require('dotenv').config({ quiet: true });
const express = require('express');
const { PollyClient, SynthesizeSpeechCommand } = require("@aws-sdk/client-polly");
const textToSpeech = require('@google-cloud/text-to-speech');
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
        const data = JSON.parse(raw);
        // To support migration from the old format (single object) to the new array format
        if (Array.isArray(data)) {
            return data;
        }
        // If it's the old object format, wrap it in an array
        if (data && data.date) {
            return [data];
        }
        return []; // If format is unknown or file is empty, start fresh
    } catch (err) {
        // If file doesn't exist, start with an empty array.
        if (err.code === 'ENOENT') {
            return [];
        }
        // If JSON is invalid, also start fresh.
        console.error("Error reading or parsing usage.json, starting fresh.", err);
        return [];
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
        const todayStr = getTodayString();
        const usageHistory = await readUsage();

        let todayUsage = usageHistory.find(u => u.date === todayStr);

        // If no entry for today, create one
        if (!todayUsage) {
            todayUsage = { date: todayStr, requests: 0, chars: 0 };
            usageHistory.push(todayUsage);
        }

        const nextRequests = todayUsage.requests + 1;
        const nextChars = todayUsage.chars + addChars;

        if (nextRequests > DAILY_REQUEST_LIMIT) {
            return { allowed: false, reason: 'daily_requests_exceeded', remainingRequests: Math.max(0, DAILY_REQUEST_LIMIT - todayUsage.requests) };
        }

        if (nextChars > DAILY_CHAR_LIMIT) {
            return { allowed: false, reason: 'daily_chars_exceeded', remainingChars: Math.max(0, DAILY_CHAR_LIMIT - todayUsage.chars) };
        }

        // Accept and persist
        todayUsage.requests = nextRequests;
        todayUsage.chars = nextChars;
        try {
            await writeUsage(usageHistory);
        } catch (err) {
            console.error('Failed to write usage file:', err);
            // Even if write fails, allow the request (we've updated in memory)
        }

        return { allowed: true, usage: todayUsage };
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
        const isDevelopment = process.env.NODE_ENV === 'development';
        const isLocalhost = origin && /^http:\/\/localhost(:\d+)?$/.test(origin);
        const isAllowedDomain = !origin || textreaderOriginRegex.test(origin);

        if (isAllowedDomain || (isDevelopment && isLocalhost)) {
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
// Create a write stream (in append mode)
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });
// Setup the logger
app.use(morgan('combined', { stream: accessLogStream }));

// 1. Initialize AWS Polly Client
// The SDK automatically looks for AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in environment variables.
const pollyClient = new PollyClient({
    region: process.env.AWS_REGION || "us-east-1"
});

// Initialize Google Cloud Text-to-Speech Client
const googleTtsClient = new textToSpeech.TextToSpeechClient();

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

app.get('/', async (req, res) => {
    try {
        res.send("<h2>Server Online</h2> Usage: <a href=\"/stats\">/stats");
    } catch (error) {
        console.error(error);
    }
});

app.get('/stats', async (req, res) => {
    try {
        const usageHistory = await readUsage();
        const usageWithDetails = usageHistory.map(day => ({
            ...day,
            spend: `$${(day.chars * (4 / 1000000)).toFixed(2)}` // $4 per 1 million chars
        }));
        res.json(usageWithDetails);
    } catch (error) {
        console.error("Error reading usage file:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// 3. The TTS Endpoint
// Usage: http://localhost:3000/tts?text=Hello&voice=Brian
app.get('/tts', async (req, res) => {
    try {
        // Extract parameters from query string
        const text = req.query.text;
        const voiceId = req.query.voice || 'Brian';

        if (!text) {
            return res.status(400).json({ error: "Missing 'text' query parameter" });
        }

        if (text.length > 300) {
            return res.status(400).json({ error: "Text length exceeds 300 characters limit." });
        }

        if (voiceId.length > 50) {
            return res.status(400).json({ error: "Voice ID length exceeds 50 characters limit." });
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

        // Determine which TTS service to use based on voice ID
        if (voiceId.toLowerCase().includes('wavenet')) {
            // Google Cloud TTS
            const request = {
                input: { text: text },
                voice: { languageCode: 'en-GB', name: voiceId },
                audioConfig: { audioEncoding: 'MP3' },
            };

            console.log('Sending request to Google TTS');
            const [response] = await googleTtsClient.synthesizeSpeech(request);
            res.set('Content-Type', 'audio/mpeg');
            res.send(response.audioContent);

        } else {
            // AWS Polly
            const params = {
                Text: text,
                OutputFormat: 'mp3',
                VoiceId: voiceId,
                Engine: 'standard'
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
        }

    } catch (error) {
        console.error("TTS Error:", error);
        // Handle common AWS errors
        if (error.name === 'ValidationException') {
             return res.status(400).json({ error: "Invalid voice ID or parameters." });
        }
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get('/secretlogs', async (req, res) => {
    const logFilePath = path.join(__dirname, 'access.log');
    try {
        const stats = await fs.promises.stat(logFilePath);
        const fileSize = (stats.size / 1024).toFixed(2) + ' KB';

        const data = await fs.promises.readFile(logFilePath, 'utf8');
        const lines = data.split('\n').filter(line => line.length > 0);
        const lineCount = lines.length;
        const last5Lines = lines.slice(-10).join('<br>');

        const html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Access Logs</title>
                <style>
                    body { font-family: sans-serif; background-color: #f4f4f4; color: #333; }
                    .container { max-width: 800px; margin: 20px auto; padding: 20px; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                    h1, h2 { color: #555; }
                    p { line-height: 1.6; }
                    pre { background-color: #eee; padding: 10px; border-radius: 4px; white-space: pre-wrap; word-wrap: break-word; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Log File Stats</h1>
                    <p><strong>File Size:</strong> ${fileSize}</p>
                    <p><strong>Line Count:</strong> ${lineCount}</p>
                    <h2>Last 10 Requests:</h2>
                    <pre>${last5Lines}</pre>
                </div>
            </body>
            </html>
        `;
        res.send(html);

    } catch (error) {
        if (error.code === 'ENOENT') {
            return res.status(404).send("Log file not found. No requests logged yet.");
        }
        console.error("Error reading log file:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.listen(port, () => {
    console.log(`TTS Server running on http://localhost:${port}`);
});
