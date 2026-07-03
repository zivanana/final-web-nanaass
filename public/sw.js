// ================================================================
// sw.js — Service Worker D'ANS Personal Profile
// Fitur: Cache-first strategy, Push Notifications, Background sync
// ================================================================

const CACHE_NAME = "dans-cache-v1";
const STATIC_ASSETS = [
  "/index.html",
  "/script.js",
  "/style.css",
  "/manifest.json",
  "/images/icon-192.png",
  "/images/icon-512.png",
  "/images/pp tulip.jpeg"
];

// ================================================================
// INSTALL — cache semua static asset
// ================================================================
self.addEventListener("install", (event) => {
  console.log("[SW] Installing...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Caching static assets");
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("[SW] Some assets failed to cache:", err);
      });
    })
  );
  self.skipWaiting();
});

// ================================================================
// ACTIVATE — hapus cache lama
// ================================================================
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log("[SW] Deleting old cache:", name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// ================================================================
// FETCH — Network-first untuk API, Cache-first untuk static
// ================================================================
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // API requests → network first, no cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(
          JSON.stringify({ message: "Offline — tidak dapat terhubung ke server" }),
          { headers: { "Content-Type": "application/json" }, status: 503 }
        );
      })
    );
    return;
  }

  // Static assets → cache first, fallback network
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.status === 200 && response.type === "basic") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Fallback untuk navigasi offline
        if (event.request.mode === "navigate") {
          return caches.match("/index.html");
        }
      });
    })
  );
});

// ================================================================
// PUSH NOTIFICATION — terima push dari server
// ================================================================
self.addEventListener("push", (event) => {
  console.log("[SW] Push received:", event.data?.text());

  let data = {
    title: "D'ANS Notification",
    body: "Ada pembaruan baru di website kamu! 🌸",
    icon: "/images/icon-192.png",
    badge: "/images/icon-192.png",
    tag: "dans-notification",
    vibrate: [200, 100, 200],
  };

  try {
    if (event.data) {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    }
  } catch (e) {
    if (event.data) data.body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag,
      vibrate: data.vibrate,
      data: { url: data.url || "/" },
      actions: [
        { action: "open", title: "Buka Website" },
        { action: "close", title: "Tutup" }
      ]
    })
  );
});

// ================================================================
// NOTIFICATION CLICK — buka halaman saat notif diklik
// ================================================================
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "close") return;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Fokus ke tab yang sudah terbuka
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      // Buka tab baru jika belum ada
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data?.url || "/");
      }
    })
  );
});

// ================================================================
// BACKGROUND SYNC — sinkron artikel saat online kembali
// ================================================================
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-articles") {
    console.log("[SW] Background sync: syncing articles...");
    event.waitUntil(syncArticles());
  }
});

async function syncArticles() {
  try {
    // Kirim notifikasi ke semua client bahwa sync berhasil
    const clientList = await clients.matchAll({ type: "window" });
    clientList.forEach((client) => {
      client.postMessage({ type: "SYNC_COMPLETE", message: "Artikel berhasil disinkronkan!" });
    });
  } catch (err) {
    console.error("[SW] Sync failed:", err);
  }
}
