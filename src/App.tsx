import { useEffect, useState } from "react";
import "./App.css";
import { auth } from "./lib/firebase";
import { AppHeader, type ThemeMode } from "./components/layout/AppHeader";
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
  return (
    <main className="page">
      <section className="login-card auth-card">
        <AppHeader
          theme={theme}
          displayName={currentUser.email ?? "Mustafa"}
          roleLabel="Patron"
          onToggleTheme={onToggleTheme}
          onLogout={onLogout}
        />

        <div className="info-box">
          <strong>Giriş başarılı</strong>
          <span>Oturum açan kullanıcı: {currentUser.email}</span>
        </div>

        <div className="dashboard-preview">
          <div>
            <strong>İşletme</strong>
            <span>Ertan Market</span>
          </div>
          <div>
            <strong>Business ID</strong>
            <span>ertanmarket</span>
          </div>
          <div>
            <strong>Rol</strong>
            <span>Owner / Patron</span>
          </div>
        </div>

        <p className="footer-note">
          Bu adımda sadece eski Missio Header, logo ve tema butonu taşındı.
        </p>
      </section>
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
