// ══════════════════ FIREBASE CLOUD MESSAGING (push notifications) ══════════════════
// Added by Claude — handles notifications that arrive while the app is
// closed or in the background. Everything below this section is your
// original sw.js, unchanged.
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey:            "AIzaSyAmATKmyTWQqqyNDqxbzN4CdTKAyzG1Dq4",
  authDomain:        "c2epe-school-share-and-post.firebaseapp.com",
  projectId:         "c2epe-school-share-and-post",
  storageBucket:     "c2epe-school-share-and-post.firebasestorage.app",
  messagingSenderId: "109849107156",
  appId:             "1:109849107156:web:0b67b05f3511d2f0893941"
});

const messaging = firebase.messaging();
messaging.onBackgroundMessage(function(payload) {
  var n = payload.notification || {};
  self.registration.showNotification(n.title || "C2-EPE School", {
    body: n.body || "",
    icon: "./seg-shield.png"
  });
});
// ══════════════════ END FIREBASE CLOUD MESSAGING ══════════════════

const CACHE_NAME = 'c2epe-v1';
const urlsToCache = [
  './index.html',
  './manifest.json'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(name) {
          return name !== CACHE_NAME;
        }).map(function(name) {
          return caches.delete(name);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  // Network first, fallback to cache (so Firebase data stays fresh)
  event.respondWith(
    fetch(event.request).catch(function() {
      return caches.match(event.request);
    })
  );
});
