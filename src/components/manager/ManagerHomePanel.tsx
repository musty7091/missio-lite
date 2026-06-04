import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "firebase/auth";
import {
  AlertTriangle,
  BarChart3,
  ClipboardCheck,
  FileCheck2,
  ListChecks,
  MapPin,
  PlusSquare,
  RefreshCw,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import { ActionSheet } from "../common/ActionSheet";
import { TaskAssignSheet } from "../boss/TaskAssignSheet";
import { LocationCheckSheet } from "../boss/LocationCheckSheet";
import {
  getTaskStatusLabel,
  listBusinessTasks,
  type BusinessTaskListItem,
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
        </div>
      </div>
    </article>
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
  const [tasks, setTasks] = useState<BusinessTaskListItem[]>([]);
  const [members, setMembers] = useState<BusinessMemberListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

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
  const pendingApprovalTasks = visibleTasks.filter(isPendingApproval);
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
          <SummaryMiniCard
            label="Ekip"
            value={teamStaff.length}
            note="Personel"
          />
          <SummaryMiniCard
            label="Açık"
            value={openTaskCount}
            note="Görev"
          />
          <SummaryMiniCard
            label="Onay"
            value={pendingApprovalCount}
            note="Bekleyen"
          />
          <SummaryMiniCard
            label="Risk"
            value={delayedTaskCount}
            note="Geciken"
            danger={delayedTaskCount > 0}
          />
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
          <QuickActionCard
            icon={<PlusSquare size={22} />}
            title="Görev Ata"
            note="Ekibine görev oluştur"
            onClick={() => setActiveSheet("assignTask")}
          />

          <QuickActionCard
            icon={<MapPin size={22} />}
            title="Konum İste"
            note="Yoklama başlat"
            onClick={() => setActiveSheet("location")}
          />

          <QuickActionCard
            icon={<FileCheck2 size={22} />}
            title="Onaylar"
            note="Kontrol bekleyenler"
            onClick={() => setActiveSheet("approvals")}
          />

          <QuickActionCard
            icon={<UsersRound size={22} />}
            title="Personel"
            note="Ekip durumunu gör"
            onClick={() => setActiveSheet("staff")}
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
          icon={<ClipboardCheck size={22} />}
          title="Benim Görevlerim"
          note="Sana atanmış görevler"
          value={myTasks.length}
          onClick={() => setActiveSheet("myTasks")}
        />

        <DetailEntryCard
          icon={<ListChecks size={22} />}
          title="Ekip Görevleri"
          note="Bağlı personellerin görevleri"
          value={teamTasks.length}
          onClick={() => setActiveSheet("teamTasks")}
        />

        <DetailEntryCard
          icon={<AlertTriangle size={22} />}
          title="Acil / Geciken"
          note="Öncelik gerektiren işler"
          value={priorityTasks.length}
          onClick={() => setActiveSheet("priorityTasks")}
        />

        <DetailEntryCard
          icon={<BarChart3 size={22} />}
          title="Kısa Rapor"
          note="Operasyon toplamları"
          value={totalTaskCount}
          onClick={() => setActiveSheet("reports")}
        />
      </section>

      <ActionSheet
        title="Görev Ata"
        isOpen={activeSheet === "assignTask"}
        onClose={() => setActiveSheet(null)}
      >
        <TaskAssignSheet businessId={businessId} onCreated={handleActionCompleted} />
      </ActionSheet>

      <ActionSheet
        title="Konum İste"
        isOpen={activeSheet === "location"}
        onClose={() => setActiveSheet(null)}
      >
        <LocationCheckSheet onRequested={handleActionCompleted} />
      </ActionSheet>

      <ActionSheet
        title="Onaylar"
        isOpen={activeSheet === "approvals"}
        onClose={() => setActiveSheet(null)}
      >
        <div className="grid gap-3">
          {pendingApprovalTasks.length === 0 ? (
            <p className="text-sm font-bold leading-6 text-[var(--missio-text-muted)]">
              Onay bekleyen görev bulunmuyor.
            </p>
          ) : null}

          {pendingApprovalTasks.map((task) => (
            <TaskCard key={task.taskId} task={task} />
          ))}
        </div>
      </ActionSheet>

      <ActionSheet
        title="Personel"
        isOpen={activeSheet === "staff"}
        onClose={() => setActiveSheet(null)}
      >
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

      <ActionSheet
        title="Benim Görevlerim"
        isOpen={activeSheet === "myTasks"}
        onClose={() => setActiveSheet(null)}
      >
        <div className="grid gap-3">
          {myTasks.length === 0 ? (
            <p className="text-sm font-bold leading-6 text-[var(--missio-text-muted)]">
              Sana atanmış görev bulunmuyor.
            </p>
          ) : null}

          {myTasks.map((task) => (
            <TaskCard key={task.taskId} task={task} />
          ))}
        </div>
      </ActionSheet>

      <ActionSheet
        title="Ekip Görevleri"
        isOpen={activeSheet === "teamTasks"}
        onClose={() => setActiveSheet(null)}
      >
        <div className="grid gap-3">
          {teamTasks.length === 0 ? (
            <p className="text-sm font-bold leading-6 text-[var(--missio-text-muted)]">
              Ekibine ait görev bulunmuyor.
            </p>
          ) : null}

          {teamTasks.map((task) => (
            <TaskCard key={task.taskId} task={task} />
          ))}
        </div>
      </ActionSheet>

      <ActionSheet
        title="Acil / Geciken İşler"
        isOpen={activeSheet === "priorityTasks"}
        onClose={() => setActiveSheet(null)}
      >
        <div className="grid gap-3">
          {priorityTasks.length === 0 ? (
            <p className="text-sm font-bold leading-6 text-[var(--missio-text-muted)]">
              Acil veya geciken iş yok.
            </p>
          ) : null}

          {priorityTasks.map((task) => (
            <TaskCard key={task.taskId} task={task} />
          ))}
        </div>
      </ActionSheet>

      <ActionSheet
        title="Kısa Rapor"
        isOpen={activeSheet === "reports"}
        onClose={() => setActiveSheet(null)}
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[1.2rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-4">
            <span className="block text-xs font-black text-[var(--missio-text-muted)]">
              Toplam Görev
            </span>
            <strong className="mt-2 block text-2xl font-black text-[var(--missio-text-main)]">
              {totalTaskCount}
            </strong>
          </div>

          <div className="rounded-[1.2rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-4">
            <span className="block text-xs font-black text-[var(--missio-text-muted)]">
              Açık Görev
            </span>
            <strong className="mt-2 block text-2xl font-black text-[var(--missio-text-main)]">
              {openTaskCount}
            </strong>
          </div>

          <div className="rounded-[1.2rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-4">
            <span className="block text-xs font-black text-[var(--missio-text-muted)]">
              Onay Bekleyen
            </span>
            <strong className="mt-2 block text-2xl font-black text-[var(--missio-text-main)]">
              {pendingApprovalCount}
            </strong>
          </div>

          <div className="rounded-[1.2rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-4">
            <span className="block text-xs font-black text-[var(--missio-text-muted)]">
              Geciken
            </span>
            <strong className="mt-2 block text-2xl font-black text-red-500">
              {delayedTaskCount}
            </strong>
          </div>
        </div>
      </ActionSheet>
    </div>
  );
}