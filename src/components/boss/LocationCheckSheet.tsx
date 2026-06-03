import { useState, type ReactNode } from "react";
import {
  BellRing,
  MessageSquareText,
  UserRoundCheck,
} from "lucide-react";

type LocationCheckSheetProps = {
  onRequested: (message: string) => void;
};

const targetUsers = ["Ahmet Personel", "Ali Personel", "Demo Manager"];

function LocationFieldCard({
  icon,
  step,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  step: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.5rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-4 shadow-sm">
      <div className="mb-3 flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-500/10 text-[var(--missio-primary)]">
          {icon}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[var(--missio-primary)] px-2 py-0.5 text-[0.65rem] font-black text-white">
              {step}
            </span>

            <h4 className="text-sm font-black text-[var(--missio-text-main)]">
              {title}
            </h4>
          </div>

          <p className="mt-1 text-xs font-bold leading-5 text-[var(--missio-text-muted)]">
            {description}
          </p>
        </div>
      </div>

      {children}
    </section>
  );
}

export function LocationCheckSheet({ onRequested }: LocationCheckSheetProps) {
  const [targetUser, setTargetUser] = useState("Ahmet Personel");
  const [note, setNote] = useState("Lütfen mevcut konumunu paylaş.");
  const [requestType, setRequestType] = useState<"normal" | "urgent">("normal");

  function handleRequest() {
    onRequested("Konum talebi başarıyla gönderildi.");
  }

  return (
    <div className="grid gap-4">
      <LocationFieldCard
        step="1"
        title="Personel / Yönetici Seçimi"
        description="Konum talebi gönderilecek kişiyi seç."
        icon={<UserRoundCheck size={22} />}
      >
        <select
          value={targetUser}
          onChange={(event) => setTargetUser(event.target.value)}
          className="h-12 w-full rounded-2xl border border-[var(--missio-border)] bg-[var(--missio-page-bg)] px-4 text-sm font-black text-[var(--missio-text-main)] outline-none"
        >
          {targetUsers.map((user) => (
            <option key={user}>{user}</option>
          ))}
        </select>
      </LocationFieldCard>

      <LocationFieldCard
        step="2"
        title="Talep Tipi"
        description="Normal yoklama mı, acil konum talebi mi?"
        icon={<BellRing size={22} />}
      >
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setRequestType("normal")}
            className={[
              "min-h-12 rounded-2xl border px-4 text-sm font-black transition active:scale-95",
              requestType === "normal"
                ? "border-[var(--missio-primary)] bg-[var(--missio-primary)] text-white"
                : "border-[var(--missio-border)] bg-[var(--missio-page-bg)] text-[var(--missio-text-main)]",
            ].join(" ")}
          >
            Normal
          </button>

          <button
            type="button"
            onClick={() => setRequestType("urgent")}
            className={[
              "min-h-12 rounded-2xl border px-4 text-sm font-black transition active:scale-95",
              requestType === "urgent"
                ? "border-red-500 bg-red-500 text-white"
                : "border-[var(--missio-border)] bg-[var(--missio-page-bg)] text-[var(--missio-text-main)]",
            ].join(" ")}
          >
            Acil
          </button>
        </div>
      </LocationFieldCard>

      <LocationFieldCard
        step="3"
        title="Talep Notu"
        description="Personelin göreceği kısa açıklama."
        icon={<MessageSquareText size={22} />}
      >
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={4}
          className="w-full resize-none rounded-2xl border border-[var(--missio-border)] bg-[var(--missio-page-bg)] p-4 text-sm font-bold leading-6 text-[var(--missio-text-main)] outline-none"
        />
      </LocationFieldCard>

      <button
        type="button"
        onClick={handleRequest}
        className="min-h-14 rounded-[1.4rem] bg-[var(--missio-primary)] px-4 py-3 text-sm font-black text-white shadow-lg shadow-cyan-500/20 active:scale-95"
      >
        Konum Talebi Gönder
      </button>
    </div>
  );
}
