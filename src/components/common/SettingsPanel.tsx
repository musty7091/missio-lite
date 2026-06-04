import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import {
  BellRing,
  Eye,
  EyeOff,
  Globe2,
  KeyRound,
  LogOut,
  Mail,
  ShieldCheck,
  Store,
  UserRound,
} from "lucide-react";
import { PushNotificationCard } from "./PushNotificationCard";

const LANGUAGE_STORAGE_KEY = "missio-lite-language";

type SettingsPanelProps = {
  currentUser: User;
  businessId: string;
  businessName: string;
  roleLabel: string;
  onLogout: () => void;
};

function SettingsInfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[var(--missio-page-bg)] p-4">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-cyan-500/10 text-[var(--missio-primary)]">
        {icon}
      </div>

      <div className="min-w-0">
        <span className="block text-xs font-black uppercase tracking-wide text-[var(--missio-text-muted)]">
          {label}
        </span>
        <strong className="mt-1 block break-all text-sm font-black text-[var(--missio-text-main)]">
          {value || "-"}
        </strong>
      </div>
    </div>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  visible,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-black uppercase tracking-wide text-[var(--missio-text-muted)]">
        {label}
      </span>

      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 rounded-2xl border border-[var(--missio-border)] bg-[var(--missio-page-bg)] px-4 py-3 text-sm font-black text-[var(--missio-text-main)] outline-none focus:border-[var(--missio-primary)]"
      />
    </label>
  );
}

