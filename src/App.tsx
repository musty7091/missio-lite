import { useEffect, useState } from "react";
import "./App.css";
import { auth } from "./lib/firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";

function App() {
  const [email, setEmail] = useState("m.mkaradeniz@icloud.com");
  const [password, setPassword] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsCheckingAuth(false);
    });

    return () => unsubscribe();
  }, []);

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
      setMessage("");
    } catch (error) {
      console.error(error);
      setMessage("Giriş başarısız. E-posta veya şifreyi kontrol et.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLogout() {
    await signOut(auth);
  }

  if (isCheckingAuth) {
    return (
      <main className="page">
        <section className="login-card">
          <div className="brand-area">
            <div className="brand-icon">M</div>
            <div>
              <h1>Missio Lite</h1>
              <p>Oturum kontrol ediliyor...</p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (currentUser) {
    return (
      <main className="page">
        <section className="login-card">
          <div className="brand-area">
            <div className="brand-icon">M</div>
            <div>
              <h1>Missio Lite</h1>
              <p>Patron paneli hazırlık ekranı</p>
            </div>
          </div>

          <div className="info-box">
            <strong>Giriş başarılı</strong>
            <span>Oturum açan kullanıcı: {currentUser.email}</span>
          </div>

          <div className="dashboard-preview">
            <div>
              <strong>Bugünkü Görevler</strong>
              <span>0</span>
            </div>
            <div>
              <strong>Bekleyen Konum Yoklaması</strong>
              <span>0</span>
            </div>
            <div>
              <strong>Fotoğraf Kanıtı</strong>
              <span>0</span>
            </div>
          </div>

          <button className="logout-button" type="button" onClick={handleLogout}>
            Çıkış Yap
          </button>

          <p className="footer-note">Missio Lite v1 patron paneli iskeleti</p>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="login-card">
        <div className="brand-area">
          <div className="brand-icon">M</div>
          <div>
            <h1>Missio Lite</h1>
            <p>Görev, konum ve saha operasyon takibi</p>
          </div>
        </div>

        <div className="info-box">
          <strong>Düşük maliyetli işletme paneli</strong>
          <span>
            Personel görevleri, fotoğraf kanıtı, manuel konum yoklama ve günlük özetler tek ekranda.
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

export default App;
