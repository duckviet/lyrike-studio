/* LRCLIB Publisher Logic - Fixed with local Proxy to bypass CORS */

const API_BASE = "/api";

const els = {
    trackName: document.getElementById('trackName'),
    artistName: document.getElementById('artistName'),
    albumName: document.getElementById('albumName'),
    duration: document.getElementById('duration'),
    syncedLyrics: document.getElementById('syncedLyrics'),
    plainLyrics: document.getElementById('plainLyrics'),
    userAgent: document.getElementById('userAgent'),
    
    btnClear: document.getElementById('btnClear'),
    btnReview: document.getElementById('btnReview'),
    
    reviewModal: document.getElementById('reviewModal'),
    reviewContent: document.getElementById('reviewContent'),
    btnCancelModal: document.getElementById('btnCancelModal'),
    btnPublish: document.getElementById('btnPublish'),
    statusBox: document.getElementById('statusBox'),
    progressBar: document.getElementById('progressBar'),
    progressFill: document.getElementById('progressFill')
};

let currentPayload = null;
let isPublishing = false;

// Format: [key:value]
function parseLrcMetadata(text) {
    const lines = text.split('\n');
    const meta = {};
    for (let line of lines) {
        line = line.trim();
        const match = line.match(/^\[(ar|ti|al|length)\s*:\s*(.*?)\]$/);
        if (match) {
            meta[match[1]] = match[2].trim();
        }
    }
    return meta;
}

// Extract [mm:ss.xx] length tag into seconds rounded
function parseLrcLengthToSeconds(lengthStr) {
    // Usually [length: 03:20] or [length: 03:20.50]
    const p = lengthStr.split(':');
    if (p.length === 2) {
        const m = parseInt(p[0], 10);
        const s = parseFloat(p[1]);
        if (!isNaN(m) && !isNaN(s)) {
            return Math.round(m * 60 + s);
        }
    }
    return null;
}

els.syncedLyrics.addEventListener('input', () => {
    const text = els.syncedLyrics.value;
    const meta = parseLrcMetadata(text);
    
    if (meta.ti && els.trackName.value === "") els.trackName.value = meta.ti;
    if (meta.ar && els.artistName.value === "") els.artistName.value = meta.ar;
    if (meta.al && els.albumName.value === "") els.albumName.value = meta.al;
    if (meta.length && els.duration.value === "") {
        const sec = parseLrcLengthToSeconds(meta.length);
        if (sec !== null) els.duration.value = sec;
    }
});

els.plainLyrics.addEventListener('input', () => {
    const text = els.plainLyrics.value;
    const meta = parseLrcMetadata(text);
    
    if (meta.ti && els.trackName.value === "") els.trackName.value = meta.ti;
    if (meta.ar && els.artistName.value === "") els.artistName.value = meta.ar;
    if (meta.al && els.albumName.value === "") els.albumName.value = meta.al;
});

function getFormData() {
    return {
        trackName: els.trackName.value.trim(),
        artistName: els.artistName.value.trim(),
        albumName: els.albumName.value.trim(),
        duration: parseInt(els.duration.value, 10),
        plainLyrics: els.plainLyrics.value.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim(),
        syncedLyrics: els.syncedLyrics.value.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim(),
    };
}

function validateForm(data) {
    if (!data.trackName) throw new Error("Missing Track Name.");
    if (!data.artistName) throw new Error("Missing Artist Name.");
    if (!data.albumName) throw new Error("Missing Album Name.");
    if (isNaN(data.duration) || data.duration <= 0) throw new Error("Invalid Duration in seconds.");
    if (!data.plainLyrics && !data.syncedLyrics) throw new Error("You must provide either Plain Lyrics or Synced Lyrics.");

    // Simple LRC timestamp validation check on syncedLyrics if provided
    if (data.syncedLyrics) {
        const hasTimeTag = /\[\d{2}:\d{2}\.\d{2,3}\]/.test(data.syncedLyrics);
        if (!hasTimeTag && !confirm("Warning: We didn't detect any LRC timestamps like [00:15.00] in the Synced Lyrics field. Do you still want to proceed?")) {
            throw new Error("LRC validation failed. Please check your Synced Lyrics input.");
        }
    }
}

function showStatus(msg, type) {
    els.statusBox.textContent = msg;
    els.statusBox.className = `status active ${type}`;
}

els.btnReview.addEventListener('click', () => {
    try {
        const form = getFormData();
        validateForm(form);
        
        currentPayload = form;
        els.reviewContent.textContent = JSON.stringify(currentPayload, null, 2);
        
        // Reset status
        els.statusBox.className = 'status';
        els.progressBar.style.display = 'none';
        els.progressFill.style.width = '0%';
        
        // Reset buttons back to default state
        els.btnPublish.style.display = 'inline-flex';
        els.btnPublish.disabled = false;
        els.btnCancelModal.textContent = "Cancel";
        
        els.reviewModal.classList.add('active');
    } catch (e) {
        alert(e.message);
    }
});

els.btnCancelModal.addEventListener('click', () => {
    if (!isPublishing) {
        els.reviewModal.classList.remove('active');
    }
});

