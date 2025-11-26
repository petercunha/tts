const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

router.get("/", async (req, res) => {
  const logFilePath = path.join(__dirname, "..", "access.log");
  try {
    const stats = await fs.promises.stat(logFilePath);
    const fileSize = (stats.size / 1024).toFixed(2) + " KB";

    const data = await fs.promises.readFile(logFilePath, "utf8");
    const lines = data.split("\n").filter((line) => line.length > 0);
    const lineCount = lines.length;
    const last10Lines = lines.slice(-10).join("<br>");

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
                    <pre>${last10Lines}</pre>
                </div>
            </body>
            </html>
        `;
    res.send(html);
  } catch (error) {
    if (error.code === "ENOENT") {
      return res
        .status(404)
        .send("Log file not found. No requests logged yet.");
    }
    console.error("Error reading log file:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
