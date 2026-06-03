import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";

initializeApp();

setGlobalOptions({
  region: "europe-west1",
  maxInstances: 5,
});

const db = getFirestore();

const SUPER_ADMIN_EMAIL = "admin@missio-lite.com";

async function assertAuthenticated(
  requestAuth: { uid: string; token: { email?: string } } | undefined,
) {
  if (!requestAuth) {
    throw new HttpsError("unauthenticated", "Oturum bulunamadı.");
  }

  return {
    uid: requestAuth.uid,
    email: requestAuth.token.email?.toLowerCase() ?? "",
  };
}

async function isSuperAdmin(uid: string, email: string) {
  if (email === SUPER_ADMIN_EMAIL) {
    return true;
  }

  const userSnapshot = await db.collection("users").doc(uid).get();
  return userSnapshot.data()?.globalRole === "super_admin";
}

export const whoAmI = onCall(async (request) => {
  const caller = await assertAuthenticated(request.auth);
  const superAdmin = await isSuperAdmin(caller.uid, caller.email);

  return {
    ok: true,
    uid: caller.uid,
    email: caller.email,
    isSuperAdmin: superAdmin,
  };
});