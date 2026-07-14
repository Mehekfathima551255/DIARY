// Per-entry password protection — stored in localStorage, unlocked per session
const STORE_KEY = 'sd_entry_locks'; // { [memoryId]: hashedPw }

// Simple hash — not cryptographic, just obscures plain-text in localStorage
function simpleHash(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = (h * 0x01000193) >>> 0;
    }
    return h.toString(16);
}

function getLocks() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); } catch { return {}; }
}

function saveLocks(locks) {
    localStorage.setItem(STORE_KEY, JSON.stringify(locks));
}

export function isLocked(memoryId) {
    return !!getLocks()[String(memoryId)];
}

export function setLock(memoryId, password) {
    const locks = getLocks();
    locks[String(memoryId)] = simpleHash(password);
    saveLocks(locks);
}

export function removeLock(memoryId) {
    const locks = getLocks();
    delete locks[String(memoryId)];
    saveLocks(locks);
}

export function checkPassword(memoryId, password) {
    const locks = getLocks();
    return locks[String(memoryId)] === simpleHash(password);
}
