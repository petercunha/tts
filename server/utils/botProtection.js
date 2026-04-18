const crypto = require("crypto");

const CHALLENGE_DIFFICULTY = 2;
const CHALLENGE_TTL = 30000;
const MAX_PENDING_CHALLENGES = 10000;

const pendingChallenges = new Map();

function cleanup() {
  const now = Date.now();
  for (const [token, data] of pendingChallenges) {
    if (now - data.issuedAt > CHALLENGE_TTL) {
      pendingChallenges.delete(token);
    }
  }
}

function generateChallenge(ip) {
  cleanup();

  const countForIp = Array.from(pendingChallenges.values()).filter(data => data.ip === ip).length;
  if (countForIp >= 5) {
    return null;
  }

  if (pendingChallenges.size >= MAX_PENDING_CHALLENGES) {
    return null;
  }

  const token = crypto.randomBytes(32).toString("hex");
  pendingChallenges.set(token, {
    issuedAt: Date.now(),
    difficulty: CHALLENGE_DIFFICULTY,
    ip: ip
  });

  return { token, difficulty: CHALLENGE_DIFFICULTY };
}

function verifySolution(token, solution) {
  if (!token || solution === undefined || solution === null) {
    return { valid: false, reason: "missing_parameters" };
  }

  const challenge = pendingChallenges.get(token);
  if (!challenge) {
    return { valid: false, reason: "invalid_token" };
  }

  if (Date.now() - challenge.issuedAt > CHALLENGE_TTL) {
    pendingChallenges.delete(token);
    return { valid: false, reason: "expired" };
  }

  const solutionStr = String(solution);
  if (solutionStr.length > 16) {
    return { valid: false, reason: "invalid_solution" };
  }

  const hash = crypto
    .createHash("sha256")
    .update(token + solutionStr)
    .digest("hex");

  const prefix = "0".repeat(challenge.difficulty);
  if (!hash.startsWith(prefix)) {
    return { valid: false, reason: "invalid_solution" };
  }

  pendingChallenges.delete(token);
  return { valid: true };
}

module.exports = { generateChallenge, verifySolution };
