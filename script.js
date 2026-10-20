// Форма
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

// Музыка
const audio = document.getElementById('bg-music');
if (audio) {
  const btn = document.getElementById('music-btn');
  const menu = document.getElementById('music-menu');
  const nowTitle = document.getElementById('now-title');
  const trackList = document.getElementById('track-list');
  const seek = document.getElementById('seek');
  const seekCurrent = document.getElementById('seek-current');
  const seekTotal = document.getElementById('seek-total');

  const playlist = [
    { title: 'Undertale Theme (By BreadBaton(Me))', src: 'music/undertale.mp3' },
    { title: 'BreakFast (By BreadBaton(Me))',    src: 'music/breakfast.ogg' },
    { title: 'FF (By ???)',   src: 'music/chil.ogg' }
  ];
  let currentIndex = 0;

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
      audio.volume = 0.4;
      audio.play().then(() => { btn.textContent = '❚❚'; btn.classList.add('playing'); }).catch(() => {});
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
      audio.volume = 0.4;
      audio.play().then(() => { btn.textContent = '❚❚'; btn.classList.add('playing'); }).catch(() => {});
    } else {
      audio.pause();
      btn.textContent = '♪';
      btn.classList.remove('playing');
    }
  }
  const HOLD_MS = 500;
  let holdTimer = null, longPressFired = false;
  btn.addEventListener('pointerdown', (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    longPressFired = false;
    btn.classList.add('holding');
    holdTimer = setTimeout(() => { longPressFired = true; btn.classList.remove('holding'); toggleMenu(); }, HOLD_MS);
  });
  function cancelHold() { if (holdTimer) clearTimeout(holdTimer); btn.classList.remove('holding'); }
  btn.addEventListener('pointerup', () => { cancelHold(); if (longPressFired) { longPressFired = false; return; } playOrPause(); });
  btn.addEventListener('pointerleave', cancelHold);
  btn.addEventListener('pointercancel', cancelHold);
  btn.addEventListener('contextmenu', (e) => e.preventDefault());

  function toggleMenu() { menu.classList.contains('open') ? closeMenu() : openMenu(); }
  function openMenu() {
    const rect = btn.getBoundingClientRect();
    menu.classList.add('open');
    let left = rect.right - menu.offsetWidth;
    let top = rect.top - menu.offsetHeight - 10;
    if (left < 8) left = 8;
    if (top < 8) top = rect.bottom + 10;
    menu.style.left = left + 'px'; menu.style.top = top + 'px';
    if (!audio.src) loadTrack(0, false);
    updateSeekUI();
  }
  function closeMenu() { menu.classList.remove('open'); }
  document.addEventListener('pointerdown', (e) => { if (!menu.contains(e.target) && e.target !== btn) closeMenu(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  function updateSeekUI() {
    if (!isFinite(audio.duration) || audio.duration === 0) {
      seek.max = 100; seek.value = 0; seekCurrent.textContent = '0:00'; seekTotal.textContent = '0:00'; return;
    }
    seek.max = audio.duration; seek.value = audio.currentTime;
    seekCurrent.textContent = fmt(audio.currentTime); seekTotal.textContent = fmt(audio.duration);
  }
  audio.addEventListener('timeupdate', () => { if (menu.classList.contains('open') && !seek.matches(':active')) updateSeekUI(); });
  audio.addEventListener('loadedmetadata', updateSeekUI);
  seek.addEventListener('input', () => { if (isFinite(audio.duration)) { audio.currentTime = Number(seek.value); seekCurrent.textContent = fmt(audio.currentTime); } });
  loadTrack(0, false);
}