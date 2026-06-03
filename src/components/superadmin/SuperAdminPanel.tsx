import { useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import {
  BarChart3,
  Building2,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Database,
  KeyRound,
  Loader2,
  Plus,
  RefreshCcw,
  Settings,
  ShieldCheck,
  Store,
  UserRound,
  UsersRound,
  XCircle,
  type LucideIcon,
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

type SuperAdminTab =
  | "overview"
  | "businesses"
  | "create"
  | "users"
  | "passwords"
  | "subscriptions"
  | "system";

const tabs: Array<{
  id: SuperAdminTab;
  label: string;
  icon: LucideIcon;
}> = [
  { id: "overview", label: "Genel", icon: BarChart3 },
  { id: "businesses", label: "İşletmeler", icon: Building2 },
  { id: "create", label: "Yeni İşletme", icon: Plus },
  { id: "users", label: "Kullanıcılar", icon: UsersRound },
  { id: "passwords", label: "Şifre", icon: KeyRound },
  { id: "subscriptions", label: "Abonelik", icon: CreditCard },
  { id: "system", label: "Sistem", icon: Settings },
];

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function plusDaysIsoDate(dayCount: number) {
  const date = new Date();
  date.setDate(date.getDate() + dayCount);
  return date.toISOString().slice(0, 10);
}

function getPlanLabel(plan: string) {
  if (plan === "demo") return "Demo";
  if (plan === "pro") return "Pro";
  return "Lite";
}

function getSubscriptionLabel(status: string) {
  if (status === "trial") return "Deneme";
  if (status === "suspended") return "Askıda";
  if (status === "cancelled") return "İptal";
  return "Aktif";
}

function MetricCard({
  title,
  value,
  note,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  note: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-[1.6rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-500/10 text-[var(--missio-primary)]">
          <Icon size={22} />
        </div>
      </div>

      <p className="text-2xl font-black text-[var(--missio-text-main)]">
        {value}
      </p>

      <h4 className="mt-1 text-sm font-black text-[var(--missio-text-main)]">
        {title}
      </h4>

      <p className="mt-1 text-xs font-bold leading-5 text-[var(--missio-text-muted)]">
        {note}
      </p>
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  icon: LucideIcon;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div>
        <p className="text-xs font-black uppercase tracking-wide text-[var(--missio-primary)]">
          {eyebrow}
        </p>
        <h3 className="mt-1 text-xl font-black tracking-tight text-[var(--missio-text-main)]">
          {title}
        </h3>
      </div>

      <Icon className="text-[var(--missio-primary)]" size={24} />
    </div>
  );
}

function TextInput({
  label,
  icon: Icon,
  value,
  type = "text",
  onChange,
}: {
  label: string;
  icon: LucideIcon;
  value: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-black text-[var(--missio-text-main)]">
      {label}
      <div className="flex h-12 items-center gap-3 rounded-2xl border border-[var(--missio-border)] bg-[var(--missio-page-bg)] px-4">
        <Icon size={19} className="text-[var(--missio-primary)]" />
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-sm font-black text-[var(--missio-text-main)] outline-none"
        />
      </div>
    </label>
  );
}

function BusinessCard({ business }: { business: BusinessListItem }) {
  const isActive = business.status === "active";

  return (
    <article className="rounded-[1.5rem] border border-[var(--missio-border)] bg-[var(--missio-page-bg)] p-4">
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

        <span
          className={[
            "flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[0.65rem] font-black",
            isActive
              ? "bg-emerald-500/10 text-emerald-500"
              : "bg-slate-500/10 text-slate-400",
          ].join(" ")}
        >
          {isActive ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
          {business.status}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-[var(--missio-card-bg)] p-3">
          <span className="block text-[0.65rem] font-black text-[var(--missio-text-muted)]">
            Plan
          </span>
          <strong className="mt-1 block text-xs font-black text-[var(--missio-text-main)]">
            {getPlanLabel(business.plan)}
          </strong>
        </div>

        <div className="rounded-2xl bg-[var(--missio-card-bg)] p-3">
          <span className="block text-[0.65rem] font-black text-[var(--missio-text-muted)]">
            Abonelik
          </span>
          <strong className="mt-1 block text-xs font-black text-[var(--missio-text-main)]">
            {getSubscriptionLabel(business.subscriptionStatus)}
          </strong>
        </div>

        <div className="rounded-2xl bg-[var(--missio-card-bg)] p-3">
          <span className="block text-[0.65rem] font-black text-[var(--missio-text-muted)]">
            Limit
          </span>
          <strong className="mt-1 block text-xs font-black text-[var(--missio-text-main)]">
            {business.maxUsers}
          </strong>
        </div>
      </div>

      {business.subscriptionEndDate ? (
        <p className="mt-3 text-xs font-bold text-[var(--missio-text-muted)]">
          Bitiş: {business.subscriptionEndDate}
        </p>
      ) : null}
    </article>
  );
}

export function SuperAdminPanel({ currentUser }: SuperAdminPanelProps) {
  const [activeTab, setActiveTab] = useState<SuperAdminTab>("overview");
  const [businessCode, setBusinessCode] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [plan, setPlan] = useState("lite");
  const [subscriptionStatus, setSubscriptionStatus] = useState("trial");
  const [subscriptionStartDate, setSubscriptionStartDate] = useState(todayIsoDate());
  const [subscriptionEndDate, setSubscriptionEndDate] = useState(plusDaysIsoDate(14));
  const [maxUsers, setMaxUsers] = useState("10");

  const [businesses, setBusinesses] = useState<BusinessListItem[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const stats = useMemo(() => {
    const total = businesses.length;
    const active = businesses.filter((business) => business.status === "active").length;
    const passive = total - active;
    const trial = businesses.filter(
      (business) => business.subscriptionStatus === "trial",
    ).length;
    const pro = businesses.filter((business) => business.plan === "pro").length;

    return {
      total,
      active,
      passive,
      trial,
      pro,
      passwordRequests: 0,
    };
  }, [businesses]);

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

      const numericMaxUsers = Number(maxUsers);

      const createdBusiness = await createBusinessFromSuperAdmin({
        businessCode,
        businessName,
        ownerEmail,
        plan,
        subscriptionStatus,
        subscriptionStartDate,
        subscriptionEndDate,
        maxUsers: Number.isFinite(numericMaxUsers) ? numericMaxUsers : 10,
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
      setPlan("lite");
      setSubscriptionStatus("trial");
      setSubscriptionStartDate(todayIsoDate());
      setSubscriptionEndDate(plusDaysIsoDate(14));
      setMaxUsers("10");
      setMessage("İşletme başarıyla oluşturuldu.");
      setActiveTab("businesses");
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
          İşletme, kullanıcı, şifre talebi ve abonelik yönetimi bu merkezden yapılır.
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
            <p className="text-2xl font-black">{stats.total}</p>
            <span className="mt-1 block text-[0.7rem] font-black text-slate-200">
              İşletme
            </span>
          </div>

          <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
            <p className="text-2xl font-black">{stats.trial}</p>
            <span className="mt-1 block text-[0.7rem] font-black text-slate-200">
              Deneme
            </span>
          </div>

          <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
            <p className="text-2xl font-black">{stats.passwordRequests}</p>
            <span className="mt-1 block text-[0.7rem] font-black text-slate-200">
              Şifre
            </span>
          </div>
        </div>
      </section>

      <nav className="overflow-x-auto rounded-[1.7rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-2">
        <div className="flex min-w-max gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const selected = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={[
                  "flex min-h-11 items-center gap-2 rounded-2xl px-3 text-xs font-black transition active:scale-95",
                  selected
                    ? "bg-[var(--missio-primary)] text-white"
                    : "bg-[var(--missio-page-bg)] text-[var(--missio-text-muted)]",
                ].join(" ")}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      {message ? (
        <div className="rounded-[1.5rem] border border-cyan-400/30 bg-cyan-400/10 p-4 text-sm font-black text-[var(--missio-primary)]">
          {message}
        </div>
      ) : null}

      {activeTab === "overview" ? (
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              title="Toplam İşletme"
              value={stats.total}
              note="Sistemdeki tüm işletmeler"
              icon={Building2}
            />
            <MetricCard
              title="Aktif İşletme"
              value={stats.active}
              note="Kullanımı açık olanlar"
              icon={CheckCircle2}
            />
            <MetricCard
              title="Pasif İşletme"
              value={stats.passive}
              note="Askıya alınanlar"
              icon={XCircle}
            />
            <MetricCard
              title="Pro Plan"
              value={stats.pro}
              note="Üst plan müşteriler"
              icon={CreditCard}
            />
          </div>

          <section className="rounded-[2rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-5">
            <SectionTitle
              eyebrow="Son İşletmeler"
              title="Kısa Liste"
              icon={Store}
            />

            {businesses.length === 0 ? (
              <p className="rounded-[1.4rem] bg-[var(--missio-page-bg)] p-4 text-sm font-black text-[var(--missio-text-muted)]">
                Henüz işletme yok.
              </p>
            ) : (
              <div className="grid gap-3">
                {businesses.slice(0, 3).map((business) => (
                  <BusinessCard key={business.businessId} business={business} />
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}

      {activeTab === "businesses" ? (
        <section className="rounded-[2rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <SectionTitle
              eyebrow="İşletmeler"
              title="Kayıtlı İşletmeler"
              icon={Building2}
            />

            <button
              type="button"
              onClick={() => void loadBusinesses()}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[var(--missio-border)] bg-[var(--missio-page-bg)] text-[var(--missio-text-main)] active:scale-95"
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
                <BusinessCard key={business.businessId} business={business} />
              ))}
            </div>
          )}
        </section>
      ) : null}

      {activeTab === "create" ? (
        <section className="rounded-[2rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-5">
          <SectionTitle
            eyebrow="Yeni İşletme"
            title="İşletme ve Abonelik Oluştur"
            icon={Plus}
          />

          <div className="grid gap-3">
            <TextInput
              label="İşletme Kodu"
              icon={Store}
              value={businessCode}
              onChange={setBusinessCode}
            />

            <TextInput
              label="İşletme Adı"
              icon={Building2}
              value={businessName}
              onChange={setBusinessName}
            />

            <TextInput
              label="Patron E-posta"
              icon={UserRound}
              value={ownerEmail}
              type="email"
              onChange={setOwnerEmail}
            />

            <div className="grid gap-2">
              <span className="text-sm font-black text-[var(--missio-text-main)]">
                Plan
              </span>

              <div className="grid grid-cols-3 gap-2">
                {["demo", "lite", "pro"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPlan(item)}
                    className={[
                      "min-h-11 rounded-2xl border px-3 text-xs font-black active:scale-95",
                      plan === item
                        ? "border-[var(--missio-primary)] bg-[var(--missio-primary)] text-white"
                        : "border-[var(--missio-border)] bg-[var(--missio-page-bg)] text-[var(--missio-text-main)]",
                    ].join(" ")}
                  >
                    {getPlanLabel(item)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <span className="text-sm font-black text-[var(--missio-text-main)]">
                Abonelik Durumu
              </span>

              <div className="grid grid-cols-2 gap-2">
                {[
                  ["trial", "Deneme"],
                  ["active", "Aktif"],
                  ["suspended", "Askıda"],
                  ["cancelled", "İptal"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSubscriptionStatus(value)}
                    className={[
                      "min-h-11 rounded-2xl border px-3 text-xs font-black active:scale-95",
                      subscriptionStatus === value
                        ? "border-[var(--missio-primary)] bg-[var(--missio-primary)] text-white"
                        : "border-[var(--missio-border)] bg-[var(--missio-page-bg)] text-[var(--missio-text-main)]",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <TextInput
              label="Abonelik Başlangıç"
              icon={CalendarClock}
              value={subscriptionStartDate}
              type="date"
              onChange={setSubscriptionStartDate}
            />

            <TextInput
              label="Abonelik Bitiş"
              icon={CalendarClock}
              value={subscriptionEndDate}
              type="date"
              onChange={setSubscriptionEndDate}
            />

            <TextInput
              label="Kullanıcı Limiti"
              icon={UsersRound}
              value={maxUsers}
              type="number"
              onChange={setMaxUsers}
            />

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
      ) : null}

      {activeTab === "users" ? (
        <section className="rounded-[2rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-5">
          <SectionTitle
            eyebrow="Kullanıcı Yönetimi"
            title="Patron, Yönetici ve Personel"
            icon={UsersRound}
          />
          <p className="rounded-[1.4rem] bg-[var(--missio-page-bg)] p-4 text-sm font-bold leading-6 text-[var(--missio-text-muted)]">
            Bu bölümde işletmeye göre kullanıcı listesi, rol değişikliği, aktif/pasif kullanıcı ve geçici şifre verme işlemleri olacak.
          </p>
        </section>
      ) : null}

      {activeTab === "passwords" ? (
        <section className="rounded-[2rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-5">
          <SectionTitle
            eyebrow="Şifre Talepleri"
            title="Şifremi Unuttum Yönetimi"
            icon={KeyRound}
          />
          <p className="rounded-[1.4rem] bg-[var(--missio-page-bg)] p-4 text-sm font-bold leading-6 text-[var(--missio-text-muted)]">
            İşletme kodu ve kullanıcı adına göre gelen şifre sıfırlama talepleri burada listelenecek.
          </p>
        </section>
      ) : null}

      {activeTab === "subscriptions" ? (
        <section className="rounded-[2rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-5">
          <SectionTitle
            eyebrow="Abonelik Yönetimi"
            title="Plan, Süre ve Limitler"
            icon={CreditCard}
          />
          <p className="rounded-[1.4rem] bg-[var(--missio-page-bg)] p-4 text-sm font-bold leading-6 text-[var(--missio-text-muted)]">
            Demo, Lite, Pro planları; abonelik bitiş tarihi, kullanıcı limiti ve askıya alma işlemleri bu bölümde yönetilecek.
          </p>
        </section>
      ) : null}

      {activeTab === "system" ? (
        <section className="rounded-[2rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-5">
          <SectionTitle
            eyebrow="Sistem"
            title="Bağlantı ve Yönetim Durumu"
            icon={Settings}
          />

          <div className="grid gap-3">
            <div className="rounded-[1.4rem] bg-[var(--missio-page-bg)] p-4">
              <div className="flex items-center gap-3">
                <Database size={21} className="text-[var(--missio-primary)]" />
                <div>
                  <h4 className="text-sm font-black text-[var(--missio-text-main)]">
                    Firestore
                  </h4>
                  <p className="mt-1 text-xs font-bold text-[var(--missio-text-muted)]">
                    Bağlantı aktif.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.4rem] bg-[var(--missio-page-bg)] p-4">
              <div className="flex items-center gap-3">
                <ShieldCheck size={21} className="text-[var(--missio-primary)]" />
                <div>
                  <h4 className="text-sm font-black text-[var(--missio-text-main)]">
                    Süperadmin
                  </h4>
                  <p className="mt-1 text-xs font-bold text-[var(--missio-text-muted)]">
                    {currentUser.email}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}