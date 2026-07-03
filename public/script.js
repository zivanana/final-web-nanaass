// ================================================================
// script.js — D'ANS. Personal Profile
// Navigasi: Home, Artikel, Playlist, Contact
// Artikel: Neon.tech PostgreSQL via backend API
// ================================================================

const API_BASE = '/api';
let authToken = localStorage.getItem('dans_token') || null;

// ================================================================
// LOGIN
// ================================================================
function loginApp() {
  const loginScreen = document.getElementById("loginScreen");
  const app = document.getElementById("app");
  loginScreen.classList.add("fade-out");
  setTimeout(() => {
    loginScreen.classList.add("hidden");
    app.classList.remove("hidden");
    navigate(currentPage, true);
  }, 600);
}

// ================================================================
// NAVIGASI MULTI-HALAMAN
// ================================================================
let currentPage = "home";

function navigate(page, force = false) {
  if (page === currentPage && !force) return;

  document.querySelectorAll(".page").forEach(p => {
    p.classList.add("hidden");
    p.classList.remove("active");
  });

  const target = document.getElementById("page-" + page);
  if (target) {
    target.classList.remove("hidden");
    requestAnimationFrame(() => target.classList.add("active"));
  }

  document.querySelectorAll(".nav-item").forEach(item => {
    item.classList.toggle("active", item.dataset.page === page);
  });

  currentPage = page;

  if (page === "home") renderHomeStats();
  if (page === "artikel") loadArtikelFromAPI();
  if (page === "playlist") renderPlaylistGrid();
}

// ================================================================
// HOME STATS & DASHBOARD (gaya seperti referensi gambar)
// ================================================================
function renderHomeStats() {
  const arts  = getCachedArticles();
  const songs = getPlaylist();

  // kompatibilitas lama
  const a = document.getElementById("statArtikel");
  const b = document.getElementById("profArtikel");
  if (a) a.textContent = arts.length;
  if (b) b.textContent = arts.length;

  // Header "Aktivitas Hari Ini (n)"
  const headerCount = document.getElementById("headerActivityCount");
  if (headerCount) headerCount.textContent = `(${arts.length + songs.length})`;

  const acArtikel = document.getElementById("acArtikelCount");
  if (acArtikel) acArtikel.textContent = arts.length;
  const acPlaylist = document.getElementById("acPlaylistCount");
  if (acPlaylist) acPlaylist.textContent = songs.length;

  // Progres belajar
  const completedEl = document.getElementById("pcCompleted");
  if (completedEl) completedEl.textContent = arts.length;

  const score = Math.min(100, arts.length * 8 + songs.length * 4);
  const scoreEl = document.getElementById("pcScore");
  if (scoreEl) scoreEl.textContent = score;

  const activeEl = document.getElementById("pcActive");
  if (activeEl) activeEl.textContent = 3; // jumlah Goals

  // Kartu "Lanjutkan" — Artikel terbaru
  const latestArt = arts[0];
  const ccCat   = document.getElementById("ccArtikelCat");
  const ccIcon  = document.getElementById("ccArtikelCatIcon");
  const ccMeta  = document.getElementById("ccArtikelMeta");
  const ccTitle = document.getElementById("ccArtikelTitle");
  const ccBar   = document.getElementById("ccArtikelBar");
  if (latestArt && ccTitle) {
    if (ccCat)  ccCat.textContent  = latestArt.category || "Artikel";
    if (ccIcon) ccIcon.textContent = categoryIcon(latestArt.category);
    if (ccMeta) ccMeta.textContent = `Artikel ke-${arts.length} dari target 24`;
    ccTitle.textContent = latestArt.title;
    if (ccBar) ccBar.style.width = `${Math.min(100, (arts.length / 24) * 100)}%`;
  } else if (ccTitle) {
    if (ccMeta) ccMeta.textContent = "Belum ada artikel";
    ccTitle.textContent = "Tulis artikel pertamamu!";
    if (ccBar) ccBar.style.width = "0%";
  }

  // Kartu "Lanjutkan" — Lagu terbaru
  const latestSong = songs[songs.length - 1];
  const ccSongMeta  = document.getElementById("ccSongMeta");
  const ccSongTitle = document.getElementById("ccSongTitle");
  const ccSongBar   = document.getElementById("ccSongBar");
  if (latestSong && ccSongTitle) {
    if (ccSongMeta) ccSongMeta.textContent = `${songs.length} lagu di playlist`;
    ccSongTitle.textContent = `${latestSong.title} — ${latestSong.artist}`;
    if (ccSongBar) ccSongBar.style.width = `${Math.min(100, songs.length * 10)}%`;
  } else if (ccSongTitle) {
    if (ccSongMeta) ccSongMeta.textContent = "Belum ada lagu";
    ccSongTitle.textContent = "Tambah lagu favoritmu!";
    if (ccSongBar) ccSongBar.style.width = "0%";
  }

  renderCalendar();
}

