const fs = require("fs");
const path = require("path");

const DAILY_CHAR_LIMIT = 250000;
const DAILY_REQUEST_LIMIT = 8000;

const usageFile = path.join(__dirname, "..", "usage.json");

let usageLock = Promise.resolve();

async function readUsage() {
  try {
    const raw = await fs.promises.readFile(usageFile, "utf8");
    const data = JSON.parse(raw);
    if (Array.isArray(data)) {
      return data;
    }
    if (data && data.date) {
      return [data];
    }
    return [];
  } catch (err) {
    if (err.code === "ENOENT") {
      return [];
    }
    console.error("Error reading or parsing usage.json, starting fresh.", err);
    return [];
  }
}

async function writeUsage(u) {
  await fs.promises.writeFile(usageFile, JSON.stringify(u, null, 2), "utf8");
}

function getTodayString() {
  const d = new Date();
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function checkAndIncrementQuota(addChars) {
  return (usageLock = usageLock
    .then(async () => {
      const todayStr = getTodayString();
      const usageHistory = await readUsage();

      let todayUsage = usageHistory.find((u) => u.date === todayStr);

      if (!todayUsage) {
        todayUsage = { date: todayStr, requests: 0, chars: 0, cacheHits: 0 };
        usageHistory.push(todayUsage);
      }

      const nextRequests = todayUsage.requests + 1;
      const nextChars = todayUsage.chars + addChars;

      if (nextRequests > DAILY_REQUEST_LIMIT) {
        return {
          allowed: false,
          reason: "daily_requests_exceeded",
          remainingRequests: Math.max(
            0,
            DAILY_REQUEST_LIMIT - todayUsage.requests,
          ),
        };
      }

      if (nextChars > DAILY_CHAR_LIMIT) {
        return {
          allowed: false,
          reason: "daily_chars_exceeded",
          remainingChars: Math.max(0, DAILY_CHAR_LIMIT - todayUsage.chars),
        };
      }

      todayUsage.requests = nextRequests;
      todayUsage.chars = nextChars;
      try {
        await writeUsage(usageHistory);
      } catch (err) {
        console.error("Failed to write usage file:", err);
      }

      return { allowed: true, usage: todayUsage };
    })
    .catch((err) => {
      console.error("Quota lock error:", err);
      return { allowed: true };
    }));
}

async function incrementCacheHits() {
  return (usageLock = usageLock.then(async () => {
    const todayStr = getTodayString();
    const usageHistory = await readUsage();

    let todayUsage = usageHistory.find((u) => u.date === todayStr);

    if (!todayUsage) {
      todayUsage = { date: todayStr, requests: 0, chars: 0, cacheHits: 0 };
      usageHistory.push(todayUsage);
    }

    todayUsage.cacheHits = (todayUsage.cacheHits || 0) + 1;

    try {
      await writeUsage(usageHistory);
    } catch (err) {
      console.error("Failed to write usage file:", err);
    }
  }));
}

module.exports = {
  readUsage,
  checkAndIncrementQuota,
  incrementCacheHits,
};
