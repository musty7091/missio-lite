import { useEffect, useState } from "react";
import "./App.css";
import { auth } from "./lib/firebase";
import { AppHeader, type ThemeMode } from "./components/layout/AppHeader";
import { BottomNavigation, type AppTab } from "./components/layout/BottomNavigation";
import { BossHomePanel } from "./components/boss/BossHomePanel";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";

const THEME_STORAGE_KEY = "missio-lite-theme";

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

function AppLogo() {
  return (
    <div className="brand-icon" aria-hidden="true">
      M
    </div>
  );
}

function LoginScreen() {
  const [email, setEmail] = useState("m.mkaradeniz@icloud.com");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin() {
    setMessage("");

    if (!email.trim() || !password.trim()) {
      setMessage("Lütfen e-posta ve şifre gir.");
      return;
    }

    try {
      setIsSubmitting(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setPassword("");
    } catch (error) {
      console.error(error);
      setMessage("Giriş başarısız. E-posta veya şifreyi kontrol et.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page">
      <section className="login-card">
        <div className="brand-area">
          <AppLogo />
          <div>
            <h1>Missio Lite</h1>
            <p>Görev, konum ve saha operasyon takibi</p>
          </div>
        </div>

        <div className="info-box">
          <strong>Düşük maliyetli işletme paneli</strong>
          <span>
            Ertan Market için Firebase tabanlı görev ve operasyon paneli.
          </span>
        </div>

        <form className="login-form">
          <label>
            E-posta
            <input
              type="email"
              placeholder="ornek@firma.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label>
            Şifre
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void handleLogin();
                }
              }}
            />
          </label>

          {message ? <div className="error-message">{message}</div> : null}

          <button type="button" onClick={handleLogin} disabled={isSubmitting}>
            {isSubmitting ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>

        <p className="footer-note">Missio Lite v1 Firebase Auth bağlantısı</p>
      </section>
    </main>
  );
}

function TasksTab({
  onGoToReports,
  onGoToApprovals,
  onGoToProfile,
}: {
  onGoToReports: () => void;
  onGoToApprovals: () => void;
  onGoToProfile: () => void;
}) {
  return (
    <BossHomePanel
      onGoToReports={onGoToReports}
      onGoToApprovals={onGoToApprovals}
      onGoToProfile={onGoToProfile}
    />
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
        Görev ve konum onayları burada görünecek.
      </p>
    </section>
  );
}

function ProfileTab({ currentUser }: { currentUser: User }) {
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
            Ertan Market
          </p>
        </div>

        <div className="rounded-2xl bg-[var(--missio-page-bg)] p-4">
          <span className="text-xs font-black text-[var(--missio-text-muted)]">
            Rol
          </span>
          <p className="mt-1 text-sm font-black text-[var(--missio-text-main)]">
            Owner / Patron
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

  return (
    <main className="min-h-screen bg-[var(--missio-page-bg)] px-4 py-4 text-[var(--missio-text-main)]">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[520px] flex-col">
        <AppHeader
          theme={theme}
          displayName={currentUser.email ?? "Mustafa"}
          roleLabel="Patron"
          onToggleTheme={onToggleTheme}
          onLogout={onLogout}
        />

        <div className="mb-3 inline-flex w-fit items-center rounded-full border border-[var(--missio-border)] bg-[var(--missio-card-bg)] px-3 py-2 text-xs font-black text-[var(--missio-text-muted)]">
          Ertan Market · ertanmarket
        </div>

        <div className="grid gap-4">
          {activeTab === "tasks" ? (
            <TasksTab
              onGoToReports={() => setActiveTab("reports")}
              onGoToApprovals={() => setActiveTab("notifications")}
              onGoToProfile={() => setActiveTab("profile")}
            />
          ) : null}
          {activeTab === "reports" ? <ReportsTab /> : null}
          {activeTab === "notifications" ? <NotificationsTab /> : null}
          {activeTab === "profile" ? <ProfileTab currentUser={currentUser} /> : null}
        </div>

        <BottomNavigation
          activeTab={activeTab}
          notificationCount={1}
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
      <main className="page">
        <section className="login-card">
          <div className="brand-area">
            <AppLogo />
            <div>
              <h1>Missio Lite</h1>
              <p>Oturum kontrol ediliyor...</p>
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