function continueLatestArtikel() {
  const arts = getCachedArticles();
  if (arts.length) viewArtikel(arts[0].id);
  else { navigate('artikel'); openArtikelModal(); }
}

// ================================================================
// KALENDER AKTIVITAS (mirip "Lesson schedule" pada referensi)
// ================================================================
let calViewDate = new Date();

function renderCalendar() {
  const monthLabel = document.getElementById("calMonthLabel");
  const grid = document.getElementById("calGrid2");
  if (!grid) return;

  const year  = calViewDate.getFullYear();
  const month = calViewDate.getMonth();
  const today = new Date();

  const monthNames = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  if (monthLabel) monthLabel.textContent = `${monthNames[month]} ${year}`;

  // tandai tanggal yang ada artikel diterbitkan pada bulan ini
  const eventDays = new Set(
    getCachedArticles()
      .map(a => a.created_at ? new Date(a.created_at) : null)
      .filter(d => d && !isNaN(d) && d.getFullYear() === year && d.getMonth() === month)
      .map(d => d.getDate())
  );

  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // Senin = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const weekday = ["SEN","SEL","RAB","KAM","JUM","SAB","MIN"];
  let html = weekday.map(w => `<div class="cal-wd2">${w}</div>`).join("");

  for (let i = 0; i < startOffset; i++) {
    html += `<div class="cal-day2 other">${daysInPrevMonth - startOffset + i + 1}</div>`;
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const hasEvent = eventDays.has(d);
    html += `<div class="cal-day2 ${isToday ? "today" : ""} ${hasEvent ? "has-event" : ""}">${d}</div>`;
  }
  const totalCells = startOffset + daysInMonth;
  const remain = (7 - (totalCells % 7)) % 7;
  for (let i = 1; i <= remain; i++) html += `<div class="cal-day2 other">${i}</div>`;

  grid.innerHTML = html;
}

function calPrevMonth() { calViewDate.setMonth(calViewDate.getMonth() - 1); renderCalendar(); }
function calNextMonth() { calViewDate.setMonth(calViewDate.getMonth() + 1); renderCalendar(); }

// ================================================================
// PENCARIAN GLOBAL (search bar di topbar)
// ================================================================
function runGlobalSearch() {
  const input = document.getElementById("globalSearch");
  const q = (input?.value || "").trim().toLowerCase();
  if (!q) return;

  const arts = getCachedArticles().filter(a =>
    a.title.toLowerCase().includes(q) || (a.excerpt || "").toLowerCase().includes(q)
  );
  if (arts.length) {
    navigate("artikel", true);
    renderArtikelGrid(arts);
    showToast(`🔎 ${arts.length} artikel ditemukan untuk "${q}"`, "success");
    return;
  }

  const songs = getPlaylist().filter(s =>
    s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
  );
  if (songs.length) {
    navigate("playlist", true);
    renderPlaylistGrid(songs);
    showToast(`🔎 ${songs.length} lagu ditemukan untuk "${q}"`, "success");
    return;
  }

  showToast(`Tidak ditemukan hasil untuk "${q}"`, "error");
}

// ================================================================
// GREETING & CLOCK
// ================================================================
function getGreeting() {
  const h = new Date().getHours();
  if (h >= 4 && h < 11)  return "Selamat Pagi";
  if (h >= 11 && h < 15) return "Selamat Siang";
  if (h >= 15 && h < 18) return "Selamat Sore";
  return "Selamat Malam";
}

function updateClocks() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const greeting = getGreeting();

  const loginClock = document.getElementById("loginClock");
  if (loginClock) loginClock.textContent = timeStr;

  const topbarClock    = document.getElementById("topbarClock");
  const topbarGreeting = document.getElementById("topbarGreeting");
  const topbarDate     = document.getElementById("topbarDate");
  if (topbarClock)    topbarClock.textContent = timeStr;
  if (topbarGreeting) topbarGreeting.textContent = `${greeting}, Zivana! 👋`;
  if (topbarDate)     topbarDate.textContent = dateStr;

  const dashGreeting = document.getElementById("dashGreeting");
  if (dashGreeting) dashGreeting.textContent = `${greeting} 👋`;
}

