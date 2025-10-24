// frontend/script.js - works with backend endpoints:
//  GET /api/audio/list    -> returns array OR { files: [...] }
//  Streaming endpoint used: /api/audio/stream/:filename

const API_BASE = "http://localhost:5000";
const LIST_ROUTE = `${API_BASE}/api/audio/list`;
const STREAM_ROUTE = `${API_BASE}/api/audio/stream/`;

const trackSelect = document.getElementById("trackSelect");
const audioPlayer = document.getElementById("audioPlayer");
const nowPlaying = document.getElementById("nowPlaying");
const status = document.getElementById("status");

function setStatus(msg, isError = false) {
  status.textContent = msg || "";
  status.style.color = isError ? "#ff9b9b" : "";
}

// Normalize backend response to array of filenames
function normalizeListResponse(body) {
  if (!body) return [];
  if (Array.isArray(body)) return body;
  if (body.files && Array.isArray(body.files)) {
    // body.files may be array of strings or objects {name, ...}
    return body.files.map(f => (typeof f === "string" ? f : (f.name || f.filename || ""))).filter(Boolean);
  }
  // if body is { message:..., files: [...] } or other shape
  if (body.length && Array.isArray(body)) return body;
  return [];
}

async function loadTracks() {
  setStatus("Loading tracks...");
  try {
    const res = await fetch(LIST_ROUTE);
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    const body = await res.json();
    const files = normalizeListResponse(body);

    if (!files.length) {
      trackSelect.innerHTML = `<option value="">No tracks found</option>`;
      setStatus("No audio files found in uploads folder.");
      return;
    }

    trackSelect.innerHTML = files.map(f => `<option value="${encodeURIComponent(f)}">${f.replace(/\.(mp3|wav|m4a|ogg)$/i,'')}</option>`).join("");
    // load first automatically
    trackSelect.selectedIndex = 0;
    playSelected();
    setStatus("");
  } catch (err) {
    console.warn("Could not fetch /api/audio/list:", err);
    // fallback to hard-coded filenames if you want:
    const fallback = ["chris.mp3","dema.mp3","bac.mp3"];
    trackSelect.innerHTML = fallback.map(f => `<option value="${encodeURIComponent(f)}">${f.replace(/\.(mp3|wav|m4a|ogg)$/i,'')}</option>`).join("");
    trackSelect.selectedIndex = 0;
    playSelected();
    setStatus("Loaded fallback list (couldn't fetch /api/audio/list).", true);
  }
}

function playSelected() {
  const raw = trackSelect.value;
  if (!raw) {
    setStatus("Select a track to play", true);
    return;
  }
  // value might be encoded
  const filename = decodeURIComponent(raw);
  // use the streaming endpoint
  audioPlayer.src = STREAM_ROUTE + encodeURIComponent(filename);
  audioPlayer.load();
  audioPlayer.play().then(() => {
    nowPlaying.textContent = `Now playing: ${filename}`;
    setStatus("");
  }).catch(err => {
    console.error("Play error:", err);
    setStatus("Playback failed. Check console and server.", true);
  });
}

trackSelect.addEventListener("change", playSelected);

// audio element error handling
audioPlayer.addEventListener("error", (e) => {
  console.error("Audio element error", e);
  setStatus("Playback error: file may not exist or server returned an error.", true);
});

// init
loadTracks();
