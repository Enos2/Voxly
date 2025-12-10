/* Final corrected script.js (clickable live pills, no duplicate tabs, logo in tab handled by HTML) */

const API_BASE = 'http://localhost:5000/uploads';

/* ---------- Sample Data ---------- */
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

const audioPlayer = document.getElementById('audioPlayer');
const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const seekBar = document.getElementById('seekBar');
const playerTitle = document.getElementById('playerTitle');
const playerCreator = document.getElementById('playerCreator');

/* ---------- State ---------- */
let currentTab = 'echoLine';
let playlist = [];
let currentIndex = -1;
let currentRoom = null;

/* ---------- Render functions ---------- */

function renderCarousel() {
  liveCarousel.innerHTML = '';
  const top = liveRooms.slice(0, 5);
  top.forEach((r) => {
    const pill = document.createElement('button'); // use button for accessibility
    pill.className = 'live-pill';
    pill.type = 'button';
    pill.setAttribute('aria-label', `${r.host} live with ${r.viewers} viewers`);
    pill.innerHTML = `
      <div class="live-badge">LIVE</div>
      <img src="${r.hostPic}" alt="${r.host}" />
      <div style="margin-top:.6rem; font-weight:700; font-size:.95rem;">${r.host}</div>
      <div class="count">${r.viewers} viewers</div>
    `;
    pill.addEventListener('click', () => {
      renderHero(r);
      // set playlist to the liveRooms so controls/prev-next operate on live feed
      playlist = liveRooms.map(x => ({ title: x.title, creator: x.host, audioUrl: x.audioUrl }));
      currentIndex = liveRooms.findIndex(x => x.id === r.id);
    });
    liveCarousel.appendChild(pill);
  });
}

function renderHero(room) {
  if (!room) {
    heroCard.innerHTML = `
      <div class="hero-content">
        <div class="hero-left">
          <img class="host-pic" src="assets/voxly-logo.png" alt="Voxly logo"/>
          <div class="hero-meta">
            <div class="room-title">No featured live</div>
            <div class="room-info">Discover live creators</div>
          </div>
        </div>
      </div>
    `;
    currentRoom = null;
    return;
  }

  heroCard.innerHTML = `
    <img src="${room.cover}" class="hero-cover" alt="${room.title}" />
    <div class="hero-content">
      <div class="hero-left">
        <img class="host-pic" src="${room.hostPic}" alt="${room.host}" />
        <div class="hero-meta">
          <div class="room-title">${room.title}</div>
          <div class="room-info">${room.host} • ${room.viewers} listeners</div>
          <div class="hero-actions" aria-hidden="false">
            <button class="hero-btn" data-action="play" type="button">▶️ Play</button>
            <button class="hero-btn" data-action="join" type="button">🎤 Join</button>
            <button class="hero-btn" data-action="like" type="button">❤️ 0</button>
            <button class="hero-btn" data-action="comment" type="button">💬 0</button>
            <button class="hero-btn" data-action="share" type="button">🔗 Share</button>
          </div>
        </div>
      </div>
    </div>
  `;
  currentRoom = room;

  // attach hero action listeners
  const heroActions = heroCard.querySelectorAll('.hero-actions .hero-btn');
  heroActions.forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      if (action === 'play') {
        startPlayback(room.audioUrl, room.title, room.host);
      } else if (action === 'join') {
        openRoom(room);
      } else if (action === 'like') {
        alert('Liked ' + room.title);
      } else if (action === 'comment') {
        alert('Open comments for ' + room.title);
      } else if (action === 'share') {
        alert('Share ' + room.title);
      }
    });
  });
}