// ================================================================
// COUNTDOWN ULANG TAHUN
// ================================================================
function updateCountdown() {
  const now = new Date();
  let target = new Date(now.getFullYear(), 11, 1, 0, 0, 0);
  if (target <= now) target = new Date(now.getFullYear() + 1, 11, 1, 0, 0, 0);

  const diff = target - now;
  const hari  = Math.floor(diff / (1000 * 60 * 60 * 24));
  const jam   = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const menit = Math.floor((diff / (1000 * 60)) % 60);
  const detik = Math.floor((diff / 1000) % 60);

  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(val).padStart(2, "0");
  };
  set("cdHari", hari);
  set("cdJam", jam);
  set("cdMenit", menit);
  set("cdDetik", detik);
}


// ================================================================
// ARTIKEL — API ke Neon.tech (via backend)
// ================================================================

let cachedArticles = [];

function getCachedArticles() { return cachedArticles; }

async function loadArtikelFromAPI() {
  const el = document.getElementById("artikelGrid");
  const loading = document.getElementById("artikelLoading");
  if (!el) return;

  if (loading) loading.style.display = "flex";
  el.innerHTML = "";

  try {
    const res = await fetch(`${API_BASE}/articles`);
    if (!res.ok) throw new Error("Gagal memuat artikel");
    const arts = await res.json();
    
    // 🔥 Simpan ke cache dan localStorage
    cachedArticles = arts;
    if (arts.length > 0) {
      lsSet("dans_profile_articles", arts); // backup ke localStorage
    }
    renderHomeStats();
    renderArtikelGrid(arts);
  } catch (err) {
    console.warn("❌ Gagal fetch dari backend, pakai localStorage:", err);
    // Fallback ke localStorage
    const local = lsGet("dans_profile_articles") || [];
    cachedArticles = local;
    renderHomeStats();
    renderArtikelGrid(local);
    
    if (local.length === 0) {
      el.innerHTML = `<div class="empty-state">
        <div class="es-icon">⚠️</div>
        <p>Backend tidak terhubung. Pastikan server berjalan di <code>localhost:5000</code></p>
        <p style="margin-top:8px;font-size:0.85rem;opacity:0.7">Artikel akan disimpan sementara di localStorage</p>
      </div>`;
    }
  } finally {
    if (loading) loading.style.display = "none";
  }
}

async function saveArtikelToAPI(data) {
  if (!authToken) {
    // Simpan ke localStorage sebagai fallback
    saveArtikelLocal(data);
    return;
  }
  try {
    const url = editArtikelId
      ? `${API_BASE}/articles/${editArtikelId}`
      : `${API_BASE}/articles`;
    const method = editArtikelId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Gagal menyimpan artikel");
    const msg = editArtikelId ? "✅ Artikel berhasil diperbarui!" : "🎉 Artikel berhasil ditambahkan!";
    showToast(msg, "success");
    triggerArtikelNotification(data.title);
    loadArtikelFromAPI();
  } catch (err) {
    saveArtikelLocal(data);
    showToast("⚠ Backend tidak tersambung, artikel disimpan lokal", "error");
  }
}

async function deleteArtikelAPI(id) {
  if (!authToken) {
    deleteArtikelLocal(id);
    return;
  }
  try {
    await fetch(`${API_BASE}/articles/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` },
    });
    showToast("🗑 Artikel berhasil dihapus", "success");
    loadArtikelFromAPI();
  } catch (err) {
    deleteArtikelLocal(id);
  }
}

