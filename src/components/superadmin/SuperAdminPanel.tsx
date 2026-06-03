import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import {
  Building2,
  CheckCircle2,
  Loader2,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Store,
  UserRound,
} from "lucide-react";
import {
  createBusinessFromSuperAdmin,
  ensureSuperAdminProfile,
  listBusinessesForSuperAdmin,
  type BusinessListItem,
} from "../../lib/superAdminData";

type SuperAdminPanelProps = {
  currentUser: User;
};

export function SuperAdminPanel({ currentUser }: SuperAdminPanelProps) {
  const [businessCode, setBusinessCode] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [businesses, setBusinesses] = useState<BusinessListItem[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  async function loadBusinesses() {
    setIsLoading(true);
    setMessage("");

    try {
      await ensureSuperAdminProfile(currentUser);
      const businessList = await listBusinessesForSuperAdmin();
      setBusinesses(businessList);
      setMessage("Süperadmin paneli hazır.");
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Süperadmin verileri okunamadı.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadBusinesses();
  }, [currentUser]);

  async function handleCreateBusiness() {
    setMessage("");

    try {
      setIsSaving(true);

      const createdBusiness = await createBusinessFromSuperAdmin({
        businessCode,
        businessName,
        ownerEmail,
      });

      setBusinesses((currentBusinesses) => {
        const withoutSameBusiness = currentBusinesses.filter(
          (business) => business.businessId !== createdBusiness.businessId,
        );

        return [...withoutSameBusiness, createdBusiness].sort((a, b) =>
          a.businessName.localeCompare(b.businessName, "tr"),
        );
      });

      setBusinessCode("");
      setBusinessName("");
      setOwnerEmail("");
      setMessage("İşletme başarıyla oluşturuldu.");
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error
          ? error.message
          : "İşletme oluşturulamadı.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-4">
      <section className="overflow-hidden rounded-[2rem] bg-slate-950 p-5 text-white shadow-2xl shadow-slate-900/20 dark:bg-slate-950">
        <p className="text-xs font-black uppercase tracking-wide text-cyan-300">
          Missio Yönetim
        </p>

        <h2 className="mt-2 text-3xl font-black tracking-tight">
          Süperadmin Paneli
        </h2>

        <p className="mt-2 text-sm font-bold leading-6 text-slate-300">
          İşletme oluşturma, işletme listesi ve sistem yönetimi bu ekrandan yapılır.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
            <p className="text-2xl font-black">{businesses.length}</p>
            <span className="mt-1 block text-[0.7rem] font-black text-slate-200">
              İşletme
            </span>
          </div>

          <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
            <p className="text-2xl font-black">SA</p>
            <span className="mt-1 block text-[0.7rem] font-black text-slate-200">
              Yetki
            </span>
          </div>
        </div>
      </section>

      {message ? (
        <div className="rounded-[1.5rem] border border-cyan-400/30 bg-cyan-400/10 p-4 text-sm font-black text-[var(--missio-primary)]">
          {message}
        </div>
      ) : null}

      <section className="rounded-[2rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-5 shadow-xl shadow-slate-900/5 dark:shadow-black/25">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-[var(--missio-primary)]">
              Yeni İşletme
            </p>
            <h3 className="mt-1 text-xl font-black tracking-tight text-[var(--missio-text-main)]">
              İşletme Oluştur
            </h3>
          </div>

          <Building2 className="text-[var(--missio-primary)]" size={24} />
        </div>

        <div className="grid gap-3">
          <label className="grid gap-2 text-sm font-black text-[var(--missio-text-main)]">
            İşletme Kodu
            <div className="flex h-12 items-center gap-3 rounded-2xl border border-[var(--missio-border)] bg-[var(--missio-page-bg)] px-4">
              <Store size={19} className="text-[var(--missio-primary)]" />
              <input
                value={businessCode}
                onChange={(event) => setBusinessCode(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm font-black text-[var(--missio-text-main)] outline-none"
              />
            </div>
          </label>

          <label className="grid gap-2 text-sm font-black text-[var(--missio-text-main)]">
            İşletme Adı
            <div className="flex h-12 items-center gap-3 rounded-2xl border border-[var(--missio-border)] bg-[var(--missio-page-bg)] px-4">
              <Building2 size={19} className="text-[var(--missio-primary)]" />
              <input
                value={businessName}
                onChange={(event) => setBusinessName(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm font-black text-[var(--missio-text-main)] outline-none"
              />
            </div>
          </label>

          <label className="grid gap-2 text-sm font-black text-[var(--missio-text-main)]">
            Patron E-posta
            <div className="flex h-12 items-center gap-3 rounded-2xl border border-[var(--missio-border)] bg-[var(--missio-page-bg)] px-4">
              <UserRound size={19} className="text-[var(--missio-primary)]" />
              <input
                type="email"
                value={ownerEmail}
                onChange={(event) => setOwnerEmail(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm font-black text-[var(--missio-text-main)] outline-none"
              />
            </div>
          </label>

          <button
            type="button"
            onClick={handleCreateBusiness}
            disabled={isSaving}
            className="mt-2 flex min-h-14 items-center justify-center gap-2 rounded-[1.4rem] bg-[var(--missio-primary)] px-4 py-3 text-sm font-black text-white shadow-lg shadow-cyan-500/20 active:scale-95 disabled:opacity-70"
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            {isSaving ? "Oluşturuluyor..." : "İşletme Oluştur"}
          </button>
        </div>
      </section>

      <section className="rounded-[2rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-5 shadow-xl shadow-slate-900/5 dark:shadow-black/25">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-[var(--missio-primary)]">
              İşletmeler
            </p>
            <h3 className="mt-1 text-xl font-black tracking-tight text-[var(--missio-text-main)]">
              Kayıtlı İşletmeler
            </h3>
          </div>

          <button
            type="button"
            onClick={() => void loadBusinesses()}
            className="grid h-11 w-11 place-items-center rounded-2xl border border-[var(--missio-border)] bg-[var(--missio-page-bg)] text-[var(--missio-text-main)] active:scale-95"
          >
            <RefreshCcw size={18} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-3 rounded-[1.4rem] bg-[var(--missio-page-bg)] p-4 text-sm font-black text-[var(--missio-text-muted)]">
            <Loader2 size={18} className="animate-spin text-[var(--missio-primary)]" />
            İşletmeler yükleniyor...
          </div>
        ) : businesses.length === 0 ? (
          <div className="rounded-[1.4rem] bg-[var(--missio-page-bg)] p-4 text-sm font-black text-[var(--missio-text-muted)]">
            Henüz işletme yok.
          </div>
        ) : (
          <div className="grid gap-3">
            {businesses.map((business) => (
              <article
                key={business.businessId}
                className="rounded-[1.5rem] border border-[var(--missio-border)] bg-[var(--missio-page-bg)] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="truncate text-sm font-black text-[var(--missio-text-main)]">
                      {business.businessName}
                    </h4>

                    <p className="mt-1 text-xs font-bold text-[var(--missio-text-muted)]">
                      Kod: {business.businessCode}
                    </p>

                    <p className="mt-1 truncate text-xs font-bold text-[var(--missio-text-muted)]">
                      Patron: {business.ownerEmail || "Henüz atanmadı"}
                    </p>
                  </div>

                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[0.65rem] font-black text-emerald-500">
                    <CheckCircle2 size={13} />
                    {business.status}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-[1.5rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-500/10 text-[var(--missio-primary)]">
            <ShieldCheck size={22} />
          </div>

          <div>
            <h4 className="text-sm font-black text-[var(--missio-text-main)]">
              Not
            </h4>
            <p className="mt-1 text-xs font-bold leading-5 text-[var(--missio-text-muted)]">
              Bu panel işletme kaydını oluşturur. Patron Auth hesabı oluşturma işlemi sonraki adımda Cloud Function ile bağlanacak.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
