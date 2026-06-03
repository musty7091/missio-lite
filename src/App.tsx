import { useEffect, useState, type ReactNode } from "react";
import "./App.css";
import { auth, db } from "./lib/firebase";
import {
  AppHeader,
  MissioMiniLogo,
  type ThemeMode,
} from "./components/layout/AppHeader";
import { BottomNavigation, type AppTab } from "./components/layout/BottomNavigation";
import { BossHomePanel } from "./components/boss/BossHomePanel";
import { ActionSheet } from "./components/common/ActionSheet";
import { ForgotPasswordSheet } from "./components/auth/ForgotPasswordSheet";
import { SuperAdminPanel } from "./components/superadmin/SuperAdminPanel";
import {
  Building2,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const THEME_STORAGE_KEY = "missio-lite-theme";
const ACTIVE_BUSINESS_STORAGE_KEY = "missio-lite-active-business-id";
const SUPER_ADMIN_EMAIL = "admin@missio-lite.com";

function getInitialTheme(): ThemeMode {
  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return "dark";
}

function applyTheme(theme: ThemeMode) {
  const isDark = theme === "dark";

  document.documentElement.classList.toggle("dark", isDark);
  document.body.classList.toggle("dark", isDark);
  document.documentElement.dataset.theme = theme;
  document.body.dataset.theme = theme;
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

async function resolveLoginEmail(businessCode: string, username: string) {
  const normalizedBusinessCode = businessCode.trim().toLowerCase();
  const normalizedUsername = username.trim().toLowerCase();

  if (!normalizedBusinessCode && normalizedUsername === "admin") {
    return SUPER_ADMIN_EMAIL;
  }

  if (!normalizedBusinessCode) {
    throw new Error("BUSINESS_CODE_REQUIRED");
  }

  if (!normalizedUsername) {
    throw new Error("UNKNOWN_USERNAME");
  }

  const usernameRef = doc(
    db,
    "businesses",
    normalizedBusinessCode,
    "usernames",
    normalizedUsername,
  );

  const usernameSnapshot = await getDoc(usernameRef);

  if (!usernameSnapshot.exists()) {
    throw new Error("UNKNOWN_USERNAME");
  }

  const usernameData = usernameSnapshot.data();
  const email = String(usernameData.email ?? "").trim();

  if (!email) {
    throw new Error("UNKNOWN_USERNAME");
  }

  return email;
}

function isSuperAdminUser(currentUser: User) {
  return currentUser.email?.toLowerCase() === SUPER_ADMIN_EMAIL;
}

type BusinessSession = {
  id: string;
  name: string;
  role: string;
  roleLabel: string;
};

function getBusinessRoleLabel(role: string) {
  if (role === "owner" || role === "boss") {
    return "Patron";
  }

  if (role === "manager") {
    return "Yönetici";
  }

  if (role === "staff") {
    return "Personel";
  }

  return "Kullanıcı";
}

function LoginField({
  label,
  icon,
  type,
  value,
  onChange,
  onEnter,
}: {
  label: string;
  icon: ReactNode;
  type: string;
  value: string;
  onChange: (value: string) => void;
  onEnter?: () => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-[var(--missio-text-main)]">
        {label}
      </span>

      <div className="flex h-14 items-center gap-3 rounded-2xl border border-[var(--missio-border)] bg-[var(--missio-page-bg)] px-4 focus-within:border-[var(--missio-primary)] focus-within:ring-4 focus-within:ring-cyan-500/10">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-cyan-500/10 text-[var(--missio-primary)]">
          {icon}
        </span>

        <input
          type={type}
          value={value}
          autoComplete="off"
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && onEnter) {
              onEnter();
            }
          }}
          className="h-full min-w-0 flex-1 bg-transparent text-sm font-black text-[var(--missio-text-main)] outline-none"
        />
      </div>
    </label>
  );
}

