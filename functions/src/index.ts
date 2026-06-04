import { initializeApp } from "firebase-admin/app";
import { getAuth, type UserRecord } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
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

  if (role === "staff" && !managerUid) {
    throw new HttpsError("invalid-argument", "Personel için bağlı yönetici seçilmelidir.");
  }

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
      managerName: role === "staff" ? managerName : null,
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


export const updateBusinessMember = onCall(async (request) => {
  const data = request.data as Record<string, unknown>;

  const businessId = normalizeBusinessCode(requiredString(data, "businessId", "İşletme kodu"));
  const targetUid = requiredString(data, "targetUid", "Kullanıcı UID");

  await assertCanCreateBusinessUser(request.auth, businessId);

  const displayName = requiredString(data, "displayName", "Ad soyad");
  const phone = optionalString(data, "phone");
  const role = String(data.role ?? "staff") as BusinessRole;
  const status = String(data.status ?? "active");
  const managerUid = optionalString(data, "managerUid");

  if (!["manager", "staff"].includes(role)) {
    throw new HttpsError("invalid-argument", "Kullanıcı rolü sadece yönetici veya personel olabilir.");
  }

  if (!["active", "passive"].includes(status)) {
    throw new HttpsError("invalid-argument", "Kullanıcı durumu geçersiz.");
  }

  if (role === "staff" && !managerUid) {
    throw new HttpsError("invalid-argument", "Personel için bağlı yönetici seçilmelidir.");
  }

  const businessRef = db.collection("businesses").doc(businessId);
  const businessSnapshot = await businessRef.get();

  if (!businessSnapshot.exists) {
    throw new HttpsError("not-found", "İşletme bulunamadı.");
  }

  const memberRef = businessRef.collection("members").doc(targetUid);
  const memberSnapshot = await memberRef.get();
  const memberData = memberSnapshot.data();

  if (!memberSnapshot.exists || !memberData) {
    throw new HttpsError("not-found", "Güncellenecek kullanıcı bulunamadı.");
  }

  if (memberData.role === "owner") {
    throw new HttpsError("permission-denied", "Patron hesabı bu ekrandan değiştirilemez.");
  }

  if (memberData.role === "manager" && (role !== "manager" || status === "passive")) {
    const assignedStaffSnapshot = await businessRef
      .collection("members")
      .where("managerUid", "==", targetUid)
      .where("status", "==", "active")
      .limit(1)
      .get();

    if (!assignedStaffSnapshot.empty) {
      throw new HttpsError(
        "failed-precondition",
        "Bu yöneticinin bağlı aktif personeli var. Önce personelleri başka yöneticiye aktarın.",
      );
    }
  }

  let managerName: string | null = null;

  if (role === "staff") {
    const managerSnapshot = await businessRef.collection("members").doc(managerUid).get();
    const managerData = managerSnapshot.data();

    if (!managerSnapshot.exists || managerData?.role !== "manager") {
      throw new HttpsError("invalid-argument", "Seçilen yönetici bulunamadı.");
    }

    if (managerData.status === "passive" || managerData.isActive === false) {
      throw new HttpsError("invalid-argument", "Pasif yöneticiye personel bağlanamaz.");
    }

    managerName = String(managerData.displayName ?? "");
  }

  const username = String(memberData.username ?? "").trim();
  const email = String(memberData.email ?? "").trim();
  const isActive = status === "active";
  const now = FieldValue.serverTimestamp();

  const batch = db.batch();

  batch.set(
    memberRef,
    {
      displayName,
      phone,
      role,
      roleLabel: getRoleLabel(role),
      status,
      isActive,
      managerUid: role === "staff" ? managerUid : null,
      managerName: role === "staff" ? managerName : null,
      ...getDefaultPermissions(role),
      updatedAt: now,
    },
    { merge: true },
  );

  batch.set(
    db.collection("users").doc(targetUid),
    {
      displayName,
      phone,
      status,
      updatedAt: now,
    },
    { merge: true },
  );

  if (username) {
    batch.set(
      businessRef.collection("usernames").doc(username),
      {
        uid: targetUid,
        email,
        username,
        displayName,
        role,
        status,
        managerUid: role === "staff" ? managerUid : null,
        managerName: role === "staff" ? managerName : null,
        updatedAt: now,
      },
      { merge: true },
    );
  }

  await batch.commit();

  await auth.updateUser(targetUid, {
    displayName,
    disabled: !isActive,
  });

  return {
    ok: true,
    businessId,
    uid: targetUid,
    username,
    email,
    role,
    status,
    managerUid: role === "staff" ? managerUid : null,
    managerName: role === "staff" ? managerName : null,
  };
});


