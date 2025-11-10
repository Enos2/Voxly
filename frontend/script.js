// DOM ELEMENTS
const registerBlock = document.getElementById("registerBlock");
const loginBlock = document.getElementById("loginBlock");
const authCard = document.getElementById("authCard");
const playerCard = document.getElementById("playerCard");
const logoutBtn = document.getElementById("logoutBtn");
const trackSelect = document.getElementById("trackSelect");
const audioPlayer = document.getElementById("audioPlayer");
const nowPlaying = document.getElementById("nowPlaying");
const status = document.getElementById("status");

// API BASE
const API_BASE = "http://localhost:5000/api";

// Hide elements initially
playerCard.style.display = "none";
logoutBtn.style.display = "none";

// HELPER FUNCTION: Set auth state
function setLoggedIn(user, token) {
  localStorage.setItem("token", token);
  localStorage.setItem("username", user.username);

  authCard.style.display = "none";
  playerCard.style.display = "block";
  logoutBtn.style.display = "block";

  loadTracks();
}

// HELPER FUNCTION: Clear auth state
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  authCard.style.display = "block";
  playerCard.style.display = "none";
  logoutBtn.style.display = "none";
  audioPlayer.pause();
  audioPlayer.src = "";
  nowPlaying.textContent = "Not playing";
  trackSelect.innerHTML = '<option value="">Loading tracks…</option>';
}

// REGISTER
async function handleRegister() {
  const name = document.getElementById("reg-name").value;
  const email = document.getElementById("reg-email").value;
  const password = document.getElementById("reg-password").value;

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.message);

    // Auto-login after registration
    setLoggedIn(data.user, data.token);

    status.textContent = "Registration successful!";
    status.style.color = "#00ff99";
  } catch (err) {
    status.textContent = err.message;
    status.style.color = "red";
  }
}

// LOGIN
async function handleLogin() {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.message);

    setLoggedIn(data.user, data.token);

    status.textContent = "Login successful!";
    status.style.color = "#00ff99";
  } catch (err) {
    status.textContent = err.message;
    status.style.color = "red";
  }
}

// LOGOUT
function handleLogout() {
  logout();
  status.textContent = "Logged out successfully.";
  status.style.color = "#0284f6";
}

// LOAD TRACKS
async function loadTracks() {
  try {
    const res = await fetch(`${API_BASE}/audio/list`);
    const tracks = await res.json();

    if (!Array.isArray(tracks) || tracks.length === 0) {
      trackSelect.innerHTML = '<option value="">No tracks available</option>';
      return;
    }

    trackSelect.innerHTML = tracks
      .map(
        (track) =>
          `<option value="${track.streamUrl}">${track.title}</option>`
      )
      .join("");

    // Auto-select first track
    audioPlayer.src = tracks[0].streamUrl;
    nowPlaying.textContent = tracks[0].title;

    trackSelect.addEventListener("change", () => {
      const selected = trackSelect.value;
      audioPlayer.src = selected;
      const title =
        trackSelect.options[trackSelect.selectedIndex].textContent;
      nowPlaying.textContent = title;
      audioPlayer.play();
    });
  } catch (err) {
    status.textContent = "Failed to load tracks.";
    status.style.color = "red";
  }
}

// CHECK LOCALSTORAGE ON LOAD
window.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");

  if (token && username) {
    authCard.style.display = "none";
    playerCard.style.display = "block";
    logoutBtn.style.display = "block";
    loadTracks();
  }
});
