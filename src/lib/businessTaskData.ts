import { getFunctions, httpsCallable } from "firebase/functions";
import { firebaseApp } from "./firebase";
import { listBusinessMembers } from "./businessUserData";

const functions = getFunctions(firebaseApp, "europe-west1");

export type TaskType = "Rutin" | "Ekstra";
export type TaskPriority = "Normal" | "Önemli" | "Acil" | "Kritik";

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