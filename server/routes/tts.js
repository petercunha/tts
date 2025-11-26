const express = require("express");
const router = express.Router();
const {
  PollyClient,
  SynthesizeSpeechCommand,
} = require("@aws-sdk/client-polly");
const textToSpeech = require("@google-cloud/text-to-speech");
const { checkAndIncrementQuota } = require("../utils/usage");

const pollyClient = new PollyClient({
  region: process.env.AWS_REGION || "us-east-1",
});

const googleTtsClient = new textToSpeech.TextToSpeechClient();

router.get("/", async (req, res) => {
  try {
    const text = req.query.text;
    const voiceId = req.query.voice || "Brian";

    if (!text) {
      return res.status(400).json({ error: "Missing 'text' query parameter" });
    }

    if (text.length > 300) {
      return res
        .status(400)
        .json({ error: "Text length exceeds 300 characters limit." });
    }

    if (voiceId.length > 50) {
      return res
        .status(400)
        .json({ error: "Voice ID length exceeds 50 characters limit." });
    }

    const textLength = text.length;
    const quotaResult = await checkAndIncrementQuota(textLength);
    if (!quotaResult.allowed) {
      if (quotaResult.reason === "daily_requests_exceeded") {
        return res
          .status(429)
          .json({ error: "Daily request limit exceeded. Try again tomorrow." });
      }
      if (quotaResult.reason === "daily_chars_exceeded") {
        return res.status(429).json({
          error:
            "Daily character processing limit exceeded. Try again tomorrow.",
        });
      }
      return res
        .status(429)
        .json({ error: "Daily quota exceeded. Try again tomorrow." });
    }

    if (voiceId.toLowerCase().includes("wavenet")) {
      // Google Cloud TTS
      const request = {
        input: { text: text },
        voice: { languageCode: "en-GB", name: voiceId },
        audioConfig: { audioEncoding: "MP3" },
      };

      console.log("Sending request to Google TTS");
      const [response] = await googleTtsClient.synthesizeSpeech(request);
      res.set("Content-Type", "audio/mpeg");
      res.send(response.audioContent);
    } else {
      // AWS Polly
      const params = {
        Text: text,
        OutputFormat: "mp3",
        VoiceId: voiceId,
        Engine: "standard",
      };

      const command = new SynthesizeSpeechCommand(params);
      console.log("Sending request to Polly");
      const response = await pollyClient.send(command);

      if (response.AudioStream) {
        res.setHeader("Content-Type", "audio/mpeg");
        response.AudioStream.pipe(res);
      } else {
        res.status(500).json({ error: "AWS returned no audio stream." });
      }
    }
  } catch (error) {
    console.error("TTS Error:", error);
    if (error.name === "ValidationException") {
      return res.status(400).json({ error: "Invalid voice ID or parameters." });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
