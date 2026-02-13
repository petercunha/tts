const express = require("express");
const router = express.Router();
const https = require("https");
const {
  PollyClient,
  SynthesizeSpeechCommand,
} = require("@aws-sdk/client-polly");
const textToSpeech = require("@google-cloud/text-to-speech");
const { checkAndIncrementQuota, updateCacheStats } = require("../utils/usage");
const { getCachedAudio, cacheAudio } = require("../utils/cache");
const fs = require("fs");

const pollyClient = new PollyClient({
  region: process.env.AWS_REGION || "us-east-1",
});
const googleTtsClient = new textToSpeech.TextToSpeechClient();
const ttsProvider = (process.env.TTS_PROVIDER || "streamlabs").toLowerCase();

function makeHttpsRequest(url, options = {}, requestBody = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode || 0,
          headers: res.headers,
          body: Buffer.concat(chunks),
        });
      });
    });

    req.on("error", reject);

    if (requestBody) {
      req.write(requestBody);
    }

    req.end();
  });
}

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

    const cachedPath = await getCachedAudio(text, voiceId);
    if (cachedPath) {
      await updateCacheStats(text.length);
      res.set("X-Cache-Status", "hit");
      res.set("Content-Type", "audio/mpeg");
      return fs.createReadStream(cachedPath).pipe(res);
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

    let audioContent;

    if (voiceId.toLowerCase().includes("wavenet")) {
      // Google Cloud TTS
      const request = {
        input: { text: text },
        voice: { languageCode: "en-GB", name: voiceId },
        audioConfig: { audioEncoding: "MP3" },
      };

      console.log("Sending request to Google TTS");
      const [response] = await googleTtsClient.synthesizeSpeech(request);
      audioContent = response.audioContent;
    } else {
      if (ttsProvider === "aws") {
        // AWS Polly (opt-in via TTS_PROVIDER=aws)
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
          const audioStream = response.AudioStream;
          const chunks = [];
          for await (const chunk of audioStream) {
            chunks.push(chunk);
          }
          audioContent = Buffer.concat(chunks);
        } else {
          return res.status(500).json({ error: "AWS returned no audio stream." });
        }
      } else {
        // Streamlabs Polly API (default provider)
        const payload = new URLSearchParams({
          voice: voiceId,
          text,
        }).toString();

        console.log("Sending request to Streamlabs Polly API");
        const streamlabsResponse = await makeHttpsRequest(
          "https://streamlabs.com/polly/speak",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "Content-Length": Buffer.byteLength(payload),
              Referer: "https://streamlabs.com",
            },
          },
          payload
        );

        if (streamlabsResponse.statusCode >= 400) {
          return res.status(502).json({
            error: `Streamlabs request failed with status ${streamlabsResponse.statusCode}.`,
          });
        }

        let parsedResponse;
        try {
          parsedResponse = JSON.parse(streamlabsResponse.body.toString("utf8"));
        } catch (_err) {
          return res
            .status(502)
            .json({ error: "Unexpected Streamlabs response format." });
        }

        if (!parsedResponse.success || !parsedResponse.speak_url) {
          return res.status(502).json({
            error: parsedResponse.error || "Streamlabs did not return audio URL.",
          });
        }

        const audioResponse = await makeHttpsRequest(parsedResponse.speak_url);
        if (audioResponse.statusCode >= 400 || !audioResponse.body.length) {
          return res.status(502).json({
            error: "Failed to fetch Streamlabs audio output.",
          });
        }

        const contentType = String(audioResponse.headers["content-type"] || "");
        if (contentType.includes("application/json")) {
          let audioError = "Streamlabs audio endpoint returned JSON.";
          try {
            const parsedAudioError = JSON.parse(
              audioResponse.body.toString("utf8")
            );
            if (parsedAudioError.error) {
              audioError = parsedAudioError.error;
            }
          } catch (_err) {
            // Keep default error message when JSON parsing fails.
          }
          return res.status(502).json({ error: audioError });
        }

        audioContent = audioResponse.body;
      }
    }

    if (audioContent) {
      await cacheAudio(text, voiceId, audioContent);
      res.set("X-Cache-Status", "miss");
      res.set("Content-Type", "audio/mpeg");
      res.send(audioContent);
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