// ---- Fallback localStorage ----
function lsGet(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}
function lsSet(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

function saveArtikelLocal(data) {
  let arts = lsGet("dans_profile_articles") || [];
  if (editArtikelId !== null) {
    const idx = arts.findIndex(a => a.id === editArtikelId);
    if (idx !== -1) arts[idx] = { ...arts[idx], ...data };
  } else {
    const newId = Date.now();
    arts.unshift({ id: newId, ...data, created_at: new Date().toISOString() });
  }
  lsSet("dans_profile_articles", arts);
  cachedArticles = arts;
  renderArtikelGrid(arts);
  renderHomeStats();
}

function deleteArtikelLocal(id) {
  let arts = lsGet("dans_profile_articles") || [];
  arts = arts.filter(a => a.id !== id);
  lsSet("dans_profile_articles", arts);
  cachedArticles = arts;
  renderArtikelGrid(arts);
  renderHomeStats();
  showToast("🗑 Artikel dihapus (lokal)", "success");
}


// ================================================================
// ARTIKEL — Render Grid
// ================================================================
function renderArtikelGrid(arts) {
  const el = document.getElementById("artikelGrid");
  if (!el) return;

  if (!arts || !arts.length) {
    el.innerHTML = `<div class="empty-state">
      <div class="es-icon">📝</div>
      <p>Belum ada artikel. Klik <strong>"+ Tulis Artikel"</strong> untuk membuat yang pertama!</p>
    </div>`;
    return;
  }

  el.innerHTML = arts.map(a => `
    <div class="artikel-card" onclick="viewArtikel('${a.id}')">
      ${a.image_url
        ? `<img class="artikel-thumb" src="${a.image_url}" alt="${escapeHtml(a.title)}" />`
        : `<div class="artikel-thumb-placeholder">${categoryIcon(a.category)}</div>`}
      <div class="artikel-body">
        <span class="artikel-cat">${a.category || 'Lainnya'}</span>
        <div class="artikel-title">${escapeHtml(a.title)}</div>
        <div class="artikel-excerpt">${escapeHtml(a.excerpt || truncate(a.content, 90))}</div>
        <div class="artikel-meta">📅 ${formatDate(a.created_at || a.date)}</div>
      </div>
      <div class="artikel-actions">
        <button class="btn btn-sm" onclick="event.stopPropagation(); editArtikel('${a.id}')">✏ Edit</button>
        <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); deleteArtikel('${a.id}')">🗑 Hapus</button>
      </div>
    </div>
  `).join("");
}

function formatDate(val) {
  if (!val) return "—";
  try {
    return new Date(val).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return val; }
}

function categoryIcon(cat) {
  const map = { "Web Development": "💻", "Desain Grafis": "🎨", "Cyber Security": "🔐", "Kuliah": "🎓", "Project": "🚀" };
  return map[cat] || "📝";
}

function truncate(text, len) {
  if (!text) return "";
  return text.length > len ? text.slice(0, len) + "…" : text;
}

function escapeHtml(str) {
  return (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}


// ================================================================
// ARTIKEL — CRUD Modal
// ================================================================
let editArtikelId = null;
let pendingImage = null;

function openArtikelModal() {
  editArtikelId = null;
  pendingImage = null;
  clearArtikelForm();
  document.getElementById("artikelModalTitle").textContent = "Tulis Artikel Baru";
  document.getElementById("overlayArtikel").classList.add("open");
}

function closeArtikelModal() { document.getElementById("overlayArtikel").classList.remove("open"); }
function closeArtikelIfBackdrop(e) { if (e.target === document.getElementById("overlayArtikel")) closeArtikelModal(); }

function clearArtikelForm() {
  ["aTitle","aExcerpt","aContent"].forEach(id => { const el = document.getElementById(id); if(el) el.value = ""; });
  const cat = document.getElementById("aCategory"); if (cat) cat.value = "";
  const ai = document.getElementById("aImage"); if (ai) ai.value = "";
  const tc = document.getElementById("aTitleCount"); if (tc) tc.textContent = "0/120";
  const ec = document.getElementById("aExcerptCount"); if (ec) ec.textContent = "0/160";
  const ipw = document.getElementById("imgPreviewWrap"); if (ipw) ipw.style.display = "none";
  ["aTitle","aCategory","aContent"].forEach(id => document.getElementById(id)?.classList.remove("input-error"));
  ["eATitle","eACategory","eAContent"].forEach(id => document.getElementById(id)?.classList.remove("show"));
}

function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) { showToast("⚠ File harus berupa gambar", "error"); return; }
  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = new Image();
    img.onload = () => {
      const maxW = 700;
      const scale = Math.min(1, maxW / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      pendingImage = canvas.toDataURL("image/jpeg", 0.8);
      document.getElementById("imgPreview").src = pendingImage;
      document.getElementById("imgPreviewWrap").style.display = "flex";
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function removeImage() {
  pendingImage = null;
  const ai = document.getElementById("aImage"); if (ai) ai.value = "";
  document.getElementById("imgPreviewWrap").style.display = "none";
}

function validateArtikelForm() {
  let valid = true;
  const title   = document.getElementById("aTitle").value.trim();
  const cat     = document.getElementById("aCategory").value;
  const content = document.getElementById("aContent").value.trim();
  if (title.length < 5) { document.getElementById("aTitle").classList.add("input-error"); document.getElementById("eATitle").classList.add("show"); valid = false; }
  if (!cat) { document.getElementById("aCategory").classList.add("input-error"); document.getElementById("eACategory").classList.add("show"); valid = false; }
  if (content.length < 30) { document.getElementById("aContent").classList.add("input-error"); document.getElementById("eAContent").classList.add("show"); valid = false; }
  return valid;
}

async function saveArtikel() {
  if (!validateArtikelForm()) return;
  const btn = document.getElementById("btnSimpanArtikel");
  if (btn) { btn.disabled = true; btn.textContent = "Menyimpan..."; }

  const data = {
    title:    document.getElementById("aTitle").value.trim(),
    category: document.getElementById("aCategory").value,
    excerpt:  document.getElementById("aExcerpt").value.trim(),
    content:  document.getElementById("aContent").value.trim(),
    image_url: pendingImage || "",
  };

  await saveArtikelToAPI(data);
  editArtikelId = null;
  closeArtikelModal();
  renderHomeStats();

  if (btn) { btn.disabled = false; btn.textContent = "💾 Simpan Artikel"; }
}

function editArtikel(id) {
  const a = cachedArticles.find(x => String(x.id) === String(id));
  if (!a) return;
  editArtikelId = id;
  pendingImage = a.image_url || null;

  document.getElementById("artikelModalTitle").textContent = "Edit Artikel";
  document.getElementById("aTitle").value = a.title;
  document.getElementById("aCategory").value = a.category || "";
  document.getElementById("aExcerpt").value = a.excerpt || "";
  document.getElementById("aContent").value = a.content;
  countChars("aTitle","aTitleCount",120);
  countChars("aExcerpt","aExcerptCount",160);

  if (a.image_url) {
    document.getElementById("imgPreview").src = a.image_url;
    document.getElementById("imgPreviewWrap").style.display = "flex";
  } else {
    document.getElementById("imgPreviewWrap").style.display = "none";
  }
  ["aTitle","aCategory","aContent"].forEach(id2 => document.getElementById(id2)?.classList.remove("input-error"));
  ["eATitle","eACategory","eAContent"].forEach(id2 => document.getElementById(id2)?.classList.remove("show"));
  document.getElementById("overlayArtikel").classList.add("open");
}

function deleteArtikel(id) {
  const a = cachedArticles.find(x => String(x.id) === String(id));
  if (!a) return;
  if (!confirm(`Hapus artikel:\n"${a.title}"?`)) return;
  deleteArtikelAPI(id);
}

function viewArtikel(id) {
  const a = cachedArticles.find(x => String(x.id) === String(id));
  if (!a) return;
  const body = document.getElementById("viewBody");
  body.innerHTML = `
    ${a.image_url ? `<img class="view-img" src="${a.image_url}" alt="${escapeHtml(a.title)}" />` : ""}
    <div class="view-meta-row">
      <span class="artikel-cat">${a.category || 'Lainnya'}</span>
      <span class="artikel-meta">📅 ${formatDate(a.created_at || a.date)}</span>
    </div>
    <div class="view-title">${escapeHtml(a.title)}</div>
    <div class="view-content">${escapeHtml(a.content)}</div>
  `;
  document.getElementById("viewFoot").innerHTML = `
    <button class="btn" onclick="closeViewModal()">Tutup</button>
    <button class="btn btn-primary" onclick="closeViewModal(); editArtikel('${a.id}')">✏ Edit Artikel</button>
  `;
  document.getElementById("overlayView").classList.add("open");
}

function closeViewModal() { document.getElementById("overlayView").classList.remove("open"); }
function closeViewIfBackdrop(e) { if (e.target === document.getElementById("overlayView")) closeViewModal(); }


// ================================================================
// PLAYLIST — localStorage
// ================================================================
const LS_PLAYLIST = "dans_playlist";

function getPlaylist() { return lsGet(LS_PLAYLIST) || []; }
function savePlaylistData(data) { lsSet(LS_PLAYLIST, data); }

let editPlaylistId = null;
let activeGenreFilter = "Semua";

function initDefaultPlaylist() {
  if (!lsGet(LS_PLAYLIST)) {
    const defaults = [
      { id: 1, title: "Gurenge", artist: "LiSA", genre: "OST Anime", note: "Opening Demon Slayer 🔥", youtube: "https://www.youtube.com/watch?v=CwkzK-F0Y4I" },
      { id: 2, title: "Unlasting", artist: "LiSA", genre: "J-Pop", note: "Melankolis tapi indah banget", youtube: "" },
      { id: 3, title: "Neon Tetra", artist: "Wednesday Campanella", genre: "J-Pop", note: "Lagu yang bikin semangat ngoding!", youtube: "" },
      { id: 4, title: "Stay", artist: "The Kid LAROI ft. Justin Bieber", genre: "Pop", note: "Favorit banget di 2021", youtube: "" },
      { id: 5, title: "Love Scenario", artist: "iKON", genre: "K-Pop", note: "Klasik K-Pop yang nggak pernah bosen", youtube: "" },
    ];
    savePlaylistData(defaults);
  }
}

function renderPlaylistFilter() {
  const el = document.getElementById("playlistFilter");
  if (!el) return;
  const playlist = getPlaylist();
  const genres = ["Semua", ...new Set(playlist.map(s => s.genre))];
  el.innerHTML = genres.map(g =>
    `<button class="genre-btn ${g === activeGenreFilter ? 'active' : ''}" onclick="setGenreFilter('${g}')">${g}</button>`
  ).join("");
}

function setGenreFilter(genre) {
  activeGenreFilter = genre;
  renderPlaylistGrid();
}

function renderPlaylistGrid(customList) {
  renderPlaylistFilter();
  const el = document.getElementById("playlistContainer");
  if (!el) return;
  let playlist = customList || getPlaylist();
  if (!customList && activeGenreFilter !== "Semua") playlist = playlist.filter(s => s.genre === activeGenreFilter);

  if (!playlist.length) {
    el.innerHTML = `<div class="empty-state"><div class="es-icon">🎵</div><p>Belum ada lagu di playlist. Tambah yuk!</p></div>`;
    return;
  }

  el.innerHTML = `<div class="playlist-list">
    ${playlist.map((s, i) => `
      <div class="playlist-item">
        <div class="playlist-rank">${i + 1}</div>
        <div class="playlist-cover">${genreEmoji(s.genre)}</div>
        <div class="playlist-info">
          <div class="playlist-title">${escapeHtml(s.title)}</div>
          <div class="playlist-artist">${escapeHtml(s.artist)}</div>
          ${s.note ? `<div class="playlist-note">💬 ${escapeHtml(s.note)}</div>` : ""}
        </div>
        <div class="playlist-genre-tag">${escapeHtml(s.genre)}</div>
        <div class="playlist-actions">
          ${s.youtube ? `<a class="btn btn-sm btn-youtube" href="${s.youtube}" target="_blank" rel="noopener" onclick="event.stopPropagation()">▶ YouTube</a>` : ""}
          <button class="btn btn-sm" onclick="editPlaylist(${s.id})">✏</button>
          <button class="btn btn-sm btn-danger" onclick="deletePlaylist(${s.id})">🗑</button>
        </div>
      </div>
    `).join("")}
  </div>`;
}

function genreEmoji(genre) {
  const map = { "J-Pop": "🇯🇵", "K-Pop": "🇰🇷", "Pop": "🎤", "Indie": "🎸", "OST Anime": "⚔️", "R&B": "🎷" };
  return map[genre] || "🎵";
}

function openPlaylistModal() {
  editPlaylistId = null;
  clearPlaylistForm();
  document.getElementById("playlistModalTitle").textContent = "Tambah Lagu";
  document.getElementById("overlayPlaylist").classList.add("open");
}

function closePlaylistModal() { document.getElementById("overlayPlaylist").classList.remove("open"); }
function closePlaylistIfBackdrop(e) { if (e.target === document.getElementById("overlayPlaylist")) closePlaylistModal(); }

function clearPlaylistForm() {
  ["pTitle","pArtist","pNote","pYoutube"].forEach(id => { const el = document.getElementById(id); if(el) el.value=""; });
  const pg = document.getElementById("pGenre"); if (pg) pg.value = "Pop";
}

function savePlaylist() {
  const title  = document.getElementById("pTitle").value.trim();
  const artist = document.getElementById("pArtist").value.trim();
  const genre  = document.getElementById("pGenre").value;
  const note   = document.getElementById("pNote").value.trim();
  const youtube= document.getElementById("pYoutube").value.trim();

  let valid = true;
  if (!title) { document.getElementById("ePTitle").classList.add("show"); valid = false; }
  else document.getElementById("ePTitle").classList.remove("show");
  if (!artist) { document.getElementById("ePArtist").classList.add("show"); valid = false; }
  else document.getElementById("ePArtist").classList.remove("show");
  if (!valid) return;

  let playlist = getPlaylist();
  if (editPlaylistId !== null) {
    const idx = playlist.findIndex(s => s.id === editPlaylistId);
    if (idx !== -1) playlist[idx] = { ...playlist[idx], title, artist, genre, note, youtube };
    showToast("✅ Lagu berhasil diperbarui!", "success");
  } else {
    const newId = Date.now();
    playlist.push({ id: newId, title, artist, genre, note, youtube });
    showToast("🎵 Lagu berhasil ditambahkan!", "success");
  }

  savePlaylistData(playlist);
  closePlaylistModal();
  renderPlaylistGrid();
}

function editPlaylist(id) {
  const s = getPlaylist().find(x => x.id === id);
  if (!s) return;
  editPlaylistId = id;
  document.getElementById("playlistModalTitle").textContent = "Edit Lagu";
  document.getElementById("pTitle").value = s.title;
  document.getElementById("pArtist").value = s.artist;
  document.getElementById("pGenre").value = s.genre;
  document.getElementById("pNote").value = s.note || "";
  document.getElementById("pYoutube").value = s.youtube || "";
  document.getElementById("overlayPlaylist").classList.add("open");
}

function deletePlaylist(id) {
  const s = getPlaylist().find(x => x.id === id);
  if (!s || !confirm(`Hapus lagu:\n"${s.title}"?`)) return;
  let playlist = getPlaylist().filter(x => x.id !== id);
  savePlaylistData(playlist);
  renderPlaylistGrid();
  showToast("🗑 Lagu dihapus dari playlist", "success");
}


// ================================================================
// CONTACT — form pesan (localStorage)
// ================================================================
function sendMessage() {
  let valid = true;
  const name  = document.getElementById("msgName").value.trim();
  const email = document.getElementById("msgEmail").value.trim();
  const text  = document.getElementById("msgText").value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!name) { document.getElementById("msgName").classList.add("input-error"); document.getElementById("eMsgName").classList.add("show"); valid = false; }
  if (!emailRegex.test(email)) { document.getElementById("msgEmail").classList.add("input-error"); document.getElementById("eMsgEmail").classList.add("show"); valid = false; }
  if (text.length < 10) { document.getElementById("msgText").classList.add("input-error"); document.getElementById("eMsgText").classList.add("show"); valid = false; }
  if (!valid) return;

  const msgs = lsGet("dans_profile_messages") || [];
  msgs.unshift({ name, email, text, date: new Date().toISOString() });
  lsSet("dans_profile_messages", msgs);

  document.getElementById("msgName").value = "";
  document.getElementById("msgEmail").value = "";
  document.getElementById("msgText").value = "";

  showToast("✅ Pesan terkirim! Terima kasih sudah menghubungi saya 🌸", "success");
}


// ================================================================
// UTILITAS
// ================================================================
function countChars(inputId, countId, max) {
  const el = document.getElementById(inputId);
  const cEl = document.getElementById(countId);
  if (el && cEl) cEl.textContent = `${el.value.length}/${max}`;
}

function clearErr(inputId, errId) {
  document.getElementById(inputId)?.classList.remove("input-error");
  document.getElementById(errId)?.classList.remove("show");
}

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => toast.classList.remove("show"), 3000);
}


