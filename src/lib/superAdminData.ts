import type { User } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { firebaseApp, db } from "./firebase";

const functions = getFunctions(firebaseApp, "europe-west1");
const SUPER_ADMIN_EMAIL = "admin@missio-lite.com";

export type BusinessListItem = {
  businessId: string;
  businessCode: string;
  businessName: string;
  ownerEmail: string;
  ownerName: string;
  status: string;
  plan: string;
  subscriptionStatus: string;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
  maxUsers: number;
};

export type CreateBusinessWithOwnerInput = {
  businessCode: string;
  businessName: string;
  businessPhone: string;
  businessAddress: string;

  ownerDisplayName: string;
  ownerUsername: string;
  ownerEmail: string;
  ownerPhone: string;
  temporaryPassword: string;

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

export async function createBusinessFromSuperAdmin(
  input: CreateBusinessWithOwnerInput,
): Promise<BusinessListItem> {
  const callable = httpsCallable<
    CreateBusinessWithOwnerInput,
    {
      ok: boolean;
      businessId: string;
      businessName: string;
      ownerUid: string;
      ownerUsername: string;
      ownerEmail: string;
    }
  >(functions, "createBusinessWithOwner");

  const result = await callable(input);

  return {
    businessId: result.data.businessId,
    businessCode: result.data.businessId,
    businessName: result.data.businessName,
    ownerEmail: result.data.ownerEmail,
    ownerName: input.ownerDisplayName,
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
        ownerName: String(data.ownerName ?? ""),
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