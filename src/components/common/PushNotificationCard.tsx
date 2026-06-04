import { useEffect, useState } from "react";
import { BellRing, CheckCircle2, Smartphone, Volume2 } from "lucide-react";
import {
  disablePushNotificationsForBusiness,
  enablePushNotificationsForBusiness,
  getCurrentNotificationPermission,
  isPushNotificationSupported,
} from "../../lib/pushNotificationData";

type PushNotificationCardProps = {
  businessId: string;
};

function getPushStorageKey(businessId: string) {
  return `missio-lite-push-enabled-${businessId}`;
}

export function PushNotificationCard({ businessId }: PushNotificationCardProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<string>("unknown");
  const [isEnabled, setIsEnabled] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isCancelled = false;

    async function checkSupport() {
      const supported = await isPushNotificationSupported();

      if (isCancelled) {
        return;
      }

      const currentPermission = getCurrentNotificationPermission();
      const savedEnabled =
        window.localStorage.getItem(getPushStorageKey(businessId)) === "1";

      setIsSupported(supported);
      setPermission(currentPermission);
      setIsEnabled(supported && currentPermission === "granted" && savedEnabled);
    }

    void checkSupport();

    return () => {
      isCancelled = true;
    };
  }, [businessId]);

  async function handleToggle() {
    try {
      setIsWorking(true);
      setMessage("");

      if (isEnabled) {
        await disablePushNotificationsForBusiness(businessId);

        window.localStorage.removeItem(getPushStorageKey(businessId));
        setIsEnabled(false);
        setPermission(getCurrentNotificationPermission());
        setMessage("Bu cihazda Missio bildirimleri kapatıldı.");
        return;
      }

      await enablePushNotificationsForBusiness(businessId);

      window.localStorage.setItem(getPushStorageKey(businessId), "1");
      setIsEnabled(true);
      setPermission(getCurrentNotificationPermission());
      setMessage("Bu cihazda Missio bildirimleri açıldı.");
    } catch (error) {
      console.error(error);

      const errorMessage =
        error instanceof Error && error.message ? error.message : "Bilinmeyen hata.";

      setMessage(`Bildirim ayarı değiştirilemedi: ${errorMessage}`);
      setPermission(getCurrentNotificationPermission());
    } finally {
      setIsWorking(false);
    }
  }

  if (!isSupported) {
    return (
      <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm font-black leading-6 text-red-500">
        Bu tarayıcı Web Push bildirimlerini desteklemiyor.
      </div>
    );
  }

  const isDenied = permission === "denied";

  return (
    <div className="rounded-[1.4rem] border border-[var(--missio-border)] bg-[var(--missio-page-bg)] p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={[
              "grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white",
              isEnabled ? "bg-emerald-500" : "bg-amber-500",
            ].join(" ")}
          >
            {isEnabled ? <CheckCircle2 size={21} /> : <BellRing size={21} />}
          </div>

          <div className="min-w-0">
            <strong className="block text-sm font-black text-[var(--missio-text-main)]">
              Sesli Bildirimler
            </strong>

            <p className="mt-1 text-xs font-bold leading-5 text-[var(--missio-text-muted)]">
              Görev, onay, red ve konum yoklama bildirimleri bu cihazda alınır.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggle}
          disabled={isWorking || isDenied}
          aria-pressed={isEnabled}
          className={[
            "relative h-8 w-14 shrink-0 rounded-full transition disabled:opacity-60",
            isEnabled ? "bg-emerald-500" : "bg-slate-500/40",
          ].join(" ")}
        >
          <span
            className={[
              "absolute top-1 h-6 w-6 rounded-full bg-white transition",
              isEnabled ? "left-7" : "left-1",
            ].join(" ")}
          />
        </button>
      </div>

      <div className="mt-3 grid gap-2 rounded-2xl bg-white/5 p-3 text-xs font-bold leading-5 text-[var(--missio-text-muted)]">
        <span className="flex items-center gap-2">
          <Smartphone size={15} />
          iPhone için siteyi Ana Ekrana Eklemen gerekir.
        </span>
        <span className="flex items-center gap-2">
          <Volume2 size={15} />
          Ses/titreşim cihaz bildirim ayarına bağlıdır.
        </span>
      </div>

      {isDenied ? (
        <p className="mt-3 text-xs font-black leading-5 text-red-500">
          Tarayıcı bildirim izni engellenmiş. Bildirim açmak için tarayıcı/site ayarlarından izin vermen gerekir.
        </p>
      ) : null}

      {message ? (
        <p className="mt-3 text-xs font-black leading-5 text-[var(--missio-primary)]">
          {message}
        </p>
      ) : null}
    </div>
  );
}