function renderRooms() {
  roomList.innerHTML = '';

  let list = [];
  if (currentTab === 'echoLine') {
    list = liveRooms;
  } else if (currentTab === 'yourCircle') {
    list = recommended.slice(0, 3);
  } else if (currentTab === 'pulse') {
    list = recommended;
  } else if (currentTab === 'crewWave') {
    list = recommended.slice(0, 2);
  }

  // setup playlist for prev/next (map)
  playlist = list.map(item => ({
    title: item.title || item.name,
    creator: item.creator || item.host || 'Host',
    audioUrl: item.audioUrl || item.audio || item.url,
    thumb: item.thumb || item.cover || item.hostPic
  }));
  currentIndex = -1;

  list.forEach((r, idx) => {
    const card = document.createElement('div');
    card.className = 'room-card ' + (currentTab === 'echoLine' ? 'big' : 'small');
    card.innerHTML = `
      <img class="room-thumb" src="${r.thumb || r.hostPic || 'assets/voxly-logo.png'}" alt="${r.title || r.creator}" />
      <div class="room-details">
        <div style="font-weight:700; color:var(--neon-blue)">${r.title || r.name}</div>
        <div style="color:var(--muted); font-size:.9rem">${r.creator || r.host || ''}</div>
        <div class="room-actions">
          <button class="action-btn" data-action="play" data-idx="${idx}" title="Play">▶️ Play</button>
          <button class="action-btn" data-action="join" data-idx="${idx}" title="Join">🎤 Join</button>
          <button class="action-btn" data-action="like" data-idx="${idx}" title="Like">❤️ 0</button>
          <button class="action-btn" data-action="comment" data-idx="${idx}" title="Comment">💬 0</button>
          <button class="action-btn" data-action="share" data-idx="${idx}" title="Share">🔗 Share</button>
        </div>
      </div>
    `;
    roomList.appendChild(card);
  });
}

/* ---------- Utility: open modal ---------- */
function openRoom(room) {
  currentRoom = room;
  if (!modalContent) return;
  modalContent.innerHTML = `
    <h3 style="color:var(--neon-blue)">${room.title}</h3>
    <p style="color:var(--muted)">${room.host} • ${room.viewers || 0} listeners</p>
    <div style="margin-top:1rem;">
      <img src="${room.hostPic || 'assets/voxly-logo.png'}" style="width:120px; height:120px; border-radius:12px; object-fit:cover;" />
    </div>
    <p style="margin-top:1rem;color:var(--muted)">Join as a guest or listen only. Guest features are placeholders in this prototype.</p>
  `;
  joinModal.classList.remove('hidden');
  joinModal.setAttribute('aria-hidden', 'false');
}

/* ---------- Action delegation for room buttons ---------- */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.action-btn');
  if (!btn) return;
  const action = btn.dataset.action;
  const idx = Number(btn.dataset.idx);
  const item = playlist[idx];
  if (!item) return;

  if (action === 'play') {
    startPlayback(item.audioUrl, item.title, item.creator);
  } else if (action === 'join') {
    openRoom({
      id: item.id || `item-${idx}`,
      title: item.title,
      host: item.creator,
      hostPic: item.thumb || 'assets/voxly-logo.png',
      viewers: Math.floor(Math.random() * 900),
      cover: item.thumb || 'assets/voxly-logo.png',
      audioUrl: item.audioUrl
    });
  } else if (action === 'like') {
    alert('Liked: ' + item.title);
  } else if (action === 'comment') {
    alert('Comment for: ' + item.title);
  } else if (action === 'share') {
    alert('Share: ' + item.title);
  }
});

/* ---------- Modal controls ---------- */
if (closeModal) closeModal.addEventListener('click', () => {
  joinModal.classList.add('hidden');
  joinModal.setAttribute('aria-hidden', 'true');
});
if (joinBtn) joinBtn.addEventListener('click', () => {
  if (!currentRoom) return;
  startPlayback(currentRoom.audioUrl, currentRoom.title, currentRoom.host);
  joinModal.classList.add('hidden');
  joinModal.setAttribute('aria-hidden', 'true');
});
if (listenBtn) listenBtn.addEventListener('click', () => {
  if (!currentRoom) return;
  startPlayback(currentRoom.audioUrl, currentRoom.title, currentRoom.host);
  joinModal.classList.add('hidden');
  joinModal.setAttribute('aria-hidden', 'true');
});

