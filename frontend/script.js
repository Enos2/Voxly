/* Voxly Feed JS — full upgrade with EchoLine/Your Circle layouts */

/* ---------- Config / Data ---------- */
const API_BASE = 'http://localhost:5000/uploads'; // updated to match backend

const liveRooms = [
  { id: 'r1', title: 'History Deep Dive', host: 'Cupiden', hostPic: 'assets/voxly-logo.png', viewers: 812, cover: 'assets/voxly-logo.png', audioUrl: `${API_BASE}/bac.mp3`, live: true },
  { id: 'r2', title: 'Late Night Chill', host: 'Chris', hostPic: 'assets/voxly-logo.png', viewers: 420, cover: 'assets/voxly-logo.png', audioUrl: `${API_BASE}/chris.mp3`, live: true },
  { id: 'r3', title: 'Dema Talks', host: 'Dema', hostPic: 'assets/voxly-logo.png', viewers: 230, cover: 'assets/voxly-logo.png', audioUrl: `${API_BASE}/dema.mp3`, live: true }
];

const recommended = [
  { id: 's1', title: 'Studio Beats', creator: 'BeatMaker', thumb: 'assets/voxly-logo.png', audioUrl: `${API_BASE}/chris.mp3` },
  { id: 's2', title: 'History Room', creator: 'Cupiden', thumb: 'assets/voxly-logo.png', audioUrl: `${API_BASE}/bac.mp3` },
  { id: 's3', title: 'Dema Podcast', creator: 'Dema', thumb: 'assets/voxly-logo.png', audioUrl: `${API_BASE}/dema.mp3` }
];

const creators = [
  { id: 'c1', name: 'Cupiden', pic: 'assets/voxly-logo.png' },
  { id: 'c2', name: 'Chris', pic: 'assets/voxly-logo.png' },
  { id: 'c3', name: 'Dema', pic: 'assets/voxly-logo.png' },
  { id: 'c4', name: 'BeatMaker', pic: 'assets/voxly-logo.png' }
];

/* ---------- DOM refs ---------- */
const liveCarousel = document.getElementById('liveCarousel');
const heroCard = document.getElementById('heroCard');
const roomList = document.getElementById('roomList');
const creatorsEl = document.getElementById('creators');
const tabButtons = document.querySelectorAll('.tab-btn');
const startLiveBtn = document.getElementById('startLiveBtn');

const joinModal = document.getElementById('joinModal');
const modalContent = document.getElementById('modalContent');
const closeModal = document.getElementById('closeModal');
const joinBtn = document.getElementById('joinBtn');
const listenBtn = document.getElementById('listenBtn');

/* Player elements */
const audioPlayer = document.getElementById('audioPlayer');
const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const seekBar = document.getElementById('seekBar');
const playerTitle = document.getElementById('playerTitle');
const playerCreator = document.getElementById('playerCreator');

let currentList = 'forYou';
let currentRoom = null;
let playlist = [];
let currentIndex = 0;

/* ---------- Render helpers ---------- */
function renderCarousel() {
  liveCarousel.innerHTML = '';
  liveRooms.forEach(r => {
    const pill = document.createElement('div');
    pill.className = 'live-pill';
    pill.innerHTML = `
      <div class="live-badge">LIVE</div>
      <img src="${r.hostPic}" alt="${r.host}" />
      <div style="margin-top:.6rem; font-weight:700; font-size:.95rem;">${r.host}</div>
      <div class="count">${r.viewers} viewers</div>
    `;
    pill.addEventListener('click', () => openRoom(r));
    liveCarousel.appendChild(pill);
  });
}

function renderHero(room) {
  if (!room) {
    heroCard.innerHTML = `<div class="hero-content"><div class="hero-left"><img class="host-pic" src="assets/voxly-logo.png" /><div class="hero-meta"><div class="room-title">No featured live</div><div class="room-info">Discover live creators</div></div></div><div></div></div>`;
    return;
  }
  heroCard.innerHTML = `
    <img src="${room.cover}" class="hero-cover" alt="cover" />
    <div class="hero-content">
      <div class="hero-left">
        <img class="host-pic" src="${room.hostPic}" alt="${room.host}" />
        <div class="hero-meta">
          <div class="room-title">${room.title}</div>
          <div class="room-info">${room.host} • ${room.viewers} listeners</div>
        </div>
      </div>
      <div class="hero-actions">
        <button class="primary" id="heroJoin">Join Live</button>
      </div>
    </div>
  `;
  document.getElementById('heroJoin').addEventListener('click', () => openRoom(room));
}

function renderRooms() {
  roomList.innerHTML = '';
  const list = currentList === 'forYou' ? recommended : recommended.slice(0,2);
  playlist = list;
  list.forEach((r, idx) => {
    const card = document.createElement('div');
    card.className = 'room-card';
    card.classList.add(currentList === 'forYou' ? 'big' : 'small');
    card.innerHTML = `
      <img class="room-thumb" src="${r.thumb}" />
      <div class="room-details">
        <div style="font-weight:700; color:var(--neon-blue)">${r.title}</div>
        <div style="color:var(--muted); font-size:.9rem">${r.creator}</div>
      </div>
      <div class="room-actions">
        <button class="primary play-room" data-idx="${idx}">Play</button>
        <button class="secondary join-room" data-idx="${idx}">Join</button>
      </div>
    `;
    roomList.appendChild(card);
  });
}

