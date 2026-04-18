async function solveChallenge(token, difficulty) {
  const prefix = "0".repeat(difficulty);
  const tokenBytes = new TextEncoder().encode(token);
  const tokenLen = tokenBytes.byteLength;
  const buffer = new ArrayBuffer(tokenLen + 16);
  const view = new Uint8Array(buffer);
  view.set(tokenBytes);

  function digitsLen(n) {
    if (n < 10) return 1;
    if (n < 100) return 2;
    if (n < 1000) return 3;
    if (n < 10000) return 4;
    if (n < 100000) return 5;
    return String(n).length;
  }

  for (let solution = 0; ; solution++) {
    const len = digitsLen(solution);
    const str = String(solution);
    for (let i = 0; i < len; i++) {
      view[tokenLen + i] = str.charCodeAt(i);
    }
    const slice = new Uint8Array(buffer, 0, tokenLen + len);

    const hashBuffer = await crypto.subtle.digest("SHA-256", slice);
    const hashView = new Uint8Array(hashBuffer);
    let matches = true;
    for (let i = 0; i < difficulty; i++) {
      const nibble = i % 2 === 0 ? hashView[i >> 1] >> 4 : hashView[i >> 1] & 0x0f;
      if (nibble !== 0) {
        matches = false;
        break;
      }
    }

    if (matches) return solution;

    if (solution % 500 === 499) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }
}

export default solveChallenge;
