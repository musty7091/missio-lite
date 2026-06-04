import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  CheckCircle2,
  Mail,
  Phone,
  RefreshCw,
  Save,
  ShieldCheck,
  ToggleLeft,
  UserCheck,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import {
  listBusinessMembers,
  updateBusinessMemberForBusiness,
  type BusinessManagerOption,
  type BusinessMemberListItem,
  type BusinessMemberStatus,
  type CreateBusinessUserRole,
} from "../../lib/businessUserData";

type StaffListSheetProps = {
  businessId: string;
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

const statusOptions: Array<{
  value: BusinessMemberStatus;
  label: string;
}> = [
  {
    value: "active",
    label: "Aktif",
  },
  {
    value: "passive",
    label: "Pasif",
  },
];

function getStatusLabel(member: BusinessMemberListItem) {
  if (!member.isActive || member.status === "passive") {
    return "Pasif";
  }

  return "Aktif";
}

function getStatusClass(member: BusinessMemberListItem) {
  if (!member.isActive || member.status === "passive") {
    return "bg-slate-500/10 text-slate-400";
  }

  return "bg-emerald-500/10 text-emerald-500";
}

function normalizeStatus(member: BusinessMemberListItem): BusinessMemberStatus {
  if (!member.isActive || member.status === "passive") {
    return "passive";
  }

  return "active";
}

function MemberCard({
  member,
  onEdit,
}: {
  member: BusinessMemberListItem;
  onEdit: (member: BusinessMemberListItem) => void;
}) {
  return (
    <article className="rounded-[1.5rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cyan-500/10 text-[var(--missio-primary)]">
          {member.role === "manager" ? (
            <UserCheck size={22} />
          ) : (
            <UserRound size={22} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="truncate text-sm font-black text-[var(--missio-text-main)]">
                {member.displayName || member.username || member.email}
              </h4>

              <p className="mt-1 truncate text-xs font-bold text-[var(--missio-text-muted)]">
                @{member.username || "kullanici-adi-yok"}
              </p>
            </div>

            <span
              className={[
                "shrink-0 rounded-full px-2.5 py-1 text-[0.65rem] font-black",
                getStatusClass(member),
              ].join(" ")}
            >
              {getStatusLabel(member)}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-[var(--missio-page-bg)] p-3">
              <BriefcaseBusiness
                size={17}
                className="mb-1 text-[var(--missio-primary)]"
              />
              <span className="block text-[0.65rem] font-black text-[var(--missio-text-muted)]">
                Rol
              </span>
              <strong className="mt-1 block text-xs font-black text-[var(--missio-text-main)]">
                {member.roleLabel}
              </strong>
            </div>

            <div className="rounded-2xl bg-[var(--missio-page-bg)] p-3">
              <ShieldCheck
                size={17}
                className="mb-1 text-[var(--missio-primary)]"
              />
              <span className="block text-[0.65rem] font-black text-[var(--missio-text-muted)]">
                Bağlı Yönetici
              </span>
              <strong className="mt-1 block text-xs font-black text-[var(--missio-text-main)]">
                {member.role === "staff"
                  ? member.managerName || "Atanmamış"
                  : "-"}
              </strong>
            </div>
          </div>

          <div className="mt-3 grid gap-2">
            {member.email ? (
              <div className="flex items-center gap-2 rounded-2xl bg-[var(--missio-page-bg)] px-3 py-2 text-xs font-bold text-[var(--missio-text-muted)]">
                <Mail
                  size={15}
                  className="shrink-0 text-[var(--missio-primary)]"
                />
                <span className="truncate">{member.email}</span>
              </div>
            ) : null}

            {member.phone ? (
              <div className="flex items-center gap-2 rounded-2xl bg-[var(--missio-page-bg)] px-3 py-2 text-xs font-bold text-[var(--missio-text-muted)]">
                <Phone
                  size={15}
                  className="shrink-0 text-[var(--missio-primary)]"
                />
                <span className="truncate">{member.phone}</span>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => onEdit(member)}
            className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500/10 px-3 text-xs font-black text-[var(--missio-primary)] active:scale-95"
          >
            <ShieldCheck size={16} />
            Düzenle / Durum Değiştir
          </button>
        </div>
      </div>
    </article>
  );
}

export function StaffListSheet({ businessId }: StaffListSheetProps) {
  const [members, setMembers] = useState<BusinessMemberListItem[]>([]);
  const [selectedMember, setSelectedMember] =
    useState<BusinessMemberListItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [draftDisplayName, setDraftDisplayName] = useState("");
  const [draftPhone, setDraftPhone] = useState("");
  const [draftRole, setDraftRole] = useState<CreateBusinessUserRole>("staff");
  const [draftStatus, setDraftStatus] =
    useState<BusinessMemberStatus>("active");
  const [draftManagerUid, setDraftManagerUid] = useState("");

  const managers = useMemo(
    () =>
      members.filter(
        (member) =>
          member.role === "manager" &&
          member.status !== "passive" &&
          member.isActive !== false,
      ),
    [members],
  );

  const managerOptions = useMemo<BusinessManagerOption[]>(() => {
    return managers
      .filter((manager) => manager.uid !== selectedMember?.uid)
      .map((manager) => ({
        uid: manager.uid,
        displayName: manager.displayName,
        email: manager.email,
        username: manager.username,
      }));
  }, [managers, selectedMember?.uid]);

  const visibleManagers = useMemo(
    () => members.filter((member) => member.role === "manager"),
    [members],
  );

  const staffMembers = useMemo(
    () => members.filter((member) => member.role === "staff"),
    [members],
  );

  async function loadMembers() {
    try {
      setIsLoading(true);
      setMessage("");

      const memberList = await listBusinessMembers(businessId);
      setMembers(memberList);
    } catch (error) {
      console.error(error);
      setMembers([]);
      setMessage("Personel listesi veritabanından okunamadı.");
    } finally {
      setIsLoading(false);
    }
  }

  function startEdit(member: BusinessMemberListItem) {
    if (member.role === "owner") {
      setMessage("Patron hesabı bu ekrandan değiştirilemez.");
      return;
    }

    if (member.role !== "manager" && member.role !== "staff") {
      setMessage("Bu kullanıcı rolü bu ekrandan değiştirilemez.");
      return;
    }

    setMessage("");
    setSelectedMember(member);
    setDraftDisplayName(member.displayName);
    setDraftPhone(member.phone);
    setDraftRole(member.role);
    setDraftStatus(normalizeStatus(member));
    setDraftManagerUid(member.managerUid ?? "");
  }

  function cancelEdit() {
    setSelectedMember(null);
    setMessage("");
  }

  async function saveEdit() {
    if (!selectedMember) {
      return;
    }

    setMessage("");

    if (!draftDisplayName.trim()) {
      setMessage("Ad soyad alanı zorunludur.");
      return;
    }

    if (draftRole === "staff" && !draftManagerUid.trim()) {
      setMessage("Personel için bağlı yönetici seçilmelidir.");
      return;
    }

    try {
      setIsSaving(true);

      await updateBusinessMemberForBusiness({
        businessId,
        targetUid: selectedMember.uid,
        displayName: draftDisplayName,
        phone: draftPhone,
        role: draftRole,
        status: draftStatus,
        managerUid: draftRole === "staff" ? draftManagerUid : undefined,
      });

      setSelectedMember(null);
      await loadMembers();
      setMessage("Kullanıcı bilgileri güncellendi.");
    } catch (error) {
      console.error(error);

      if (error instanceof Error && error.message) {
        setMessage(error.message);
        return;
      }

      setMessage("Kullanıcı güncellenemedi.");
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    void loadMembers();
  }, [businessId]);

  useEffect(() => {
    if (draftRole === "manager") {
      setDraftManagerUid("");
    }
  }, [draftRole]);

  if (selectedMember) {
    return (
      <div className="grid gap-4">
        <div className="rounded-[1.6rem] border border-cyan-400/25 bg-cyan-400/10 p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--missio-primary)] text-white">
              <ShieldCheck size={23} />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-base font-black text-[var(--missio-text-main)]">
                Kullanıcı Düzenle
              </h3>
              <p className="truncate text-xs font-bold leading-5 text-[var(--missio-text-muted)]">
                @{selectedMember.username} · {selectedMember.email}
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
              <h4 className="text-sm font-black text-[var(--missio-text-main)]">
                Ad Soyad
              </h4>
              <p className="mt-1 text-xs font-bold leading-5 text-[var(--missio-text-muted)]">
                Panelde ve görevlerde görünecek isim.
              </p>
            </div>
          </div>

          <input
            value={draftDisplayName}
            onChange={(event) => setDraftDisplayName(event.target.value)}
            className="h-12 w-full rounded-2xl border border-[var(--missio-border)] bg-[var(--missio-page-bg)] px-4 text-sm font-black text-[var(--missio-text-main)] outline-none"
          />
        </section>

        <section className="rounded-[1.5rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-4 shadow-sm">
          <div className="mb-3 flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-500/10 text-[var(--missio-primary)]">
              <Phone size={22} />
            </div>

            <div>
              <h4 className="text-sm font-black text-[var(--missio-text-main)]">
                Telefon
              </h4>
              <p className="mt-1 text-xs font-bold leading-5 text-[var(--missio-text-muted)]">
                İsteğe bağlı iletişim numarası.
              </p>
            </div>
          </div>

          <input
            value={draftPhone}
            onChange={(event) => setDraftPhone(event.target.value)}
            className="h-12 w-full rounded-2xl border border-[var(--missio-border)] bg-[var(--missio-page-bg)] px-4 text-sm font-black text-[var(--missio-text-main)] outline-none"
          />
        </section>

        <section className="rounded-[1.5rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-4 shadow-sm">
          <div className="mb-3 flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-500/10 text-[var(--missio-primary)]">
              <BriefcaseBusiness size={22} />
            </div>

            <div>
              <h4 className="text-sm font-black text-[var(--missio-text-main)]">
                Rol
              </h4>
              <p className="mt-1 text-xs font-bold leading-5 text-[var(--missio-text-muted)]">
                Yönetici veya personel olarak güncellenebilir.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {roleOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setDraftRole(option.value)}
                className={[
                  "min-h-12 rounded-2xl border px-4 text-sm font-black transition active:scale-95",
                  draftRole === option.value
                    ? "border-[var(--missio-primary)] bg-[var(--missio-primary)] text-white"
                    : "border-[var(--missio-border)] bg-[var(--missio-page-bg)] text-[var(--missio-text-main)]",
                ].join(" ")}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        {draftRole === "staff" ? (
          <section className="rounded-[1.5rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-4 shadow-sm">
            <div className="mb-3 flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-500/10 text-[var(--missio-primary)]">
                <UsersRound size={22} />
              </div>

              <div>
                <h4 className="text-sm font-black text-[var(--missio-text-main)]">
                  Bağlı Yönetici
                </h4>
                <p className="mt-1 text-xs font-bold leading-5 text-[var(--missio-text-muted)]">
                  Personel için bağlı yönetici zorunludur.
                </p>
              </div>
            </div>

            {managerOptions.length === 0 ? (
              <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-xs font-black leading-5 text-amber-500">
                Atanabilecek aktif yönetici bulunamadı.
              </div>
            ) : (
              <div className="grid gap-2">
                {managerOptions.map((manager) => (
                  <button
                    key={manager.uid}
                    type="button"
                    onClick={() => setDraftManagerUid(manager.uid)}
                    className={[
                      "rounded-2xl border p-4 text-left transition active:scale-95",
                      draftManagerUid === manager.uid
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
            )}
          </section>
        ) : null}

        <section className="rounded-[1.5rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-4 shadow-sm">
          <div className="mb-3 flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-500/10 text-[var(--missio-primary)]">
              <ToggleLeft size={22} />
            </div>

            <div>
              <h4 className="text-sm font-black text-[var(--missio-text-main)]">
                Kullanıcı Durumu
              </h4>
              <p className="mt-1 text-xs font-bold leading-5 text-[var(--missio-text-muted)]">
                Pasif kullanıcıların Firebase Auth hesabı devre dışı bırakılır.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setDraftStatus(option.value)}
                className={[
                  "min-h-12 rounded-2xl border px-4 text-sm font-black transition active:scale-95",
                  draftStatus === option.value
                    ? "border-[var(--missio-primary)] bg-[var(--missio-primary)] text-white"
                    : "border-[var(--missio-border)] bg-[var(--missio-page-bg)] text-[var(--missio-text-main)]",
                ].join(" ")}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={cancelEdit}
            disabled={isSaving}
            className="flex min-h-14 items-center justify-center gap-2 rounded-[1.4rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] px-4 py-3 text-sm font-black text-[var(--missio-text-main)] active:scale-95 disabled:opacity-60"
          >
            <X size={18} />
            Vazgeç
          </button>

          <button
            type="button"
            onClick={saveEdit}
            disabled={
              isSaving || (draftRole === "staff" && managerOptions.length === 0)
            }
            className="flex min-h-14 items-center justify-center gap-2 rounded-[1.4rem] bg-[var(--missio-primary)] px-4 py-3 text-sm font-black text-white shadow-lg shadow-cyan-500/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? (
              "Kaydediliyor..."
            ) : (
              <>
                <Save size={18} />
                Kaydet
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-[1.6rem] border border-cyan-400/25 bg-cyan-400/10 p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--missio-primary)] text-white">
            <UsersRound size={23} />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-base font-black text-[var(--missio-text-main)]">
              Personel Yönetimi
            </h3>
            <p className="text-xs font-bold leading-5 text-[var(--missio-text-muted)]">
              {businessId} işletmesindeki gerçek Firestore member kayıtları.
            </p>
          </div>

          <button
            type="button"
            onClick={loadMembers}
            disabled={isLoading}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[var(--missio-border)] bg-[var(--missio-card-bg)] text-[var(--missio-primary)] active:scale-95 disabled:opacity-60"
            aria-label="Personel listesini yenile"
          >
            <RefreshCw size={19} />
          </button>
        </div>
      </div>

      {message ? (
        <div className="rounded-[1.4rem] border border-cyan-400/30 bg-cyan-400/10 p-4 text-sm font-black leading-6 text-[var(--missio-primary)]">
          {message}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-[1.5rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-4 text-sm font-black text-[var(--missio-text-muted)]">
          Personel listesi veritabanından okunuyor...
        </div>
      ) : null}

      {!isLoading && members.length === 0 ? (
        <div className="rounded-[1.5rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-4 text-sm font-bold leading-6 text-[var(--missio-text-muted)]">
          Henüz kullanıcı kaydı yok. Yönetici veya personel oluşturduğunda burada görünecek.
        </div>
      ) : null}

      {!isLoading && visibleManagers.length > 0 ? (
        <section className="grid gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-[var(--missio-primary)]">
              Yöneticiler
            </p>
            <h4 className="mt-1 text-lg font-black text-[var(--missio-text-main)]">
              {visibleManagers.length} yönetici
            </h4>
          </div>

          {visibleManagers.map((manager) => (
            <MemberCard key={manager.uid} member={manager} onEdit={startEdit} />
          ))}
        </section>
      ) : null}

      {!isLoading && staffMembers.length > 0 ? (
        <section className="grid gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-[var(--missio-primary)]">
              Personeller
            </p>
            <h4 className="mt-1 text-lg font-black text-[var(--missio-text-main)]">
              {staffMembers.length} personel
            </h4>
          </div>

          {staffMembers.map((staffMember) => (
            <MemberCard
              key={staffMember.uid}
              member={staffMember}
              onEdit={startEdit}
            />
          ))}
        </section>
      ) : null}

      {!isLoading && members.length > 0 ? (
        <div className="rounded-[1.5rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-500/10 text-[var(--missio-primary)]">
              <CheckCircle2 size={22} />
            </div>

            <div>
              <h4 className="text-sm font-black text-[var(--missio-text-main)]">
                Canlı Veri
              </h4>
              <p className="mt-1 text-xs font-bold leading-5 text-[var(--missio-text-muted)]">
                Bu liste Firestore members kayıtlarından okunuyor. Düzenleme işlemleri Cloud Function üzerinden yapılır.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}