function renderCreators() {
  creatorsEl.innerHTML = '';
  creators.forEach(c => {
    const el = document.createElement('div');
    el.className = 'creator';
    el.innerHTML = `
      <img src="${c.pic}" alt="${c.name}" />
      <small>${c.name}</small>
    `;
    creatorsEl.appendChild(el);
  });
}

/* ---------- Room open / modal ---------- */
function openRoom(room) {
  currentRoom = room;
  modalContent.innerHTML = `
    <h3 style="color:var(--neon-blue)">${room.title}</h3>
    <p style="color:var(--muted)">${room.host} • ${room.viewers} listeners</p>
    <div style="margin-top:1rem;">
      <img src="${room.hostPic}" style="width:120px; height:120px; border-radius:12px; object-fit:cover;" />
    </div>
    <p style="margin-top:1rem;color:var(--muted)">Join as a guest or listen only. Guest features are placeholders in this prototype.</p>
  `;
  joinModal.classList.remove('hidden');
}

/* Join / Listen actions */
joinBtn.addEventListener('click', () => {
  if (!currentRoom) return;
  startPlayback(currentRoom.audioUrl, currentRoom.title, currentRoom.host);
  joinModal.classList.add('hidden');
});

listenBtn.addEventListener('click', () => {
  if (!currentRoom) return;
  startPlayback(currentRoom.audioUrl, currentRoom.title, currentRoom.host);
  joinModal.classList.add('hidden');
});

closeModal.addEventListener('click', () => joinModal.classList.add('hidden'));

/* ---------- Playback controls ---------- */
function startPlayback(url, title, creator) {
  audioPlayer.src = url;
  audioPlayer.currentTime = 0;
  audioPlayer.play().catch(e => console.log('play err', e));
  playerTitle.textContent = title;
  playerCreator.textContent = creator;
  playBtn.textContent = '⏸️';
  // Update currentIndex
  currentIndex = playlist.findIndex(p => p.audioUrl === url);
}

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('play-room')) {
    const idx = parseInt(e.target.dataset.idx, 10);
    const item = playlist[idx];
    startPlayback(item.audioUrl, item.title, item.creator || item.host);
  }
  if (e.target.classList.contains('join-room')) {
    const idx = parseInt(e.target.dataset.idx, 10);
    const item = playlist[idx];
    openRoom({ ...item, host: item.creator || 'Host', hostPic: item.thumb, cover: item.thumb, viewers: Math.floor(Math.random()*900) });
  }
});

playBtn.addEventListener('click', () => {
  if (audioPlayer.paused) {
    audioPlayer.play().catch(e => console.log(e));
    playBtn.textContent = '⏸️';
  } else {
    audioPlayer.pause();
    playBtn.textContent = '▶️';
  }
});
prevBtn.addEventListener('click', () => {
  if (audioPlayer.currentTime > 3) {
    audioPlayer.currentTime = 0;
  } else if (currentIndex > 0) {
    startPlayback(playlist[currentIndex-1].audioUrl, playlist[currentIndex-1].title, playlist[currentIndex-1].creator || playlist[currentIndex-1].host);
  }
});
nextBtn.addEventListener('click', () => {
  if (currentIndex < playlist.length-1) {
    startPlayback(playlist[currentIndex+1].audioUrl, playlist[currentIndex+1].title, playlist[currentIndex+1].creator || playlist[currentIndex+1].host);
  }
});

/* Seek */
audioPlayer.addEventListener('timeupdate', () => {
  const pct = audioPlayer.duration ? (audioPlayer.currentTime / audioPlayer.duration) * 100 : 0;
  seekBar.value = pct;
});
seekBar.addEventListener('input', (e) => {
  if (!audioPlayer.duration) return;
  audioPlayer.currentTime = (e.target.value / 100) * audioPlayer.duration;
});

/* ---------- Tabs ---------- */
tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    tabButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentList = btn.dataset.tab === 'forYou' ? 'forYou' : 'following';
    renderRooms();
    renderHero(liveRooms[0]);
  });
});

/* ---------- Start Live (FAB) ---------- */
startLiveBtn.addEventListener('click', () => {
  alert('Start Live — creator flow not implemented in prototype.');
});

/* ---------- Init ---------- */
function init() {
  renderCarousel();
  renderHero(liveRooms[0] || null);
  renderRooms();
  renderCreators();
  // Unlock autoplay
  document.body.addEventListener('click', function unlockAudio() {
    audioPlayer.play().then(()=>{ audioPlayer.pause(); }).catch(()=>{});
    document.body.removeEventListener('click', unlockAudio);
  });
}

window.addEventListener('DOMContentLoaded', init);
