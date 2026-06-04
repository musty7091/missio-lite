import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import type { User } from "firebase/auth";
import {
  AlertTriangle,
  BarChart3,
  Camera,
  ClipboardCheck,
  Eye,
  FileCheck2,
  ImagePlus,
  ListChecks,
  MapPin,
  PlusSquare,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import { ActionSheet } from "../common/ActionSheet";
import { TaskAssignSheet } from "../boss/TaskAssignSheet";
import { LocationCheckSheet } from "../boss/LocationCheckSheet";
import {
  attachBusinessTaskProofPhotoForBusiness,
  getTaskStatusLabel,
  hasTaskProofPhoto,
  listBusinessTasks,
  removeBusinessTaskProofPhotoForBusiness,
  updateBusinessTaskStatusForBusiness,
  type BusinessTaskListItem,
  type ProofPhotoItem,
} from "../../lib/businessTaskData";
import {
  listBusinessMembers,
  type BusinessMemberListItem,
} from "../../lib/businessUserData";

type ManagerHomePanelProps = {
  businessId: string;
  businessName: string;
  currentUser: User;
};

type ManagerSheet =
  | "assignTask"
  | "location"
  | "approvals"
  | "reports"
  | "staff"
  | "myTasks"
  | "teamTasks"
  | "priorityTasks"
  | null;

function todayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isOpenTask(task: BusinessTaskListItem) {
  return task.status === "assigned" || task.status === "in_progress";
}

function isPendingApproval(task: BusinessTaskListItem) {
  return task.status === "completed" && task.requiresApproval;
}

function isDelayedTask(task: BusinessTaskListItem) {
  if (!task.dueDate || !isOpenTask(task)) {
    return false;
  }

  return task.dueDate < todayIsoDate();
}

function getPriorityClass(priority: string) {
  if (priority === "Kritik") return "bg-red-500/10 text-red-500";
  if (priority === "Acil") return "bg-orange-500/10 text-orange-500";
  if (priority === "Önemli") return "bg-amber-500/10 text-amber-500";
  return "bg-cyan-500/10 text-[var(--missio-primary)]";
}

function SummaryMiniCard({
  label,
  value,
  note,
  danger,
}: {
  label: string;
  value: number;
  note: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-[1.15rem] bg-white/10 px-3 py-2.5 ring-1 ring-white/10">
      <p
        className={[
          "text-xl font-black leading-none",
          danger ? "text-red-300" : "text-white",
        ].join(" ")}
      >
        {value}
      </p>
      <span className="mt-2 block text-[0.64rem] font-black uppercase tracking-wide text-slate-200">
        {label}
      </span>
      <small className="mt-1 block truncate text-[0.6rem] font-bold text-slate-400">
        {note}
      </small>
    </div>
  );
}

function QuickActionCard({
  icon,
  title,
  note,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  note: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[1.45rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-4 text-left shadow-sm active:scale-[0.99]"
    >
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-500/10 text-[var(--missio-primary)]">
        {icon}
      </div>

      <strong className="mt-3 block text-sm font-black text-[var(--missio-text-main)]">
        {title}
      </strong>

      <span className="mt-1 block text-xs font-bold leading-5 text-[var(--missio-text-muted)]">
        {note}
      </span>
    </button>
  );
}

function DetailEntryCard({
  icon,
  title,
  note,
  value,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  note: string;
  value: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-[1.5rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-4 text-left shadow-sm active:scale-[0.99]"
    >
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-500/10 text-[var(--missio-primary)]">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <strong className="block text-sm font-black text-[var(--missio-text-main)]">
          {title}
        </strong>
        <span className="mt-1 block truncate text-xs font-bold text-[var(--missio-text-muted)]">
          {note}
        </span>
      </div>

      <div className="grid h-9 min-w-9 place-items-center rounded-full bg-[var(--missio-page-bg)] px-3 text-sm font-black text-[var(--missio-text-main)]">
        {value}
      </div>
    </button>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-[var(--missio-page-bg)] p-3">
      <span className="block text-[0.65rem] font-black uppercase tracking-wide text-[var(--missio-text-muted)]">
        {label}
      </span>
      <strong className="mt-1 block text-xs font-black text-[var(--missio-text-main)]">
        {value || "-"}
      </strong>
    </div>
  );
}

function ProofPhotoGallery({
  task,
  currentUserUid,
  onPreviewPhoto,
  onRemovePhoto,
  removingPhotoPath,
}: {
  task: BusinessTaskListItem;
  currentUserUid: string;
  onPreviewPhoto: (photo: ProofPhotoItem) => void;
  onRemovePhoto: (taskId: string, photo: ProofPhotoItem) => void;
  removingPhotoPath: string;
}) {
  const canEditPhotos =
    task.assignedToUid === currentUserUid &&
    (task.status === "assigned" || task.status === "in_progress");

  if (task.proofPhotos.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 rounded-2xl border border-[var(--missio-border)] bg-[var(--missio-page-bg)] p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <strong className="block text-xs font-black text-[var(--missio-text-main)]">
            Fotoğraf Kanıtları
          </strong>
          <span className="mt-1 block text-[0.65rem] font-bold text-[var(--missio-text-muted)]">
            {task.proofPhotos.length}/3 fotoğraf eklendi
          </span>
        </div>

        <Camera size={18} className="text-[var(--missio-primary)]" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {task.proofPhotos.map((photo, index) => (
          <div
            key={`${photo.path}-${index}`}
            className="relative overflow-hidden rounded-2xl border border-[var(--missio-border)] bg-slate-950"
          >
            <button
              type="button"
              onClick={() => onPreviewPhoto(photo)}
              className="block h-24 w-full"
            >
              <img
                src={photo.url}
                alt={`Görev fotoğraf kanıtı ${index + 1}`}
                className="h-full w-full object-cover"
              />

              <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/55 px-2 py-1 text-[0.62rem] font-black text-white">
                <Eye size={12} />
                Büyüt
              </div>
            </button>

            {canEditPhotos ? (
              <button
                type="button"
                onClick={() => onRemovePhoto(task.taskId, photo)}
                disabled={removingPhotoPath === photo.path}
                className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-red-500 text-white shadow-lg disabled:opacity-60"
                aria-label="Fotoğrafı sil"
              >
                <Trash2 size={14} />
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function TaskCard({
  task,
  currentUserUid,
  onStart,
  onComplete,
  onApprove,
  onReject,
  onPhotoSelected,
  onPreviewPhoto,
  onRemovePhoto,
  isUpdating,
  isUploading,
  removingPhotoPath,
}: {
  task: BusinessTaskListItem;
  currentUserUid: string;
  onStart: (taskId: string) => void;
  onComplete: (taskId: string) => void;
  onApprove: (taskId: string) => void;
  onReject: (taskId: string) => void;
  onPhotoSelected: (taskId: string, event: ChangeEvent<HTMLInputElement>) => void;
  onPreviewPhoto: (photo: ProofPhotoItem) => void;
  onRemovePhoto: (taskId: string, photo: ProofPhotoItem) => void;
  isUpdating: boolean;
  isUploading: boolean;
  removingPhotoPath: string;
}) {
  const isMyTask = task.assignedToUid === currentUserUid;
  const hasProof = hasTaskProofPhoto(task);
  const photoCount = task.proofPhotos.length;
  const canAddPhoto =
    isMyTask &&
    task.status === "in_progress" &&
    task.requiresPhoto &&
    photoCount < 3;

  const canComplete =
    isMyTask &&
    task.status === "in_progress" &&
    (!task.requiresPhoto || hasProof);

  return (
    <article className="rounded-[1.6rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cyan-500/10 text-[var(--missio-primary)]">
          <ListChecks size={22} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="text-base font-black leading-5 text-[var(--missio-text-main)]">
                {task.title}
              </h4>

              <p className="mt-1 text-xs font-bold leading-5 text-[var(--missio-text-muted)]">
                Veren: {task.assignedByName || "Bilinmiyor"} · Atanan:{" "}
                {task.assignedToName || "Bilinmiyor"}
              </p>
            </div>

            <span
              className={[
                "shrink-0 rounded-full px-2.5 py-1 text-[0.65rem] font-black",
                getPriorityClass(task.priority),
              ].join(" ")}
            >
              {task.priority}
            </span>
          </div>

          {task.description ? (
            <div className="mt-4 rounded-2xl border border-[var(--missio-border)] bg-[var(--missio-page-bg)] p-4">
              <span className="block text-[0.65rem] font-black uppercase tracking-wide text-[var(--missio-text-muted)]">
                Görev Açıklaması
              </span>
              <p className="mt-2 text-sm font-bold leading-6 text-[var(--missio-text-main)]">
                {task.description}
              </p>
            </div>
          ) : null}

          <div className="mt-3 grid grid-cols-2 gap-2">
            <DetailRow label="Durum" value={getTaskStatusLabel(task.status)} />
            <DetailRow label="Tip" value={task.taskType} />
            <DetailRow label="Son Tarih" value={task.dueDate || "Belirtilmedi"} />
            <DetailRow
              label="Kanıt"
              value={
                task.requiresPhoto
                  ? hasProof
                    ? `${photoCount}/3 fotoğraf`
                    : "Fotoğraf gerekli"
                  : "Gerekli değil"
              }
            />
          </div>

          {task.requiresPhoto && !hasProof ? (
            <div className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4">
              <div className="flex items-start gap-3">
                <Camera className="mt-0.5 shrink-0 text-amber-600" size={20} />
                <div>
                  <strong className="block text-sm font-black text-amber-700">
                    Fotoğraf kanıtı zorunlu
                  </strong>
                  <p className="mt-1 text-xs font-bold leading-5 text-amber-700">
                    Bu görev fotoğraf eklenmeden tamamlanamaz.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {task.requiresPhoto && hasProof ? (
            <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-xs font-black leading-5 text-emerald-600">
              Fotoğraf kanıtı eklendi.
            </div>
          ) : null}

          <ProofPhotoGallery
            task={task}
            currentUserUid={currentUserUid}
            onPreviewPhoto={onPreviewPhoto}
            onRemovePhoto={onRemovePhoto}
            removingPhotoPath={removingPhotoPath}
          />

          <div className="mt-4 grid gap-2">
            {isMyTask && task.status === "assigned" ? (
              <button
                type="button"
                onClick={() => onStart(task.taskId)}
                disabled={isUpdating}
                className="rounded-2xl bg-[var(--missio-primary)] px-4 py-3 text-sm font-black text-white active:scale-[0.99] disabled:opacity-60"
              >
                {isUpdating ? "İşleniyor..." : "Göreve Başladım"}
              </button>
            ) : null}

            {canAddPhoto ? (
              <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-black text-white active:scale-[0.99]">
                <ImagePlus size={19} />
                {isUploading ? "Fotoğraf yükleniyor..." : "Fotoğraf Ekle"}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  disabled={isUploading}
                  onChange={(event) => onPhotoSelected(task.taskId, event)}
                  className="hidden"
                />
              </label>
            ) : null}

            {isMyTask &&
            task.status === "in_progress" &&
            task.requiresPhoto &&
            photoCount >= 3 ? (
              <div className="rounded-2xl bg-slate-500/10 px-4 py-3 text-xs font-black leading-5 text-[var(--missio-text-muted)]">
                3 fotoğraf sınırına ulaşıldı. Yeni fotoğraf eklemek için önce yanlış olanı silebilirsin.
              </div>
            ) : null}

            {canComplete ? (
              <button
                type="button"
                onClick={() => onComplete(task.taskId)}
                disabled={isUpdating}
                className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-white active:scale-[0.99] disabled:opacity-60"
              >
                {isUpdating ? "İşleniyor..." : "Tamamladım"}
              </button>
            ) : null}

            {isMyTask &&
            task.status === "in_progress" &&
            task.requiresPhoto &&
            !hasProof ? (
              <div className="rounded-2xl bg-red-500/10 px-4 py-3 text-xs font-black leading-5 text-red-500">
                Tamamlamak için önce fotoğraf kanıtı eklemelisin.
              </div>
            ) : null}

            {!isMyTask && isOpenTask(task) ? (
              <div className="rounded-2xl bg-cyan-500/10 px-4 py-3 text-xs font-black leading-5 text-[var(--missio-primary)]">
                Bu görev ekibindeki bir personele ait. Yönetici olarak durumunu takip edebilirsin.
              </div>
            ) : null}

            {!isMyTask && task.status === "completed" && task.requiresApproval ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onApprove(task.taskId)}
                  disabled={isUpdating}
                  className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-white active:scale-[0.99] disabled:opacity-60"
                >
                  {isUpdating ? "İşleniyor..." : "Onayla"}
                </button>

                <button
                  type="button"
                  onClick={() => onReject(task.taskId)}
                  disabled={isUpdating}
                  className="rounded-2xl bg-red-500 px-4 py-3 text-sm font-black text-white active:scale-[0.99] disabled:opacity-60"
                >
                  {isUpdating ? "İşleniyor..." : "Reddet"}
                </button>
              </div>
            ) : null}

            {task.status === "completed" ? (
              <div className="rounded-2xl bg-amber-500/10 px-4 py-3 text-sm font-black text-amber-600">
                Görev tamamlandı. Onay bekliyor.
              </div>
            ) : null}

            {task.status === "approved" ? (
              <div className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm font-black text-emerald-600">
                Görev onaylandı.
              </div>
            ) : null}

            {task.status === "rejected" ? (
              <div className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-black text-red-500">
                Görev reddedildi.
              </div>
            ) : null}
          </div>

          {task.requiresApproval ? (
            <div className="mt-3 flex items-start gap-2 rounded-2xl bg-cyan-500/10 p-3 text-xs font-bold leading-5 text-[var(--missio-primary)]">
              <ShieldCheck className="mt-0.5 shrink-0" size={16} />
              Bu görev tamamlandıktan sonra yönetici/patron onayına düşer.
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function TaskList({
  tasks,
  emptyText,
  currentUserUid,
  onStart,
  onComplete,
  onApprove,
  onReject,
  onPhotoSelected,
  onPreviewPhoto,
  onRemovePhoto,
  updatingTaskId,
  uploadingTaskId,
  removingPhotoPath,
}: {
  tasks: BusinessTaskListItem[];
  emptyText: string;
  currentUserUid: string;
  onStart: (taskId: string) => void;
  onComplete: (taskId: string) => void;
  onApprove: (taskId: string) => void;
  onReject: (taskId: string) => void;
  onPhotoSelected: (taskId: string, event: ChangeEvent<HTMLInputElement>) => void;
  onPreviewPhoto: (photo: ProofPhotoItem) => void;
  onRemovePhoto: (taskId: string, photo: ProofPhotoItem) => void;
  updatingTaskId: string;
  uploadingTaskId: string;
  removingPhotoPath: string;
}) {
  if (tasks.length === 0) {
    return (
      <p className="text-sm font-bold leading-6 text-[var(--missio-text-muted)]">
        {emptyText}
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      {tasks.map((task) => (
        <TaskCard
          key={task.taskId}
          task={task}
          currentUserUid={currentUserUid}
          onStart={onStart}
          onComplete={onComplete}
          onApprove={onApprove}
          onReject={onReject}
          onPhotoSelected={onPhotoSelected}
          onPreviewPhoto={onPreviewPhoto}
          onRemovePhoto={onRemovePhoto}
          isUpdating={updatingTaskId === task.taskId}
          isUploading={uploadingTaskId === task.taskId}
          removingPhotoPath={removingPhotoPath}
        />
      ))}
    </div>
  );
}

function StaffStatusCard({
  member,
  tasks,
}: {
  member: BusinessMemberListItem;
  tasks: BusinessTaskListItem[];
}) {
  const openCount = tasks.filter(isOpenTask).length;
  const approvalCount = tasks.filter(isPendingApproval).length;
  const delayedCount = tasks.filter(isDelayedTask).length;

  return (
    <article className="rounded-[1.5rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-500/10 text-[var(--missio-primary)]">
          <UserRoundCheck size={21} />
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-black text-[var(--missio-text-main)]">
            {member.displayName || member.username || member.email}
          </h4>
          <p className="mt-1 truncate text-xs font-bold text-[var(--missio-text-muted)]">
            @{member.username || "kullanıcı"} · {member.email}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-[var(--missio-page-bg)] p-3">
          <span className="block text-[0.62rem] font-black text-[var(--missio-text-muted)]">
            Açık
          </span>
          <strong className="mt-1 block text-sm font-black text-[var(--missio-text-main)]">
            {openCount}
          </strong>
        </div>

        <div className="rounded-2xl bg-[var(--missio-page-bg)] p-3">
          <span className="block text-[0.62rem] font-black text-[var(--missio-text-muted)]">
            Onay
          </span>
          <strong className="mt-1 block text-sm font-black text-[var(--missio-text-main)]">
            {approvalCount}
          </strong>
        </div>

        <div className="rounded-2xl bg-[var(--missio-page-bg)] p-3">
          <span className="block text-[0.62rem] font-black text-[var(--missio-text-muted)]">
            Geciken
          </span>
          <strong className="mt-1 block text-sm font-black text-red-500">
            {delayedCount}
          </strong>
        </div>
      </div>
    </article>
  );
}

export function ManagerHomePanel({
  businessId,
  businessName,
  currentUser,
}: ManagerHomePanelProps) {
  const [activeSheet, setActiveSheet] = useState<ManagerSheet>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<ProofPhotoItem | null>(null);
  const [tasks, setTasks] = useState<BusinessTaskListItem[]>([]);
  const [members, setMembers] = useState<BusinessMemberListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [updatingTaskId, setUpdatingTaskId] = useState("");
  const [uploadingTaskId, setUploadingTaskId] = useState("");
  const [removingPhotoPath, setRemovingPhotoPath] = useState("");

  const teamStaff = useMemo(
    () =>
      members.filter(
        (member) =>
          member.role === "staff" &&
          member.managerUid === currentUser.uid &&
          member.status !== "passive" &&
          member.isActive !== false,
      ),
    [members, currentUser.uid],
  );

  const teamStaffUidSet = useMemo(
    () => new Set(teamStaff.map((member) => member.uid)),
    [teamStaff],
  );

  const myTasks = useMemo(
    () => tasks.filter((task) => task.assignedToUid === currentUser.uid),
    [tasks, currentUser.uid],
  );

  const teamTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.assignedByUid === currentUser.uid ||
          teamStaffUidSet.has(task.assignedToUid),
      ),
    [tasks, currentUser.uid, teamStaffUidSet],
  );

  const visibleTasks = useMemo(() => {
    const merged = new Map<string, BusinessTaskListItem>();

    [...myTasks, ...teamTasks].forEach((task) => {
      merged.set(task.taskId, task);
    });

    return Array.from(merged.values());
  }, [myTasks, teamTasks]);

  const totalTaskCount = visibleTasks.length;
  const openTaskCount = visibleTasks.filter(isOpenTask).length;
  const pendingApprovalTasks = visibleTasks.filter(
    (task) => isPendingApproval(task) && task.assignedToUid !== currentUser.uid,
  );
  const delayedTasks = visibleTasks.filter(isDelayedTask);
  const pendingApprovalCount = pendingApprovalTasks.length;
  const delayedTaskCount = delayedTasks.length;

  const priorityTasks = useMemo(
    () =>
      visibleTasks
        .filter(
          (task) =>
            isDelayedTask(task) ||
            task.priority === "Kritik" ||
            task.priority === "Acil",
        )
        .slice(0, 8),
    [visibleTasks],
  );

  async function loadData() {
    try {
      setIsLoading(true);
      setMessage("");

      const [taskList, memberList] = await Promise.all([
        listBusinessTasks(businessId),
        listBusinessMembers(businessId),
      ]);

      setTasks(taskList);
      setMembers(memberList);
    } catch (error) {
      console.error(error);
      setTasks([]);
      setMembers([]);
      setMessage("Yönetici paneli verileri okunamadı.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [businessId, currentUser.uid]);

  async function handleActionCompleted(actionMessage: string) {
    setMessage(actionMessage);
    setActiveSheet(null);
    await loadData();
  }

  async function handleTaskStatusChange(
    taskId: string,
    status: "in_progress" | "completed" | "approved" | "rejected",
  ) {
    try {
      setUpdatingTaskId(taskId);
      setMessage("");

      await updateBusinessTaskStatusForBusiness({
        businessId,
        taskId,
        status,
      });

      if (status === "completed") {
        setMessage("Görev tamamlandı. Yönetici/patron onayına gönderildi.");
        setActiveSheet(null);
      } else if (status === "approved") {
        setMessage("Görev onaylandı.");
      } else if (status === "rejected") {
        setMessage("Görev reddedildi.");
      } else {
        setMessage("Görev başlatıldı.");
      }

      await loadData();
    } catch (error) {
      console.error(error);

      const errorMessage =
        error instanceof Error && error.message ? error.message : "Bilinmeyen hata.";

      setMessage(`Görev durumu güncellenemedi: ${errorMessage}`);
    } finally {
      setUpdatingTaskId("");
    }
  }

  async function handlePhotoSelected(
    taskId: string,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessage("Sadece fotoğraf dosyası eklenebilir.");
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setMessage("Fotoğraf 25 MB üzerinde olamaz.");
      return;
    }

    try {
      setUploadingTaskId(taskId);
      setMessage("Fotoğraf hazırlanıyor ve optimize ediliyor...");

      await attachBusinessTaskProofPhotoForBusiness({
        businessId,
        taskId,
        file,
      });

      setMessage("Fotoğraf kanıtı eklendi.");
      await loadData();
    } catch (error) {
      console.error(error);

      const errorMessage =
        error instanceof Error && error.message ? error.message : "Bilinmeyen hata.";

      setMessage(`Fotoğraf yüklenemedi: ${errorMessage}`);
    } finally {
      setUploadingTaskId("");
    }
  }

  async function handleRemovePhoto(taskId: string, photo: ProofPhotoItem) {
    const confirmed = window.confirm("Bu fotoğraf kanıtı silinsin mi?");

    if (!confirmed) {
      return;
    }

    try {
      setRemovingPhotoPath(photo.path);
      setMessage("");

      await removeBusinessTaskProofPhotoForBusiness({
        businessId,
        taskId,
        proofPhotoPath: photo.path,
      });

      setMessage("Fotoğraf kanıtı silindi.");
      await loadData();
    } catch (error) {
      console.error(error);

      const errorMessage =
        error instanceof Error && error.message ? error.message : "Bilinmeyen hata.";

      setMessage(`Fotoğraf silinemedi: ${errorMessage}`);
    } finally {
      setRemovingPhotoPath("");
    }
  }

  function handleTaskStart(taskId: string) {
    void handleTaskStatusChange(taskId, "in_progress");
  }

  function handleTaskComplete(taskId: string) {
    void handleTaskStatusChange(taskId, "completed");
  }

  function handleTaskApprove(taskId: string) {
    void handleTaskStatusChange(taskId, "approved");
  }

  function handleTaskReject(taskId: string) {
    void handleTaskStatusChange(taskId, "rejected");
  }

  const taskListProps = {
    currentUserUid: currentUser.uid,
    onStart: handleTaskStart,
    onComplete: handleTaskComplete,
    onApprove: handleTaskApprove,
    onReject: handleTaskReject,
    onPhotoSelected: handlePhotoSelected,
    onPreviewPhoto: setSelectedPhoto,
    onRemovePhoto: handleRemovePhoto,
    updatingTaskId,
    uploadingTaskId,
    removingPhotoPath,
  };

  return (
    <div className="grid gap-4">
      <section className="overflow-hidden rounded-[2rem] bg-slate-950 p-4 text-white shadow-2xl shadow-slate-900/20 dark:bg-slate-950">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
              Yönetici Alanı
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-tight">
              Operasyon Özeti
            </h2>

            <p className="mt-2 text-xs font-bold leading-5 text-slate-300">
              {businessName} · kendi ekibin ve görevlerin
            </p>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-cyan-200 ring-1 ring-white/10 active:scale-95 disabled:opacity-60"
            aria-label="Yenile"
          >
            <RefreshCw size={19} />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          <SummaryMiniCard label="Ekip" value={teamStaff.length} note="Personel" />
          <SummaryMiniCard label="Açık" value={openTaskCount} note="Görev" />
          <SummaryMiniCard label="Onay" value={pendingApprovalCount} note="Bekleyen" />
          <SummaryMiniCard label="Risk" value={delayedTaskCount} note="Geciken" danger={delayedTaskCount > 0} />
        </div>
      </section>

      {message ? (
        <div className="rounded-[1.4rem] border border-cyan-400/30 bg-cyan-400/10 p-4 text-sm font-black text-[var(--missio-primary)]">
          {message}
        </div>
      ) : null}

      <section className="grid gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-[var(--missio-primary)]">
            Hızlı İşlemler
          </p>
          <h3 className="mt-1 text-xl font-black text-[var(--missio-text-main)]">
            Ne yapmak istiyorsun?
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <QuickActionCard icon={<PlusSquare size={22} />} title="Görev Ata" note="Ekibine görev oluştur" onClick={() => setActiveSheet("assignTask")} />
          <QuickActionCard icon={<MapPin size={22} />} title="Konum İste" note="Yoklama başlat" onClick={() => setActiveSheet("location")} />
          <QuickActionCard icon={<FileCheck2 size={22} />} title="Onaylar" note="Kontrol bekleyenler" onClick={() => setActiveSheet("approvals")} />
          <QuickActionCard icon={<UsersRound size={22} />} title="Personel" note="Ekip durumunu gör" onClick={() => setActiveSheet("staff")} />
        </div>
      </section>

      <section className="grid gap-3 pb-24">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-[var(--missio-primary)]">
            Detaylar
          </p>
          <h3 className="mt-1 text-xl font-black text-[var(--missio-text-main)]">
            Tıklayarak İncele
          </h3>
        </div>

        <DetailEntryCard icon={<ClipboardCheck size={22} />} title="Benim Görevlerim" note="Sana atanmış görevler" value={myTasks.length} onClick={() => setActiveSheet("myTasks")} />
        <DetailEntryCard icon={<ListChecks size={22} />} title="Ekip Görevleri" note="Bağlı personellerin görevleri" value={teamTasks.length} onClick={() => setActiveSheet("teamTasks")} />
        <DetailEntryCard icon={<AlertTriangle size={22} />} title="Acil / Geciken" note="Öncelik gerektiren işler" value={priorityTasks.length} onClick={() => setActiveSheet("priorityTasks")} />
        <DetailEntryCard icon={<BarChart3 size={22} />} title="Kısa Rapor" note="Operasyon toplamları" value={totalTaskCount} onClick={() => setActiveSheet("reports")} />
      </section>

      <ActionSheet title="Görev Ata" isOpen={activeSheet === "assignTask"} onClose={() => setActiveSheet(null)}>
        <TaskAssignSheet
          businessId={businessId}
          assignmentMode="managerTeam"
          managerUid={currentUser.uid}
          onCreated={handleActionCompleted}
        />
      </ActionSheet>

      <ActionSheet title="Konum İste" isOpen={activeSheet === "location"} onClose={() => setActiveSheet(null)}>
        <LocationCheckSheet onRequested={handleActionCompleted} />
      </ActionSheet>

      <ActionSheet title="Onaylar" isOpen={activeSheet === "approvals"} onClose={() => setActiveSheet(null)}>
        <div className="grid gap-3">
          {pendingApprovalTasks.length === 0 ? (
            <p className="text-sm font-bold leading-6 text-[var(--missio-text-muted)]">
              Onay bekleyen görev bulunmuyor.
            </p>
          ) : null}

          <TaskList tasks={pendingApprovalTasks} emptyText="Onay bekleyen görev bulunmuyor." {...taskListProps} />
        </div>
      </ActionSheet>

      <ActionSheet title="Personel" isOpen={activeSheet === "staff"} onClose={() => setActiveSheet(null)}>
        <div className="grid gap-3">
          {teamStaff.length === 0 ? (
            <p className="text-sm font-bold leading-6 text-[var(--missio-text-muted)]">
              Sana bağlı aktif personel bulunmuyor.
            </p>
          ) : null}

          {teamStaff.map((member) => (
            <StaffStatusCard
              key={member.uid}
              member={member}
              tasks={tasks.filter((task) => task.assignedToUid === member.uid)}
            />
          ))}
        </div>
      </ActionSheet>

      <ActionSheet title="Benim Görevlerim" isOpen={activeSheet === "myTasks"} onClose={() => setActiveSheet(null)}>
        <TaskList tasks={myTasks} emptyText="Sana atanmış görev bulunmuyor." {...taskListProps} />
      </ActionSheet>

      <ActionSheet title="Ekip Görevleri" isOpen={activeSheet === "teamTasks"} onClose={() => setActiveSheet(null)}>
        <TaskList tasks={teamTasks} emptyText="Ekibine ait görev bulunmuyor." {...taskListProps} />
      </ActionSheet>

      <ActionSheet title="Acil / Geciken İşler" isOpen={activeSheet === "priorityTasks"} onClose={() => setActiveSheet(null)}>
        <TaskList tasks={priorityTasks} emptyText="Acil veya geciken iş yok." {...taskListProps} />
      </ActionSheet>

      <ActionSheet title="Kısa Rapor" isOpen={activeSheet === "reports"} onClose={() => setActiveSheet(null)}>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[1.2rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-4">
            <span className="block text-xs font-black text-[var(--missio-text-muted)]">Toplam Görev</span>
            <strong className="mt-2 block text-2xl font-black text-[var(--missio-text-main)]">{totalTaskCount}</strong>
          </div>

          <div className="rounded-[1.2rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-4">
            <span className="block text-xs font-black text-[var(--missio-text-muted)]">Açık Görev</span>
            <strong className="mt-2 block text-2xl font-black text-[var(--missio-text-main)]">{openTaskCount}</strong>
          </div>

          <div className="rounded-[1.2rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-4">
            <span className="block text-xs font-black text-[var(--missio-text-muted)]">Onay Bekleyen</span>
            <strong className="mt-2 block text-2xl font-black text-[var(--missio-text-main)]">{pendingApprovalCount}</strong>
          </div>

          <div className="rounded-[1.2rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-4">
            <span className="block text-xs font-black text-[var(--missio-text-muted)]">Geciken</span>
            <strong className="mt-2 block text-2xl font-black text-red-500">{delayedTaskCount}</strong>
          </div>
        </div>
      </ActionSheet>

      <ActionSheet title="Fotoğraf Önizleme" isOpen={Boolean(selectedPhoto)} onClose={() => setSelectedPhoto(null)}>
        {selectedPhoto ? (
          <div className="grid gap-3">
            <div className="overflow-hidden rounded-[1.5rem] border border-[var(--missio-border)] bg-[var(--missio-page-bg)]">
              <img src={selectedPhoto.url} alt="Fotoğraf önizleme" className="max-h-[70vh] w-full object-contain" />
            </div>

            <div className="rounded-2xl bg-[var(--missio-page-bg)] p-3 text-xs font-bold leading-5 text-[var(--missio-text-muted)]">
              {selectedPhoto.name || "Fotoğraf kanıtı"}
              {selectedPhoto.uploadedAtText ? ` · ${selectedPhoto.uploadedAtText}` : ""}
            </div>
          </div>
        ) : null}
      </ActionSheet>
    </div>
  );
}