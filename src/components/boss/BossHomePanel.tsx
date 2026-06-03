import { useState } from "react";
import {
  BarChart3,
  ClipboardCheck,
  FileCheck2,
  MapPin,
  PlusSquare,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { ActionSheet } from "../common/ActionSheet";
import { TaskAssignSheet } from "./TaskAssignSheet";
import { LocationCheckSheet } from "./LocationCheckSheet";
import { UserAddSheet } from "./UserAddSheet";
import { StaffListSheet } from "./StaffListSheet";

type BossHomePanelProps = {
  businessName: string;
  businessId: string;
  onGoToReports: () => void;
  onGoToApprovals: () => void;
  onGoToProfile: () => void;
};

type ActiveSheet = "task" | "location" | "user" | "staff" | null;

const summaryItems = [
  {
    label: "Bugünkü Görev",
    value: "0",
    note: "Firestore bağlanınca canlı veri",
  },
  {
    label: "Onay Bekleyen",
    value: "0",
    note: "Kontrol bekleyen iş yok",
  },
  {
    label: "Konum İsteği",
    value: "0",
    note: "Aktif yoklama yok",
  },
];

export function BossHomePanel({
  businessName,
  businessId,
  onGoToReports,
  onGoToApprovals,
  onGoToProfile,
}: BossHomePanelProps) {
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);
  const [lastMessage, setLastMessage] = useState("");

  void onGoToProfile;

  function closeSheet() {
    setActiveSheet(null);
  }

  function showMessage(message: string) {
    setLastMessage(message);
    closeSheet();
  }

  return (
    <div className="grid gap-4">
      <section className="overflow-hidden rounded-[2rem] bg-slate-950 p-5 text-white shadow-2xl shadow-slate-900/20 dark:bg-slate-950">
        <p className="text-xs font-black uppercase tracking-wide text-cyan-300">
          Günlük Özet
        </p>

        <h2 className="mt-2 text-3xl font-black tracking-tight">
          {businessName}
        </h2>

        <p className="mt-2 text-sm font-bold leading-6 text-slate-300">
          İşletme kodu: {businessId}. Görev atama, konum yoklama, kullanıcı ekleme ve personel listesi panelleri veritabanı yapısına bağlanacak.
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {summaryItems.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10"
            >
              <p className="text-2xl font-black">{item.value}</p>
              <span className="mt-1 block text-[0.7rem] font-black text-slate-200">
                {item.label}
              </span>
              <small className="mt-1 block text-[0.62rem] font-bold leading-4 text-slate-400">
                {item.note}
              </small>
            </div>
          ))}
        </div>
      </section>

      {lastMessage ? (
        <div className="rounded-[1.5rem] border border-cyan-400/30 bg-cyan-400/10 p-4 text-sm font-black text-[var(--missio-primary)]">
          {lastMessage}
        </div>
      ) : null}

      <section className="rounded-[2rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-5 shadow-xl shadow-slate-900/5 dark:shadow-black/25">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-[var(--missio-primary)]">
              Hızlı İşlemler
            </p>
            <h3 className="mt-1 text-xl font-black tracking-tight text-[var(--missio-text-main)]">
              Patron Paneli
            </h3>
          </div>

          <ClipboardCheck className="text-[var(--missio-primary)]" size={24} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className="boss-action-card"
            onClick={() => setActiveSheet("task")}
          >
            <PlusSquare size={23} />
            <strong>Görev Ata</strong>
            <span>Personele görev oluştur</span>
          </button>

          <button
            type="button"
            className="boss-action-card"
            onClick={() => setActiveSheet("location")}
          >
            <MapPin size={23} />
            <strong>Konum İste</strong>
            <span>Manuel yoklama başlat</span>
          </button>

          <button
            type="button"
            className="boss-action-card"
            onClick={() => setActiveSheet("user")}
          >
            <UserPlus size={23} />
            <strong>Kullanıcı Ekle</strong>
            <span>Personel hesabı hazırla</span>
          </button>

          <button
            type="button"
            className="boss-action-card"
            onClick={onGoToApprovals}
          >
            <FileCheck2 size={23} />
            <strong>Onaylar</strong>
            <span>Tamamlanan işleri kontrol et</span>
          </button>

          <button
            type="button"
            className="boss-action-card"
            onClick={onGoToReports}
          >
            <BarChart3 size={23} />
            <strong>Raporlar</strong>
            <span>Son 14 günü incele</span>
          </button>

          <button
            type="button"
            className="boss-action-card"
            onClick={() => setActiveSheet("staff")}
          >
            <UsersRound size={23} />
            <strong>Personel</strong>
            <span>Ekip durumunu gör</span>
          </button>
        </div>
      </section>

      <section className="rounded-[2rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-5 shadow-xl shadow-slate-900/5 dark:shadow-black/25">
        <p className="text-xs font-black uppercase tracking-wide text-[var(--missio-primary)]">
          Bugünkü İş Akışı
        </p>

        <h3 className="mt-1 text-xl font-black tracking-tight text-[var(--missio-text-main)]">
          Henüz canlı görev yok
        </h3>

        <p className="mt-2 text-sm font-bold leading-6 text-[var(--missio-text-muted)]">
          Görev listesi ana ekranda uzamayacak. Detaylar panel içinde açılacak.
        </p>
      </section>

      <ActionSheet
        title="Görev Ata"
        isOpen={activeSheet === "task"}
        onClose={closeSheet}
      >
        <TaskAssignSheet onCreated={showMessage} />
      </ActionSheet>

      <ActionSheet
        title="Konum İste"
        isOpen={activeSheet === "location"}
        onClose={closeSheet}
      >
        <LocationCheckSheet onRequested={showMessage} />
      </ActionSheet>

      <ActionSheet
        title="Kullanıcı Ekle"
        isOpen={activeSheet === "user"}
        onClose={closeSheet}
      >
        <UserAddSheet businessId={businessId} onCreated={showMessage} />
      </ActionSheet>

      <ActionSheet
        title="Personel"
        isOpen={activeSheet === "staff"}
        onClose={closeSheet}
      >
        <StaffListSheet />
      </ActionSheet>
    </div>
  );
}
