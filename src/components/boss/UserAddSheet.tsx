import { useState } from "react";
import {
  BadgeCheck,
  KeyRound,
  Mail,
  ShieldCheck,
  UserPlus,
  UserRound,
} from "lucide-react";

type UserAddSheetProps = {
  onCreated: (message: string) => void;
};

const roleOptions = [
  {
    value: "manager",
    label: "Yönetici",
  },
  {
    value: "staff",
    label: "Personel",
  },
];

export function UserAddSheet({ onCreated }: UserAddSheetProps) {
  const [fullName, setFullName] = useState("Yeni Personel");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("staff");
  const [temporaryPassword, setTemporaryPassword] = useState("Missio123!");

  function handleSubmit() {
    if (!fullName.trim()) {
      onCreated("Ad soyad alanı zorunludur.");
      return;
    }

    if (!email.trim()) {
      onCreated("E-posta alanı zorunludur.");
      return;
    }

    onCreated("Kullanıcı oluşturma isteği hazırlandı.");
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-[1.6rem] border border-cyan-400/25 bg-cyan-400/10 p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--missio-primary)] text-white">
            <UserPlus size={23} />
          </div>

          <div>
            <h3 className="text-base font-black text-[var(--missio-text-main)]">
              Kullanıcı Ekle
            </h3>
            <p className="text-xs font-bold leading-5 text-[var(--missio-text-muted)]">
              Personel veya yönetici hesabı hazırlama paneli.
            </p>
          </div>
        </div>
      </div>

      <section className="rounded-[1.5rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-4 shadow-sm">
        <div className="mb-3 flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-500/10 text-[var(--missio-primary)]">
            <UserRound size={22} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[var(--missio-primary)] px-2 py-0.5 text-[0.65rem] font-black text-white">
                1
              </span>
              <h4 className="text-sm font-black text-[var(--missio-text-main)]">
                Ad Soyad
              </h4>
            </div>
            <p className="mt-1 text-xs font-bold leading-5 text-[var(--missio-text-muted)]">
              Kullanıcının panelde görünecek adı.
            </p>
          </div>
        </div>

        <input
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          className="h-12 w-full rounded-2xl border border-[var(--missio-border)] bg-[var(--missio-page-bg)] px-4 text-sm font-black text-[var(--missio-text-main)] outline-none"
        />
      </section>

      <section className="rounded-[1.5rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-4 shadow-sm">
        <div className="mb-3 flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-500/10 text-[var(--missio-primary)]">
            <Mail size={22} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[var(--missio-primary)] px-2 py-0.5 text-[0.65rem] font-black text-white">
                2
              </span>
              <h4 className="text-sm font-black text-[var(--missio-text-main)]">
                E-posta
              </h4>
            </div>
            <p className="mt-1 text-xs font-bold leading-5 text-[var(--missio-text-muted)]">
              Kullanıcının giriş yapacağı e-posta adresi.
            </p>
          </div>
        </div>

        <input
          type="email"
          value={email}
          placeholder="personel@firma.com"
          onChange={(event) => setEmail(event.target.value)}
          className="h-12 w-full rounded-2xl border border-[var(--missio-border)] bg-[var(--missio-page-bg)] px-4 text-sm font-black text-[var(--missio-text-main)] outline-none"
        />
      </section>

      <section className="rounded-[1.5rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-4 shadow-sm">
        <div className="mb-3 flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-500/10 text-[var(--missio-primary)]">
            <ShieldCheck size={22} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[var(--missio-primary)] px-2 py-0.5 text-[0.65rem] font-black text-white">
                3
              </span>
              <h4 className="text-sm font-black text-[var(--missio-text-main)]">
                Rol
              </h4>
            </div>
            <p className="mt-1 text-xs font-bold leading-5 text-[var(--missio-text-muted)]">
              Kullanıcının işletme içindeki yetkisi.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {roleOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setRole(option.value)}
              className={[
                "min-h-12 rounded-2xl border px-4 text-sm font-black transition active:scale-95",
                role === option.value
                  ? "border-[var(--missio-primary)] bg-[var(--missio-primary)] text-white"
                  : "border-[var(--missio-border)] bg-[var(--missio-page-bg)] text-[var(--missio-text-main)]",
              ].join(" ")}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-4 shadow-sm">
        <div className="mb-3 flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-500/10 text-[var(--missio-primary)]">
            <KeyRound size={22} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[var(--missio-primary)] px-2 py-0.5 text-[0.65rem] font-black text-white">
                4
              </span>
              <h4 className="text-sm font-black text-[var(--missio-text-main)]">
                Geçici Şifre
              </h4>
            </div>
            <p className="mt-1 text-xs font-bold leading-5 text-[var(--missio-text-muted)]">
              İlk giriş için geçici şifre.
            </p>
          </div>
        </div>

        <input
          value={temporaryPassword}
          onChange={(event) => setTemporaryPassword(event.target.value)}
          className="h-12 w-full rounded-2xl border border-[var(--missio-border)] bg-[var(--missio-page-bg)] px-4 text-sm font-black text-[var(--missio-text-main)] outline-none"
        />
      </section>

      <section className="rounded-[1.5rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-500/10 text-[var(--missio-primary)]">
            <BadgeCheck size={22} />
          </div>

          <div>
            <h4 className="text-sm font-black text-[var(--missio-text-main)]">
              Sonraki Teknik Adım
            </h4>
            <p className="mt-1 text-xs font-bold leading-5 text-[var(--missio-text-muted)]">
              Bu form Cloud Function ile Firebase Auth kullanıcısı ve Firestore member kaydı oluşturacak.
            </p>
          </div>
        </div>
      </section>

      <button
        type="button"
        onClick={handleSubmit}
        className="min-h-14 rounded-[1.4rem] bg-[var(--missio-primary)] px-4 py-3 text-sm font-black text-white shadow-lg shadow-cyan-500/20 active:scale-95"
      >
        Kullanıcıyı Hazırla
      </button>
    </div>
  );
}