/* ---------- Playback ---------- */
function startPlayback(url, title = '', creator = '') {
  if (!url) {
    console.warn('No audio URL:', url);
    return;
  }
  audioPlayer.src = url;
  audioPlayer.currentTime = 0;
  audioPlayer.play().then(() => {
    playBtn.textContent = '⏸️';
  }).catch(err => {
    console.warn('Playback blocked or error:', err);
  });
  if (playerTitle) playerTitle.textContent = title || 'Playing';
  if (playerCreator) playerCreator.textContent = creator || '';
  // attempt to find index
  const idx = playlist.findIndex(p => (p.audioUrl || p.url) === url);
  currentIndex = idx >= 0 ? idx : currentIndex;
}

if (playBtn) playBtn.addEventListener('click', () => {
  if (audioPlayer.paused) {
    audioPlayer.play().catch(e => console.warn('Play failed', e));
    playBtn.textContent = '⏸️';
  } else {
    audioPlayer.pause();
    playBtn.textContent = '▶️';
  }
});
if (prevBtn) prevBtn.addEventListener('click', () => {
  if (audioPlayer.currentTime > 3) {
    audioPlayer.currentTime = 0;
  } else if (currentIndex > 0) {
    const prev = playlist[currentIndex - 1];
    if (prev) startPlayback(prev.audioUrl, prev.title, prev.creator);
  }
});
if (nextBtn) nextBtn.addEventListener('click', () => {
  if (currentIndex >= 0 && currentIndex < playlist.length - 1) {
    const next = playlist[currentIndex + 1];
    if (next) startPlayback(next.audioUrl, next.title, next.creator);
  }
});

audioPlayer.addEventListener('timeupdate', () => {
  if (!audioPlayer.duration || isNaN(audioPlayer.duration)) return;
  seekBar.value = (audioPlayer.currentTime / audioPlayer.duration) * 100;
});
seekBar.addEventListener('input', (e) => {
  if (!audioPlayer.duration || isNaN(audioPlayer.duration)) return;
  audioPlayer.currentTime = (e.target.value / 100) * audioPlayer.duration;
});
audioPlayer.addEventListener('ended', () => {
  playBtn.textContent = '▶️';
});

/* ---------- Tabs ---------- */
tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    tabButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    // keep aria-selected accurate
    tabButtons.forEach(b => b.setAttribute('aria-selected', 'false'));
    btn.setAttribute('aria-selected', 'true');

    const t = btn.dataset.tab;
    if (['echoLine','yourCircle','pulse','crewWave'].includes(t)) {
      currentTab = t;
    } else {
      currentTab = 'echoLine';
    }
    // hero selection: for echoLine show top live, otherwise show recommended first
    if (currentTab === 'echoLine') {
      renderHero(liveRooms[0] || null);
      playlist = liveRooms.map(x => ({ title: x.title, creator: x.host, audioUrl: x.audioUrl }));
    } else {
      renderHero(recommended[0] || liveRooms[0] || null);
      playlist = recommended.map(x => ({ title: x.title, creator: x.creator, audioUrl: x.audioUrl }));
    }
    renderRooms();
    renderCarousel();
  });
});

/* ---------- Creators render ---------- */
function renderCreators() {
  creatorsEl.innerHTML = '';
  creators.forEach(c => {
    const el = document.createElement('div');
    el.className = 'creator';
    el.innerHTML = `<img src="${c.pic}" alt="${c.name}"/><small>${c.name}</small>`;
    creatorsEl.appendChild(el);
  });
}

/* ---------- Start Live FAB ---------- */
if (startLiveBtn) startLiveBtn.addEventListener('click', () => {
  alert('Start Live — creator flow not implemented in prototype.');
});

/* ---------- Init ---------- */
function init() {
  renderCarousel();
  renderHero(liveRooms[0] || recommended[0] || null);
  renderRooms();
  renderCreators();

  // Unlock audio on first user gesture (works around autoplay blocking)
  const unlock = () => {
    audioPlayer.play().then(()=>audioPlayer.pause()).catch(()=>{});
    document.body.removeEventListener('click', unlock);
  };
  document.body.addEventListener('click', unlock);
}

window.addEventListener('DOMContentLoaded', init);
