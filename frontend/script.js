const API_BASE = "http://localhost:5000";
const LIST_ROUTE = `${API_BASE}/api/audio/list`;
const STREAM_ROUTE = `${API_BASE}/api/audio/stream/`;

const trackSelect = document.getElementById("trackSelect");
const audioPlayer = document.getElementById("audioPlayer");
const nowPlaying = document.getElementById("nowPlaying");
const status = document.getElementById("status");
const vinyl = document.querySelector(".vinyl");

function setStatus(msg, isError = false) {
  status.textContent = msg || "";
  status.style.color = isError ? "#ff7777" : "#b7c6cc";
}

async function loadTracks() {
  setStatus("Loading tracks...");
  try {
    const res = await fetch(LIST_ROUTE);
    if (!res.ok) throw new Error(`Server error ${res.status}`);
    const files = await res.json();

    if (!Array.isArray(files) || files.length === 0) {
      trackSelect.innerHTML = `<option value="">No tracks found</option>`;
      setStatus("No audio files found in uploads folder.");
      return;
    }

    trackSelect.innerHTML = files
      .map(
        (file) =>
          `<option value="${encodeURIComponent(file)}">${file.replace(/\.(mp3|wav|ogg)$/i, "")}</option>`
      )
      .join("");

    setStatus(`Loaded ${files.length} track${files.length > 1 ? "s" : ""}.`);
    playSelected();
  } catch (err) {
    console.error(err);
    setStatus("Failed to load tracks. Using fallback list.", true);

    const fallback = ["chris.mp3", "dema.mp3", "bac.mp3"];
    trackSelect.innerHTML = fallback
      .map(
        (f) =>
          `<option value="${encodeURIComponent(f)}">${f.replace(/\.(mp3|wav|ogg)$/i, "")}</option>`
      )
      .join("");

    playSelected();
  }
}

function playSelected() {
  const filename = decodeURIComponent(trackSelect.value);
  if (!filename) {
    setStatus("Select a track to play", true);
    nowPlaying.textContent = "Not playing";
    vinyl.classList.remove("playing");
    return;
  }

  audioPlayer.src = STREAM_ROUTE + encodeURIComponent(filename);
  audioPlayer.load();
  audioPlayer.play()
    .then(() => {
      nowPlaying.textContent = `Now playing: ${filename}`;
      setStatus("");
      vinyl.classList.add("playing");
    })
    .catch((err) => {
      console.error("Playback error:", err);
      setStatus("Could not play file.", true);
      vinyl.classList.remove("playing");
    });
}

audioPlayer.addEventListener("ended", () => vinyl.classList.remove("playing"));
audioPlayer.addEventListener("pause", () => vinyl.classList.remove("playing"));
trackSelect.addEventListener("change", playSelected);

loadTracks();
