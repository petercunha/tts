require('dotenv').config({ quiet: true });
const express = require('express');
const { PollyClient, SynthesizeSpeechCommand } = require("@aws-sdk/client-polly");
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
const morgan = require('morgan');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Trust the first proxy (Nginx). This populates req.ip with the real client IP
// instead of the Nginx local IP, fixing the rate limiter error.
app.set('trust proxy', 1);

// Daily quota settings
const DAILY_CHAR_LIMIT = 250000; // characters per day
const DAILY_REQUEST_LIMIT = 8000; // requests per day

// Path to persistent usage file
const usageFile = path.join(__dirname, 'usage.json');

// In-memory lock to serialize usage updates (simple promise-queue)
let usageLock = Promise.resolve();

async function readUsage() {
    try {
        const raw = await fs.promises.readFile(usageFile, 'utf8');
        return JSON.parse(raw);
    } catch (err) {
        // If file doesn't exist or parse error, start fresh
        return {
            date: getTodayString(),
            requests: 0,
            chars: 0
        };
    }
}

async function writeUsage(u) {
    await fs.promises.writeFile(usageFile, JSON.stringify(u, null, 2), 'utf8');
}

function getTodayString() {
    const d = new Date();
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

/**
 * Checks quotas and increments counters atomically. Returns an object { allowed, reason }.
 * This is serialized using a promise lock to avoid race conditions.
 */
function checkAndIncrementQuota(addChars) {
    return usageLock = usageLock.then(async () => {
        const today = getTodayString();
        const usage = await readUsage();

        // Reset if different day
        if (usage.date !== today) {
            usage.date = today;
            usage.requests = 0;
            usage.chars = 0;
        }

        const nextRequests = usage.requests + 1;
        const nextChars = usage.chars + addChars;

        if (nextRequests > DAILY_REQUEST_LIMIT) {
            return { allowed: false, reason: 'daily_requests_exceeded', remainingRequests: Math.max(0, DAILY_REQUEST_LIMIT - usage.requests) };
        }

        if (nextChars > DAILY_CHAR_LIMIT) {
            return { allowed: false, reason: 'daily_chars_exceeded', remainingChars: Math.max(0, DAILY_CHAR_LIMIT - usage.chars) };
        }

        // Accept and persist
        usage.requests = nextRequests;
        usage.chars = nextChars;
        try {
            await writeUsage(usage);
        } catch (err) {
            console.error('Failed to write usage file:', err);
            // Even if write fails, allow the request (we've updated in memory)
        }

        return { allowed: true, usage };
    }).catch(err => {
        console.error('Quota lock error:', err);
        // On unexpected error, be conservative and allow request
        return { allowed: true };
    });
}

// CORS Middleware: allow requests from textreader.pro and its subdomains
const textreaderOriginRegex = /^https?:\/\/([a-z0-9-]+\.)*textreader\.pro(?::\d+)?$/i;
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || textreaderOriginRegex.test(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
};
app.use(cors(corsOptions));

// Request logging middleware
// Skip logging for OPTIONS requests (CORS preflight)
app.use(morgan('dev'));

// 1. Initialize AWS Polly Client
// The SDK automatically looks for AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in environment variables.
const pollyClient = new PollyClient({
    region: process.env.AWS_REGION || "us-east-1"
});

// 2. Configure Rate Limiting (Protect your Wallet)
// This limits each IP address to 50 requests every 10 minutes.
const apiLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 50, // Limit each IP to 50 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { error: "Too many requests, please slow down." }
});

// Apply the rate limiting middleware to all requests
app.use(apiLimiter);

// 3. The TTS Endpoint
// Usage: http://localhost:3000/tts?text=Hello&voice=Brian
app.get('/tts', async (req, res) => {
    try {
        // Extract parameters from query string
        const text = req.query.text;
        const voiceId = req.query.voice || 'Brian'; // Default to Brian if no voice specified
        const engine = 'standard'
        // const engine = req.query.engine || 'standard'; // 'standard' or 'neural'

        if (!text) {
            return res.status(400).json({ error: "Missing 'text' query parameter" });
        }

        // Check daily quotas (characters and total requests). If quota exceeded, deny until next day.
        const textLength = text.length;
        const quotaResult = await checkAndIncrementQuota(textLength);
        if (!quotaResult.allowed) {
            if (quotaResult.reason === 'daily_requests_exceeded') {
                return res.status(429).json({ error: 'Daily request limit exceeded. Try again tomorrow.' });
            }
            if (quotaResult.reason === 'daily_chars_exceeded') {
                return res.status(429).json({ error: 'Daily character processing limit exceeded. Try again tomorrow.' });
            }
            return res.status(429).json({ error: 'Daily quota exceeded. Try again tomorrow.' });
        }

        // Define Polly Parameters
        const params = {
            Text: text,
            OutputFormat: 'mp3',
            VoiceId: voiceId,
            Engine: engine 
        };

        // Send request to AWS
        const command = new SynthesizeSpeechCommand(params);
        console.log('Sending request to Polly');
        const response = await pollyClient.send(command);

        // Stream the audio directly to the client
        if (response.AudioStream) {
            res.setHeader('Content-Type', 'audio/mpeg');
            // In Node.js, AudioStream is a readable stream, so we can pipe it directly
            response.AudioStream.pipe(res);
        } else {
            res.status(500).json({ error: "AWS returned no audio stream." });
        }

    } catch (error) {
        console.error("Polly Error:", error);
        // Handle common AWS errors
        if (error.name === 'ValidationException') {
             return res.status(400).json({ error: "Invalid voice ID or parameters." });
        }
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.listen(port, () => {
    console.log(`TTS Server running on http://localhost:${port}`);
});
