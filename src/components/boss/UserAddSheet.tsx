import { useEffect, useState } from "react";
import {
  BadgeCheck,
  KeyRound,
  Mail,
  Phone,
  ShieldCheck,
  UserPlus,
  UserRound,
  UsersRound,
} from "lucide-react";
import {
  createBusinessUserForBusiness,
  listBusinessManagers,
  type BusinessManagerOption,
  type CreateBusinessUserRole,
} from "../../lib/businessUserData";

type UserAddSheetProps = {
  businessId: string;
  onCreated: (message: string) => void;
};

const roleOptions: Array<{
  value: CreateBusinessUserRole;
  label: string;
}> = [
  {
    value: "manager",
    label: "Yönetici",
  },
  {
    value: "staff",
    label: "Personel",
  },
];

export function UserAddSheet({ businessId, onCreated }: UserAddSheetProps) {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<CreateBusinessUserRole>("staff");
  const [temporaryPassword, setTemporaryPassword] = useState("Missio1234!");
  const [managerUid, setManagerUid] = useState("");
  const [managers, setManagers] = useState<BusinessManagerOption[]>([]);
  const [isLoadingManagers, setIsLoadingManagers] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function loadManagers() {
      if (!businessId.trim()) {
        setManagers([]);
        return;
      }

      try {
        setIsLoadingManagers(true);

        const managerList = await listBusinessManagers(businessId);

        if (!isCancelled) {
          setManagers(managerList);
        }
      } catch (error) {
        console.error(error);

        if (!isCancelled) {
          setManagers([]);
          setMessage("Yönetici listesi okunamadı.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingManagers(false);
        }
      }
    }

    void loadManagers();

    return () => {
      isCancelled = true;
    };
  }, [businessId]);

  useEffect(() => {
    if (role === "manager") {
      setManagerUid("");
    }
  }, [role]);

  async function handleSubmit() {
    setMessage("");

    if (!businessId.trim()) {
      setMessage("Aktif işletme bilgisi bulunamadı. Lütfen çıkış yapıp tekrar giriş yap.");
      return;
    }

    if (!displayName.trim()) {
      setMessage("Ad soyad alanı zorunludur.");
      return;
    }

    if (!username.trim()) {
      setMessage("Kullanıcı adı zorunludur.");
      return;
    }

    if (!email.trim()) {
      setMessage("E-posta alanı zorunludur.");
      return;
    }

    if (role === "staff" && !managerUid.trim()) {
      setMessage("Personel için bağlı yönetici seçilmelidir.");
      return;
    }

    if (!temporaryPassword.trim() || temporaryPassword.trim().length < 6) {
      setMessage("Geçici şifre en az 6 karakter olmalıdır.");
      return;
    }

    try {
      setIsSubmitting(true);

      const createdUser = await createBusinessUserForBusiness({
        businessId,
        displayName,
        username,
        email,
        phone,
        role,
        temporaryPassword,
        managerUid: role === "staff" ? managerUid : undefined,
      });

      const roleLabel = createdUser.role === "manager" ? "Yönetici" : "Personel";

      setDisplayName("");
      setUsername("");
      setEmail("");
      setPhone("");
      setRole("staff");
      setTemporaryPassword("Missio1234!");
      setManagerUid("");

      onCreated(
        `${roleLabel} oluşturuldu. Kullanıcı adı: ${createdUser.username}`,
      );
    } catch (error) {
      if (error instanceof Error && error.message) {
        setMessage(error.message);
        return;
      }

      setMessage("Kullanıcı oluşturulamadı.");
    } finally {
      setIsSubmitting(false);
    }
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
              {businessId} işletmesine yönetici veya personel hesabı oluştur.
            </p>
          </div>
        </div>
      </div>

      {message ? (
        <div className="rounded-[1.4rem] border border-red-400/30 bg-red-400/10 p-4 text-sm font-black leading-6 text-red-500">
          {message}
        </div>
      ) : null}

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
          value={displayName}
          placeholder="Örn: Mehmet Yılmaz"
          onChange={(event) => setDisplayName(event.target.value)}
          className="h-12 w-full rounded-2xl border border-[var(--missio-border)] bg-[var(--missio-page-bg)] px-4 text-sm font-black text-[var(--missio-text-main)] outline-none"
        />
      </section>

      <section className="rounded-[1.5rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-4 shadow-sm">
        <div className="mb-3 flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-500/10 text-[var(--missio-primary)]">
            <UserRound size={22} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[var(--missio-primary)] px-2 py-0.5 text-[0.65rem] font-black text-white">
                2
              </span>
              <h4 className="text-sm font-black text-[var(--missio-text-main)]">
                Kullanıcı Adı
              </h4>
            </div>
            <p className="mt-1 text-xs font-bold leading-5 text-[var(--missio-text-muted)]">
              Giriş ekranında işletme koduyla birlikte kullanılacak kısa ad.
            </p>
          </div>
        </div>

        <input
          value={username}
          placeholder="Örn: mehmet"
          onChange={(event) => setUsername(event.target.value)}
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
                3
              </span>
              <h4 className="text-sm font-black text-[var(--missio-text-main)]">
                E-posta
              </h4>
            </div>
            <p className="mt-1 text-xs font-bold leading-5 text-[var(--missio-text-muted)]">
              Firebase Auth hesabı bu e-posta ile oluşturulur.
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
            <Phone size={22} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[var(--missio-primary)] px-2 py-0.5 text-[0.65rem] font-black text-white">
                4
              </span>
              <h4 className="text-sm font-black text-[var(--missio-text-main)]">
                Telefon
              </h4>
            </div>
            <p className="mt-1 text-xs font-bold leading-5 text-[var(--missio-text-muted)]">
              İsteğe bağlı iletişim numarası.
            </p>
          </div>
        </div>

        <input
          value={phone}
          placeholder="Örn: 0533 000 00 00"
          onChange={(event) => setPhone(event.target.value)}
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
                5
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

      {role === "staff" ? (
        <section className="rounded-[1.5rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-4 shadow-sm">
          <div className="mb-3 flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-500/10 text-[var(--missio-primary)]">
              <UsersRound size={22} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[var(--missio-primary)] px-2 py-0.5 text-[0.65rem] font-black text-white">
                  6
                </span>
                <h4 className="text-sm font-black text-[var(--missio-text-main)]">
                  Bağlı Yönetici
                </h4>
              </div>
              <p className="mt-1 text-xs font-bold leading-5 text-[var(--missio-text-muted)]">
                Personel sadece seçilen yöneticinin altında görünecek.
              </p>
            </div>
          </div>

          {isLoadingManagers ? (
            <div className="rounded-2xl bg-[var(--missio-page-bg)] p-4 text-xs font-black text-[var(--missio-text-muted)]">
              Yönetici listesi okunuyor...
            </div>
          ) : null}

          {!isLoadingManagers && managers.length === 0 ? (
            <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-xs font-black leading-5 text-amber-500">
              Personel oluşturmak için önce en az bir yönetici oluşturmalısın.
            </div>
          ) : null}

          {managers.length > 0 ? (
            <div className="grid gap-2">
              {managers.map((manager) => (
                <button
                  key={manager.uid}
                  type="button"
                  onClick={() => setManagerUid(manager.uid)}
                  className={[
                    "rounded-2xl border p-4 text-left transition active:scale-95",
                    managerUid === manager.uid
                      ? "border-[var(--missio-primary)] bg-cyan-500/10"
                      : "border-[var(--missio-border)] bg-[var(--missio-page-bg)]",
                  ].join(" ")}
                >
                  <strong className="block text-sm font-black text-[var(--missio-text-main)]">
                    {manager.displayName || manager.username || manager.email}
                  </strong>
                  <span className="mt-1 block text-xs font-bold text-[var(--missio-text-muted)]">
                    {manager.username ? `${manager.username} · ` : ""}
                    {manager.email}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-[1.5rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-4 shadow-sm">
        <div className="mb-3 flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-500/10 text-[var(--missio-primary)]">
            <KeyRound size={22} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[var(--missio-primary)] px-2 py-0.5 text-[0.65rem] font-black text-white">
                {role === "staff" ? "7" : "6"}
              </span>
              <h4 className="text-sm font-black text-[var(--missio-text-main)]">
                Geçici Şifre
              </h4>
            </div>
            <p className="mt-1 text-xs font-bold leading-5 text-[var(--missio-text-muted)]">
              Kullanıcı ilk girişini bu şifreyle yapacak.
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
              Kayıt Yeri
            </h4>
            <p className="mt-1 text-xs font-bold leading-5 text-[var(--missio-text-muted)]">
              Kullanıcı Firebase Auth, users, members ve usernames kayıtlarına yazılacak.
            </p>
          </div>
        </div>
      </section>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting || (role === "staff" && managers.length === 0)}
        className="min-h-14 rounded-[1.4rem] bg-[var(--missio-primary)] px-4 py-3 text-sm font-black text-white shadow-lg shadow-cyan-500/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Kullanıcı Oluşturuluyor..." : "Kullanıcı Oluştur"}
      </button>
    </div>
  );
}