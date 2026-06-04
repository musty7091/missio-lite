import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BarChart3,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  FileCheck2,
  ListChecks,
  MapPin,
  PlusSquare,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  UsersRound,
  XCircle,
} from "lucide-react";
import { ActionSheet } from "../common/ActionSheet";
import { TaskAssignSheet } from "./TaskAssignSheet";
import { LocationCheckSheet } from "./LocationCheckSheet";
import { UserAddSheet } from "./UserAddSheet";
import { StaffListSheet } from "./StaffListSheet";
import {
  getTaskStatusLabel,
  hasTaskProofPhoto,
  listBusinessTasks,
  updateBusinessTaskStatusForBusiness,
  type BusinessTaskListItem,
  type ProofPhotoItem,
} from "../../lib/businessTaskData";

type BossHomePanelProps = {
  businessName: string;
  businessId: string;
  onGoToReports: () => void;
  onGoToApprovals: () => void;
  onGoToProfile: () => void;
};

type ActiveSheet = "task" | "location" | "user" | "staff" | "approvals" | null;

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
  onPreviewPhoto,
}: {
  task: BusinessTaskListItem;
  onPreviewPhoto: (photo: ProofPhotoItem) => void;
}) {
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
          </div>
        ))}
      </div>
    </div>
  );
}