// ================================================================
// INISIALISASI
// ================================================================
initDefaultPlaylist();
updateClocks();
updateCountdown();
setInterval(updateClocks, 1000);
setInterval(updateCountdown, 1000);
renderHomeStats();
loadArtikelFromAPI(); // muat data artikel di awal agar dashboard Home langsung terisi


// ================================================================
// PWA — Service Worker Registration
// ================================================================
let swRegistration = null;

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    console.warn("Service Worker tidak didukung browser ini");
    return;
  }
  try {
    swRegistration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    console.log("[PWA] Service Worker registered:", swRegistration.scope);

    // Dengarkan pesan dari SW (background sync complete, dll)
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type === "SYNC_COMPLETE") {
        showToast("🔄 " + event.data.message, "success");
        if (currentPage === "artikel") loadArtikelFromAPI();
      }
    });

    // Cek update SW
    swRegistration.addEventListener("updatefound", () => {
      console.log("[PWA] Service Worker update found!");
    });

    // Minta izin push notification setelah SW aktif
    await swRegistration.update();
    console.log("[PWA] SW ready");

    // Tampilkan tombol notif setelah SW aktif
    requestNotificationPermission();

  } catch (err) {
    console.error("[PWA] SW registration failed:", err);
  }
}

// ================================================================
// PUSH NOTIFICATION — Minta izin & kirim notif lokal
// ================================================================
async function requestNotificationPermission() {
  if (!("Notification" in window)) return;

  const btn = document.getElementById("btnSendNotif");

  if (Notification.permission === "granted") {
    if (btn) btn.style.display = "flex";
  } else if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      if (btn) btn.style.display = "flex";
      showToast("🔔 Notifikasi diaktifkan! Kamu akan dapat update terbaru.", "success");
    }
  }
}

