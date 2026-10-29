
importScripts(
  "https://www.gstatic.com/firebasejs/12.19.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyCI4pL8pfQJh_6hjspgw-19Btdn7dtAX0",
  authDomain: "fireguard-5b48c.firebaseapp.com",
  projectId: "fireguard-5b48c",
  storageBucket: "fireguard-5b48c.firebasestorage.app",
  messagingSenderId: "582631223976",
  appId: "1:582631223976:web:167a48703115b6dc0a889d"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  // Firebase automatically displays notification payloads.
  // Display our own notification for data-only messages.
  if (payload.notification) return;

  const data = payload.data || {};

  self.registration.showNotification(
    data.title || "FireGuard Fire Alert",
    {
      body: data.body || "A new society alert has been reported.",
      data: { url: data.url || "/" }
    }
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.openWindow(new URL(url, self.location.origin).href)
  );
});
