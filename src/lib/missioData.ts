import type { User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./firebase";

const BUSINESS_ID = "ertanmarket";
const BUSINESS_NAME = "Ertan Market";
const OWNER_EMAIL = "m.mkaradeniz@icloud.com";

type SeedResult = {
  businessId: string;
  businessName: string;
  ownerEmail: string | null;
  memberRole: string;
  demoMemberCount: number;
};

async function setDocWithCreatedAt(
  pathParts: string[],
  data: Record<string, unknown>,
) {
  const reference = doc(db, pathParts[0], pathParts[1], ...pathParts.slice(2));
  const snapshot = await getDoc(reference);

  if (snapshot.exists()) {
    await setDoc(
      reference,
      {
        ...data,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    return;
  }

  await setDoc(
    reference,
    {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function ensureInitialErtanMarketData(
  currentUser: User,
): Promise<SeedResult> {
  if (currentUser.email !== OWNER_EMAIL) {
    throw new Error("İlk kurulum sadece owner hesabı ile yapılabilir.");
  }

  await setDocWithCreatedAt(["businesses", BUSINESS_ID], {
    businessId: BUSINESS_ID,
    businessCode: BUSINESS_ID,
    businessName: BUSINESS_NAME,
    ownerEmail: OWNER_EMAIL,
    status: "active",
    plan: "lite",
    timezone: "Europe/Istanbul",
  });

  await setDocWithCreatedAt(["users", currentUser.uid], {
    uid: currentUser.uid,
    email: currentUser.email,
    displayName: "Mustafa Karadeniz",
    defaultBusinessId: BUSINESS_ID,
    businessIds: [BUSINESS_ID],
    status: "active",
  });

  await setDocWithCreatedAt(
    ["businesses", BUSINESS_ID, "members", currentUser.uid],
    {
      uid: currentUser.uid,
      email: currentUser.email,
      username: "m.mkaradeniz",
      displayName: "Mustafa Karadeniz",
      role: "owner",
      roleLabel: "Patron",
      status: "active",
      isActive: true,
      canManageUsers: true,
      canAssignTasks: true,
      canRequestLocation: true,
    },
  );

  const demoMembers = [
    {
      id: "ahmet-personel",
      email: "ahmet@ertanmarket.com",
      username: "ahmet",
      displayName: "Ahmet Personel",
      phone: "0533 000 00 01",
      role: "staff",
      roleLabel: "Personel",
      sortOrder: 10,
    },
    {
      id: "ali-personel",
      email: "ali@ertanmarket.com",
      username: "ali",
      displayName: "Ali Personel",
      phone: "0533 000 00 02",
      role: "staff",
      roleLabel: "Personel",
      sortOrder: 20,
    },
    {
      id: "demo-manager",
      email: "manager@ertanmarket.com",
      username: "manager",
      displayName: "Demo Manager",
      phone: "0533 000 00 03",
      role: "manager",
      roleLabel: "Yönetici",
      sortOrder: 30,
    },
  ];

  for (const member of demoMembers) {
    await setDocWithCreatedAt(
      ["businesses", BUSINESS_ID, "members", member.id],
      {
        ...member,
        businessId: BUSINESS_ID,
        status: "active",
        isActive: true,
        isDemo: true,
        canManageUsers: member.role === "manager",
        canAssignTasks: member.role === "manager",
        canRequestLocation: member.role === "manager",
      },
    );
  }

  return {
    businessId: BUSINESS_ID,
    businessName: BUSINESS_NAME,
    ownerEmail: currentUser.email,
    memberRole: "owner",
    demoMemberCount: demoMembers.length,
  };
}
