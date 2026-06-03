import { initializeApp } from "firebase-admin/app";
import { getAuth, type UserRecord } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";

initializeApp();

setGlobalOptions({
  region: "europe-west1",
  maxInstances: 5,
});

const db = getFirestore();
const auth = getAuth();

const SUPER_ADMIN_EMAIL = "admin@missio-lite.com";

type BusinessRole = "owner" | "manager" | "staff";
type SubscriptionPlan = "demo" | "lite" | "pro";
type SubscriptionStatus = "trial" | "active" | "suspended" | "cancelled";

function normalizeBusinessCode(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function normalizeUsername(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function requiredString(data: Record<string, unknown>, key: string, label: string) {
  const value = String(data[key] ?? "").trim();

  if (!value) {
    throw new HttpsError("invalid-argument", `${label} zorunludur.`);
  }

  return value;
}

function optionalString(data: Record<string, unknown>, key: string) {
  const value = String(data[key] ?? "").trim();
  return value || "";
}

function validateEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail.includes("@") || !normalizedEmail.includes(".")) {
    throw new HttpsError("invalid-argument", "Geçerli bir e-posta adresi girilmelidir.");
  }

  return normalizedEmail;
}

function validatePassword(password: string) {
  if (password.length < 6) {
    throw new HttpsError("invalid-argument", "Geçici şifre en az 6 karakter olmalıdır.");
  }

  return password;
}

function getRoleLabel(role: BusinessRole) {
  if (role === "owner") {
    return "Patron";
  }

  if (role === "manager") {
    return "Yönetici";
  }

  return "Personel";
}

function getDefaultPermissions(role: BusinessRole) {
  if (role === "owner") {
    return {
      canManageUsers: true,
      canAssignTasks: true,
      canRequestLocation: true,
      canViewReports: true,
    };
  }

  if (role === "manager") {
    return {
      canManageUsers: false,
      canAssignTasks: true,
      canRequestLocation: true,
      canViewReports: true,
    };
  }

  return {
    canManageUsers: false,
    canAssignTasks: false,
    canRequestLocation: false,
    canViewReports: false,
  };
}

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

async function assertSuperAdmin(
  requestAuth: { uid: string; token: { email?: string } } | undefined,
) {
  const caller = await assertAuthenticated(requestAuth);
  const allowed = await isSuperAdmin(caller.uid, caller.email);

  if (!allowed) {
    throw new HttpsError("permission-denied", "Bu işlem sadece süperadmin tarafından yapılabilir.");
  }

  return caller;
}

async function assertCanCreateBusinessUser(
  requestAuth: { uid: string; token: { email?: string } } | undefined,
  businessId: string,
) {
  const caller = await assertAuthenticated(requestAuth);

  if (await isSuperAdmin(caller.uid, caller.email)) {
    return {
      caller,
      callerRole: "super_admin",
    };
  }

  const memberSnapshot = await db
    .collection("businesses")
    .doc(businessId)
    .collection("members")
    .doc(caller.uid)
    .get();

  const memberData = memberSnapshot.data();

  if (!memberSnapshot.exists || memberData?.role !== "owner") {
    throw new HttpsError(
      "permission-denied",
      "Bu işletmede kullanıcı oluşturma yetkiniz yok.",
    );
  }

  return {
    caller,
    callerRole: "owner",
  };
}

async function createOrUpdateAuthUser(input: {
  email: string;
  password: string;
  displayName: string;
}): Promise<UserRecord> {
  try {
    const existingUser = await auth.getUserByEmail(input.email);

    await auth.updateUser(existingUser.uid, {
      displayName: input.displayName,
      password: input.password,
      disabled: false,
    });

    return await auth.getUser(existingUser.uid);
  } catch (error) {
    const errorCode = (error as { code?: string }).code;

    if (errorCode !== "auth/user-not-found") {
      throw error;
    }

    return await auth.createUser({
      email: input.email,
      password: input.password,
      displayName: input.displayName,
      disabled: false,
      emailVerified: false,
    });
  }
}

