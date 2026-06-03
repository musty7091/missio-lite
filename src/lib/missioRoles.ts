export type GlobalRole = "super_admin";

export type BusinessRole = "owner" | "manager" | "staff";

export type MemberStatus = "active" | "passive";

export type SubscriptionPlan = "demo" | "lite" | "pro";

export type SubscriptionStatus = "trial" | "active" | "suspended" | "cancelled";

export type BusinessMember = {
  uid: string;
  businessId: string;

  email: string;
  username: string;
  displayName: string;
  phone?: string;

  role: BusinessRole;
  roleLabel: string;
  status: MemberStatus;
  isActive: boolean;

  managerUid?: string | null;
  managerName?: string | null;

  canManageUsers: boolean;
  canAssignTasks: boolean;
  canRequestLocation: boolean;
  canViewReports: boolean;

  createdAt?: unknown;
  updatedAt?: unknown;
};

export type BusinessRecord = {
  businessId: string;
  businessCode: string;
  businessName: string;

  ownerUid?: string;
  ownerEmail: string;
  ownerName?: string;

  status: "active" | "passive";
  plan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
  maxUsers: number;

  timezone: string;

  createdAt?: unknown;
  updatedAt?: unknown;
};

export type AppUserProfile = {
  uid: string;
  email: string;
  username: string;
  displayName: string;

  globalRole?: GlobalRole;
  defaultBusinessId?: string;
  businessIds?: string[];

  status: MemberStatus;

  createdAt?: unknown;
  updatedAt?: unknown;
};

export function getBusinessRoleLabel(role: BusinessRole) {
  if (role === "owner") {
    return "Patron";
  }

  if (role === "manager") {
    return "Yönetici";
  }

  return "Personel";
}

export function getDefaultPermissions(role: BusinessRole) {
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

export function canSeeMember({
  viewerRole,
  viewerUid,
  targetUid,
  targetManagerUid,
}: {
  viewerRole: BusinessRole;
  viewerUid: string;
  targetUid: string;
  targetManagerUid?: string | null;
}) {
  if (viewerRole === "owner") {
    return true;
  }

  if (viewerRole === "manager") {
    return targetManagerUid === viewerUid || targetUid === viewerUid;
  }

  return targetUid === viewerUid;
}