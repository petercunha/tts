require('dotenv').config();
const express = require('express');
const { PollyClient, SynthesizeSpeechCommand } = require("@aws-sdk/client-polly");
const rateLimit = require('express-rate-limit');

const app = express();
const port = process.env.PORT || 3000;

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
        const voiceId = req.query.voice || 'Joanna'; // Default to Joanna if no voice specified
        const engine = req.query.engine || 'standard'; // 'standard' or 'neural'

        if (!text) {
            return res.status(400).json({ error: "Missing 'text' query parameter" });
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