export const createBusinessTask = onCall(async (request) => {
  const data = request.data as Record<string, unknown>;

  const caller = await assertAuthenticated(request.auth);

  const businessId = normalizeBusinessCode(requiredString(data, "businessId", "İşletme kodu"));
  const assignedToUid = requiredString(data, "assignedToUid", "Görev atanacak kullanıcı");
  const title = requiredString(data, "title", "Görev başlığı");
  const description = optionalString(data, "description");
  const taskType = String(data.taskType ?? "Rutin");
  const priority = String(data.priority ?? "Normal");
  const requiresPhoto = Boolean(data.requiresPhoto ?? false);
  const requiresApproval = requiresPhoto || Boolean(data.requiresApproval ?? true);
  const referenceImageName = optionalString(data, "referenceImageName");
  const dueDate = optionalString(data, "dueDate");

  if (!["Rutin", "Ekstra"].includes(taskType)) {
    throw new HttpsError("invalid-argument", "Görev tipi geçersiz.");
  }

  if (!["Normal", "Önemli", "Acil", "Kritik"].includes(priority)) {
    throw new HttpsError("invalid-argument", "Görev önceliği geçersiz.");
  }

  const businessRef = db.collection("businesses").doc(businessId);
  const businessSnapshot = await businessRef.get();

  if (!businessSnapshot.exists) {
    throw new HttpsError("not-found", "İşletme bulunamadı.");
  }

  const callerIsSuperAdmin = await isSuperAdmin(caller.uid, caller.email);
  const callerMemberSnapshot = await businessRef.collection("members").doc(caller.uid).get();
  const callerMemberData = callerMemberSnapshot.data();

  if (!callerIsSuperAdmin) {
    if (!callerMemberSnapshot.exists || !callerMemberData) {
      throw new HttpsError("permission-denied", "Bu işletmede görev atama yetkiniz yok.");
    }

    if (!["owner", "manager"].includes(String(callerMemberData.role ?? ""))) {
      throw new HttpsError("permission-denied", "Görev atama yetkiniz yok.");
    }

    if (callerMemberData.status === "passive" || callerMemberData.isActive === false) {
      throw new HttpsError("permission-denied", "Pasif kullanıcı görev atayamaz.");
    }
  }

  const assignedMemberSnapshot = await businessRef
    .collection("members")
    .doc(assignedToUid)
    .get();

  const assignedMemberData = assignedMemberSnapshot.data();

  if (!assignedMemberSnapshot.exists || !assignedMemberData) {
    throw new HttpsError("not-found", "Görev atanacak kullanıcı bulunamadı.");
  }

  const assignedRole = String(assignedMemberData.role ?? "");

  if (!["manager", "staff"].includes(assignedRole)) {
    throw new HttpsError("invalid-argument", "Görev sadece yönetici veya personele atanabilir.");
  }

  if (assignedMemberData.status === "passive" || assignedMemberData.isActive === false) {
    throw new HttpsError("failed-precondition", "Pasif kullanıcıya görev atanamaz.");
  }

  const callerRole = callerIsSuperAdmin
    ? "super_admin"
    : String(callerMemberData?.role ?? "");

  if (callerRole === "manager") {
    if (assignedRole !== "staff" || assignedMemberData.managerUid !== caller.uid) {
      throw new HttpsError(
        "permission-denied",
        "Yönetici sadece kendisine bağlı personele görev atayabilir.",
      );
    }
  }

  const now = FieldValue.serverTimestamp();
  const taskRef = businessRef.collection("tasks").doc();

  const assignedToName = String(
    assignedMemberData.displayName ??
      assignedMemberData.username ??
      assignedMemberData.email ??
      "",
  );

  const assignedByName = callerIsSuperAdmin
    ? "Süperadmin"
    : String(
        callerMemberData?.displayName ??
          callerMemberData?.username ??
          caller.email ??
          "",
      );

  await taskRef.set({
    taskId: taskRef.id,
    businessId,
    title,
    description,
    taskType,
    priority,
    status: "assigned",
    assignedToUid,
    assignedToName,
    assignedToRole: assignedRole,
    assignedToUsername: String(assignedMemberData.username ?? ""),
    assignedByUid: caller.uid,
    assignedByName,
    assignedByRole: callerRole,
    requiresPhoto,
    requiresApproval,
    referenceImageName,
    dueDate,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    approvedAt: null,
    approvedByUid: null,
    approvedByName: null,
  });

  return {
    ok: true,
    businessId,
    taskId: taskRef.id,
    assignedToUid,
    assignedToName,
    title,
    status: "assigned",
  };
});


