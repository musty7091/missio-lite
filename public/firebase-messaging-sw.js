importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAgSdYkVTP_V-CJ32ihUNozax2x5jx8ZHs",
  authDomain: "missio-lite.firebaseapp.com",
  projectId: "missio-lite",
  storageBucket: "missio-lite.firebasestorage.app",
  messagingSenderId: "944973973762",
  appId: "1:944973973762:web:0a7c63e667908b71dc1a1b",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title =
    payload.notification?.title ||
    payload.data?.title ||
    "Missio";

  const options = {
    body:
      payload.notification?.body ||
      payload.data?.body ||
      "Yeni bildirim var.",
    icon: "/pwa-icon.svg",
    badge: "/pwa-icon.svg",
    tag: payload.data?.tag || payload.data?.taskId || "missio-notification",
    data: payload.data || {},
    silent: false,
  };

  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }

      return undefined;
    })
  );
});
