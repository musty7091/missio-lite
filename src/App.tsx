import "./App.css";

function App() {
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
            <input type="email" placeholder="ornek@firma.com" />
          </label>

          <label>
            Şifre
            <input type="password" placeholder="••••••••" />
          </label>

          <button type="button">Giriş Yap</button>
        </form>

        <p className="footer-note">
          Missio Lite v1 demo hazırlık ekranı
        </p>
      </section>
    </main>
  );
}

export default App;