export const updateBusinessTaskStatus = onCall(async (request) => {
  const data = request.data as Record<string, unknown>;

  const caller = await assertAuthenticated(request.auth);

  const businessId = normalizeBusinessCode(requiredString(data, "businessId", "İşletme kodu"));
  const taskId = requiredString(data, "taskId", "Görev ID");
  const nextStatus = String(data.status ?? "");
  const note = optionalString(data, "note");

  if (!["in_progress", "completed", "approved", "rejected", "cancelled"].includes(nextStatus)) {
    throw new HttpsError("invalid-argument", "Geçersiz görev durumu.");
  }

  const businessRef = db.collection("businesses").doc(businessId);
  const businessSnapshot = await businessRef.get();

  if (!businessSnapshot.exists) {
    throw new HttpsError("not-found", "İşletme bulunamadı.");
  }

  const taskRef = businessRef.collection("tasks").doc(taskId);
  const taskSnapshot = await taskRef.get();
  const taskData = taskSnapshot.data();

  if (!taskSnapshot.exists || !taskData) {
    throw new HttpsError("not-found", "Görev bulunamadı.");
  }

  const callerIsSuperAdmin = await isSuperAdmin(caller.uid, caller.email);

  const callerMemberSnapshot = await businessRef
    .collection("members")
    .doc(caller.uid)
    .get();

  const callerMemberData = callerMemberSnapshot.data();

  if (!callerIsSuperAdmin) {
    if (!callerMemberSnapshot.exists || !callerMemberData) {
      throw new HttpsError("permission-denied", "Bu işletmede görev güncelleme yetkiniz yok.");
    }

    if (callerMemberData.status === "passive" || callerMemberData.isActive === false) {
      throw new HttpsError("permission-denied", "Pasif kullanıcı görev güncelleyemez.");
    }
  }

  const callerRole = callerIsSuperAdmin
    ? "super_admin"
    : String(callerMemberData?.role ?? "");

  const assignedToUid = String(taskData.assignedToUid ?? "");
  const currentStatus = String(taskData.status ?? "assigned");
  const requiresPhoto = taskData.requiresPhoto === true;
  const proofPhotoUrl = String(taskData.proofPhotoUrl ?? "");
  const proofPhotoUrls = Array.isArray(taskData.proofPhotoUrls)
    ? taskData.proofPhotoUrls.filter((item) => typeof item === "string" && item.trim().length > 0)
    : [];

  if (nextStatus === "completed" && requiresPhoto && !proofPhotoUrl && proofPhotoUrls.length === 0) {
    throw new HttpsError(
      "failed-precondition",
      "Bu görev için fotoğraf kanıtı eklenmeden tamamlandı yapılamaz.",
    );
  }

  if (callerRole === "staff") {
    if (assignedToUid !== caller.uid) {
      throw new HttpsError("permission-denied", "Personel sadece kendi görevini güncelleyebilir.");
    }

    if (!["in_progress", "completed"].includes(nextStatus)) {
      throw new HttpsError("permission-denied", "Personel bu görev durumunu veremez.");
    }
  }

  if (callerRole === "manager") {
    const assignedMemberSnapshot = await businessRef
      .collection("members")
      .doc(assignedToUid)
      .get();

    const assignedMemberData = assignedMemberSnapshot.data();

    const isOwnTask = assignedToUid === caller.uid;
    const isOwnStaffTask =
      assignedMemberSnapshot.exists &&
      assignedMemberData?.role === "staff" &&
      assignedMemberData?.managerUid === caller.uid;

    if (!isOwnTask && !isOwnStaffTask) {
      throw new HttpsError(
        "permission-denied",
        "Yönetici sadece kendi görevlerini veya kendi personelinin görevlerini güncelleyebilir.",
      );
    }
  }

  if (callerRole === "staff" && currentStatus === "completed") {
    throw new HttpsError("failed-precondition", "Tamamlanmış görev personel tarafından tekrar değiştirilemez.");
  }

  const now = FieldValue.serverTimestamp();

  const updatePayload: Record<string, unknown> = {
    status: nextStatus,
    updatedAt: now,
    lastStatusChangedByUid: caller.uid,
    lastStatusChangedByName:
      callerMemberData?.displayName ??
      callerMemberData?.username ??
      caller.email ??
      "Sistem",
    lastStatusNote: note,
  };

  if (nextStatus === "in_progress") {
    updatePayload.startedAt = now;
  }

  if (nextStatus === "completed") {
    updatePayload.completedAt = now;

    if (requiresPhoto) {
      updatePayload.requiresApproval = true;
    }
  }

  if (nextStatus === "approved") {
    updatePayload.approvedAt = now;
    updatePayload.approvedByUid = caller.uid;
    updatePayload.approvedByName =
      callerMemberData?.displayName ??
      callerMemberData?.username ??
      caller.email ??
      "Sistem";
  }

  if (nextStatus === "rejected") {
    updatePayload.rejectedAt = now;
    updatePayload.rejectedByUid = caller.uid;
    updatePayload.rejectedByName =
      callerMemberData?.displayName ??
      callerMemberData?.username ??
      caller.email ??
      "Sistem";
  }

  await taskRef.set(updatePayload, { merge: true });

  return {
    ok: true,
    businessId,
    taskId,
    status: nextStatus,
  };
});



