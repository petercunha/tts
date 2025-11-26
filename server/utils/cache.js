const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const cacheDir = path.join(__dirname, '..', 'cache');
const manifestFile = path.join(cacheDir, 'manifest.json');
const MAX_CACHE_SIZE = 1 * 1024 * 1024 * 1024; // 1 GB

let manifest = {
    files: {},
    totalSize: 0,
};

async function init() {
    try {
        await fs.mkdir(cacheDir, { recursive: true });
        const manifestData = await fs.readFile(manifestFile, 'utf8');
        manifest = JSON.parse(manifestData);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.error('Error initializing cache:', error);
        }
    }
}

function getCacheKey(text, voiceId) {
    return crypto.createHash('sha256').update(text + voiceId).digest('hex');
}

async function saveManifest() {
    await fs.writeFile(manifestFile, JSON.stringify(manifest, null, 2));
}

async function ensureCacheSpace(size) {
    if (manifest.totalSize + size <= MAX_CACHE_SIZE) {
        return;
    }

    const sortedFiles = Object.entries(manifest.files).sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    for (const [key, fileInfo] of sortedFiles) {
        if (manifest.totalSize + size <= MAX_CACHE_SIZE) {
            break;
        }

        console.log(`Cache full. Evicting ${key}`);
        await fs.unlink(path.join(cacheDir, key + '.mp3'));
        manifest.totalSize -= fileInfo.size;
        delete manifest.files[key];
    }
    await saveManifest();
}

async function getCachedAudio(text, voiceId) {
    const key = getCacheKey(text, voiceId);
    if (manifest.files[key]) {
        manifest.files[key].lastAccessed = Date.now();
        await saveManifest();
        return path.join(cacheDir, key + '.mp3');
    }
    return null;
}

async function cacheAudio(text, voiceId, audioBuffer) {
    const key = getCacheKey(text, voiceId);
    const filePath = path.join(cacheDir, key + '.mp3');
    const size = audioBuffer.length;

    await ensureCacheSpace(size);

    await fs.writeFile(filePath, audioBuffer);

    manifest.files[key] = {
        size,
        lastAccessed: Date.now(),
        voiceId,
        text,
    };
    manifest.totalSize += size;
    await saveManifest();
}

init();

module.exports = { getCachedAudio, cacheAudio };
