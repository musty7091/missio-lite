import { useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  CheckCircle2,
  Clock,
  Mail,
  Pencil,
  Phone,
  Save,
  ShieldCheck,
  ToggleLeft,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

type StaffRole = "manager" | "staff";
type StaffStatus = "active" | "passive";

type StaffMember = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: StaffRole;
  status: StaffStatus;
  todayTasks: number;
  completedTasks: number;
};

const initialStaffList: StaffMember[] = [
  {
    id: "ahmet-personel",
    name: "Ahmet Personel",
    email: "ahmet@ertanmarket.com",
    phone: "0533 000 00 01",
    role: "staff",
    status: "active",
    todayTasks: 0,
    completedTasks: 0,
  },
  {
    id: "ali-personel",
    name: "Ali Personel",
    email: "ali@ertanmarket.com",
    phone: "0533 000 00 02",
    role: "staff",
    status: "active",
    todayTasks: 0,
    completedTasks: 0,
  },
  {
    id: "demo-manager",
    name: "Demo Manager",
    email: "manager@ertanmarket.com",
    phone: "0533 000 00 03",
    role: "manager",
    status: "active",
    todayTasks: 0,
    completedTasks: 0,
  },
];

function getRoleLabel(role: StaffRole) {
  if (role === "manager") {
    return "Yönetici";
  }

  return "Personel";
}

function getStatusLabel(status: StaffStatus) {
  if (status === "active") {
    return "Aktif";
  }

  return "Pasif";
}

function getStatusClass(status: StaffStatus) {
  if (status === "active") {
    return "bg-emerald-500/10 text-emerald-500";
  }

  return "bg-slate-500/10 text-slate-400";
}