function LoginScreen() {
  const [businessCode, setBusinessCode] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  async function handleLogin() {
    setMessage("");

    const isSuperAdminLogin =
      !businessCode.trim() && username.trim().toLowerCase() === "admin";

    if ((!isSuperAdminLogin && !businessCode.trim()) || !username.trim() || !password.trim()) {
      setMessage("Lütfen işletme kodu, kullanıcı adı ve şifre gir.");
      return;
    }

    try {
      setIsSubmitting(true);

      const loginEmail = await resolveLoginEmail(businessCode, username);

      await signInWithEmailAndPassword(auth, loginEmail, password);

      if (isSuperAdminLogin) {
        window.localStorage.removeItem(ACTIVE_BUSINESS_STORAGE_KEY);
      } else {
        window.localStorage.setItem(
          ACTIVE_BUSINESS_STORAGE_KEY,
          businessCode.trim().toLowerCase(),
        );
      }

      setPassword("");
    } catch (error) {
      console.error(error);

      if (error instanceof Error && error.message === "INVALID_BUSINESS_CODE") {
        setMessage("İşletme kodu bulunamadı.");
      } else if (error instanceof Error && error.message === "UNKNOWN_USERNAME") {
        setMessage("Kullanıcı adı bulunamadı.");
      } else {
        setMessage("Giriş başarısız. Bilgileri kontrol et.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleForgotPasswordMessage(requestMessage: string) {
    setMessage(requestMessage);
    setForgotPasswordOpen(false);
  }

  return (
    <main className="min-h-screen bg-[var(--missio-page-bg)] px-4 py-6 text-[var(--missio-text-main)]">
      <section className="mx-auto max-w-[520px] overflow-hidden rounded-[2.2rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] shadow-2xl shadow-slate-950/20">
        <div className="relative overflow-hidden bg-slate-950 px-6 pb-7 pt-7 text-white">
          <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="relative flex items-center gap-4">
            <MissioMiniLogo />

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-black tracking-tight">Missio</h1>
                <span className="rounded-full bg-cyan-400/15 px-2.5 py-1 text-[0.65rem] font-black text-cyan-200 ring-1 ring-cyan-300/20">
                  LITE
                </span>
              </div>

              <p className="mt-2 text-sm font-bold leading-5 text-slate-300">
                Görev, konum ve saha operasyon takibi
              </p>
            </div>
          </div>

          <div className="relative mt-6 rounded-[1.6rem] border border-cyan-300/20 bg-white/5 p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-400/15 text-cyan-200">
                <ShieldCheck size={22} />
              </div>

              <div>
                <h2 className="text-base font-black text-white">Missio Login</h2>
                <p className="mt-1 text-xs font-bold leading-5 text-slate-300">
                  İşletme kodu, kullanıcı adı ve şifre ile güvenli giriş yap.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-6">
          <LoginField
            label="İşletme Kodu"
            type="text"
            value={businessCode}
            onChange={setBusinessCode}
            icon={<Building2 size={20} />}
          />

          <LoginField
            label="Kullanıcı Adı"
            type="text"
            value={username}
            onChange={setUsername}
            icon={<UserRound size={20} />}
          />

          <LoginField
            label="Şifre"
            type="password"
            value={password}
            onChange={setPassword}
            onEnter={() => void handleLogin()}
            icon={<LockKeyhole size={20} />}
          />

          {message ? (
            <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm font-black text-red-500">
              {message}
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleLogin}
            disabled={isSubmitting}
            className="flex min-h-14 items-center justify-center gap-2 rounded-[1.4rem] bg-[var(--missio-primary)] px-4 py-3 text-sm font-black text-white shadow-lg shadow-cyan-500/20 transition active:scale-95 disabled:opacity-70"
          >
            <KeyRound size={18} />
            {isSubmitting ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>

          <button
            type="button"
            onClick={() => setForgotPasswordOpen(true)}
            className="min-h-13 rounded-[1.4rem] border border-[var(--missio-border)] bg-[var(--missio-page-bg)] px-4 py-3 text-sm font-black text-[var(--missio-primary)] transition active:scale-95"
          >
            Şifremi Unuttum
          </button>
        </div>
      </section>

      <ActionSheet
        title="Şifremi Unuttum"
        isOpen={forgotPasswordOpen}
        onClose={() => setForgotPasswordOpen(false)}
      >
        <ForgotPasswordSheet onRequested={handleForgotPasswordMessage} />
      </ActionSheet>
    </main>
  );
}

function ReportsTab() {
  return (
    <section className="rounded-[2rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-5 shadow-xl shadow-slate-900/5 dark:shadow-black/25">
      <p className="text-xs font-black uppercase tracking-wide text-[var(--missio-primary)]">
        Rapor
      </p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-[var(--missio-text-main)]">
        Son 14 Gün
      </h2>
      <p className="mt-2 text-sm font-bold leading-6 text-[var(--missio-text-muted)]">
        Rapor paneli sonraki fazda Firestore günlük özetlerinden beslenecek.
      </p>
    </section>
  );
}

function NotificationsTab() {
  return (
    <section className="rounded-[2rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-5 shadow-xl shadow-slate-900/5 dark:shadow-black/25">
      <p className="text-xs font-black uppercase tracking-wide text-[var(--missio-primary)]">
        Onaylar
      </p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-[var(--missio-text-main)]">
        Bekleyen Kontroller
      </h2>
      <p className="mt-2 text-sm font-bold leading-6 text-[var(--missio-text-muted)]">
        Görev, konum ve şifre talepleri burada görünecek.
      </p>
    </section>
  );
}

function ProfileTab({
  currentUser,
  businessSession,
}: {
  currentUser: User;
  businessSession: BusinessSession;
}) {
  return (
    <section className="rounded-[2rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-5 shadow-xl shadow-slate-900/5 dark:shadow-black/25">
      <p className="text-xs font-black uppercase tracking-wide text-[var(--missio-primary)]">
        Hesabım
      </p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-[var(--missio-text-main)]">
        Profil
      </h2>

      <div className="mt-5 grid gap-3">
        <div className="rounded-2xl bg-[var(--missio-page-bg)] p-4">
          <span className="text-xs font-black text-[var(--missio-text-muted)]">
            E-posta
          </span>
          <p className="mt-1 break-all text-sm font-black text-[var(--missio-text-main)]">
            {currentUser.email}
          </p>
        </div>

        <div className="rounded-2xl bg-[var(--missio-page-bg)] p-4">
          <span className="text-xs font-black text-[var(--missio-text-muted)]">
            İşletme
          </span>
          <p className="mt-1 text-sm font-black text-[var(--missio-text-main)]">
            {businessSession.name}
          </p>
          <p className="mt-1 text-xs font-bold text-[var(--missio-text-muted)]">
            {businessSession.id}
          </p>
        </div>

        <div className="rounded-2xl bg-[var(--missio-page-bg)] p-4">
          <span className="text-xs font-black text-[var(--missio-text-muted)]">
            Rol
          </span>
          <p className="mt-1 text-sm font-black text-[var(--missio-text-main)]">
            {businessSession.roleLabel}
          </p>
        </div>
      </div>
    </section>
  );
}
function AuthenticatedPanel({
  currentUser,
  theme,
  onToggleTheme,
  onLogout,
}: {
  currentUser: User;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onLogout: () => void;
}) {
  const [activeTab, setActiveTab] = useState<AppTab>("tasks");
  const [businessSession, setBusinessSession] = useState<BusinessSession | null>(null);
  const [businessLoadError, setBusinessLoadError] = useState("");
  const isSuperAdmin = isSuperAdminUser(currentUser);

  useEffect(() => {
    if (isSuperAdmin) {
      setBusinessSession(null);
      setBusinessLoadError("");
      return;
    }

    const activeBusinessId = (
      window.localStorage.getItem(ACTIVE_BUSINESS_STORAGE_KEY) ?? ""
    )
      .trim()
      .toLowerCase();

    if (!activeBusinessId) {
      setBusinessLoadError("Aktif işletme bilgisi bulunamadı. Lütfen çıkış yapıp tekrar giriş yap.");
      return;
    }

    let isCancelled = false;

    async function loadBusinessSession() {
      try {
        setBusinessLoadError("");

        const businessRef = doc(db, "businesses", activeBusinessId);
        const memberRef = doc(
          db,
          "businesses",
          activeBusinessId,
          "members",
          currentUser.uid,
        );

        const [businessSnapshot, memberSnapshot] = await Promise.all([
          getDoc(businessRef),
          getDoc(memberRef),
        ]);

        if (!businessSnapshot.exists()) {
          throw new Error("BUSINESS_NOT_FOUND");
        }

        if (!memberSnapshot.exists()) {
          throw new Error("MEMBER_NOT_FOUND");
        }

        const businessData = businessSnapshot.data();
        const memberData = memberSnapshot.data();

        const businessName = String(
          businessData.name ??
            businessData.businessName ??
            businessData.title ??
            activeBusinessId,
        );

        const role = String(memberData.role ?? "user");

        if (!isCancelled) {
          setBusinessSession({
            id: activeBusinessId,
            name: businessName,
            role,
            roleLabel: getBusinessRoleLabel(role),
          });
        }
      } catch (error) {
        console.error(error);

        if (!isCancelled) {
          setBusinessSession(null);
          setBusinessLoadError(
            "İşletme bilgisi veritabanından okunamadı. Lütfen süperadmin panelinden işletme ve üyelik kaydını kontrol et.",
          );
        }
      }
    }

    void loadBusinessSession();

    return () => {
      isCancelled = true;
    };
  }, [currentUser.uid, isSuperAdmin]);

  if (isSuperAdmin) {
    return (
      <main className="min-h-screen bg-[var(--missio-page-bg)] px-4 py-4 text-[var(--missio-text-main)]">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[520px] flex-col">
          <AppHeader
            theme={theme}
            displayName="admin"
            roleLabel="Süperadmin"
            onToggleTheme={onToggleTheme}
            onLogout={onLogout}
          />

          <SuperAdminPanel currentUser={currentUser} />
        </div>
      </main>
    );
  }

  if (businessLoadError) {
    return (
      <main className="min-h-screen bg-[var(--missio-page-bg)] px-4 py-4 text-[var(--missio-text-main)]">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[520px] flex-col">
          <AppHeader
            theme={theme}
            displayName={currentUser.email ?? "Kullanıcı"}
            roleLabel="Kullanıcı"
            onToggleTheme={onToggleTheme}
            onLogout={onLogout}
          />

          <section className="mt-6 rounded-[2rem] border border-red-400/30 bg-red-400/10 p-5 text-sm font-black leading-6 text-red-500">
            {businessLoadError}
          </section>
        </div>
      </main>
    );
  }

  if (!businessSession) {
    return (
      <main className="min-h-screen bg-[var(--missio-page-bg)] px-4 py-4 text-[var(--missio-text-main)]">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[520px] flex-col">
          <AppHeader
            theme={theme}
            displayName={currentUser.email ?? "Kullanıcı"}
            roleLabel="Yükleniyor"
            onToggleTheme={onToggleTheme}
            onLogout={onLogout}
          />

          <section className="mt-6 rounded-[2rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-5 text-sm font-black text-[var(--missio-text-muted)]">
            İşletme bilgisi veritabanından okunuyor...
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--missio-page-bg)] px-4 py-4 text-[var(--missio-text-main)]">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[520px] flex-col">
        <AppHeader
          theme={theme}
          displayName={currentUser.email ?? "Kullanıcı"}
          roleLabel={businessSession.roleLabel}
          onToggleTheme={onToggleTheme}
          onLogout={onLogout}
        />

        <div className="mb-3 inline-flex w-fit items-center rounded-full border border-[var(--missio-border)] bg-[var(--missio-card-bg)] px-3 py-2 text-xs font-black text-[var(--missio-text-muted)]">
          {businessSession.name} · {businessSession.id}
        </div>

        <div className="grid gap-4">
          {activeTab === "tasks" ? (
            <BossHomePanel
              businessName={businessSession.name}
              businessId={businessSession.id}
              onGoToReports={() => setActiveTab("reports")}
              onGoToApprovals={() => setActiveTab("notifications")}
              onGoToProfile={() => setActiveTab("profile")}
            />
          ) : null}

          {activeTab === "reports" ? <ReportsTab /> : null}
          {activeTab === "notifications" ? <NotificationsTab /> : null}
          {activeTab === "profile" ? (
            <ProfileTab
              currentUser={currentUser}
              businessSession={businessSession}
            />
          ) : null}
        </div>

        <BottomNavigation
          activeTab={activeTab}
          notificationCount={0}
          role="owner"
          onTabChange={setActiveTab}
        />
      </div>
    </main>
  );
}
function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [theme, setTheme] = useState<ThemeMode>(() => getInitialTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsCheckingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  async function handleLogout() {
    await signOut(auth);
  }

  function handleToggleTheme() {
    setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light"));
  }

  if (isCheckingAuth) {
    return (
      <main className="min-h-screen bg-[var(--missio-page-bg)] px-4 py-6 text-[var(--missio-text-main)]">
        <section className="mx-auto max-w-[520px] rounded-[2rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-6">
          <div className="flex items-center gap-4">
            <MissioMiniLogo />
            <div>
              <h1 className="text-2xl font-black tracking-tight text-[var(--missio-text-main)]">
                Missio
              </h1>
              <p className="mt-1 text-sm font-bold text-[var(--missio-text-muted)]">
                Oturum kontrol ediliyor...
              </p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (!currentUser) {
    return <LoginScreen />;
  }

  return (
    <AuthenticatedPanel
      currentUser={currentUser}
      theme={theme}
      onToggleTheme={handleToggleTheme}
      onLogout={() => void handleLogout()}
    />
  );
}

export default App;
