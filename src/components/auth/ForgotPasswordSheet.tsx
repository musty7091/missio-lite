import { useState } from "react";
import { Building2, KeyRound, Send, ShieldAlert, UserRound } from "lucide-react";

type ForgotPasswordSheetProps = {
  onRequested: (message: string) => void;
};

export function ForgotPasswordSheet({ onRequested }: ForgotPasswordSheetProps) {
  const [businessCode, setBusinessCode] = useState("");
  const [username, setUsername] = useState("");
  const [note, setNote] = useState("Şifremi unuttum. Geçici şifre talep ediyorum.");

  function handleSubmit() {
    if (!businessCode.trim()) {
      onRequested("İşletme kodu zorunludur.");
      return;
    }

    if (!username.trim()) {
      onRequested("Kullanıcı adı zorunludur.");
      return;
    }

    onRequested("Şifre sıfırlama talebi yöneticine gönderildi.");
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-[1.6rem] border border-cyan-400/25 bg-cyan-400/10 p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--missio-primary)] text-white">
            <KeyRound size={23} />
          </div>

          <div>
            <h3 className="text-base font-black text-[var(--missio-text-main)]">
              Şifremi Unuttum
            </h3>
            <p className="text-xs font-bold leading-5 text-[var(--missio-text-muted)]">
              İşletme kodu ve kullanıcı adına göre yöneticine şifre sıfırlama talebi gönderilir.
            </p>
          </div>
        </div>
      </div>

      <section className="rounded-[1.5rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-4 shadow-sm">
        <div className="mb-3 flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-500/10 text-[var(--missio-primary)]">
            <Building2 size={22} />
          </div>

          <div>
            <h4 className="text-sm font-black text-[var(--missio-text-main)]">
              İşletme Kodu
            </h4>
            <p className="mt-1 text-xs font-bold leading-5 text-[var(--missio-text-muted)]">
              Bağlı olduğun işletmenin giriş kodu.
            </p>
          </div>
        </div>

        <input
          value={businessCode}
          placeholder=""
          onChange={(event) => setBusinessCode(event.target.value)}
          className="h-12 w-full rounded-2xl border border-[var(--missio-border)] bg-[var(--missio-page-bg)] px-4 text-sm font-black text-[var(--missio-text-main)] outline-none"
        />
      </section>

      <section className="rounded-[1.5rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-4 shadow-sm">
        <div className="mb-3 flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-500/10 text-[var(--missio-primary)]">
            <UserRound size={22} />
          </div>

          <div>
            <h4 className="text-sm font-black text-[var(--missio-text-main)]">
              Kullanıcı Adı
            </h4>
            <p className="mt-1 text-xs font-bold leading-5 text-[var(--missio-text-muted)]">
              Giriş yaparken kullandığın kullanıcı adını yaz.
            </p>
          </div>
        </div>

        <input
          value={username}
          placeholder=""
          onChange={(event) => setUsername(event.target.value)}
          className="h-12 w-full rounded-2xl border border-[var(--missio-border)] bg-[var(--missio-page-bg)] px-4 text-sm font-black text-[var(--missio-text-main)] outline-none"
        />
      </section>

      <section className="rounded-[1.5rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-4 shadow-sm">
        <div className="mb-3 flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-500/10 text-[var(--missio-primary)]">
            <ShieldAlert size={22} />
          </div>

          <div>
            <h4 className="text-sm font-black text-[var(--missio-text-main)]">
              Talep Notu
            </h4>
            <p className="mt-1 text-xs font-bold leading-5 text-[var(--missio-text-muted)]">
              Bu not işletme sahibi veya yöneticinin ekranında görünecek.
            </p>
          </div>
        </div>

        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={4}
          className="w-full resize-none rounded-2xl border border-[var(--missio-border)] bg-[var(--missio-page-bg)] p-4 text-sm font-bold leading-6 text-[var(--missio-text-main)] outline-none"
        />
      </section>

      <button
        type="button"
        onClick={handleSubmit}
        className="flex min-h-14 items-center justify-center gap-2 rounded-[1.4rem] bg-[var(--missio-primary)] px-4 py-3 text-sm font-black text-white shadow-lg shadow-cyan-500/20 active:scale-95"
      >
        <Send size={18} />
        Talebi Gönder
      </button>
    </div>
  );
}


