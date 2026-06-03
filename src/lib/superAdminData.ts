import type { User } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";

const SUPER_ADMIN_EMAIL = "admin@missio-lite.com";

export type BusinessListItem = {
  businessId: string;
  businessCode: string;
  businessName: string;
  ownerEmail: string;
  status: string;
  plan: string;
  subscriptionStatus: string;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
  maxUsers: number;
};

export async function ensureSuperAdminProfile(currentUser: User) {
  if (currentUser.email !== SUPER_ADMIN_EMAIL) {
    throw new Error("Bu işlem sadece süperadmin hesabı ile yapılabilir.");
  }

  await setDoc(
    doc(db, "users", currentUser.uid),
    {
      uid: currentUser.uid,
      email: currentUser.email,
      username: "admin",
      displayName: "Missio Süperadmin",
      globalRole: "super_admin",
      status: "active",
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function createBusinessFromSuperAdmin(input: {
  businessCode: string;
  businessName: string;
  ownerEmail: string;
  plan: string;
  subscriptionStatus: string;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
  maxUsers: number;
}) {
  const businessCode = input.businessCode.trim().toLowerCase();
  const businessName = input.businessName.trim();
  const ownerEmail = input.ownerEmail.trim().toLowerCase();

  if (!businessCode) {
    throw new Error("İşletme kodu zorunludur.");
  }

  if (!businessName) {
    throw new Error("İşletme adı zorunludur.");
  }

  if (!ownerEmail) {
    throw new Error("Patron e-posta adresi zorunludur.");
  }

  await setDoc(
    doc(db, "businesses", businessCode),
    {
      businessId: businessCode,
      businessCode,
      businessName,
      ownerEmail,
      status: "active",
      plan: input.plan,
      subscriptionStatus: input.subscriptionStatus,
      subscriptionStartDate: input.subscriptionStartDate,
      subscriptionEndDate: input.subscriptionEndDate,
      maxUsers: input.maxUsers,
      timezone: "Europe/Istanbul",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return {
    businessId: businessCode,
    businessCode,
    businessName,
    ownerEmail,
    status: "active",
    plan: input.plan,
    subscriptionStatus: input.subscriptionStatus,
    subscriptionStartDate: input.subscriptionStartDate,
    subscriptionEndDate: input.subscriptionEndDate,
    maxUsers: input.maxUsers,
  };
}

export async function listBusinessesForSuperAdmin(): Promise<BusinessListItem[]> {
  const snapshot = await getDocs(collection(db, "businesses"));

  return snapshot.docs
    .map((documentSnapshot) => {
      const data = documentSnapshot.data();

      return {
        businessId: String(data.businessId ?? documentSnapshot.id),
        businessCode: String(data.businessCode ?? documentSnapshot.id),
        businessName: String(data.businessName ?? documentSnapshot.id),
        ownerEmail: String(data.ownerEmail ?? ""),
        status: String(data.status ?? "active"),
        plan: String(data.plan ?? "lite"),
        subscriptionStatus: String(data.subscriptionStatus ?? "active"),
        subscriptionStartDate: String(data.subscriptionStartDate ?? ""),
        subscriptionEndDate: String(data.subscriptionEndDate ?? ""),
        maxUsers: Number(data.maxUsers ?? 10),
      };
    })
    .sort((a, b) => a.businessName.localeCompare(b.businessName, "tr"));
}