export const attachBusinessTaskProofPhoto = onCall(async (request) => {
  const data = request.data as Record<string, unknown>;

  const caller = await assertAuthenticated(request.auth);

  const businessId = normalizeBusinessCode(requiredString(data, "businessId", "İşletme kodu"));
  const taskId = requiredString(data, "taskId", "Görev ID");
  const proofPhotoUrl = requiredString(data, "proofPhotoUrl", "Fotoğraf bağlantısı");
  const proofPhotoPath = requiredString(data, "proofPhotoPath", "Fotoğraf yolu");
  const proofPhotoName = optionalString(data, "proofPhotoName");

  if (!proofPhotoPath.startsWith(`businesses/${businessId}/tasks/${taskId}/proof/`)) {
    throw new HttpsError("permission-denied", "Fotoğraf yolu bu göreve ait değil.");
  }

  const businessRef = db.collection("businesses").doc(businessId);
  const businessSnapshot = await businessRef.get();

  if (!businessSnapshot.exists) {
    throw new HttpsError("not-found", "İşletme bulunamadı.");
  }

  const taskRef = businessRef.collection("tasks").doc(taskId);
  const taskSnapshot = await taskRef.get();
  const taskData = taskSnapshot.data();

  if (!taskSnapshot.exists || !taskData) {
    throw new HttpsError("not-found", "Görev bulunamadı.");
  }

  const assignedToUid = String(taskData.assignedToUid ?? "");
  const currentStatus = String(taskData.status ?? "assigned");

  if (assignedToUid !== caller.uid) {
    throw new HttpsError("permission-denied", "Fotoğraf kanıtını sadece görevin atandığı kullanıcı ekleyebilir.");
  }

  if (!["assigned", "in_progress"].includes(currentStatus)) {
    throw new HttpsError("failed-precondition", "Bu görev durumunda fotoğraf kanıtı eklenemez.");
  }

  const existingProofPhotos = Array.isArray(taskData.proofPhotos)
    ? taskData.proofPhotos.filter((item) => item && typeof item === "object")
    : [];

  const existingProofPhotoUrls = Array.isArray(taskData.proofPhotoUrls)
    ? taskData.proofPhotoUrls.filter((item) => typeof item === "string" && item.trim().length > 0)
    : [];

  const existingProofCount = Math.max(existingProofPhotos.length, existingProofPhotoUrls.length);

  if (existingProofCount >= 3) {
    throw new HttpsError("failed-precondition", "Bir göreve en fazla 3 fotoğraf kanıtı eklenebilir.");
  }

  const callerMemberSnapshot = await businessRef
    .collection("members")
    .doc(caller.uid)
    .get();

  const callerMemberData = callerMemberSnapshot.data();

  if (!callerMemberSnapshot.exists || !callerMemberData) {
    throw new HttpsError("permission-denied", "Bu işletmede fotoğraf ekleme yetkiniz yok.");
  }

  if (callerMemberData.status === "passive" || callerMemberData.isActive === false) {
    throw new HttpsError("permission-denied", "Pasif kullanıcı fotoğraf ekleyemez.");
  }

  const now = FieldValue.serverTimestamp();
  const uploadedAtIso = new Date().toISOString();

  const proofPhotoItem = {
    url: proofPhotoUrl,
    path: proofPhotoPath,
    name: proofPhotoName,
    uploadedAtIso,
    uploadedByUid: caller.uid,
    uploadedByName:
      callerMemberData.displayName ??
      callerMemberData.username ??
      caller.email ??
      "Personel",
  };

  await taskRef.set(
    {
      proofPhotoUrl,
      proofPhotoPath,
      proofPhotoName,
      proofPhotoUrls: FieldValue.arrayUnion(proofPhotoUrl),
      proofPhotos: FieldValue.arrayUnion(proofPhotoItem),
      proofPhotoUploadedAt: now,
      proofPhotoUploadedByUid: caller.uid,
      proofPhotoUploadedByName:
        callerMemberData.displayName ??
        callerMemberData.username ??
        caller.email ??
        "Personel",
      updatedAt: now,
    },
    { merge: true },
  );

  return {
    ok: true,
    businessId,
    taskId,
    proofPhotoUrl,
    proofPhotoPath,
    proofPhotoName,
    proofPhotoItem,
  };
});


