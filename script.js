// ========== Форма ==========
const form = document.getElementById('contact-form');
if (form) {
  const msg = document.getElementById('form-msg');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    msg.textContent = `Спасибо, ${name || 'друг'}! Заявка отправлена (демо-режим).`;
    form.reset();
  });
}

// ========== Музыка ==========
const audio = document.getElementById('bg-music');
if (audio) {
  const btn = document.getElementById('music-btn');

  // --- Создаём меню динамически ---
  const menu = document.createElement('div');
  menu.id = 'music-menu';
  menu.innerHTML = `
    <div class="now-label">Сейчас играет</div>
    <h4 id="now-title">—</h4>
    <ul class="track-list" id="track-list"></ul>
    <div class="seek-label"><span id="seek-current">0:00</span><span id="seek-total">0:00</span></div>
    <input type="range" id="seek" min="0" max="100" value="0" step="0.1">
    <div class="volume-label"><span>Громкость</span><span id="volume-value">40%</span></div>
    <input type="range" id="volume" min="0" max="100" value="40" step="1">
    <div class="menu-hint">Зажмите кнопку — меню</div>
  `;
  document.body.appendChild(menu);

  const nowTitle = menu.querySelector('#now-title');
  const trackList = menu.querySelector('#track-list');
  const seek = menu.querySelector('#seek');
  const seekCurrent = menu.querySelector('#seek-current');
  const seekTotal = menu.querySelector('#seek-total');
  const volume = menu.querySelector('#volume');
  const volumeValue = menu.querySelector('#volume-value');

  const playlist = [
    { title: 'Undertale Theme (By BreadBaton(Me))', src: 'music/undertale.mp3' },
    { title: 'BreakFast (By BreadBaton(Me))',    src: 'music/breakfast.ogg' },
    { title: 'The bad is behind (By BreadBaton(Me))',   src: 'music/chil.ogg' }
  ];
  let currentIndex = 0;

  // --- Громкость ---
  const VOLUME_KEY = 'haxe-site-volume';
  let savedVolume = parseFloat(localStorage.getItem(VOLUME_KEY));
  if (!isFinite(savedVolume) || savedVolume < 0 || savedVolume > 1) savedVolume = 0.4;

  function applyVolume(v) {
    audio.volume = v;
    volume.value = Math.round(v * 100);
    volumeValue.textContent = Math.round(v * 100) + '%';
    localStorage.setItem(VOLUME_KEY, String(v));
  }
  applyVolume(savedVolume);

  volume.addEventListener('input', () => {
    applyVolume(Number(volume.value) / 100);
  });

  // --- Утилиты ---
  function fmt(sec) {
    if (!isFinite(sec)) return '0:00';
    return Math.floor(sec / 60) + ':' + String(Math.floor(sec % 60)).padStart(2, '0');
  }

  function loadTrack(i, autoplay) {
    currentIndex = i;
    audio.src = playlist[i].src;
    nowTitle.textContent = playlist[i].title;
    renderTrackList();
    if (autoplay) {
      audio.play().then(() => {
        btn.textContent = '❚❚';
        btn.classList.add('playing');
      }).catch(() => {});
    }
  }

  function renderTrackList() {
    trackList.innerHTML = '';
    playlist.forEach((t, i) => {
      const li = document.createElement('li');
      li.className = i === currentIndex ? 'active' : '';
      li.textContent = t.title;
      li.addEventListener('click', () => loadTrack(i, true));
      trackList.appendChild(li);
    });
  }

  function playOrPause() {
    if (!audio.src) { loadTrack(0, true); return; }
    if (audio.paused) {
      audio.play().then(() => {
        btn.textContent = '❚❚';
        btn.classList.add('playing');
      }).catch(() => {});
    } else {
      audio.pause();
      btn.textContent = '♪';
      btn.classList.remove('playing');
    }
  }

  // --- Долгое зажатие ЛКМ ---
  const HOLD_MS = 500;
  let holdTimer = null, longPressFired = false;

  btn.addEventListener('pointerdown', (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    longPressFired = false;
    btn.classList.add('holding');
    holdTimer = setTimeout(() => {
      longPressFired = true;
      btn.classList.remove('holding');
      toggleMenu();
    }, HOLD_MS);
  });

  function cancelHold() {
    if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
    btn.classList.remove('holding');
  }

  btn.addEventListener('pointerup', () => {
    cancelHold();
    if (longPressFired) { longPressFired = false; return; }
    playOrPause();
  });
  btn.addEventListener('pointerleave', cancelHold);
  btn.addEventListener('pointercancel', cancelHold);
  btn.addEventListener('contextmenu', (e) => e.preventDefault());

  // --- Меню ---
  function toggleMenu() {
    menu.classList.contains('open') ? closeMenu() : openMenu();
  }
  function openMenu() {
    const rect = btn.getBoundingClientRect();
    menu.classList.add('open');
    let left = rect.right - menu.offsetWidth;
    let top = rect.top - menu.offsetHeight - 10;
    if (left < 8) left = 8;
    if (top < 8) top = rect.bottom + 10;
    menu.style.left = left + 'px';
    menu.style.top = top + 'px';
    if (!audio.src) loadTrack(0, false);
    updateSeekUI();
  }
  function closeMenu() { menu.classList.remove('open'); }

  document.addEventListener('pointerdown', (e) => {
    if (!menu.contains(e.target) && e.target !== btn) closeMenu();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  // --- Перемотка ---
  function updateSeekUI() {
    if (!isFinite(audio.duration) || audio.duration === 0) {
      seek.max = 100; seek.value = 0;
      seekCurrent.textContent = '0:00';
      seekTotal.textContent = '0:00';
      return;
    }
    seek.max = audio.duration;
    seek.value = audio.currentTime;
    seekCurrent.textContent = fmt(audio.currentTime);
    seekTotal.textContent = fmt(audio.duration);
  }

  audio.addEventListener('timeupdate', () => {
    if (menu.classList.contains('open') && !seek.matches(':active')) updateSeekUI();
  });
  audio.addEventListener('loadedmetadata', updateSeekUI);

  seek.addEventListener('input', () => {
    if (isFinite(audio.duration)) {
      audio.currentTime = Number(seek.value);
      seekCurrent.textContent = fmt(audio.currentTime);
    }
  });

  // --- Старт ---
  loadTrack(0, false);
}