export function SettingsPanel({
  currentUser,
  businessId,
  businessName,
  roleLabel,
  onLogout,
}: SettingsPanelProps) {
  const [language, setLanguage] = useState("tr");
  const [message, setMessage] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordRepeat, setNewPasswordRepeat] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);

    if (savedLanguage === "tr" || savedLanguage === "en") {
      setLanguage(savedLanguage);
    }
  }, []);

  function handleLanguageChange(nextLanguage: string) {
    setLanguage(nextLanguage);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    setMessage("Dil tercihi kaydedildi. Metinlerin tamamı sonraki fazda bu tercihe bağlanacak.");
  }

  async function handleChangePassword() {
    if (!currentUser.email) {
      setMessage("Bu kullanıcı için e-posta bilgisi bulunamadı.");
      return;
    }

    if (!currentPassword.trim() || !newPassword.trim() || !newPasswordRepeat.trim()) {
      setMessage("Şifre değiştirmek için tüm şifre alanlarını doldur.");
      return;
    }

    if (newPassword.length < 6) {
      setMessage("Yeni şifre en az 6 karakter olmalı.");
      return;
    }

    if (newPassword !== newPasswordRepeat) {
      setMessage("Yeni şifre ve tekrar alanı aynı değil.");
      return;
    }

    try {
      setIsChangingPassword(true);
      setMessage("");

      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword,
      );

      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);

      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordRepeat("");
      setMessage("Şifren başarıyla güncellendi.");
    } catch (error) {
      console.error(error);
      setMessage("Şifre güncellenemedi. Mevcut şifreni ve yeni şifreyi kontrol et.");
    } finally {
      setIsChangingPassword(false);
    }
  }

  return (
    <div className="grid gap-4">
      <section className="rounded-[1.6rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cyan-500/10 text-[var(--missio-primary)]">
            <UserRound size={23} />
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-wide text-[var(--missio-primary)]">
              Ayarlar
            </p>
            <h2 className="mt-1 text-xl font-black text-[var(--missio-text-main)]">
              Profil ve Sistem Ayarları
            </h2>
            <p className="mt-2 text-sm font-bold leading-6 text-[var(--missio-text-muted)]">
              Bildirim, şifre, dil ve hesap bilgilerini buradan yönet.
            </p>
          </div>
        </div>
      </section>

      {message ? (
        <div className="rounded-[1.4rem] border border-cyan-400/30 bg-cyan-400/10 p-4 text-sm font-black leading-6 text-[var(--missio-primary)]">
          {message}
        </div>
      ) : null}

      <section className="grid gap-3 rounded-[1.6rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-4">
        <div className="flex items-center gap-2">
          <ShieldCheck size={19} className="text-[var(--missio-primary)]" />
          <h3 className="text-base font-black text-[var(--missio-text-main)]">
            Kullanıcı Bilgileri
          </h3>
        </div>

        <SettingsInfoCard icon={<Mail size={19} />} label="E-posta" value={currentUser.email ?? ""} />
        <SettingsInfoCard icon={<Store size={19} />} label="İşletme" value={`${businessName} · ${businessId}`} />
        <SettingsInfoCard icon={<UserRound size={19} />} label="Rol" value={roleLabel} />
      </section>

      <section className="grid gap-3 rounded-[1.6rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-4">
        <div className="flex items-center gap-2">
          <BellRing size={19} className="text-[var(--missio-primary)]" />
          <h3 className="text-base font-black text-[var(--missio-text-main)]">
            Bildirim Ayarları
          </h3>
        </div>

        <PushNotificationCard businessId={businessId} />
      </section>

      <section className="grid gap-3 rounded-[1.6rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <KeyRound size={19} className="text-[var(--missio-primary)]" />
            <h3 className="text-base font-black text-[var(--missio-text-main)]">
              Şifre Değiştir
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setShowPasswords((current) => !current)}
            className="grid h-10 w-10 place-items-center rounded-2xl border border-[var(--missio-border)] bg-[var(--missio-page-bg)] text-[var(--missio-text-main)]"
            aria-label="Şifreleri göster/gizle"
          >
            {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <PasswordInput
          label="Mevcut Şifre"
          value={currentPassword}
          onChange={setCurrentPassword}
          visible={showPasswords}
        />

        <PasswordInput
          label="Yeni Şifre"
          value={newPassword}
          onChange={setNewPassword}
          visible={showPasswords}
        />

        <PasswordInput
          label="Yeni Şifre Tekrar"
          value={newPasswordRepeat}
          onChange={setNewPasswordRepeat}
          visible={showPasswords}
        />

        <button
          type="button"
          onClick={handleChangePassword}
          disabled={isChangingPassword}
          className="min-h-12 rounded-2xl bg-[var(--missio-primary)] px-4 py-3 text-sm font-black text-white active:scale-[0.99] disabled:opacity-60"
        >
          {isChangingPassword ? "Güncelleniyor..." : "Şifremi Güncelle"}
        </button>
      </section>

      <section className="grid gap-3 rounded-[1.6rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-4">
        <div className="flex items-center gap-2">
          <Globe2 size={19} className="text-[var(--missio-primary)]" />
          <h3 className="text-base font-black text-[var(--missio-text-main)]">
            Dil Seçimi
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleLanguageChange("tr")}
            className={[
              "min-h-12 rounded-2xl border px-4 py-3 text-sm font-black active:scale-[0.99]",
              language === "tr"
                ? "border-[var(--missio-primary)] bg-cyan-500/10 text-[var(--missio-primary)]"
                : "border-[var(--missio-border)] bg-[var(--missio-page-bg)] text-[var(--missio-text-main)]",
            ].join(" ")}
          >
            Türkçe
          </button>

          <button
            type="button"
            onClick={() => handleLanguageChange("en")}
            className={[
              "min-h-12 rounded-2xl border px-4 py-3 text-sm font-black active:scale-[0.99]",
              language === "en"
                ? "border-[var(--missio-primary)] bg-cyan-500/10 text-[var(--missio-primary)]"
                : "border-[var(--missio-border)] bg-[var(--missio-page-bg)] text-[var(--missio-text-main)]",
            ].join(" ")}
          >
            English
          </button>
        </div>
      </section>

      <button
        type="button"
        onClick={onLogout}
        className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-black text-red-500 active:scale-[0.99]"
      >
        <LogOut size={18} />
        Çıkış Yap
      </button>
    </div>
  );
}