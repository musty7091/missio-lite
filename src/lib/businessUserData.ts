import { getFunctions, httpsCallable } from "firebase/functions";
import { collection, getDocs } from "firebase/firestore";
import { firebaseApp, db } from "./firebase";

const functions = getFunctions(firebaseApp, "europe-west1");

export type CreateBusinessUserRole = "manager" | "staff";
export type BusinessMemberRole = "owner" | "manager" | "staff" | "user";
export type BusinessMemberStatus = "active" | "passive";

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

export type UpdateBusinessMemberInput = {
  businessId: string;
  targetUid: string;
  displayName: string;
  phone?: string;
  role: CreateBusinessUserRole;
  status: BusinessMemberStatus;
  managerUid?: string;
};

export type UpdatedBusinessMember = {
  ok: boolean;
  businessId: string;
  uid: string;
  username: string;
  email: string;
  role: CreateBusinessUserRole;
  status: BusinessMemberStatus;
  managerUid?: string | null;
  managerName?: string | null;
};

export type BusinessManagerOption = {
  uid: string;
  displayName: string;
  email: string;
  username: string;
};

export type BusinessMemberListItem = {
  uid: string;
  displayName: string;
  email: string;
  username: string;
  phone: string;
  role: BusinessMemberRole;
  roleLabel: string;
  status: string;
  isActive: boolean;
  managerUid: string | null;
  managerName: string | null;
};

function getRoleLabel(role: BusinessMemberRole) {
  if (role === "owner") return "Patron";
  if (role === "manager") return "Yönetici";
  if (role === "staff") return "Personel";
  return "Kullanıcı";
}

function getRoleSortValue(role: BusinessMemberRole) {
  if (role === "owner") return 1;
  if (role === "manager") return 2;
  if (role === "staff") return 3;
  return 4;
}

function normalizeRole(value: unknown): BusinessMemberRole {
  const role = String(value ?? "user");
  if (role === "owner" || role === "manager" || role === "staff") return role;
  return "user";
}

export async function listBusinessMembers(
  businessId: string,
): Promise<BusinessMemberListItem[]> {
  const normalizedBusinessId = businessId.trim().toLowerCase();

  if (!normalizedBusinessId) return [];

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
      const role = normalizeRole(data.role);

      return {
        uid: String(data.uid ?? memberDoc.id),
        displayName: String(data.displayName ?? ""),
        email: String(data.email ?? ""),
        username: String(data.username ?? ""),
        phone: String(data.phone ?? ""),
        role,
        roleLabel: String(data.roleLabel ?? getRoleLabel(role)),
        status: String(data.status ?? "active"),
        isActive: data.isActive !== false,
        managerUid: data.managerUid ? String(data.managerUid) : null,
        managerName: data.managerName ? String(data.managerName) : null,
      };
    })
    .sort((first, second) => {
      const roleDiff =
        getRoleSortValue(first.role) - getRoleSortValue(second.role);

      if (roleDiff !== 0) return roleDiff;

      return first.displayName.localeCompare(second.displayName, "tr");
    });
}

export async function listBusinessManagers(
  businessId: string,
): Promise<BusinessManagerOption[]> {
  const members = await listBusinessMembers(businessId);

  return members
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
}

export async function updateBusinessMemberForBusiness(
  input: UpdateBusinessMemberInput,
): Promise<UpdatedBusinessMember> {
  const callable = httpsCallable<UpdateBusinessMemberInput, UpdatedBusinessMember>(
    functions,
    "updateBusinessMember",
  );

  const response = await callable({
    businessId: input.businessId.trim().toLowerCase(),
    targetUid: input.targetUid,
    displayName: input.displayName.trim(),
    phone: input.phone?.trim() ?? "",
    role: input.role,
    status: input.status,
    managerUid: input.managerUid?.trim() || undefined,
  });

  return response.data;
}