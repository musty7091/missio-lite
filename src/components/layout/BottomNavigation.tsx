import {
  BarChart3,
  Bell,
  Building2,
  ClipboardCheck,
  FileCheck2,
  Home,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export type AppTab = "tasks" | "notifications" | "reports" | "profile";

type NavigationItem = {
  id: AppTab;
  label: string;
  icon: LucideIcon;
};

type BottomNavigationProps = {
  activeTab: AppTab;
  notificationCount: number;
  role: string;
  onTabChange: (tab: AppTab) => void;
};

function isSuperAdminRole(role: string) {
  return role === "super_admin";
}

function isStaffRole(role: string) {
  return role === "staff";
}

function isBossRole(role: string) {
  return role === "boss" || role === "owner";
}

function getNavigationItems(role: string): NavigationItem[] {
  if (isSuperAdminRole(role)) {
    return [
      { id: "tasks", label: "İşletme", icon: Building2 },
      { id: "reports", label: "Rapor", icon: BarChart3 },
      { id: "notifications", label: "Sistem", icon: ShieldCheck },
      { id: "profile", label: "Profil", icon: UserRound },
    ];
  }

  if (isStaffRole(role)) {
    return [
      { id: "tasks", label: "Görev", icon: ClipboardCheck },
      { id: "notifications", label: "Bildirim", icon: Bell },
      { id: "reports", label: "Kontrol", icon: ShieldCheck },
      { id: "profile", label: "Profil", icon: UserRound },
    ];
  }

  if (isBossRole(role)) {
    return [
      { id: "tasks", label: "Özet", icon: Home },
      { id: "reports", label: "Rapor", icon: BarChart3 },
      { id: "notifications", label: "Onay", icon: FileCheck2 },
      { id: "profile", label: "Profil", icon: UserRound },
    ];
  }

  return [
    { id: "tasks", label: "Operasyon", icon: ClipboardCheck },
    { id: "notifications", label: "Onay", icon: FileCheck2 },
    { id: "reports", label: "Kapanış", icon: ShieldCheck },
    { id: "profile", label: "Profil", icon: UserRound },
  ];
}

export function BottomNavigation({
  activeTab,
  notificationCount,
  role,
  onTabChange,
}: BottomNavigationProps) {
  const navigationItems = getNavigationItems(role);
  const notificationLabel = notificationCount > 9 ? "9+" : String(notificationCount);

  return (
    <nav
      className="sticky bottom-3 z-20 mt-auto rounded-[2rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)]/95 p-2 shadow-2xl shadow-slate-900/10 backdrop-blur-xl dark:shadow-black/30"
      aria-label="Alt menü"
    >
      <div className="grid grid-cols-4 gap-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === activeTab;
          const shouldShowBadge =
            item.id === "notifications" && notificationCount > 0;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              aria-current={isActive ? "page" : undefined}
              className={[
                "relative flex min-h-[4.05rem] flex-col items-center justify-center gap-1 rounded-[1.45rem] px-2 text-[0.68rem] font-black transition active:scale-95",
                isActive
                  ? "bg-[var(--missio-primary)] text-white shadow-lg shadow-cyan-500/20"
                  : "text-[var(--missio-text-muted)] hover:bg-[var(--missio-page-bg)]",
              ].join(" ")}
            >
              <span className="relative">
                <Icon size={20} />

                {shouldShowBadge ? (
                  <span className="absolute -right-3 -top-3 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[var(--missio-card-bg)] bg-red-500 px-1 text-[0.62rem] font-black text-white">
                    {notificationLabel}
                  </span>
                ) : null}
              </span>

              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