export function StaffListSheet() {
  const [staffList, setStaffList] = useState<StaffMember[]>(initialStaffList);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const editingStaff = useMemo(
    () => staffList.find((staff) => staff.id === editingStaffId) ?? null,
    [editingStaffId, staffList],
  );

  const [draftName, setDraftName] = useState("");
  const [draftEmail, setDraftEmail] = useState("");
  const [draftPhone, setDraftPhone] = useState("");
  const [draftRole, setDraftRole] = useState<StaffRole>("staff");
  const [draftStatus, setDraftStatus] = useState<StaffStatus>("active");

  function startEdit(staff: StaffMember) {
    setMessage("");
    setEditingStaffId(staff.id);
    setDraftName(staff.name);
    setDraftEmail(staff.email);
    setDraftPhone(staff.phone);
    setDraftRole(staff.role);
    setDraftStatus(staff.status);
  }

  function cancelEdit() {
    setEditingStaffId(null);
  }

  function saveEdit() {
    if (!editingStaff) {
      return;
    }

    if (!draftName.trim()) {
      setMessage("Ad soyad boş bırakılamaz.");
      return;
    }

    if (!draftEmail.trim()) {
      setMessage("E-posta boş bırakılamaz.");
      return;
    }

    setStaffList((currentList) =>
      currentList.map((staff) =>
        staff.id === editingStaff.id
          ? {
              ...staff,
              name: draftName.trim(),
              email: draftEmail.trim(),
              phone: draftPhone.trim(),
              role: draftRole,
              status: draftStatus,
            }
          : staff,
      ),
    );

    setEditingStaffId(null);
    setMessage("Personel bilgileri güncellendi.");
  }

  if (editingStaff) {
    return (
      <div className="grid gap-4">
        <div className="rounded-[1.6rem] border border-cyan-400/25 bg-cyan-400/10 p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--missio-primary)] text-white">
              <Pencil size={23} />
            </div>

            <div>
              <h3 className="text-base font-black text-[var(--missio-text-main)]">
                Personel Düzenle
              </h3>
              <p className="text-xs font-bold leading-5 text-[var(--missio-text-muted)]">
                Bilgi, rol ve aktiflik durumunu buradan güncelle.
              </p>
            </div>
          </div>
        </div>

        {message ? (
          <div className="rounded-[1.4rem] border border-red-400/30 bg-red-400/10 p-4 text-sm font-black text-red-500">
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
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            className="h-12 w-full rounded-2xl border border-[var(--missio-border)] bg-[var(--missio-page-bg)] px-4 text-sm font-black text-[var(--missio-text-main)] outline-none"
          />
        </section>

        <section className="rounded-[1.5rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-4 shadow-sm">
          <div className="mb-3 flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-500/10 text-[var(--missio-primary)]">
              <Mail size={22} />
            </div>

            <div>
              <h4 className="text-sm font-black text-[var(--missio-text-main)]">
                E-posta
              </h4>
              <p className="mt-1 text-xs font-bold leading-5 text-[var(--missio-text-muted)]">
                Kullanıcının giriş hesabı.
              </p>
            </div>
          </div>

          <input
            value={draftEmail}
            onChange={(event) => setDraftEmail(event.target.value)}
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
                Personel iletişim numarası.
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
              <ShieldCheck size={22} />
            </div>

            <div>
              <h4 className="text-sm font-black text-[var(--missio-text-main)]">
                Rol Değişikliği
              </h4>
              <p className="mt-1 text-xs font-bold leading-5 text-[var(--missio-text-muted)]">
                İşletme içindeki yetki seviyesi.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDraftRole("staff")}
              className={[
                "min-h-12 rounded-2xl border px-4 text-sm font-black transition active:scale-95",
                draftRole === "staff"
                  ? "border-[var(--missio-primary)] bg-[var(--missio-primary)] text-white"
                  : "border-[var(--missio-border)] bg-[var(--missio-page-bg)] text-[var(--missio-text-main)]",
              ].join(" ")}
            >
              Personel
            </button>

            <button
              type="button"
              onClick={() => setDraftRole("manager")}
              className={[
                "min-h-12 rounded-2xl border px-4 text-sm font-black transition active:scale-95",
                draftRole === "manager"
                  ? "border-[var(--missio-primary)] bg-[var(--missio-primary)] text-white"
                  : "border-[var(--missio-border)] bg-[var(--missio-page-bg)] text-[var(--missio-text-main)]",
              ].join(" ")}
            >
              Yönetici
            </button>
          </div>
        </section>

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
                Pasif kullanıcılar giriş yapamaz hale getirilecek.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDraftStatus("active")}
              className={[
                "min-h-12 rounded-2xl border px-4 text-sm font-black transition active:scale-95",
                draftStatus === "active"
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "border-[var(--missio-border)] bg-[var(--missio-page-bg)] text-[var(--missio-text-main)]",
              ].join(" ")}
            >
              Aktif
            </button>

            <button
              type="button"
              onClick={() => setDraftStatus("passive")}
              className={[
                "min-h-12 rounded-2xl border px-4 text-sm font-black transition active:scale-95",
                draftStatus === "passive"
                  ? "border-slate-500 bg-slate-500 text-white"
                  : "border-[var(--missio-border)] bg-[var(--missio-page-bg)] text-[var(--missio-text-main)]",
              ].join(" ")}
            >
              Pasif
            </button>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={cancelEdit}
            className="flex min-h-14 items-center justify-center gap-2 rounded-[1.4rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] px-4 py-3 text-sm font-black text-[var(--missio-text-main)] active:scale-95"
          >
            <X size={18} />
            Vazgeç
          </button>

          <button
            type="button"
            onClick={saveEdit}
            className="flex min-h-14 items-center justify-center gap-2 rounded-[1.4rem] bg-[var(--missio-primary)] px-4 py-3 text-sm font-black text-white shadow-lg shadow-cyan-500/20 active:scale-95"
          >
            <Save size={18} />
            Kaydet
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

          <div>
            <h3 className="text-base font-black text-[var(--missio-text-main)]">
              Personel Yönetimi
            </h3>
            <p className="text-xs font-bold leading-5 text-[var(--missio-text-muted)]">
              Personel bilgileri, rol değişikliği ve aktiflik durumu.
            </p>
          </div>
        </div>
      </div>

      {message ? (
        <div className="rounded-[1.4rem] border border-cyan-400/30 bg-cyan-400/10 p-4 text-sm font-black text-[var(--missio-primary)]">
          {message}
        </div>
      ) : null}

      <div className="grid gap-3">
        {staffList.map((staff) => (
          <article
            key={staff.id}
            className="rounded-[1.5rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cyan-500/10 text-[var(--missio-primary)]">
                <UserRound size={22} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="truncate text-sm font-black text-[var(--missio-text-main)]">
                      {staff.name}
                    </h4>
                    <p className="mt-1 truncate text-xs font-bold text-[var(--missio-text-muted)]">
                      {staff.email}
                    </p>
                    <p className="mt-1 truncate text-xs font-bold text-[var(--missio-text-muted)]">
                      {staff.phone}
                    </p>
                  </div>

                  <span
                    className={[
                      "shrink-0 rounded-full px-2.5 py-1 text-[0.65rem] font-black",
                      getStatusClass(staff.status),
                    ].join(" ")}
                  >
                    {getStatusLabel(staff.status)}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-2xl bg-[var(--missio-page-bg)] p-3">
                    <BriefcaseBusiness
                      size={17}
                      className="mb-1 text-[var(--missio-primary)]"
                    />
                    <span className="block text-[0.65rem] font-black text-[var(--missio-text-muted)]">
                      Rol
                    </span>
                    <strong className="mt-1 block text-xs font-black text-[var(--missio-text-main)]">
                      {getRoleLabel(staff.role)}
                    </strong>
                  </div>

                  <div className="rounded-2xl bg-[var(--missio-page-bg)] p-3">
                    <Clock
                      size={17}
                      className="mb-1 text-[var(--missio-primary)]"
                    />
                    <span className="block text-[0.65rem] font-black text-[var(--missio-text-muted)]">
                      Görev
                    </span>
                    <strong className="mt-1 block text-xs font-black text-[var(--missio-text-main)]">
                      {staff.todayTasks}
                    </strong>
                  </div>

                  <div className="rounded-2xl bg-[var(--missio-page-bg)] p-3">
                    <CheckCircle2
                      size={17}
                      className="mb-1 text-[var(--missio-primary)]"
                    />
                    <span className="block text-[0.65rem] font-black text-[var(--missio-text-muted)]">
                      Biten
                    </span>
                    <strong className="mt-1 block text-xs font-black text-[var(--missio-text-main)]">
                      {staff.completedTasks}
                    </strong>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(staff)}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--missio-border)] bg-[var(--missio-page-bg)] px-3 text-xs font-black text-[var(--missio-text-main)] active:scale-95"
                  >
                    <Pencil size={16} />
                    Düzenle
                  </button>

                  <button
                    type="button"
                    onClick={() => startEdit(staff)}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-cyan-500/10 px-3 text-xs font-black text-[var(--missio-primary)] active:scale-95"
                  >
                    <ShieldCheck size={16} />
                    Rol / Durum
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="rounded-[1.5rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-500/10 text-[var(--missio-primary)]">
            <ShieldCheck size={22} />
          </div>

          <div>
            <h4 className="text-sm font-black text-[var(--missio-text-main)]">
              Sonraki Adım
            </h4>
            <p className="mt-1 text-xs font-bold leading-5 text-[var(--missio-text-muted)]">
              Bu yönetim ekranı Firestore member kayıtlarına bağlanacak.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
