import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "firebase/auth";
import {
  AlertTriangle,
  Bell,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  ListChecks,
  RefreshCw,
} from "lucide-react";
import { ActionSheet } from "../common/ActionSheet";
import {
  getTaskStatusLabel,
  listBusinessTasks,
  updateBusinessTaskStatusForBusiness,
  type BusinessTaskListItem,
} from "../../lib/businessTaskData";

type StaffHomePanelProps = {
  businessId: string;
  businessName: string;
  currentUser: User;
};

type StaffSheet =
  | "allTasks"
  | "routineTasks"
  | "extraTasks"
  | "pendingApproval"
  | "priorityTasks"
  | "photoTasks"
  | "completedTasks"
  | "notifications"
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

function isCompletedTask(task: BusinessTaskListItem) {
  return task.status === "completed" || task.status === "approved";
}

function isDelayedTask(task: BusinessTaskListItem) {
  if (!task.dueDate || !isOpenTask(task)) {
    return false;
  }

  return task.dueDate < todayIsoDate();
}

function getPriorityClass(priority: string) {
  if (priority === "Kritik") {
    return "bg-red-500/10 text-red-500";
  }

  if (priority === "Acil") {
    return "bg-orange-500/10 text-orange-500";
  }

  if (priority === "Önemli") {
    return "bg-amber-500/10 text-amber-500";
  }

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

function TaskCard({
  task,
  onStart,
  onComplete,
  isUpdating,
}: {
  task: BusinessTaskListItem;
  onStart: (taskId: string) => void;
  onComplete: (taskId: string) => void;
  isUpdating: boolean;
}) {
  return (
    <article className="rounded-[1.5rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-500/10 text-[var(--missio-primary)]">
          <ListChecks size={21} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="text-sm font-black text-[var(--missio-text-main)]">
                {task.title}
              </h4>

              <p className="mt-1 text-xs font-bold leading-5 text-[var(--missio-text-muted)]">
                Veren: {task.assignedByName || "Bilinmiyor"}
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
            <p className="mt-3 text-xs font-bold leading-5 text-[var(--missio-text-muted)]">
              {task.description}
            </p>
          ) : null}

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-[var(--missio-page-bg)] p-3">
              <span className="block text-[0.65rem] font-black text-[var(--missio-text-muted)]">
                Durum
              </span>
              <strong className="mt-1 block text-xs font-black text-[var(--missio-text-main)]">
                {getTaskStatusLabel(task.status)}
              </strong>
            </div>

            <div className="rounded-2xl bg-[var(--missio-page-bg)] p-3">
              <span className="block text-[0.65rem] font-black text-[var(--missio-text-muted)]">
                Tip
              </span>
              <strong className="mt-1 block text-xs font-black text-[var(--missio-text-main)]">
                {task.taskType}
              </strong>
            </div>
          </div>

          {task.dueDate ? (
            <p
              className={[
                "mt-3 text-xs font-black",
                isDelayedTask(task) ? "text-red-500" : "text-[var(--missio-primary)]",
              ].join(" ")}
            >
              Son tarih: {task.dueDate}
              {isDelayedTask(task) ? " · Gecikmiş" : ""}
            </p>
          ) : null}

          {task.requiresPhoto || task.requiresApproval ? (
            <div className="mt-3 rounded-2xl bg-[var(--missio-page-bg)] p-3 text-xs font-bold leading-5 text-[var(--missio-text-muted)]">
              {task.requiresPhoto ? "Fotoğraf kanıtı gerekli. " : ""}
              {task.requiresApproval ? "Tamamlandıktan sonra onay bekler." : ""}
            </div>
          ) : null}

          <div className="mt-4 grid gap-2">
            {task.status === "assigned" ? (
              <button
                type="button"
                onClick={() => onStart(task.taskId)}
                disabled={isUpdating}
                className="rounded-2xl bg-[var(--missio-primary)] px-4 py-3 text-sm font-black text-white active:scale-[0.99] disabled:opacity-60"
              >
                {isUpdating ? "İşleniyor..." : "Göreve Başladım"}
              </button>
            ) : null}

            {task.status === "in_progress" ? (
              <button
                type="button"
                onClick={() => onComplete(task.taskId)}
                disabled={isUpdating}
                className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-white active:scale-[0.99] disabled:opacity-60"
              >
                {isUpdating ? "İşleniyor..." : "Tamamladım"}
              </button>
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
        </div>
      </div>
    </article>
  );
}

function TaskList({
  tasks,
  emptyText,
  onStart,
  onComplete,
  updatingTaskId,
}: {
  tasks: BusinessTaskListItem[];
  emptyText: string;
  onStart: (taskId: string) => void;
  onComplete: (taskId: string) => void;
  updatingTaskId: string;
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
          onStart={onStart}
          onComplete={onComplete}
          isUpdating={updatingTaskId === task.taskId}
        />
      ))}
    </div>
  );
}