function TaskCard({
  task,
  onPreviewPhoto,
  onApprove,
  onReject,
  isUpdating,
  approvalMode = false,
}: {
  task: BusinessTaskListItem;
  onPreviewPhoto: (photo: ProofPhotoItem) => void;
  onApprove: (taskId: string) => void;
  onReject: (taskId: string, note: string) => void;
  isUpdating: boolean;
  approvalMode?: boolean;
}) {
  const hasProof = hasTaskProofPhoto(task);
  const photoCount = task.proofPhotos.length;
  const [rejectBoxOpen, setRejectBoxOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

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
                Atanan: {task.assignedToName || "Bilinmiyor"} · Veren:{" "}
                {task.assignedByName || "Bilinmiyor"}
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

          {task.requiresPhoto && hasProof ? (
            <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-xs font-black leading-5 text-emerald-600">
              Fotoğraf kanıtı eklendi.
            </div>
          ) : null}

          {task.requiresPhoto && !hasProof ? (
            <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-400/10 p-3 text-xs font-black leading-5 text-red-500">
              Bu görev fotoğraf kanıtı istiyor fakat fotoğraf bulunamadı.
            </div>
          ) : null}

          <ProofPhotoGallery task={task} onPreviewPhoto={onPreviewPhoto} />

          {approvalMode && task.status === "completed" && task.requiresApproval ? (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onApprove(task.taskId)}
                disabled={isUpdating}
                className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-white active:scale-[0.99] disabled:opacity-60"
              >
                <CheckCircle2 size={18} />
                {isUpdating ? "İşleniyor..." : "Onayla"}
              </button>

              <button
                type="button"
                onClick={() => setRejectBoxOpen(true)}
                disabled={isUpdating}
                className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-red-500 px-4 py-3 text-sm font-black text-white active:scale-[0.99] disabled:opacity-60"
              >
                <XCircle size={18} />
                {isUpdating ? "İşleniyor..." : "Reddet"}
              </button>
            </div>
          ) : null}

          {approvalMode && rejectBoxOpen ? (
            <div className="mt-3 grid gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 p-3">
              <label className="text-xs font-black text-red-500">
                Reddetme nedeni
              </label>

              <textarea
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                rows={3}
                placeholder="Eksik veya hatalı olan durumu yaz..."
                className="w-full resize-none rounded-2xl border border-red-400/30 bg-[var(--missio-page-bg)] p-3 text-sm font-bold leading-6 text-[var(--missio-text-main)] outline-none"
              />

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRejectBoxOpen(false);
                    setRejectReason("");
                  }}
                  className="rounded-2xl border border-[var(--missio-border)] bg-[var(--missio-card-bg)] px-4 py-3 text-sm font-black text-[var(--missio-text-main)]"
                >
                  Vazgeç
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!rejectReason.trim()) {
                      return;
                    }

                    onReject(task.taskId, rejectReason.trim());
                  }}
                  disabled={isUpdating || !rejectReason.trim()}
                  className="rounded-2xl bg-red-500 px-4 py-3 text-sm font-black text-white disabled:opacity-60"
                >
                  {isUpdating ? "İşleniyor..." : "Reddetmeyi Onayla"}
                </button>
              </div>
            </div>
          ) : null}

          {task.status === "completed" ? (
            <div className="mt-3 flex items-start gap-2 rounded-2xl bg-amber-500/10 p-3 text-xs font-bold leading-5 text-amber-600">
              <ShieldCheck className="mt-0.5 shrink-0" size={16} />
              Görev tamamlandı. Onay bekliyor.
            </div>
          ) : null}

          {task.status === "approved" ? (
            <div className="mt-3 rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm font-black text-emerald-600">
              Görev onaylandı.
            </div>
          ) : null}

          {task.status === "rejected" ? (
            <div className="mt-3 rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-black text-red-500">
              Görev reddedildi.
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function BossHomePanel({
  businessName,
  businessId,
  onGoToReports,
  onGoToApprovals,
  onGoToProfile,
}: BossHomePanelProps) {
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<ProofPhotoItem | null>(null);
  const [lastMessage, setLastMessage] = useState("");
  const [tasks, setTasks] = useState<BusinessTaskListItem[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [taskMessage, setTaskMessage] = useState("");
  const [updatingTaskId, setUpdatingTaskId] = useState("");

  void onGoToApprovals;
  void onGoToProfile;

  const openTaskCount = useMemo(
    () => tasks.filter(isOpenTask).length,
    [tasks],
  );

  const pendingApprovalTasks = useMemo(
    () => tasks.filter(isPendingApproval),
    [tasks],
  );

  const pendingApprovalCount = pendingApprovalTasks.length;

  const delayedTaskCount = useMemo(
    () => tasks.filter(isDelayedTask).length,
    [tasks],
  );

  const recentTasks = useMemo(
    () => tasks.slice(0, 5),
    [tasks],
  );

  async function loadTasks() {
    try {
      setIsLoadingTasks(true);
      setTaskMessage("");

      const taskList = await listBusinessTasks(businessId);
      setTasks(taskList);
    } catch (error) {
      console.error(error);
      setTasks([]);
      setTaskMessage("Görev listesi veritabanından okunamadı.");
    } finally {
      setIsLoadingTasks(false);
    }
  }

  useEffect(() => {
    void loadTasks();
  }, [businessId]);

  function closeSheet() {
    setActiveSheet(null);
  }

  async function showMessage(message: string) {
    setLastMessage(message);
    closeSheet();
    await loadTasks();
  }

  async function handleApprovalStatus(
    taskId: string,
    status: "approved" | "rejected",
    note = "",
  ) {
    if (status === "rejected" && !note.trim()) {
      setLastMessage("Reddetme nedeni zorunludur.");
      return;
    }

    try {
      setUpdatingTaskId(taskId);
      setTaskMessage("");

      await updateBusinessTaskStatusForBusiness({
        businessId,
        taskId,
        status,
        note: note.trim(),
      });

      setLastMessage(status === "approved" ? "Görev onaylandı." : "Görev reddedildi.");
      setActiveSheet(null);
      setSelectedPhoto(null);

      await loadTasks();
    } catch (error) {
      console.error(error);

      const errorMessage =
        error instanceof Error && error.message ? error.message : "Bilinmeyen hata.";

      setTaskMessage(`Onay işlemi başarısız: ${errorMessage}`);
    } finally {
      setUpdatingTaskId("");
    }
  }

  function handleApprove(taskId: string) {
    void handleApprovalStatus(taskId, "approved");
  }

  function handleReject(taskId: string, note: string) {
    void handleApprovalStatus(taskId, "rejected", note);
  }


  return (
    <div className="grid gap-4">
      <section className="overflow-hidden rounded-[2rem] bg-slate-950 p-4 text-white shadow-2xl shadow-slate-900/20 dark:bg-slate-950">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
              Patron Alanı
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-tight">
              İşletme Özeti
            </h2>

            <p className="mt-2 text-xs font-bold leading-5 text-slate-300">
              {businessName} · tüm görev, onay ve ekip akışı
            </p>
          </div>

          <button
            type="button"
            onClick={loadTasks}
            disabled={isLoadingTasks}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-cyan-200 ring-1 ring-white/10 active:scale-95 disabled:opacity-60"
            aria-label="Yenile"
          >
            <RefreshCw size={19} />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          <SummaryMiniCard label="Toplam" value={tasks.length} note="Görev" />
          <SummaryMiniCard label="Açık" value={openTaskCount} note="Görev" />
          <SummaryMiniCard label="Onay" value={pendingApprovalCount} note="Bekleyen" danger={pendingApprovalCount > 0} />
          <SummaryMiniCard label="Risk" value={delayedTaskCount} note="Geciken" danger={delayedTaskCount > 0} />
        </div>
      </section>

      {lastMessage ? (
        <div className="rounded-[1.5rem] border border-cyan-400/30 bg-cyan-400/10 p-4 text-sm font-black text-[var(--missio-primary)]">
          {lastMessage}
        </div>
      ) : null}

      {taskMessage ? (
        <div className="rounded-[1.5rem] border border-red-400/30 bg-red-400/10 p-4 text-sm font-black text-red-500">
          {taskMessage}
        </div>
      ) : null}

      <section className="grid gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-[var(--missio-primary)]">
            Hızlı İşlemler
          </p>
          <h3 className="mt-1 text-xl font-black text-[var(--missio-text-main)]">
            Patron Paneli
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <QuickActionCard
            icon={<PlusSquare size={22} />}
            title="Görev Ata"
            note="Ekibe görev oluştur"
            onClick={() => setActiveSheet("task")}
          />

          <QuickActionCard
            icon={<MapPin size={22} />}
            title="Konum İste"
            note="Yoklama başlat"
            onClick={() => setActiveSheet("location")}
          />

          <QuickActionCard
            icon={<UserPlus size={22} />}
            title="Kullanıcı Ekle"
            note="Personel hesabı hazırla"
            onClick={() => setActiveSheet("user")}
          />

          <QuickActionCard
            icon={<FileCheck2 size={22} />}
            title="Onaylar"
            note="Tamamlanan işleri kontrol et"
            onClick={() => setActiveSheet("approvals")}
          />

          <QuickActionCard
            icon={<BarChart3 size={22} />}
            title="Raporlar"
            note="Son 14 günü incele"
            onClick={onGoToReports}
          />

          <QuickActionCard
            icon={<UsersRound size={22} />}
            title="Personel"
            note="Ekip durumunu gör"
            onClick={() => setActiveSheet("staff")}
          />
        </div>
      </section>

      <section className="rounded-[2rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-5 shadow-xl shadow-slate-900/5 dark:shadow-black/25">
        <div className="mb-4 flex items-center gap-3">
          <ClipboardCheck className="text-[var(--missio-primary)]" size={24} />
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-[var(--missio-primary)]">
              Görev Akışı
            </p>
            <h3 className="mt-1 text-xl font-black text-[var(--missio-text-main)]">
              Son Görevler
            </h3>
          </div>
        </div>

        {isLoadingTasks ? (
          <p className="text-sm font-black text-[var(--missio-text-muted)]">
            Görevler okunuyor...
          </p>
        ) : null}

        {!isLoadingTasks && recentTasks.length === 0 ? (
          <p className="text-sm font-bold leading-6 text-[var(--missio-text-muted)]">
            Henüz görev yok.
          </p>
        ) : null}

        {!isLoadingTasks && recentTasks.length > 0 ? (
          <div className="grid gap-3">
            {recentTasks.map((task) => (
              <TaskCard
                key={task.taskId}
                task={task}
                onPreviewPhoto={setSelectedPhoto}
                onApprove={handleApprove}
                onReject={handleReject}
                isUpdating={updatingTaskId === task.taskId}
              />
            ))}
          </div>
        ) : null}
      </section>

      <ActionSheet title="Görev Ata" isOpen={activeSheet === "task"} onClose={closeSheet}>
        <TaskAssignSheet businessId={businessId} onCreated={showMessage} />
      </ActionSheet>

      <ActionSheet title="Konum İste" isOpen={activeSheet === "location"} onClose={closeSheet}>
        <LocationCheckSheet onRequested={showMessage} />
      </ActionSheet>

      <ActionSheet title="Kullanıcı Ekle" isOpen={activeSheet === "user"} onClose={closeSheet}>
        <UserAddSheet businessId={businessId} onCreated={showMessage} />
      </ActionSheet>

      <ActionSheet title="Personel" isOpen={activeSheet === "staff"} onClose={closeSheet}>
        <StaffListSheet businessId={businessId} />
      </ActionSheet>

      <ActionSheet title="Onay Bekleyen Görevler" isOpen={activeSheet === "approvals"} onClose={closeSheet}>
        <div className="grid gap-3">
          {pendingApprovalTasks.length === 0 ? (
            <p className="text-sm font-bold leading-6 text-[var(--missio-text-muted)]">
              Onay bekleyen görev bulunmuyor.
            </p>
          ) : null}

          {pendingApprovalTasks.map((task) => (
            <TaskCard
              key={task.taskId}
              task={task}
              onPreviewPhoto={setSelectedPhoto}
              onApprove={handleApprove}
              onReject={handleReject}
              isUpdating={updatingTaskId === task.taskId}
              approvalMode
            />
          ))}
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