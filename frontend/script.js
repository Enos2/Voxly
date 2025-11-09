const API_BASE = "http://localhost:5000";
const LIST_ROUTE = `${API_BASE}/api/audio/list`;
const STREAM_ROUTE = `${API_BASE}/uploads/`;
const AUTH_ROUTE = `${API_BASE}/api/auth`;

// UI Elements
const trackSelect = document.getElementById("trackSelect");
const audioPlayer = document.getElementById("audioPlayer");
const nowPlaying = document.getElementById("nowPlaying");
const status = document.getElementById("status");

const loginBlock = document.getElementById("loginBlock");
const registerBlock = document.getElementById("registerBlock");
const logoutBlock = document.getElementById("logoutBlock");
const audioSection = document.getElementById("audioSection");
const welcomeUser = document.getElementById("welcomeUser");

// ─── Token Management ───
function saveToken(token) {
  localStorage.setItem("voxly_token", token);
}

function getToken() {
  return localStorage.getItem("voxly_token");
}

function removeToken() {
  localStorage.removeItem("voxly_token");
}

// ─── UI Updates ───
function setStatus(msg, isError = false) {
  status.textContent = msg || "";
  status.style.color = isError ? "#ff7777" : "#b7c6cc";
}

function updateAuthUI(user = null) {
  const token = getToken();
  if (token && user) {
    loginBlock.style.display = "none";
    registerBlock.style.display = "none";
    logoutBlock.style.display = "block";
    audioSection.style.display = "flex";
    welcomeUser.textContent = `Welcome, ${user.username}`;
  } else {
    loginBlock.style.display = "block";
    registerBlock.style.display = "block";
    logoutBlock.style.display = "none";
    audioSection.style.display = "none";
  }
}

// ─── Auth Functions ───
async function handleRegister() {
  const name = document.getElementById("reg-name").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value.trim();

  if (!name || !email || !password) return alert("Please fill all fields");

  setStatus("Registering...");
  try {
    const res = await fetch(`${AUTH_ROUTE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Registration failed");

    saveToken(data.token);
    setStatus("Registration successful!");
    updateAuthUI(data.user);
    loadTracks();
  } catch (err) {
    console.error(err);
    setStatus(err.message, true);
  }
}

async function handleLogin() {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();
  if (!email || !password) return alert("Please enter email and password");

  setStatus("Logging in...");
  try {
    const res = await fetch(`${AUTH_ROUTE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Login failed");

    saveToken(data.token);
    setStatus("Login successful!");
    updateAuthUI(data.user);
    loadTracks();
  } catch (err) {
    console.error(err);
    setStatus(err.message, true);
  }
}

async function handleLogout() {
  const token = getToken();
  if (!token) return;

  setStatus("Logging out...");
  removeToken();
  updateAuthUI();
  setStatus("Logged out");
}

// ─── Audio Player Functions ───
async function loadTracks() {
  setStatus("Loading tracks...");
  try {
    const res = await fetch(LIST_ROUTE);
    if (!res.ok) throw new Error(`Server error ${res.status}`);
    const files = await res.json();

    if (!Array.isArray(files) || files.length === 0) {
      trackSelect.innerHTML = `<option value="">No tracks found</option>`;
      setStatus("No audio files found.");
      return;
    }

    trackSelect.innerHTML = files
      .map(
        (file) =>
          `<option value="${encodeURIComponent(file.title)}">${file.title}</option>`
      )
      .join("");

    setStatus(`Loaded ${files.length} track${files.length > 1 ? "s" : ""}.`);
    playSelected();
  } catch (err) {
    console.error(err);
    setStatus("Failed to load tracks.", true);
  }
}

function playSelected() {
  const selectedOption = trackSelect.options[trackSelect.selectedIndex];
  if (!selectedOption || !selectedOption.value) {
    nowPlaying.textContent = "Not playing";
    audioPlayer.src = "";
    return;
  }

  const filename = selectedOption.value;
  audioPlayer.src = `${STREAM_ROUTE}${filename}.mp3`;
  audioPlayer.load();
  audioPlayer
    .play()
    .then(() => {
      nowPlaying.textContent = `Now playing: ${filename}`;
    })
    .catch((err) => {
      console.error("Playback error:", err);
      setStatus("Could not play file.", true);
    });
}

// Event Listeners
trackSelect.addEventListener("change", playSelected);
audioPlayer.addEventListener("ended", () => (nowPlaying.textContent = "Not playing"));

// Initialize app
const savedToken = getToken();
if (savedToken) {
  // Optional: fetch user info from backend to update UI (simplified here)
  updateAuthUI({ username: "User" });
  loadTracks();
} else {
  updateAuthUI();
}
