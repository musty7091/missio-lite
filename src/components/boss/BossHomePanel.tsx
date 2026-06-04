import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  ClipboardCheck,
  FileCheck2,
  ListChecks,
  MapPin,
  PlusSquare,
  RefreshCw,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { ActionSheet } from "../common/ActionSheet";
import { TaskAssignSheet } from "./TaskAssignSheet";
import { LocationCheckSheet } from "./LocationCheckSheet";
import { UserAddSheet } from "./UserAddSheet";
import { StaffListSheet } from "./StaffListSheet";
import {
  getTaskStatusLabel,
  listBusinessTasks,
  type BusinessTaskListItem,
} from "../../lib/businessTaskData";

type BossHomePanelProps = {
  businessName: string;
  businessId: string;
  onGoToReports: () => void;
  onGoToApprovals: () => void;
  onGoToProfile: () => void;
};

type ActiveSheet = "task" | "location" | "user" | "staff" | null;

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

function TaskCard({ task }: { task: BusinessTaskListItem }) {
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
                Atanan: {task.assignedToName || "Bilinmiyor"}
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
            <p className="mt-3 text-xs font-black text-[var(--missio-primary)]">
              Son tarih: {task.dueDate}
            </p>
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
  const [lastMessage, setLastMessage] = useState("");
  const [tasks, setTasks] = useState<BusinessTaskListItem[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [taskMessage, setTaskMessage] = useState("");

  void onGoToProfile;

  const assignedTaskCount = useMemo(
    () =>
      tasks.filter(
        (task) => task.status === "assigned" || task.status === "in_progress",
      ).length,
    [tasks],
  );

  const pendingApprovalCount = useMemo(
    () =>
      tasks.filter(
        (task) => task.status === "completed" && task.requiresApproval,
      ).length,
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

  return (
    <div className="grid gap-4">
      <section className="overflow-hidden rounded-[2rem] bg-slate-950 p-5 text-white shadow-2xl shadow-slate-900/20 dark:bg-slate-950">
        <p className="text-xs font-black uppercase tracking-wide text-cyan-300">
          Günlük Özet
        </p>

        <h2 className="mt-2 text-3xl font-black tracking-tight">
          {businessName}
        </h2>

        <p className="mt-2 text-sm font-bold leading-6 text-slate-300">
          İşletme kodu: {businessId}. Görevler artık Firestore tasks kayıtlarından okunuyor.
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
            <p className="text-2xl font-black">{assignedTaskCount}</p>
            <span className="mt-1 block text-[0.7rem] font-black text-slate-200">
              Aktif Görev
            </span>
            <small className="mt-1 block text-[0.62rem] font-bold leading-4 text-slate-400">
              Atanan / devam eden
            </small>
          </div>

          <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
            <p className="text-2xl font-black">{pendingApprovalCount}</p>
            <span className="mt-1 block text-[0.7rem] font-black text-slate-200">
              Onay Bekleyen
            </span>
            <small className="mt-1 block text-[0.62rem] font-bold leading-4 text-slate-400">
              Tamamlanıp onay isteyen
            </small>
          </div>

          <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
            <p className="text-2xl font-black">0</p>
            <span className="mt-1 block text-[0.7rem] font-black text-slate-200">
              Konum İsteği
            </span>
            <small className="mt-1 block text-[0.62rem] font-bold leading-4 text-slate-400">
              Aktif yoklama yok
            </small>
          </div>
        </div>
      </section>

      {lastMessage ? (
        <div className="rounded-[1.5rem] border border-cyan-400/30 bg-cyan-400/10 p-4 text-sm font-black text-[var(--missio-primary)]">
          {lastMessage}
        </div>
      ) : null}

      <section className="rounded-[2rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-5 shadow-xl shadow-slate-900/5 dark:shadow-black/25">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-[var(--missio-primary)]">
              Hızlı İşlemler
            </p>
            <h3 className="mt-1 text-xl font-black tracking-tight text-[var(--missio-text-main)]">
              Patron Paneli
            </h3>
          </div>

          <ClipboardCheck className="text-[var(--missio-primary)]" size={24} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className="boss-action-card"
            onClick={() => setActiveSheet("task")}
          >
            <PlusSquare size={23} />
            <strong>Görev Ata</strong>
            <span>Personele görev oluştur</span>
          </button>

          <button
            type="button"
            className="boss-action-card"
            onClick={() => setActiveSheet("location")}
          >
            <MapPin size={23} />
            <strong>Konum İste</strong>
            <span>Manuel yoklama başlat</span>
          </button>

          <button
            type="button"
            className="boss-action-card"
            onClick={() => setActiveSheet("user")}
          >
            <UserPlus size={23} />
            <strong>Kullanıcı Ekle</strong>
            <span>Personel hesabı hazırla</span>
          </button>

          <button
            type="button"
            className="boss-action-card"
            onClick={onGoToApprovals}
          >
            <FileCheck2 size={23} />
            <strong>Onaylar</strong>
            <span>Tamamlanan işleri kontrol et</span>
          </button>

          <button
            type="button"
            className="boss-action-card"
            onClick={onGoToReports}
          >
            <BarChart3 size={23} />
            <strong>Raporlar</strong>
            <span>Son 14 günü incele</span>
          </button>

          <button
            type="button"
            className="boss-action-card"
            onClick={() => setActiveSheet("staff")}
          >
            <UsersRound size={23} />
            <strong>Personel</strong>
            <span>Ekip durumunu gör</span>
          </button>
        </div>
      </section>

      <section className="rounded-[2rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-5 shadow-xl shadow-slate-900/5 dark:shadow-black/25">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-[var(--missio-primary)]">
              Bugünkü İş Akışı
            </p>
            <h3 className="mt-1 text-xl font-black tracking-tight text-[var(--missio-text-main)]">
              Görevler
            </h3>
          </div>

          <button
            type="button"
            onClick={loadTasks}
            disabled={isLoadingTasks}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[var(--missio-border)] bg-[var(--missio-card-bg)] text-[var(--missio-primary)] active:scale-95 disabled:opacity-60"
            aria-label="Görevleri yenile"
          >
            <RefreshCw size={19} />
          </button>
        </div>

        {taskMessage ? (
          <div className="mb-3 rounded-[1.4rem] border border-red-400/30 bg-red-400/10 p-4 text-sm font-black text-red-500">
            {taskMessage}
          </div>
        ) : null}

        {isLoadingTasks ? (
          <p className="text-sm font-black text-[var(--missio-text-muted)]">
            Görevler veritabanından okunuyor...
          </p>
        ) : null}

        {!isLoadingTasks && tasks.length === 0 ? (
          <p className="text-sm font-bold leading-6 text-[var(--missio-text-muted)]">
            Henüz görev yok. Görev Ata kartından yeni görev oluşturabilirsin.
          </p>
        ) : null}

        {!isLoadingTasks && tasks.length > 0 ? (
          <div className="grid gap-3">
            {tasks.slice(0, 5).map((task) => (
              <TaskCard key={task.taskId} task={task} />
            ))}
          </div>
        ) : null}
      </section>

      <ActionSheet
        title="Görev Ata"
        isOpen={activeSheet === "task"}
        onClose={closeSheet}
      >
        <TaskAssignSheet businessId={businessId} onCreated={showMessage} />
      </ActionSheet>

      <ActionSheet
        title="Konum İste"
        isOpen={activeSheet === "location"}
        onClose={closeSheet}
      >
        <LocationCheckSheet onRequested={showMessage} />
      </ActionSheet>

      <ActionSheet
        title="Kullanıcı Ekle"
        isOpen={activeSheet === "user"}
        onClose={closeSheet}
      >
        <UserAddSheet businessId={businessId} onCreated={showMessage} />
      </ActionSheet>

      <ActionSheet
        title="Personel"
        isOpen={activeSheet === "staff"}
        onClose={closeSheet}
      >
        <StaffListSheet businessId={businessId} />
      </ActionSheet>
    </div>
  );
}