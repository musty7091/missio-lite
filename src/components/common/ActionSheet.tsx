import type { ReactNode } from "react";
import { X } from "lucide-react";

type ActionSheetProps = {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
};

export function ActionSheet({ title, isOpen, onClose, children }: ActionSheetProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <section className="max-h-[88vh] w-full max-w-[520px] overflow-hidden rounded-[2rem] border border-[var(--missio-border)] bg-[var(--missio-page-bg)] shadow-2xl shadow-black/40">
        <header className="flex items-center justify-between gap-3 border-b border-[var(--missio-border)] bg-[var(--missio-card-bg)] px-4 py-3">
          <h2 className="text-base font-black text-[var(--missio-text-main)]">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--missio-page-bg)] text-[var(--missio-text-main)] active:scale-95"
            aria-label="Kapat"
          >
            <X size={20} />
          </button>
        </header>

        <div className="max-h-[calc(88vh-72px)] overflow-y-auto p-4">
          {children}
        </div>
      </section>
    </div>
  );
}
