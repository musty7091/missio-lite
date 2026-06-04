import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import {
  Camera,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Flag,
  ImagePlus,
  ListChecks,
  Mic,
  PenLine,
  PlayCircle,
  RefreshCw,
  ShieldCheck,
  Square,
  Trash2,
  UserRound,
} from "lucide-react";
import {
  createBusinessTaskForBusiness,
  listAssignableTaskMembers,
  type AssignableTaskMember,
  type TaskPriority,
  type TaskType,
} from "../../lib/businessTaskData";

type TaskAssignSheetProps = {
  businessId: string;
  onCreated: (message: string) => void;
};

const priorityOptions: TaskPriority[] = ["Normal", "Önemli", "Acil", "Kritik"];

function FieldCard({
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

export function TaskAssignSheet({ businessId, onCreated }: TaskAssignSheetProps) {
  const [assignableMembers, setAssignableMembers] = useState<AssignableTaskMember[]>([]);
  const [assignedToUid, setAssignedToUid] = useState("");
  const [taskType, setTaskType] = useState<TaskType>("Rutin");
  const [title, setTitle] = useState("Raf düzeni kontrolü");
  const [description, setDescription] = useState(
    "Sorumlu olduğu rafların düzen ve temizlik kontrolü yapılsın.",
  );
  const [dueDate, setDueDate] = useState("");
  const [referenceImageName, setReferenceImageName] = useState("");
  const [referenceImageUrl, setReferenceImageUrl] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("Normal");
  const [requiresPhoto, setRequiresPhoto] = useState(true);
  const [requiresApproval, setRequiresApproval] = useState(true);
  const [message, setMessage] = useState("");
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState("");
  const [audioMessage, setAudioMessage] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadAssignableMembers() {
      try {
        setIsLoadingMembers(true);
        setMessage("");

        const members = await listAssignableTaskMembers(businessId);

        if (!isCancelled) {
          setAssignableMembers(members);

          if (members.length > 0) {
            setAssignedToUid((current) => current || members[0].uid);
          }
        }
      } catch (error) {
        console.error(error);

        if (!isCancelled) {
          setAssignableMembers([]);
          setAssignedToUid("");
          setMessage("Görev atanacak kullanıcı listesi okunamadı.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingMembers(false);
        }
      }
    }

    void loadAssignableMembers();

    return () => {
      isCancelled = true;
    };
  }, [businessId]);

  useEffect(() => {
    return () => {
      if (referenceImageUrl) {
        URL.revokeObjectURL(referenceImageUrl);
      }

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }

      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }

      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, [audioUrl, referenceImageUrl]);

  function handleReferenceImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (referenceImageUrl) {
      URL.revokeObjectURL(referenceImageUrl);
    }

    setReferenceImageName(file.name);
    setReferenceImageUrl(URL.createObjectURL(file));
  }

  function removeReferenceImage() {
    if (referenceImageUrl) {
      URL.revokeObjectURL(referenceImageUrl);
    }

    setReferenceImageName("");
    setReferenceImageUrl("");
  }

  async function startRecording() {
    setAudioMessage("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setAudioMessage("Bu tarayıcı ses kaydını desteklemiyor.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      audioChunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }

        setAudioUrl(URL.createObjectURL(audioBlob));
        setIsRecording(false);

        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };

      setRecordingSeconds(0);
      setIsRecording(true);
      mediaRecorder.start();

      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((current) => {
          if (current >= 29) {
            stopRecording();
            return 30;
          }

          return current + 1;
        });
      }, 1000);
    } catch (error) {
      console.error(error);
      setAudioMessage("Mikrofon izni alınamadı.");
      setIsRecording(false);
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }

    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsRecording(false);
  }

  function removeAudio() {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    setAudioUrl("");
    setRecordingSeconds(0);
    setAudioMessage("");
  }

  function handleRequiresPhotoToggle() {
    setRequiresPhoto((current) => {
      const nextValue = !current;

      if (nextValue) {
        setRequiresApproval(true);
      }

      return nextValue;
    });
  }

  function handleRequiresApprovalToggle() {
    if (requiresPhoto) {
      setRequiresApproval(true);
      return;
    }

    setRequiresApproval((current) => !current);
  }


  async function handleSubmit() {
    setMessage("");

    if (!assignedToUid.trim()) {
      setMessage("Görev atanacak kullanıcı seçilmelidir.");
      return;
    }

    if (!title.trim()) {
      setMessage("Görev ismi boş bırakılamaz.");
      return;
    }

    try {
      setIsSubmitting(true);

      const task = await createBusinessTaskForBusiness({
        businessId,
        assignedToUid,
        title,
        description,
        taskType,
        priority,
        requiresPhoto,
        requiresApproval: requiresPhoto || requiresApproval,
        referenceImageName,
        dueDate,
      });

      setTitle("");
      setDescription("");
      setReferenceImageName("");
      setReferenceImageUrl("");
      setDueDate("");
      setPriority("Normal");
      setRequiresPhoto(true);
      setRequiresApproval(true);
      removeAudio();

      onCreated(`Görev atandı: ${task.assignedToName}`);
    } catch (error) {
      console.error(error);

      if (error instanceof Error && error.message) {
        setMessage(error.message);
        return;
      }

      setMessage("Görev oluşturulamadı.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-[1.6rem] border border-cyan-400/25 bg-cyan-400/10 p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--missio-primary)] text-white">
            <ClipboardCheck size={23} />
          </div>

          <div>
            <h3 className="text-base font-black text-[var(--missio-text-main)]">
              Görev Ata
            </h3>
            <p className="text-xs font-bold leading-5 text-[var(--missio-text-muted)]">
              {businessId} işletmesindeki aktif yönetici ve personele görev oluştur.
            </p>
          </div>
        </div>
      </div>

      {message ? (
        <div className="rounded-[1.4rem] border border-red-400/30 bg-red-400/10 p-4 text-sm font-black leading-6 text-red-500">
          {message}
        </div>
      ) : null}

      <FieldCard
        step="1"
        title="Personel Seçimi"
        description="Görevin atanacağı aktif kullanıcı."
        icon={<UserRound size={22} />}
      >
        <div className="grid gap-2">
          <select
            value={assignedToUid}
            onChange={(event) => setAssignedToUid(event.target.value)}
            disabled={isLoadingMembers || assignableMembers.length === 0}
            className="h-12 w-full rounded-2xl border border-[var(--missio-border)] bg-[var(--missio-page-bg)] px-4 text-sm font-black text-[var(--missio-text-main)] outline-none disabled:opacity-60"
          >
            {isLoadingMembers ? (
              <option>Liste okunuyor...</option>
            ) : null}

            {!isLoadingMembers && assignableMembers.length === 0 ? (
              <option>Aktif kullanıcı yok</option>
            ) : null}

            {assignableMembers.map((member) => (
              <option key={member.uid} value={member.uid}>
                {member.displayName || member.username || member.email} - {member.roleLabel}
                {member.role === "staff" && member.managerName
                  ? ` / Yönetici: ${member.managerName}`
                  : ""}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={async () => {
              try {
                setIsLoadingMembers(true);
                const members = await listAssignableTaskMembers(businessId);
                setAssignableMembers(members);
                setAssignedToUid(members[0]?.uid ?? "");
              } catch (error) {
                console.error(error);
                setMessage("Kullanıcı listesi yenilenemedi.");
              } finally {
                setIsLoadingMembers(false);
              }
            }}
            className="flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--missio-border)] bg-[var(--missio-card-bg)] px-3 text-xs font-black text-[var(--missio-primary)] active:scale-95"
          >
            <RefreshCw size={16} />
            Listeyi Yenile
          </button>

          {requiresPhoto ? (
            <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-xs font-black leading-5 text-amber-600">
              Fotoğraf kanıtı isteyen görevlerde patron/yönetici onayı otomatik zorunludur.
            </div>
          ) : null}
        </div>
      </FieldCard>

      <FieldCard
        step="2"
        title="Görev Tipi"
        description="Rutin iş mi, ekstra görev mi?"
        icon={<ListChecks size={22} />}
      >
        <div className="grid grid-cols-2 gap-2">
          {(["Rutin", "Ekstra"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setTaskType(option)}
              className={[
                "min-h-12 rounded-2xl border px-4 text-sm font-black transition active:scale-95",
                taskType === option
                  ? "border-[var(--missio-primary)] bg-[var(--missio-primary)] text-white"
                  : "border-[var(--missio-border)] bg-[var(--missio-page-bg)] text-[var(--missio-text-main)]",
              ].join(" ")}
            >
              {option}
            </button>
          ))}
        </div>
      </FieldCard>

      <FieldCard
        step="3"
        title="Görev İsmi"
        description="Kısa ve net görev adı."
        icon={<PenLine size={22} />}
      >
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="h-12 w-full rounded-2xl border border-[var(--missio-border)] bg-[var(--missio-page-bg)] px-4 text-sm font-black text-[var(--missio-text-main)] outline-none"
        />
      </FieldCard>

      <FieldCard
        step="4"
        title="Görev Açıklaması"
        description="Personelin görevi yanlış anlamaması için detay."
        icon={<FileText size={22} />}
      >
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={4}
          className="w-full resize-none rounded-2xl border border-[var(--missio-border)] bg-[var(--missio-page-bg)] p-4 text-sm font-bold leading-6 text-[var(--missio-text-main)] outline-none"
        />
      </FieldCard>

      <FieldCard
        step="5"
        title="Bitiş Tarihi"
        description="İsteğe bağlı son tarih."
        icon={<Flag size={22} />}
      >
        <input
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          className="h-12 w-full rounded-2xl border border-[var(--missio-border)] bg-[var(--missio-page-bg)] px-4 text-sm font-black text-[var(--missio-text-main)] outline-none"
        />
      </FieldCard>

      <FieldCard
        step="6"
        title="Referans Görsel"
        description="Varsa örnek raf, ürün veya alan görseli. Bu aşamada sadece dosya adı kaydedilir."
        icon={<ImagePlus size={22} />}
      >
        <label className="flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-2xl border border-dashed border-[var(--missio-border)] bg-[var(--missio-page-bg)] p-4 text-sm font-black text-[var(--missio-text-main)]">
          <span className="flex items-center gap-2">
            <ImagePlus size={20} className="text-[var(--missio-primary)]" />
            {referenceImageName || "Referans görsel seç"}
          </span>

          <input
            type="file"
            accept="image/*"
            onChange={handleReferenceImageChange}
            className="hidden"
          />
        </label>

        {referenceImageUrl ? (
          <div className="mt-3 grid gap-2 rounded-2xl border border-[var(--missio-border)] bg-[var(--missio-page-bg)] p-3">
            <img
              src={referenceImageUrl}
              alt="Referans görsel önizleme"
              className="max-h-48 w-full rounded-xl object-cover"
            />

            <button
              type="button"
              onClick={removeReferenceImage}
              className="flex items-center justify-center gap-2 rounded-xl bg-red-500/10 px-3 py-2 text-xs font-black text-red-500"
            >
              <Trash2 size={16} />
              Görseli Kaldır
            </button>
          </div>
        ) : null}
      </FieldCard>

      <FieldCard
        step="7"
        title="Görev Önem Derecesi"
        description="İşin önceliğini belirle."
        icon={<Flag size={22} />}
      >
        <div className="grid grid-cols-2 gap-2">
          {priorityOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setPriority(option)}
              className={[
                "min-h-11 rounded-2xl border px-3 text-xs font-black transition active:scale-95",
                priority === option
                  ? "border-[var(--missio-primary)] bg-[var(--missio-primary)] text-white"
                  : "border-[var(--missio-border)] bg-[var(--missio-page-bg)] text-[var(--missio-text-main)]",
              ].join(" ")}
            >
              {option}
            </button>
          ))}
        </div>
      </FieldCard>

      <FieldCard
        step="8"
        title="Sesli Kayıt"
        description="Maksimum 30 saniyelik görev notu. Bu aşamada sadece ekranda dinleme için tutulur."
        icon={<Mic size={22} />}
      >
        <div className="rounded-2xl border border-[var(--missio-border)] bg-[var(--missio-page-bg)] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-[var(--missio-text-main)]">
                {isRecording
                  ? `${recordingSeconds} sn kayıt alınıyor`
                  : audioUrl
                    ? "Ses kaydı hazır"
                    : "Henüz kayıt yok"}
              </p>

              <span className="text-xs font-bold text-[var(--missio-text-muted)]">
                Mikrofon izni istenebilir.
              </span>
            </div>

            {isRecording ? (
              <button
                type="button"
                onClick={stopRecording}
                className="grid h-12 w-12 place-items-center rounded-2xl bg-red-500 text-white"
              >
                <Square size={19} />
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--missio-primary)] text-white"
              >
                <Mic size={20} />
              </button>
            )}
          </div>

          {audioMessage ? (
            <p className="mt-3 text-xs font-black text-red-500">{audioMessage}</p>
          ) : null}

          {audioUrl ? (
            <div className="mt-3 grid gap-2">
              <audio controls src={audioUrl} className="w-full" />

              <button
                type="button"
                onClick={removeAudio}
                className="flex items-center justify-center gap-2 rounded-xl bg-red-500/10 px-3 py-2 text-xs font-black text-red-500"
              >
                <Trash2 size={16} />
                Ses Kaydını Kaldır
              </button>
            </div>
          ) : null}

          {!audioUrl && !isRecording ? (
            <div className="mt-3 flex items-center gap-2 text-xs font-bold text-[var(--missio-text-muted)]">
              <PlayCircle size={16} />
              Kayıt alınırsa burada dinleme alanı görünecek.
            </div>
          ) : null}
        </div>
      </FieldCard>

      <FieldCard
        step="9"
        title="Görev Zorunlulukları"
        description="Personelden fotoğraf veya onay şartı iste."
        icon={<ShieldCheck size={22} />}
      >
        <div className="grid gap-2">
          <button
            type="button"
            onClick={handleRequiresPhotoToggle}
            className={[
              "flex min-h-14 items-center justify-between rounded-2xl border p-4 text-left text-sm font-black transition active:scale-95",
              requiresPhoto
                ? "border-[var(--missio-primary)] bg-cyan-500/10 text-[var(--missio-text-main)]"
                : "border-[var(--missio-border)] bg-[var(--missio-page-bg)] text-[var(--missio-text-main)]",
            ].join(" ")}
          >
            <span className="flex items-center gap-2">
              <Camera size={19} className="text-[var(--missio-primary)]" />
              Fotoğraf kanıtı zorunlu
            </span>

            {requiresPhoto ? (
              <CheckCircle2 size={20} className="text-[var(--missio-primary)]" />
            ) : null}
          </button>

          <button
            type="button"
            onClick={handleRequiresApprovalToggle}
            disabled={requiresPhoto}
            className={[
              "flex min-h-14 items-center justify-between rounded-2xl border p-4 text-left text-sm font-black transition active:scale-95",
              requiresApproval
                ? "border-[var(--missio-primary)] bg-cyan-500/10 text-[var(--missio-text-main)]"
                : "border-[var(--missio-border)] bg-[var(--missio-page-bg)] text-[var(--missio-text-main)]",
              requiresPhoto ? "cursor-not-allowed opacity-80" : "",
            ].join(" ")}
          >
            <span className="flex items-center gap-2">
              <ShieldCheck size={19} className="text-[var(--missio-primary)]" />
              Patron/Yönetici onayı zorunlu
            </span>

            {requiresApproval ? (
              <CheckCircle2 size={20} className="text-[var(--missio-primary)]" />
            ) : null}
          </button>
        </div>
      </FieldCard>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting || isLoadingMembers || assignableMembers.length === 0}
        className="min-h-14 rounded-[1.4rem] bg-[var(--missio-primary)] px-4 py-3 text-sm font-black text-white shadow-lg shadow-cyan-500/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Görev Oluşturuluyor..." : "Görevi Oluştur"}
      </button>
    </div>
  );
}