export function StaffHomePanel({
  businessId,
  businessName,
  currentUser,
}: StaffHomePanelProps) {
  const [activeSheet, setActiveSheet] = useState<StaffSheet>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState("");
  const [tasks, setTasks] = useState<BusinessTaskListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  const myTasks = useMemo(
    () => tasks.filter((task) => task.assignedToUid === currentUser.uid),
    [tasks, currentUser.uid],
  );

  const openTasks = useMemo(
    () => myTasks.filter(isOpenTask),
    [myTasks],
  );

  const routineTasks = useMemo(
    () => myTasks.filter((task) => task.taskType === "Rutin"),
    [myTasks],
  );

  const extraTasks = useMemo(
    () => myTasks.filter((task) => task.taskType === "Ekstra"),
    [myTasks],
  );

  const pendingApprovalTasks = useMemo(
    () => myTasks.filter(isPendingApproval),
    [myTasks],
  );

  const completedTasks = useMemo(
    () => myTasks.filter(isCompletedTask),
    [myTasks],
  );

  const photoTasks = useMemo(
    () => myTasks.filter((task) => task.requiresPhoto && isOpenTask(task)),
    [myTasks],
  );

  const priorityTasks = useMemo(
    () =>
      myTasks.filter(
        (task) =>
          isDelayedTask(task) ||
          task.priority === "Kritik" ||
          task.priority === "Acil",
      ),
    [myTasks],
  );

  async function loadTasks() {
    try {
      setIsLoading(true);
      setMessage("");

      const taskList = await listBusinessTasks(businessId);
      setTasks(taskList);
    } catch (error) {
      console.error(error);
      setTasks([]);
      setMessage("Görevlerin veritabanından okunamadı.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleTaskStatusChange(
    taskId: string,
    status: "in_progress" | "completed",
  ) {
    try {
      setUpdatingTaskId(taskId);
      setMessage("");

      await updateBusinessTaskStatusForBusiness({
        businessId,
        taskId,
        status,
      });

      setMessage(
        status === "in_progress"
          ? "Görev başlatıldı."
          : "Görev tamamlandı.",
      );

      await loadTasks();
    } catch (error) {
      console.error(error);
      setMessage("Görev durumu güncellenemedi.");
    } finally {
      setUpdatingTaskId("");
    }
  }

  function handleTaskStart(taskId: string) {
    void handleTaskStatusChange(taskId, "in_progress");
  }

  function handleTaskComplete(taskId: string) {
    void handleTaskStatusChange(taskId, "completed");
  }

  useEffect(() => {
    void loadTasks();
  }, [businessId, currentUser.uid]);

  return (
    <div className="grid gap-4">
      <section className="overflow-hidden rounded-[2rem] bg-slate-950 p-4 text-white shadow-2xl shadow-slate-900/20 dark:bg-slate-950">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
              Personel Alanı
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-tight">
              Görev Özeti
            </h2>

            <p className="mt-2 text-xs font-bold leading-5 text-slate-300">
              {businessName} · sadece sana atanmış görevler
            </p>
          </div>

          <button
            type="button"
            onClick={loadTasks}
            disabled={isLoading}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-cyan-200 ring-1 ring-white/10 active:scale-95 disabled:opacity-60"
            aria-label="Yenile"
          >
            <RefreshCw size={19} />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          <SummaryMiniCard
            label="Açık"
            value={openTasks.length}
            note="Görev"
          />
          <SummaryMiniCard
            label="Rutin"
            value={routineTasks.length}
            note="İş"
          />
          <SummaryMiniCard
            label="Ekstra"
            value={extraTasks.length}
            note="İş"
          />
          <SummaryMiniCard
            label="Risk"
            value={priorityTasks.length}
            note="Acil"
            danger={priorityTasks.length > 0}
          />
        </div>
      </section>

      {message ? (
        <div className="rounded-[1.4rem] border border-red-400/30 bg-red-400/10 p-4 text-sm font-black text-red-500">
          {message}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-[1.4rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-4 text-sm font-black text-[var(--missio-text-muted)]">
          Görevlerin okunuyor...
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
          <QuickActionCard
            icon={<ClipboardCheck size={22} />}
            title="Görevlerim"
            note="Tüm işlerimi gör"
            onClick={() => setActiveSheet("allTasks")}
          />

          <QuickActionCard
            icon={<ListChecks size={22} />}
            title="Rutin"
            note="Tekrarlı görevler"
            onClick={() => setActiveSheet("routineTasks")}
          />

          <QuickActionCard
            icon={<FileCheck2 size={22} />}
            title="Ekstra"
            note="Ek işler"
            onClick={() => setActiveSheet("extraTasks")}
          />

          <QuickActionCard
            icon={<Bell size={22} />}
            title="Bildirimler"
            note="Uyarılar ve notlar"
            onClick={() => setActiveSheet("notifications")}
          />
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

        <DetailEntryCard
          icon={<AlertTriangle size={22} />}
          title="Acil / Geciken"
          note="Öncelik isteyen işler"
          value={priorityTasks.length}
          onClick={() => setActiveSheet("priorityTasks")}
        />

        <DetailEntryCard
          icon={<Camera size={22} />}
          title="Fotoğraf İstenen"
          note="Kanıt gerektiren işler"
          value={photoTasks.length}
          onClick={() => setActiveSheet("photoTasks")}
        />

        <DetailEntryCard
          icon={<FileCheck2 size={22} />}
          title="Onay Bekleyen"
          note="Tamamlandı, kontrol bekliyor"
          value={pendingApprovalTasks.length}
          onClick={() => setActiveSheet("pendingApproval")}
        />

        <DetailEntryCard
          icon={<CheckCircle2 size={22} />}
          title="Tamamlanan"
          note="Biten veya onaylanan işler"
          value={completedTasks.length}
          onClick={() => setActiveSheet("completedTasks")}
        />
      </section>

      <ActionSheet
        title="Görevlerim"
        isOpen={activeSheet === "allTasks"}
        onClose={() => setActiveSheet(null)}
      >
        <TaskList
          tasks={myTasks}
          emptyText="Sana atanmış görev bulunmuyor."
        onStart={handleTaskStart}
          onComplete={handleTaskComplete}
          updatingTaskId={updatingTaskId}
        />
      </ActionSheet>

      <ActionSheet
        title="Rutin Görevler"
        isOpen={activeSheet === "routineTasks"}
        onClose={() => setActiveSheet(null)}
      >
        <TaskList
          tasks={routineTasks}
          emptyText="Rutin görevin bulunmuyor."
        onStart={handleTaskStart}
          onComplete={handleTaskComplete}
          updatingTaskId={updatingTaskId}
        />
      </ActionSheet>

      <ActionSheet
        title="Ekstra Görevler"
        isOpen={activeSheet === "extraTasks"}
        onClose={() => setActiveSheet(null)}
      >
        <TaskList
          tasks={extraTasks}
          emptyText="Ekstra görevin bulunmuyor."
        onStart={handleTaskStart}
          onComplete={handleTaskComplete}
          updatingTaskId={updatingTaskId}
        />
      </ActionSheet>

      <ActionSheet
        title="Acil / Geciken İşler"
        isOpen={activeSheet === "priorityTasks"}
        onClose={() => setActiveSheet(null)}
      >
        <TaskList
          tasks={priorityTasks}
          emptyText="Acil veya geciken görevin bulunmuyor."
        onStart={handleTaskStart}
          onComplete={handleTaskComplete}
          updatingTaskId={updatingTaskId}
        />
      </ActionSheet>

      <ActionSheet
        title="Fotoğraf İstenen İşler"
        isOpen={activeSheet === "photoTasks"}
        onClose={() => setActiveSheet(null)}
      >
        <TaskList
          tasks={photoTasks}
          emptyText="Fotoğraf kanıtı isteyen açık görevin bulunmuyor."
        onStart={handleTaskStart}
          onComplete={handleTaskComplete}
          updatingTaskId={updatingTaskId}
        />
      </ActionSheet>

      <ActionSheet
        title="Onay Bekleyen"
        isOpen={activeSheet === "pendingApproval"}
        onClose={() => setActiveSheet(null)}
      >
        <TaskList
          tasks={pendingApprovalTasks}
          emptyText="Onay bekleyen görevin bulunmuyor."
        onStart={handleTaskStart}
          onComplete={handleTaskComplete}
          updatingTaskId={updatingTaskId}
        />
      </ActionSheet>

      <ActionSheet
        title="Tamamlanan"
        isOpen={activeSheet === "completedTasks"}
        onClose={() => setActiveSheet(null)}
      >
        <TaskList
          tasks={completedTasks}
          emptyText="Tamamlanan görevin bulunmuyor."
        onStart={handleTaskStart}
          onComplete={handleTaskComplete}
          updatingTaskId={updatingTaskId}
        />
      </ActionSheet>

      <ActionSheet
        title="Bildirimler"
        isOpen={activeSheet === "notifications"}
        onClose={() => setActiveSheet(null)}
      >
        <div className="grid gap-3">
          <p className="text-sm font-bold leading-6 text-[var(--missio-text-muted)]">
            Şimdilik aktif bildirimin yok. Sonraki adımda görev atama, konum isteği ve onay durumları burada gösterilecek.
          </p>
        </div>
      </ActionSheet>
    </div>
  );
}