async function ensureUsernameAvailable(input: {
  businessId: string;
  username: string;
  expectedUid?: string;
}) {
  const usernameRef = db
    .collection("businesses")
    .doc(input.businessId)
    .collection("usernames")
    .doc(input.username);

  const usernameSnapshot = await usernameRef.get();

  if (!usernameSnapshot.exists) {
    return;
  }

  const existingUid = usernameSnapshot.data()?.uid;

  if (input.expectedUid && existingUid === input.expectedUid) {
    return;
  }

  throw new HttpsError("already-exists", "Bu kullanıcı adı bu işletmede zaten kullanılıyor.");
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

export const createBusinessWithOwner = onCall(async (request) => {
  await assertSuperAdmin(request.auth);

  const data = request.data as Record<string, unknown>;

  const businessId = normalizeBusinessCode(requiredString(data, "businessCode", "İşletme kodu"));
  const businessName = requiredString(data, "businessName", "İşletme adı");
  const businessPhone = optionalString(data, "businessPhone");
  const businessAddress = optionalString(data, "businessAddress");

  const ownerDisplayName = requiredString(data, "ownerDisplayName", "Patron adı soyadı");
  const ownerUsername = normalizeUsername(requiredString(data, "ownerUsername", "Patron kullanıcı adı"));
  const ownerEmail = validateEmail(requiredString(data, "ownerEmail", "Patron e-posta"));
  const ownerPhone = optionalString(data, "ownerPhone");
  const temporaryPassword = validatePassword(requiredString(data, "temporaryPassword", "Geçici şifre"));

  const plan = String(data.plan ?? "lite") as SubscriptionPlan;
  const subscriptionStatus = String(data.subscriptionStatus ?? "trial") as SubscriptionStatus;
  const subscriptionStartDate = String(data.subscriptionStartDate ?? "");
  const subscriptionEndDate = String(data.subscriptionEndDate ?? "");
  const maxUsers = Number(data.maxUsers ?? 10);

  if (!businessId) {
    throw new HttpsError("invalid-argument", "İşletme kodu zorunludur.");
  }

  if (!["demo", "lite", "pro"].includes(plan)) {
    throw new HttpsError("invalid-argument", "Geçersiz plan.");
  }

  if (!["trial", "active", "suspended", "cancelled"].includes(subscriptionStatus)) {
    throw new HttpsError("invalid-argument", "Geçersiz abonelik durumu.");
  }

  if (!Number.isFinite(maxUsers) || maxUsers < 1) {
    throw new HttpsError("invalid-argument", "Kullanıcı limiti geçersiz.");
  }

  const businessRef = db.collection("businesses").doc(businessId);
  const businessSnapshot = await businessRef.get();

  if (businessSnapshot.exists) {
    throw new HttpsError("already-exists", "Bu işletme kodu zaten kullanılıyor.");
  }

  await ensureUsernameAvailable({
    businessId,
    username: ownerUsername,
  });

  const ownerUser = await createOrUpdateAuthUser({
    email: ownerEmail,
    password: temporaryPassword,
    displayName: ownerDisplayName,
  });

  const now = FieldValue.serverTimestamp();

  const batch = db.batch();

  batch.set(businessRef, {
    businessId,
    businessCode: businessId,
    businessName,
    businessPhone,
    businessAddress,
    ownerUid: ownerUser.uid,
    ownerEmail,
    ownerName: ownerDisplayName,
    status: "active",
    plan,
    subscriptionStatus,
    subscriptionStartDate,
    subscriptionEndDate,
    maxUsers,
    timezone: "Europe/Istanbul",
    createdAt: now,
    updatedAt: now,
  });

  batch.set(
    db.collection("users").doc(ownerUser.uid),
    {
      uid: ownerUser.uid,
      email: ownerEmail,
      username: ownerUsername,
      displayName: ownerDisplayName,
      phone: ownerPhone,
      defaultBusinessId: businessId,
      businessIds: FieldValue.arrayUnion(businessId),
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
    { merge: true },
  );

  batch.set(
    businessRef.collection("members").doc(ownerUser.uid),
    {
      uid: ownerUser.uid,
      businessId,
      email: ownerEmail,
      username: ownerUsername,
      displayName: ownerDisplayName,
      phone: ownerPhone,
      role: "owner",
      roleLabel: getRoleLabel("owner"),
      status: "active",
      isActive: true,
      managerUid: null,
      managerName: null,
      ...getDefaultPermissions("owner"),
      createdAt: now,
      updatedAt: now,
    },
    { merge: true },
  );

  batch.set(
    businessRef.collection("usernames").doc(ownerUsername),
    {
      uid: ownerUser.uid,
      email: ownerEmail,
      username: ownerUsername,
      displayName: ownerDisplayName,
      role: "owner",
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
    { merge: true },
  );

  await batch.commit();

  return {
    ok: true,
    businessId,
    businessName,
    ownerUid: ownerUser.uid,
    ownerUsername,
    ownerEmail,
  };
});

export const createBusinessUser = onCall(async (request) => {
  const data = request.data as Record<string, unknown>;

  const businessId = normalizeBusinessCode(requiredString(data, "businessId", "İşletme kodu"));
  await assertCanCreateBusinessUser(request.auth, businessId);

  const role = String(data.role ?? "staff") as BusinessRole;

  if (!["manager", "staff"].includes(role)) {
    throw new HttpsError("invalid-argument", "Sadece yönetici veya personel oluşturulabilir.");
  }

  const displayName = requiredString(data, "displayName", "Ad soyad");
  const username = normalizeUsername(requiredString(data, "username", "Kullanıcı adı"));
  const email = validateEmail(requiredString(data, "email", "E-posta"));
  const phone = optionalString(data, "phone");
  const temporaryPassword = validatePassword(requiredString(data, "temporaryPassword", "Geçici şifre"));
  const managerUid = optionalString(data, "managerUid");

  const businessRef = db.collection("businesses").doc(businessId);
  const businessSnapshot = await businessRef.get();

  if (!businessSnapshot.exists) {
    throw new HttpsError("not-found", "İşletme bulunamadı.");
  }

  let managerName: string | null = null;

  if (role === "staff" && managerUid) {
    const managerSnapshot = await businessRef.collection("members").doc(managerUid).get();
    const managerData = managerSnapshot.data();

    if (!managerSnapshot.exists || managerData?.role !== "manager") {
      throw new HttpsError("invalid-argument", "Seçilen yönetici bulunamadı.");
    }

    managerName = String(managerData.displayName ?? "");
  }

  await ensureUsernameAvailable({
    businessId,
    username,
  });

  const authUser = await createOrUpdateAuthUser({
    email,
    password: temporaryPassword,
    displayName,
  });

  const now = FieldValue.serverTimestamp();

  const batch = db.batch();

  batch.set(
    db.collection("users").doc(authUser.uid),
    {
      uid: authUser.uid,
      email,
      username,
      displayName,
      phone,
      defaultBusinessId: businessId,
      businessIds: FieldValue.arrayUnion(businessId),
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
    { merge: true },
  );

  batch.set(
    businessRef.collection("members").doc(authUser.uid),
    {
      uid: authUser.uid,
      businessId,
      email,
      username,
      displayName,
      phone,
      role,
      roleLabel: getRoleLabel(role),
      status: "active",
      isActive: true,
      managerUid: role === "staff" ? managerUid || null : null,
      managerName: role === "staff" ? managerName : null,
      ...getDefaultPermissions(role),
      createdAt: now,
      updatedAt: now,
    },
    { merge: true },
  );

  batch.set(
    businessRef.collection("usernames").doc(username),
    {
      uid: authUser.uid,
      email,
      username,
      displayName,
      role,
      status: "active",
      managerUid: role === "staff" ? managerUid || null : null,
      createdAt: now,
      updatedAt: now,
    },
    { merge: true },
  );

  await batch.commit();

  return {
    ok: true,
    businessId,
    uid: authUser.uid,
    username,
    email,
    role,
    managerUid: role === "staff" ? managerUid || null : null,
  };
});