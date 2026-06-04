import { getFunctions, httpsCallable } from "firebase/functions";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  type Timestamp,
} from "firebase/firestore";
import { firebaseApp, db } from "./firebase";
import { listBusinessMembers } from "./businessUserData";

const functions = getFunctions(firebaseApp, "europe-west1");

export type TaskType = "Rutin" | "Ekstra";
export type TaskPriority = "Normal" | "Önemli" | "Acil" | "Kritik";
export type BusinessTaskStatus =
  | "assigned"
  | "in_progress"
  | "completed"
  | "approved"
  | "rejected"
  | "cancelled";

export type AssignableTaskMember = {
  uid: string;
  displayName: string;
  username: string;
  email: string;
  role: "manager" | "staff";
  roleLabel: string;
  managerUid: string | null;
  managerName: string | null;
};

export type CreateBusinessTaskInput = {
  businessId: string;
  assignedToUid: string;
  title: string;
  description?: string;
  taskType: TaskType;
  priority: TaskPriority;
  requiresPhoto: boolean;
  requiresApproval: boolean;
  referenceImageName?: string;
  dueDate?: string;
};

export type CreatedBusinessTask = {
  ok: boolean;
  businessId: string;
  taskId: string;
  assignedToUid: string;
  assignedToName: string;
  title: string;
  status: string;
};

export type BusinessTaskListItem = {
  taskId: string;
  businessId: string;
  title: string;
  description: string;
  taskType: TaskType;
  priority: TaskPriority;
  status: BusinessTaskStatus;
  assignedToUid: string;
  assignedToName: string;
  assignedToRole: string;
  assignedToUsername: string;
  assignedByUid: string;
  assignedByName: string;
  assignedByRole: string;
  requiresPhoto: boolean;
  requiresApproval: boolean;
  dueDate: string;
  referenceImageName: string;
  createdAtText: string;
};

function normalizeTaskType(value: unknown): TaskType {
  return value === "Ekstra" ? "Ekstra" : "Rutin";
}

function normalizePriority(value: unknown): TaskPriority {
  if (
    value === "Normal" ||
    value === "Önemli" ||
    value === "Acil" ||
    value === "Kritik"
  ) {
    return value;
  }

  return "Normal";
}

function normalizeStatus(value: unknown): BusinessTaskStatus {
  if (
    value === "assigned" ||
    value === "in_progress" ||
    value === "completed" ||
    value === "approved" ||
    value === "rejected" ||
    value === "cancelled"
  ) {
    return value;
  }

  return "assigned";
}

function timestampToText(value: unknown) {
  const timestamp = value as Timestamp | undefined;

  if (!timestamp?.toDate) {
    return "";
  }

  return timestamp.toDate().toLocaleString("tr-TR");
}

export function getTaskStatusLabel(status: BusinessTaskStatus) {
  if (status === "assigned") return "Atandı";
  if (status === "in_progress") return "Devam Ediyor";
  if (status === "completed") return "Tamamlandı";
  if (status === "approved") return "Onaylandı";
  if (status === "rejected") return "Reddedildi";
  if (status === "cancelled") return "İptal";
  return "Atandı";
}

export async function listAssignableTaskMembers(
  businessId: string,
): Promise<AssignableTaskMember[]> {
  const members = await listBusinessMembers(businessId);

  return members
    .filter((member) => {
      return (
        (member.role === "manager" || member.role === "staff") &&
        member.status !== "passive" &&
        member.isActive !== false
      );
    })
    .map((member) => ({
      uid: member.uid,
      displayName: member.displayName,
      username: member.username,
      email: member.email,
      role: member.role === "manager" ? "manager" : "staff",
      roleLabel: member.roleLabel,
      managerUid: member.managerUid,
      managerName: member.managerName,
    }));
}

export async function listBusinessTasks(
  businessId: string,
): Promise<BusinessTaskListItem[]> {
  const normalizedBusinessId = businessId.trim().toLowerCase();

  if (!normalizedBusinessId) {
    return [];
  }

  const tasksRef = collection(db, "businesses", normalizedBusinessId, "tasks");
  const tasksQuery = query(tasksRef, orderBy("createdAt", "desc"), limit(50));
  const snapshot = await getDocs(tasksQuery);

  return snapshot.docs.map((taskDoc) => {
    const data = taskDoc.data();

    return {
      taskId: String(data.taskId ?? taskDoc.id),
      businessId: String(data.businessId ?? normalizedBusinessId),
      title: String(data.title ?? ""),
      description: String(data.description ?? ""),
      taskType: normalizeTaskType(data.taskType),
      priority: normalizePriority(data.priority),
      status: normalizeStatus(data.status),
      assignedToUid: String(data.assignedToUid ?? ""),
      assignedToName: String(data.assignedToName ?? ""),
      assignedToRole: String(data.assignedToRole ?? ""),
      assignedToUsername: String(data.assignedToUsername ?? ""),
      assignedByUid: String(data.assignedByUid ?? ""),
      assignedByName: String(data.assignedByName ?? ""),
      assignedByRole: String(data.assignedByRole ?? ""),
      requiresPhoto: Boolean(data.requiresPhoto ?? false),
      requiresApproval: Boolean(data.requiresApproval ?? false),
      dueDate: String(data.dueDate ?? ""),
      referenceImageName: String(data.referenceImageName ?? ""),
      createdAtText: timestampToText(data.createdAt),
    };
  });
}

export async function createBusinessTaskForBusiness(
  input: CreateBusinessTaskInput,
): Promise<CreatedBusinessTask> {
  const callable = httpsCallable<CreateBusinessTaskInput, CreatedBusinessTask>(
    functions,
    "createBusinessTask",
  );

  const response = await callable({
    businessId: input.businessId.trim().toLowerCase(),
    assignedToUid: input.assignedToUid,
    title: input.title.trim(),
    description: input.description?.trim() ?? "",
    taskType: input.taskType,
    priority: input.priority,
    requiresPhoto: input.requiresPhoto,
    requiresApproval: input.requiresApproval,
    referenceImageName: input.referenceImageName?.trim() ?? "",
    dueDate: input.dueDate?.trim() ?? "",
  });

  return response.data;
}