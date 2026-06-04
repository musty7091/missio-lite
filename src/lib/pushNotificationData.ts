import {
  deleteToken,
  getMessaging,
  getToken,
  isSupported,
} from "firebase/messaging";
import { getFunctions, httpsCallable } from "firebase/functions";
import { auth, firebaseApp } from "./firebase";

const functions = getFunctions(firebaseApp, "europe-west1");

type RegisterPushTokenInput = {
  businessId: string;
  token: string;
  userAgent: string;
  platform: string;
  language: string;
  permission: string;
};

type RegisterPushTokenResult = {
  ok: boolean;
  businessId: string;
  uid: string;
  tokenId: string;
};

type UnregisterPushTokenInput = {
  businessId: string;
  token: string;
  permission: string;
};

type UnregisterPushTokenResult = {
  ok: boolean;
  businessId: string;
  uid: string;
  tokenId: string;
};

export type PushPermissionResult = {
  ok: boolean;
  token: string;
  permission: NotificationPermission;
};

export type PushDisableResult = {
  ok: boolean;
  permission: NotificationPermission | "unsupported";
};

async function getMessagingRegistration() {
  const registration = await navigator.serviceWorker.register(
    "/firebase-messaging-sw.js",
  );

  await navigator.serviceWorker.ready;

  return registration;
}

function getVapidKey() {
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;

  if (!vapidKey) {
    throw new Error("VAPID key bulunamadı.");
  }

  return vapidKey;
}

export async function isPushNotificationSupported() {
  if (!("Notification" in window)) {
    return false;
  }

  if (!("serviceWorker" in navigator)) {
    return false;
  }

  return isSupported();
}

export function getCurrentNotificationPermission() {
  if (!("Notification" in window)) {
    return "unsupported";
  }

  return Notification.permission;
}

export async function enablePushNotificationsForBusiness(
  businessId: string,
): Promise<PushPermissionResult> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Bildirim açmak için önce giriş yapılmalıdır.");
  }

  const supported = await isPushNotificationSupported();

  if (!supported) {
    throw new Error("Bu tarayıcı Web Push bildirimlerini desteklemiyor.");
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error("Bildirim izni verilmedi.");
  }

  const registration = await getMessagingRegistration();
  const messaging = getMessaging(firebaseApp);

  const token = await getToken(messaging, {
    vapidKey: getVapidKey(),
    serviceWorkerRegistration: registration,
  });

  if (!token) {
    throw new Error("Bildirim token değeri alınamadı.");
  }

  const callable = httpsCallable<
    RegisterPushTokenInput,
    RegisterPushTokenResult
  >(functions, "registerPushToken");

  await callable({
    businessId: businessId.trim().toLowerCase(),
    token,
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    permission,
  });

  return {
    ok: true,
    token,
    permission,
  };
}

export async function disablePushNotificationsForBusiness(
  businessId: string,
): Promise<PushDisableResult> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Bildirim kapatmak için önce giriş yapılmalıdır.");
  }

  const supported = await isPushNotificationSupported();

  if (!supported) {
    return {
      ok: true,
      permission: "unsupported",
    };
  }

  const permission = Notification.permission;

  if (permission !== "granted") {
    return {
      ok: true,
      permission,
    };
  }

  const registration = await getMessagingRegistration();
  const messaging = getMessaging(firebaseApp);

  const token = await getToken(messaging, {
    vapidKey: getVapidKey(),
    serviceWorkerRegistration: registration,
  });

  if (token) {
    const callable = httpsCallable<
      UnregisterPushTokenInput,
      UnregisterPushTokenResult
    >(functions, "unregisterPushToken");

    await callable({
      businessId: businessId.trim().toLowerCase(),
      token,
      permission,
    });
  }

  await deleteToken(messaging).catch(() => false);

  return {
    ok: true,
    permission,
  };
}