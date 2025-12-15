const path = require('path');
require('dotenv').config({ quiet: true, path: path.join(__dirname, '.env') });
const express = require("express");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const cors = require("cors");
const fs = require("fs");
const indexRouter = require("./routes/index");
const statsRouter = require("./routes/stats");
const ttsRouter = require("./routes/tts");
const logsRouter = require("./routes/logs");

const app = express();
const port = process.env.PORT || 3000;

app.set("trust proxy", 1);

const textreaderOriginRegex =
  /^https?:\/\/([a-z0-9-]+\.)*textreader\.pro(?::\d+)?$/i;
const corsOptions = {
  origin: function (origin, callback) {
    const isDevelopment = process.env.NODE_ENV === "development";
    const isLocalhost = origin && /^http:\/\/localhost(:\d+)?$/.test(origin);
    const isAllowedDomain = !origin || textreaderOriginRegex.test(origin);

    if (isAllowedDomain || (isDevelopment && isLocalhost)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));

app.use(morgan("dev"));
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  { flags: "a" },
);
app.use(morgan("combined", { stream: accessLogStream }));

const apiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 40, // Limit each IP to 50 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { error: "Too many requests, please slow down." },
});

app.use(apiLimiter);

// app.use("/", indexRouter);
app.use("/", statsRouter);
app.use("/stats", statsRouter);
app.use("/tts", ttsRouter);
app.use("/secretlogs", logsRouter);

app.listen(port, () => {
  console.log(`TTS Server running on http://localhost:${port}`);
});
