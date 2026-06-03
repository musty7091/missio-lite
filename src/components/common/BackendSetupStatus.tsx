import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { Cloud, Database, TriangleAlert } from "lucide-react";
import { ensureInitialErtanMarketData } from "../../lib/missioData";

type BackendSetupStatusProps = {
  currentUser: User;
};

type StatusState = "loading" | "ready" | "error";

export function BackendSetupStatus({ currentUser }: BackendSetupStatusProps) {
  const [status, setStatus] = useState<StatusState>("loading");
  const [message, setMessage] = useState("Firestore bağlantısı kontrol ediliyor...");

  useEffect(() => {
    let isMounted = true;

    async function setupData() {
      try {
        const result = await ensureInitialErtanMarketData(currentUser);

        if (!isMounted) {
          return;
        }

        setStatus("ready");
        setMessage(
          `${result.businessName} backend verileri hazır. ${result.demoMemberCount} demo personel kaydı oluşturuldu.`,
        );
      } catch (error) {
        console.error(error);

        if (!isMounted) {
          return;
        }

        setStatus("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "Firestore bağlantısında hata oluştu.",
        );
      }
    }

    void setupData();

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  if (status === "loading") {
    return (
      <div className="mb-4 rounded-[1.4rem] border border-[var(--missio-border)] bg-[var(--missio-card-bg)] p-4">
        <div className="flex items-center gap-3">
          <Cloud size={21} className="text-[var(--missio-primary)]" />
          <p className="text-sm font-black text-[var(--missio-text-muted)]">
            {message}
          </p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mb-4 rounded-[1.4rem] border border-red-400/30 bg-red-400/10 p-4">
        <div className="flex items-center gap-3">
          <TriangleAlert size={21} className="text-red-500" />
          <p className="text-sm font-black text-red-500">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-[1.4rem] border border-cyan-400/30 bg-cyan-400/10 p-4">
      <div className="flex items-center gap-3">
        <Database size={21} className="text-[var(--missio-primary)]" />
        <p className="text-sm font-black text-[var(--missio-primary)]">
          {message}
        </p>
      </div>
    </div>
  );
}
