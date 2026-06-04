import { getFunctions, httpsCallable } from "firebase/functions";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  type Timestamp,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { firebaseApp, db, storage } from "./firebase";
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

export type ProofPhotoItem = {
  url: string;
  path: string;
  name: string;
  uploadedAtIso: string;
  uploadedAtText: string;
  uploadedByUid: string;
  uploadedByName: string;
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
  proofPhotoUrl: string;
  proofPhotoPath: string;
  proofPhotoName: string;
  proofPhotoUrls: string[];
  proofPhotos: ProofPhotoItem[];
  proofPhotoUploadedAtText: string;
  createdAtText: string;
};

export type UpdateBusinessTaskStatusInput = {
  businessId: string;
  taskId: string;
  status: BusinessTaskStatus;
  note?: string;
};

export type UpdatedBusinessTaskStatusResult = {
  ok: boolean;
  businessId: string;
  taskId: string;
  status: BusinessTaskStatus;
};

export type AttachBusinessTaskProofPhotoInput = {
  businessId: string;
  taskId: string;
  file: File;
};

export type AttachedBusinessTaskProofPhotoResult = {
  ok: boolean;
  businessId: string;
  taskId: string;
  proofPhotoUrl: string;
  proofPhotoPath: string;
  proofPhotoName: string;
};

export type RemoveBusinessTaskProofPhotoInput = {
  businessId: string;
  taskId: string;
  proofPhotoPath: string;
};

export type RemovedBusinessTaskProofPhotoResult = {
  ok: boolean;
  businessId: string;
  taskId: string;
  proofPhotoPath: string;
  remainingCount: number;
};


type AttachBusinessTaskProofPhotoCallableInput = {
  businessId: string;
  taskId: string;
  proofPhotoUrl: string;
  proofPhotoPath: string;
  proofPhotoName: string;
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

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim());
}

function isoDateToText(value: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("tr-TR");
}

function toProofPhotoItems(data: Record<string, unknown>): ProofPhotoItem[] {
  const proofPhotos = Array.isArray(data.proofPhotos)
    ? data.proofPhotos
    : [];

  const mappedPhotos = proofPhotos
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const proofItem = item as Record<string, unknown>;
      const uploadedAtIso = String(proofItem.uploadedAtIso ?? "");

      return {
        url: String(proofItem.url ?? ""),
        path: String(proofItem.path ?? ""),
        name: String(proofItem.name ?? ""),
        uploadedAtIso,
        uploadedAtText: isoDateToText(uploadedAtIso),
        uploadedByUid: String(proofItem.uploadedByUid ?? ""),
        uploadedByName: String(proofItem.uploadedByName ?? ""),
      };
    })
    .filter((item) => item.url && item.path);

  if (mappedPhotos.length > 0) {
    return mappedPhotos;
  }

  const singleUrl = String(data.proofPhotoUrl ?? "");
  const singlePath = String(data.proofPhotoPath ?? "");
  const singleName = String(data.proofPhotoName ?? "");

  if (singleUrl && singlePath) {
    return [
      {
        url: singleUrl,
        path: singlePath,
        name: singleName,
        uploadedAtIso: "",
        uploadedAtText: timestampToText(data.proofPhotoUploadedAt),
        uploadedByUid: String(data.proofPhotoUploadedByUid ?? ""),
        uploadedByName: String(data.proofPhotoUploadedByName ?? ""),
      },
    ];
  }

  return [];
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);

    promise
      .then((result) => {
        window.clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        window.clearTimeout(timeoutId);
        reject(error);
      });
  });
}

function createSafeFileName(fileName: string) {
  const extension = fileName.includes(".")
    ? fileName.split(".").pop()?.toLowerCase() || "jpg"
    : "jpg";

  const safeBaseName = fileName
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

  return `${Date.now()}-${safeBaseName || "proof"}.${extension}`;
}