async function sendTestNotification() {
  if (!("Notification" in window)) {
    showToast("⚠ Browser kamu tidak mendukung notifikasi", "error");
    return;
  }

  if (Notification.permission !== "granted") {
    const perm = await Notification.requestPermission();
    if (perm !== "granted") {
      showToast("⚠ Izin notifikasi ditolak", "error");
      return;
    }
  }

  // Kirim notifikasi lokal via Service Worker jika tersedia
  if (swRegistration) {
    const arts = getCachedArticles();
    const title = "D'ANS — Update Terbaru 🌸";
    const options = {
      body: arts.length > 0
        ? `Kamu punya ${arts.length} artikel di database. Klik untuk lihat!`
        : "Hai Zivana! Yuk tulis artikel baru hari ini 📝",
      icon: "/images/icon-192.png",
      badge: "/images/icon-192.png",
      tag: "dans-update",
      vibrate: [200, 100, 200],
      requireInteraction: false,
      data: { url: "/index.html" },
      actions: [
        { action: "open", title: "Buka Artikel" },
        { action: "close", title: "Nanti saja" }
      ]
    };
    await swRegistration.showNotification(title, options);
    showToast("🔔 Notifikasi berhasil dikirim!", "success");
  } else {
    // Fallback notifikasi langsung
    new Notification("D'ANS 🌸", {
      body: "Halo Zivana! Website kamu sudah online.",
      icon: "/images/icon-192.png",
    });
    showToast("🔔 Notifikasi dikirim!", "success");
  }
}

