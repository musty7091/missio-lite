import { getFunctions, httpsCallable } from "firebase/functions";
import { collection, getDocs } from "firebase/firestore";
import { firebaseApp, db } from "./firebase";

const functions = getFunctions(firebaseApp, "europe-west1");

export type CreateBusinessUserRole = "manager" | "staff";

export type CreateBusinessUserInput = {
  businessId: string;
  displayName: string;
  username: string;
  email: string;
  phone?: string;
  role: CreateBusinessUserRole;
  temporaryPassword: string;
  managerUid?: string;
};

export type CreatedBusinessUser = {
  ok: boolean;
  businessId: string;
  uid: string;
  username: string;
  email: string;
  role: CreateBusinessUserRole;
  managerUid?: string | null;
};

export type BusinessManagerOption = {
  uid: string;
  displayName: string;
  email: string;
  username: string;
};

export async function listBusinessManagers(
  businessId: string,
): Promise<BusinessManagerOption[]> {
  const normalizedBusinessId = businessId.trim().toLowerCase();

  if (!normalizedBusinessId) {
    return [];
  }

  const membersRef = collection(
    db,
    "businesses",
    normalizedBusinessId,
    "members",
  );

  const snapshot = await getDocs(membersRef);

  return snapshot.docs
    .map((memberDoc) => {
      const data = memberDoc.data();

      return {
        uid: memberDoc.id,
        displayName: String(data.displayName ?? ""),
        email: String(data.email ?? ""),
        username: String(data.username ?? ""),
        role: String(data.role ?? ""),
        status: String(data.status ?? ""),
        isActive: data.isActive,
      };
    })
    .filter((member) => {
      return (
        member.role === "manager" &&
        member.status !== "passive" &&
        member.isActive !== false
      );
    })
    .map((member) => ({
      uid: member.uid,
      displayName: member.displayName,
      email: member.email,
      username: member.username,
    }))
    .sort((first, second) =>
      first.displayName.localeCompare(second.displayName, "tr"),
    );
}

export async function createBusinessUserForBusiness(
  input: CreateBusinessUserInput,
): Promise<CreatedBusinessUser> {
  const callable = httpsCallable<CreateBusinessUserInput, CreatedBusinessUser>(
    functions,
    "createBusinessUser",
  );

  try {
    const response = await callable({
      businessId: input.businessId.trim().toLowerCase(),
      displayName: input.displayName.trim(),
      username: input.username.trim().toLowerCase(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone?.trim() ?? "",
      role: input.role,
      temporaryPassword: input.temporaryPassword,
      managerUid: input.managerUid?.trim() || undefined,
    });

    return response.data;
  } catch (error) {
    console.error(error);

    if (error instanceof Error && error.message) {
      throw new Error(error.message);
    }

    throw new Error("Kullanıcı oluşturulamadı.");
  }
}