async function optimizeImageForUpload(file: File): Promise<File> {
  const maxLongSide = 1600;
  const jpegQuality = 0.72;

  if (!file.type.startsWith("image/")) {
    return file;
  }

  const imageUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();

      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Fotoğraf okunamadı."));
      img.src = imageUrl;
    });

    const originalWidth = image.naturalWidth || image.width;
    const originalHeight = image.naturalHeight || image.height;

    if (!originalWidth || !originalHeight) {
      return file;
    }

    const longSide = Math.max(originalWidth, originalHeight);
    const scale = longSide > maxLongSide ? maxLongSide / longSide : 1;

    const targetWidth = Math.max(1, Math.round(originalWidth * scale));
    const targetHeight = Math.max(1, Math.round(originalHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      return file;
    }

    context.drawImage(image, 0, 0, targetWidth, targetHeight);

    const optimizedBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", jpegQuality);
    });

    if (!optimizedBlob) {
      return file;
    }

    if (optimizedBlob.size >= file.size && file.size <= 1024 * 1024) {
      return file;
    }

    const optimizedName = file.name.replace(/\.[^/.]+$/, "") + "-optimized.jpg";

    return new File([optimizedBlob], optimizedName, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
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

export function hasTaskProofPhoto(task: BusinessTaskListItem) {
  return Boolean(
    task.proofPhotos.length > 0 ||
      task.proofPhotoUrl ||
      task.proofPhotoUrls.length > 0,
  );
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
      proofPhotoUrl: String(data.proofPhotoUrl ?? ""),
      proofPhotoPath: String(data.proofPhotoPath ?? ""),
      proofPhotoName: String(data.proofPhotoName ?? ""),
      proofPhotoUrls: toStringArray(data.proofPhotoUrls),
      proofPhotos: toProofPhotoItems(data),
      proofPhotoUploadedAtText: timestampToText(data.proofPhotoUploadedAt),
      createdAtText: timestampToText(data.createdAt),
    };
  });
}

export async function updateBusinessTaskStatusForBusiness(
  input: UpdateBusinessTaskStatusInput,
): Promise<UpdatedBusinessTaskStatusResult> {
  const callable = httpsCallable<
    UpdateBusinessTaskStatusInput,
    UpdatedBusinessTaskStatusResult
  >(functions, "updateBusinessTaskStatus");

  const response = await callable({
    businessId: input.businessId.trim().toLowerCase(),
    taskId: input.taskId,
    status: input.status,
    note: input.note?.trim() ?? "",
  });

  return response.data;
}

export async function attachBusinessTaskProofPhotoForBusiness(
  input: AttachBusinessTaskProofPhotoInput,
): Promise<AttachedBusinessTaskProofPhotoResult> {
  const normalizedBusinessId = input.businessId.trim().toLowerCase();

  const optimizedFile = await withTimeout(
    optimizeImageForUpload(input.file),
    15000,
    "Fotoğraf hazırlanırken zaman aşımına uğradı.",
  );

  const safeFileName = createSafeFileName(optimizedFile.name);
  const proofPhotoPath = `businesses/${normalizedBusinessId}/tasks/${input.taskId}/proof/${safeFileName}`;

  const fileRef = ref(storage, proofPhotoPath);

  await withTimeout(
    uploadBytes(fileRef, optimizedFile, {
      contentType: optimizedFile.type || "image/jpeg",
      customMetadata: {
        originalFileName: input.file.name,
        originalSize: String(input.file.size),
        optimizedSize: String(optimizedFile.size),
      },
    }),
    30000,
    "Fotoğraf Firebase Storage alanına yüklenirken zaman aşımına uğradı.",
  );

  const proofPhotoUrl = await withTimeout(
    getDownloadURL(fileRef),
    15000,
    "Yüklenen fotoğraf bağlantısı alınırken zaman aşımına uğradı.",
  );

  const callable = httpsCallable<
    AttachBusinessTaskProofPhotoCallableInput,
    AttachedBusinessTaskProofPhotoResult
  >(functions, "attachBusinessTaskProofPhoto");

  const response = await withTimeout(
    callable({
      businessId: normalizedBusinessId,
      taskId: input.taskId,
      proofPhotoUrl,
      proofPhotoPath,
      proofPhotoName: optimizedFile.name,
    }),
    15000,
    "Fotoğraf görev kaydına bağlanırken zaman aşımına uğradı.",
  );

  return response.data;
}

export async function removeBusinessTaskProofPhotoForBusiness(
  input: RemoveBusinessTaskProofPhotoInput,
): Promise<RemovedBusinessTaskProofPhotoResult> {
  const callable = httpsCallable<
    RemoveBusinessTaskProofPhotoInput,
    RemovedBusinessTaskProofPhotoResult
  >(functions, "removeBusinessTaskProofPhoto");

  const response = await callable({
    businessId: input.businessId.trim().toLowerCase(),
    taskId: input.taskId,
    proofPhotoPath: input.proofPhotoPath,
  });

  return response.data;
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
    requiresApproval: input.requiresPhoto || input.requiresApproval,
    referenceImageName: input.referenceImageName?.trim() ?? "",
    dueDate: input.dueDate?.trim() ?? "",
  });

  return response.data;
}