// Notifikasi otomatis saat artikel baru berhasil disimpan
async function triggerArtikelNotification(judul) {
  if (!swRegistration || Notification.permission !== "granted") return;
  await swRegistration.showNotification("Artikel Tersimpan ✅", {
    body: `"${judul}" berhasil disimpan ke database Neon.tech!`,
    icon: "/images/icon-192.png",
    badge: "/images/icon-192.png",
    tag: "artikel-saved",
    vibrate: [100, 50, 100],
  });
}

// ================================================================
// PWA — Install Prompt (Add to Home Screen)
// ================================================================
let deferredInstallPrompt = null;

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;

  const btn = document.getElementById("btnInstallPWA");
  if (btn) btn.style.display = "flex";
  console.log("[PWA] Install prompt captured");
});

async function installPWA() {
  if (!deferredInstallPrompt) {
    showToast("📲 Aplikasi sudah terinstall atau browser tidak mendukung instalasi PWA", "error");
    return;
  }
  deferredInstallPrompt.prompt();
  const { outcome } = await deferredInstallPrompt.userChoice;
  if (outcome === "accepted") {
    showToast("🎉 D'ANS berhasil diinstall ke perangkat kamu!", "success");
    document.getElementById("btnInstallPWA").style.display = "none";
  } else {
    showToast("Instalasi dibatalkan", "error");
  }
  deferredInstallPrompt = null;
}