export const removeBusinessTaskProofPhoto = onCall(async (request) => {
  const data = request.data as Record<string, unknown>;

  const caller = await assertAuthenticated(request.auth);

  const businessId = normalizeBusinessCode(requiredString(data, "businessId", "İşletme kodu"));
  const taskId = requiredString(data, "taskId", "Görev ID");
  const proofPhotoPath = requiredString(data, "proofPhotoPath", "Fotoğraf yolu");

  if (!proofPhotoPath.startsWith(`businesses/${businessId}/tasks/${taskId}/proof/`)) {
    throw new HttpsError("permission-denied", "Fotoğraf yolu bu göreve ait değil.");
  }

  const businessRef = db.collection("businesses").doc(businessId);
  const taskRef = businessRef.collection("tasks").doc(taskId);
  const taskSnapshot = await taskRef.get();
  const taskData = taskSnapshot.data();

  if (!taskSnapshot.exists || !taskData) {
    throw new HttpsError("not-found", "Görev bulunamadı.");
  }

  const assignedToUid = String(taskData.assignedToUid ?? "");
  const currentStatus = String(taskData.status ?? "assigned");

  if (assignedToUid !== caller.uid) {
    throw new HttpsError("permission-denied", "Fotoğraf kanıtını sadece görevin atandığı kullanıcı silebilir.");
  }

  if (!["assigned", "in_progress"].includes(currentStatus)) {
    throw new HttpsError("failed-precondition", "Bu görev durumunda fotoğraf kanıtı silinemez.");
  }

  const callerMemberSnapshot = await businessRef
    .collection("members")
    .doc(caller.uid)
    .get();

  const callerMemberData = callerMemberSnapshot.data();

  if (!callerMemberSnapshot.exists || !callerMemberData) {
    throw new HttpsError("permission-denied", "Bu işletmede fotoğraf silme yetkiniz yok.");
  }

  if (callerMemberData.status === "passive" || callerMemberData.isActive === false) {
    throw new HttpsError("permission-denied", "Pasif kullanıcı fotoğraf silemez.");
  }

  const proofPhotos = Array.isArray(taskData.proofPhotos)
    ? taskData.proofPhotos.filter((item) => item && typeof item === "object")
    : [];

  const remainingProofPhotos = proofPhotos.filter((item) => {
    const proofItem = item as Record<string, unknown>;
    return String(proofItem.path ?? "") !== proofPhotoPath;
  });

  const remainingProofPhotoUrls = remainingProofPhotos
    .map((item) => {
      const proofItem = item as Record<string, unknown>;
      return String(proofItem.url ?? "");
    })
    .filter((url) => url.trim().length > 0);

  const latestProofPhoto = remainingProofPhotos.length > 0
    ? (remainingProofPhotos[remainingProofPhotos.length - 1] as Record<string, unknown>)
    : null;

  await getStorage()
    .bucket()
    .file(proofPhotoPath)
    .delete({ ignoreNotFound: true });

  await taskRef.set(
    {
      proofPhotos: remainingProofPhotos,
      proofPhotoUrls: remainingProofPhotoUrls,
      proofPhotoUrl: latestProofPhoto ? String(latestProofPhoto.url ?? "") : "",
      proofPhotoPath: latestProofPhoto ? String(latestProofPhoto.path ?? "") : "",
      proofPhotoName: latestProofPhoto ? String(latestProofPhoto.name ?? "") : "",
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return {
    ok: true,
    businessId,
    taskId,
    proofPhotoPath,
    remainingCount: remainingProofPhotos.length,
  };
});