els.btnClear.addEventListener('click', () => {
    if (confirm("Are you sure you want to clear all fields?")) {
        els.trackName.value = '';
        els.artistName.value = '';
        els.albumName.value = '';
        els.duration.value = '';
        els.syncedLyrics.value = '';
        els.plainLyrics.value = '';
    }
});

// YouTube Auto Extractor Logic
const ytUrlInput = document.getElementById('youtubeUrl');
const btnExtractYt = document.getElementById('btnExtractYt');
const ytStatusBox = document.getElementById('ytStatusBox');

function showYtStatus(msg, type) {
    if (!msg) {
        ytStatusBox.style.display = 'none';
        return;
    }
    ytStatusBox.textContent = msg;
    ytStatusBox.className = `status active ${type}`;
    ytStatusBox.style.display = 'block';
}

btnExtractYt.addEventListener('click', async () => {
    const url = ytUrlInput.value.trim();
    if (!url) {
        return showYtStatus("Please enter a valid YouTube or Audio URL.", "error");
    }

    btnExtractYt.disabled = true;
    showYtStatus("Downloading audio and transcribing with WhisperX... This may take several minutes.", "info");

    try {
        const res = await fetch('/local-api/extract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });

        const data = await res.json();

        if (!res.ok || data.error) {
            throw new Error(data.error || "Unknown extraction error");
        }

        // Fill fields
        if (data.trackName) els.trackName.value = data.trackName;
        if (data.artistName) els.artistName.value = data.artistName;
        if (data.duration) els.duration.value = data.duration;
        if (data.syncedLyrics) els.syncedLyrics.value = data.syncedLyrics;
        if (data.plainLyrics) els.plainLyrics.value = data.plainLyrics;

        showYtStatus("Extraction & Transcription Successful! Data filled below.", "success");
        
    } catch (err) {
        console.error("Extraction error:", err);
        showYtStatus(`Error: ${err.message}`, "error");
    } finally {
        btnExtractYt.disabled = false;
    }
});

function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
    }
    return bytes;
}

function bytesLessOrEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] < b[i]) return true;
        if (a[i] > b[i]) return false;
    }
    return true;
}

async function solveChallengePow(prefix, targetHex, onProgress) {
    const targetBytes = hexToBytes(targetHex);
    let nonce = 0;
    
    return new Promise((resolve) => {
        async function doBatch() {
            // Process in batches so the UI doesn't freeze
            for (let i = 0; i < 2000; i++) {
                const text = prefix + nonce;
                const buffer = new TextEncoder().encode(text);
                const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
                const hashBytes = new Uint8Array(hashBuffer);
                
                if (bytesLessOrEqual(hashBytes, targetBytes)) {
                    resolve(nonce.toString());
                    return;
                }
                nonce++;
            }
            onProgress(nonce);
            setTimeout(doBatch, 0); 
        }
        doBatch();
    });
}

els.btnPublish.addEventListener('click', async () => {
    if (!currentPayload || isPublishing) return;
    
    isPublishing = true;
    els.btnPublish.disabled = true;
    els.btnCancelModal.disabled = true;
    
    els.progressBar.style.display = 'block';
    els.progressFill.style.width = '5%';
    
    try {
        showStatus("Requesting challenge from API...", "info");
        const req = await fetch(`${API_BASE}/request-challenge`, {
            method: 'POST',
            headers: {
                'User-Agent': els.userAgent.value
            }
        });
        
        if (!req.ok) throw new Error(`Challenge request error: ${await req.text()}`);
        
        const challenge = await req.json();
        
        let visualProgress = 5;
        showStatus(`Challenge received. Solving Proof of Work...`, "info");
        
        const nonce = await solveChallengePow(challenge.prefix, challenge.target, (n) => {
            // Pseudo-progress bar animation
            visualProgress = Math.min(95, visualProgress + 2);
            els.progressFill.style.width = `${visualProgress}%`;
            showStatus(`Solving PoW (Tried ${n.toLocaleString()} nonces)...`, "info");
        });
        
        els.progressFill.style.width = '100%';
        showStatus(`Solved! Nonce = ${nonce}. Publishing...`, "info");
        
        const publishToken = `${challenge.prefix}:${nonce}`;
        
        const pub = await fetch(`${API_BASE}/publish`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Publish-Token': publishToken,
                'User-Agent': els.userAgent.value
            },
            body: JSON.stringify(currentPayload)
        });
        
        const responseText = await pub.text();
        
        if (!pub.ok) {
            throw new Error(`Publish failed (${pub.status}): ${responseText}`);
        }
        
        showStatus(`Success! Lyrics published successfully.`, "success");
        els.btnPublish.style.display = 'none'; // hide the button after success
        
    } catch(err) {
        showStatus(err.message, "error");
    } finally {
        isPublishing = false;
        els.btnCancelModal.disabled = false;
        if (els.btnPublish.style.display !== 'none') {
            els.btnPublish.disabled = false;
        }
        els.btnCancelModal.textContent = "Close";
    }
});