window.addEventListener("appinstalled", () => {
  showToast("✅ D'ANS sudah terinstall sebagai aplikasi!", "success");
  const btn = document.getElementById("btnInstallPWA");
  if (btn) btn.style.display = "none";
});

// ================================================================
// ONLINE / OFFLINE STATUS
// ================================================================
function updateOnlineStatus() {
  const dot  = document.getElementById("statusDot");
  const text = document.getElementById("statusText");
  const isOnline = navigator.onLine;
  if (dot)  dot.className  = `status-dot ${isOnline ? "online" : "offline"}`;
  if (text) text.textContent = isOnline ? "Online" : "Offline";

  if (!isOnline) {
    showToast("📡 Kamu sedang offline. Beberapa fitur mungkin terbatas.", "error");
  } else {
    showToast("✅ Kamu kembali online!", "success");
    // Background sync jika SW tersedia
    if (swRegistration && "sync" in swRegistration) {
      swRegistration.sync.register("sync-articles").catch(console.warn);
    }
  }
}

window.addEventListener("online",  updateOnlineStatus);
window.addEventListener("offline", updateOnlineStatus);

// Set status awal tanpa toast
function initOnlineStatus() {
  const dot  = document.getElementById("statusDot");
  const text = document.getElementById("statusText");
  const isOnline = navigator.onLine;
  if (dot)  dot.className  = `status-dot ${isOnline ? "online" : "offline"}`;
  if (text) text.textContent = isOnline ? "Online" : "Offline";
}

// ================================================================
// INIT PWA
// ================================================================
document.addEventListener("DOMContentLoaded", () => {
  registerServiceWorker();
  initOnlineStatus();
});

// Di bagian inisialisasi
initDefaultPlaylist();
updateClocks();
updateCountdown();
setInterval(updateClocks, 1000);
setInterval(updateCountdown, 1000);

// Urutan penting: renderHomeStats dulu, lalu load data
renderHomeStats();
loadArtikelFromAPI(); // <-- ini yang utama
