import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
// jsPDF loaded dynamically from CDN (see loadJsPDF helper below)
import {
  BarChart2,
  Briefcase,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  Globe,
  History,
  Home,
  Info,
  KeyRound,
  LogIn,
  LogOut,
  MapPin,
  Moon,
  Pencil,
  Phone,
  Plus,
  Search,
  Settings,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Sun,
  Trash2,
  User,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { getBackend } from "./backendService";
import { type TKey, t } from "./i18n";
import { formatMMK, generateId, loadLanguage, saveLanguage } from "./storage";
import type {
  CallLog,
  Job,
  Language,
  PurchaseItem,
  SaleItem,
  Staff,
} from "./types";

// ─── jsPDF CDN Loader ────────────────────────────────────────────────────────
let _jsPDFPromise: Promise<any> | null = null;
function loadJsPDF(): Promise<any> {
  if (_jsPDFPromise) return _jsPDFPromise;
  _jsPDFPromise = new Promise((resolve, reject) => {
    if ((window as any).jspdf) {
      resolve((window as any).jspdf.jsPDF);
      return;
    }
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    script.onload = () => resolve((window as any).jspdf.jsPDF);
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return _jsPDFPromise;
}

// ─── Auth Helpers ────────────────────────────────────────────────────────────
const DEFAULT_CREDENTIALS = { username: "Oasis", password: "oasis2000" };

// ─── Backend Converters ────────────────────────────────────────────────────
function jobToBackend(j: Job) {
  return {
    ...j,
    assignedStaffIds: j.assignedStaffIds,
    photoUrl: j.photoUrl ? ([j.photoUrl] as [string]) : ([] as []),
    photoUrls: j.photoUrls ?? [],
    serviceFee: j.serviceFee,
    createdAt: BigInt(j.createdAt),
    updatedAt: BigInt(j.updatedAt),
  };
}
function jobFromBackend(j: any): Job {
  return {
    ...j,
    photoUrl: j.photoUrl?.[0] ?? undefined,
    photoUrls: j.photoUrls ?? [],
    serviceFee: Number(j.serviceFee),
    createdAt: Number(j.createdAt),
    updatedAt: Number(j.updatedAt),
  };
}
function staffToBackend(s: Staff) {
  return {
    ...s,
    photoUrl: s.photoUrl ? ([s.photoUrl] as [string]) : ([] as []),
    createdAt: BigInt(s.createdAt),
  };
}
function staffFromBackend(s: any): Staff {
  return {
    ...s,
    photoUrl: s.photoUrl?.[0] ?? undefined,
    createdAt: Number(s.createdAt),
  };
}
function saleToBackend(s: SaleItem) {
  return {
    ...s,
    quantity: BigInt(s.quantity),
    unitPrice: Number(s.unitPrice),
    totalPrice: Number(s.totalPrice),
    createdAt: BigInt(s.createdAt),
  };
}
function saleFromBackend(s: any): SaleItem {
  return {
    ...s,
    quantity: Number(s.quantity),
    unitPrice: Number(s.unitPrice),
    totalPrice: Number(s.totalPrice),
    createdAt: Number(s.createdAt),
  };
}
function purchaseToBackend(p: PurchaseItem) {
  return {
    ...p,
    quantity: BigInt(p.quantity),
    unitPrice: Number(p.unitPrice),
    totalPrice: Number(p.totalPrice),
    createdAt: BigInt(p.createdAt),
  };
}
function purchaseFromBackend(p: any): PurchaseItem {
  return {
    ...p,
    quantity: Number(p.quantity),
    unitPrice: Number(p.unitPrice),
    totalPrice: Number(p.totalPrice),
    createdAt: Number(p.createdAt),
  };
}
function callLogToBackend(c: CallLog) {
  return { ...c, calledAt: BigInt(c.calledAt) };
}
function callLogFromBackend(c: any): CallLog {
  return { ...c, calledAt: Number(c.calledAt) };
}

function loadCredentials(): { username: string; password: string } {
  try {
    const raw = localStorage.getItem("oasis_credentials");
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_CREDENTIALS;
}

function saveCredentials(creds: { username: string; password: string }) {
  localStorage.setItem(
    "oasis_credentials",
    JSON.stringify({
      username: creds.username.trim(),
      password: creds.password.trim(),
    }),
  );
  getBackend()
    .then((b) => b.setCredentials(creds.username.trim(), creds.password.trim()))
    .catch(() => {});
}

function isLoggedIn(): boolean {
  return localStorage.getItem("oasis_session") === "true";
}

function setSession() {
  localStorage.setItem("oasis_session", "true");
}

function clearSession() {
  localStorage.removeItem("oasis_session");
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const creds = loadCredentials();
    if (
      username.trim() === creds.username &&
      password.trim() === creds.password
    ) {
      setSession();
      onLogin();
    } else {
      setError("Username သို့မဟုတ် Password မှားနေသည် / Invalid credentials");
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-[360px]">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-lg">
            <Wrench size={30} className="text-primary-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">Ko Htay Aung</p>
          <h1 className="text-xl font-bold text-foreground">
            Oasis AC Service
          </h1>
        </div>
        <Card className="border-border shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <ShieldCheck size={18} className="text-primary" />
              <p className="font-semibold text-sm">Login / ဝင်ရောက်ရန်</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="login-username" className="text-xs">
                  Username
                </Label>
                <Input
                  id="login-username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError("");
                  }}
                  placeholder="Username ရိုက်ထည့်ပါ"
                  autoComplete="username"
                  data-ocid="login.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="login-password" className="text-xs">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="Password ရိုက်ထည့်ပါ"
                    autoComplete="current-password"
                    data-ocid="login.input"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPw ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
              {error && (
                <p
                  className="text-xs text-destructive"
                  data-ocid="login.error_state"
                >
                  {error}
                </p>
              )}
              <Button
                type="submit"
                className="w-full"
                data-ocid="login.submit_button"
              >
                <LogIn size={16} className="mr-2" />
                Login / ဝင်ရောက်မည်
              </Button>
              <div className="text-center mt-2">
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-primary underline-offset-2 hover:underline"
                  onClick={() => {
                    setShowReset(true);
                    setResetDone(false);
                  }}
                >
                  Password မေ့သွားပါသလား?
                </button>
              </div>
            </form>
            {showReset && (
              <div className="mt-4 rounded-lg border border-border bg-muted/50 p-4 text-sm space-y-3">
                {resetDone ? (
                  <div className="text-center space-y-2">
                    <p className="text-green-600 font-semibold text-xs">
                      ✓ Reset ပြီးပါပြီ
                    </p>
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline"
                      onClick={() => setShowReset(false)}
                    >
                      ပိတ်မည်
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs font-medium">
                      Default credentials သို့ပြန်ရမည်လား?
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="flex-1 rounded-md bg-primary text-primary-foreground text-xs py-1.5 font-medium hover:bg-primary/90"
                        onClick={() => {
                          saveCredentials(DEFAULT_CREDENTIALS);
                          setResetDone(true);
                        }}
                        data-ocid="login.confirm_button"
                      >
                        အတည်ပြုမည်
                      </button>
                      <button
                        type="button"
                        className="flex-1 rounded-md border border-border text-xs py-1.5 text-muted-foreground hover:bg-muted"
                        onClick={() => setShowReset(false)}
                        data-ocid="login.cancel_button"
                      >
                        မလုပ်တော့ပါ
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}

// ─── Language Context ─────────────────────────────────────────────────────────
const LangCtx = createContext<{ lang: Language; tr: (k: TKey) => string }>({
  lang: "en",
  tr: (k) => k,
});
const useLang = () => useContext(LangCtx);

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getWeekDates() {
  const now = new Date();
  const day = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function getMonthDates() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );
  return { start, end };
}

function jobInRange(job: Job, start: Date, end: Date) {
  const d = new Date(job.date);
  return d >= start && d <= end;
}

const DEVICE_TYPES = ["AC", "Refrigerator", "WashingMachine"] as const;
const AC_TYPES = [
  "Split",
  "Window",
  "Cassette",
  "Portable",
  "Central",
] as const;
const ROLES = [
  "Leader",
  "Co-leader",
  "Technician",
  "Helper",
  "Secretary",
  "Manager",
  "MD",
] as const;
const STATUS_OPTIONS = ["Pending", "Done"] as const;

function deviceLabel(type: string, tr: (k: TKey) => string) {
  if (type === "AC") return tr("ac");
  if (type === "Refrigerator") return tr("refrigerator");
  if (type === "WashingMachine") return tr("washingMachine");
  return type;
}

function roleLabel(role: string, tr: (k: TKey) => string): string {
  const map: Record<string, TKey> = {
    Leader: "leader",
    Technician: "technician",
    Helper: "helper",
    "Co-leader": "coleader",
    Secretary: "secretary",
    Manager: "manager",
  };
  return tr(map[role] ?? (role as TKey));
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const { tr } = useLang();
  if (status === "Done") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-semibold">
        <CheckCircle2 size={11} /> {tr("done")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-xs font-semibold">
      <Clock size={11} /> {tr("pending")}
    </span>
  );
}

// ─── Role Badge ───────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  const { tr } = useLang();
  const colorMap: Record<string, string> = {
    Leader: "bg-primary/10 text-primary",
    "Co-leader": "bg-blue-100 text-blue-700",
    Technician: "bg-purple-100 text-purple-700",
    Helper: "bg-orange-100 text-orange-700",
    Secretary: "bg-pink-100 text-pink-700",
    Manager: "bg-teal-100 text-teal-700",
    MD: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${colorMap[role] || "bg-muted text-muted-foreground"}`}
    >
      {roleLabel(role, tr)}
    </span>
  );
}

// ─── Job Form ─────────────────────────────────────────────────────────────────
interface JobFormProps {
  initial?: Partial<Job>;
  staffList: Staff[];
  onSave: (job: Omit<Job, "id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
}

function JobForm({ initial, staffList, onSave, onCancel }: JobFormProps) {
  const { tr, lang } = useLang();
  const [form, setForm] = useState({
    customerName: initial?.customerName ?? "",
    customerPhone: initial?.customerPhone ?? "",
    customerAddress: initial?.customerAddress ?? "",
    deviceType: initial?.deviceType ?? "AC",
    brand: initial?.brand ?? "",
    hp: initial?.hp ?? "",
    acType: initial?.acType ?? "Split",
    problem: initial?.problem ?? "",
    gasType: initial?.gasType ?? "",
    status: initial?.status ?? "Pending",
    date: initial?.date ?? new Date().toISOString().slice(0, 10),
    assignedStaffIds: initial?.assignedStaffIds ?? [],
    serviceFee: initial?.serviceFee ?? 0,
    notes: initial?.notes ?? "",
    photoUrls: initial?.photoUrls ?? [],
  });
  const [staffOpen, setStaffOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function toggleStaff(id: string) {
    setForm((p) => {
      if (!p.assignedStaffIds.includes(id) && p.assignedStaffIds.length >= 5) {
        toast.error(
          lang === "my"
            ? "ဝန်ထမ်း အများဆုံး ၅ ဦးသာ ထည့်နိုင်သည်"
            : "Maximum 5 staff members allowed",
        );
        return p;
      }
      return {
        ...p,
        assignedStaffIds: p.assignedStaffIds.includes(id)
          ? p.assignedStaffIds.filter((s) => s !== id)
          : [...p.assignedStaffIds, id],
      };
    });
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setForm((p) => ({
            ...p,
            photoUrls: [...p.photoUrls, ev.target!.result as string],
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  }

  function removePhoto(idx: number) {
    setForm((p) => ({
      ...p,
      photoUrls: p.photoUrls.filter((_, i) => i !== idx),
    }));
  }

  function handleSubmit() {
    if (!form.customerName.trim()) {
      toast.error("Customer name required");
      return;
    }
    if (!form.date) {
      toast.error("Date required");
      return;
    }
    if (form.assignedStaffIds.length === 0) {
      toast.error(
        lang === "my"
          ? "ဝန်ထမ်းအနည်းဆုံး တစ်ဦး သတ်မှတ်ပါ"
          : "Please assign at least one staff member",
      );
      return;
    }
    onSave(form);
  }

  const selectedStaffNames = staffList
    .filter((s) => form.assignedStaffIds.includes(s.id))
    .map((s) => s.name)
    .join(", ");

  return (
    <div className="space-y-3 text-sm">
      <div>
        <Label className="text-xs text-muted-foreground">
          {tr("customerName")} *
        </Label>
        <Input
          value={form.customerName}
          onChange={(e) =>
            setForm((p) => ({ ...p, customerName: e.target.value }))
          }
          data-ocid="job.input"
          className="mt-1"
        />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">
          {tr("customerPhone")}
        </Label>
        <Input
          value={form.customerPhone}
          onChange={(e) =>
            setForm((p) => ({ ...p, customerPhone: e.target.value }))
          }
          className="mt-1"
        />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">
          {tr("customerAddress")}
        </Label>
        <Textarea
          value={form.customerAddress}
          onChange={(e) =>
            setForm((p) => ({ ...p, customerAddress: e.target.value }))
          }
          className="mt-1 resize-none"
          rows={2}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs text-muted-foreground">
            {tr("deviceType")}
          </Label>
          <Select
            value={form.deviceType}
            onValueChange={(v) => setForm((p) => ({ ...p, deviceType: v }))}
          >
            <SelectTrigger className="mt-1" data-ocid="job.select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEVICE_TYPES.map((d) => (
                <SelectItem key={d} value={d}>
                  {deviceLabel(d, tr)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">{tr("brand")}</Label>
          <Input
            value={form.brand}
            onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))}
            className="mt-1"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs text-muted-foreground">{tr("hp")}</Label>
          <Input
            value={form.hp}
            onChange={(e) => setForm((p) => ({ ...p, hp: e.target.value }))}
            className="mt-1"
            placeholder="e.g. 1.5"
          />
        </div>
        {form.deviceType === "AC" && (
          <div>
            <Label className="text-xs text-muted-foreground">
              {tr("acType")}
            </Label>
            <Select
              value={form.acType}
              onValueChange={(v) => setForm((p) => ({ ...p, acType: v }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AC_TYPES.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">{tr("problem")}</Label>
        <Textarea
          value={form.problem}
          onChange={(e) => setForm((p) => ({ ...p, problem: e.target.value }))}
          className="mt-1 resize-none"
          rows={2}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs text-muted-foreground">
            {tr("gasType")}
          </Label>
          <Input
            value={form.gasType}
            onChange={(e) =>
              setForm((p) => ({ ...p, gasType: e.target.value }))
            }
            className="mt-1"
            placeholder="R22, R410A..."
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">{tr("date")}</Label>
          <Input
            type="date"
            value={form.date}
            onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
            className="mt-1"
            data-ocid="job.input"
          />
        </div>
      </div>
      {/* Assigned Staff Dropdown */}
      <div>
        <Label className="text-xs text-muted-foreground">
          {tr("assignedStaff")} ({form.assignedStaffIds.length}/5) *
        </Label>
        <div className="relative mt-1">
          <button
            type="button"
            onClick={() => setStaffOpen((p) => !p)}
            className="w-full flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            data-ocid="job.select"
          >
            <span className="truncate">
              {selectedStaffNames || tr("selectStaff")}
            </span>
            <ChevronDown
              size={14}
              className="shrink-0 ml-1 text-muted-foreground"
            />
          </button>
          {staffOpen && (
            <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md">
              {staffList.length === 0 && (
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  {tr("noStaff")}
                </div>
              )}
              {staffList.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleStaff(s.id)}
                  className="flex w-full items-center gap-2 px-3 py-2 hover:bg-accent text-sm"
                >
                  <span
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${form.assignedStaffIds.includes(s.id) ? "bg-primary border-primary text-primary-foreground" : "border-input"}`}
                  >
                    {form.assignedStaffIds.includes(s.id) && (
                      <span className="text-[10px] font-bold">✓</span>
                    )}
                  </span>
                  <span className="flex-1 text-left">{s.name}</span>
                  <RoleBadge role={s.role} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Service Fee */}
      <div>
        <Label className="text-xs text-muted-foreground">
          {tr("serviceFee")}
        </Label>
        <div className="flex items-center gap-1 mt-1">
          <span className="text-xs font-semibold text-primary px-2 py-2 bg-primary/10 rounded-l-md border border-r-0 border-input">
            MMK
          </span>
          <Input
            type="number"
            value={form.serviceFee || ""}
            onChange={(e) =>
              setForm((p) => ({ ...p, serviceFee: Number(e.target.value) }))
            }
            className="rounded-l-none"
            placeholder="0"
            data-ocid="job.input"
          />
        </div>
      </div>
      {/* Status */}
      <div>
        <Label className="text-xs text-muted-foreground">{tr("status")}</Label>
        <Select
          value={form.status}
          onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}
        >
          <SelectTrigger className="mt-1" data-ocid="job.select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "Done" ? tr("done") : tr("pending")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {/* Photos */}
      <div>
        <Label className="text-xs text-muted-foreground">{tr("photos")}</Label>
        <div className="mt-1 flex flex-wrap gap-2">
          {form.photoUrls.map((url, photoIdx) => (
            <div key={url.slice(-20)} className="relative w-16 h-16">
              <img
                src={url}
                alt=""
                className="w-full h-full object-cover rounded-md border border-border"
              />
              <button
                type="button"
                onClick={() => removePhoto(photoIdx)}
                className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center"
              >
                <X size={10} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-16 h-16 rounded-md border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            data-ocid="job.upload_button"
          >
            <Camera size={16} />
            <span className="text-[10px] mt-0.5">{tr("addPhoto")}</span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handlePhotoChange}
          />
        </div>
      </div>
      {/* Notes */}
      <div>
        <Label className="text-xs text-muted-foreground">{tr("notes")}</Label>
        <Textarea
          value={form.notes}
          onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
          className="mt-1 resize-none"
          rows={2}
        />
      </div>
      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={onCancel}
          data-ocid="job.cancel_button"
        >
          {tr("cancel")}
        </Button>
        <Button
          className="flex-1 bg-primary text-primary-foreground"
          onClick={handleSubmit}
          data-ocid="job.save_button"
        >
          {tr("save")}
        </Button>
      </div>
    </div>
  );
}

// ─── Staff Form ───────────────────────────────────────────────────────────────
interface StaffFormProps {
  initial?: Partial<Staff>;
  onSave: (s: Omit<Staff, "id" | "createdAt">) => void;
  onCancel: () => void;
}

function StaffForm({ initial, onSave, onCancel }: StaffFormProps) {
  const { tr } = useLang();
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    role: initial?.role ?? "Technician",
    phone: initial?.phone ?? "",
    address: initial?.address ?? "",
    notes: initial?.notes ?? "",
    photoUrl: initial?.photoUrl ?? "",
  });
  const photoInputRef = useRef<HTMLInputElement>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm((p) => ({ ...p, photoUrl: ev.target!.result as string }));
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit() {
    if (!form.name.trim()) {
      toast.error("Staff name required");
      return;
    }
    onSave(form);
  }

  return (
    <div className="space-y-3 text-sm">
      {/* Profile Photo */}
      <div className="flex flex-col items-center gap-2">
        <Label className="text-xs text-muted-foreground self-start">
          {tr("profilePhoto")}
        </Label>
        <button
          type="button"
          onClick={() => photoInputRef.current?.click()}
          className="w-20 h-20 rounded-full bg-primary/10 border-2 border-dashed border-primary/30 flex items-center justify-center overflow-hidden hover:bg-primary/20 transition-colors"
          data-ocid="staff.upload_button"
        >
          {form.photoUrl ? (
            <img
              src={form.photoUrl}
              alt="profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <Camera size={24} className="text-primary/50" />
          )}
        </button>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoChange}
        />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">{tr("name")} *</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          className="mt-1"
          data-ocid="staff.input"
        />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">{tr("role")}</Label>
        <Select
          value={form.role}
          onValueChange={(v) => setForm((p) => ({ ...p, role: v }))}
        >
          <SelectTrigger className="mt-1" data-ocid="staff.select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {roleLabel(r, tr)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">{tr("phone")}</Label>
        <Input
          value={form.phone}
          onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
          className="mt-1"
        />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">{tr("address")}</Label>
        <Textarea
          value={form.address}
          onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
          className="mt-1 resize-none"
          rows={2}
        />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">{tr("notes")}</Label>
        <Textarea
          value={form.notes}
          onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
          className="mt-1 resize-none"
          rows={2}
        />
      </div>
      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={onCancel}
          data-ocid="staff.cancel_button"
        >
          {tr("cancel")}
        </Button>
        <Button
          className="flex-1 bg-primary text-primary-foreground"
          onClick={handleSubmit}
          data-ocid="staff.save_button"
        >
          {tr("save")}
        </Button>
      </div>
    </div>
  );
}

// ─── Job Card ─────────────────────────────────────────────────────────────────
function JobCard({
  job,
  staffList,
  onClick,
  onCall,
}: {
  job: Job;
  staffList: Staff[];
  onClick: () => void;
  onCall?: (name: string, phone: string, context: string) => void;
}) {
  const { tr } = useLang();
  const assignedNames = staffList
    .filter((s) => job.assignedStaffIds.includes(s.id))
    .map((s) => s.name)
    .join(", ");
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      onClick={onClick}
      className="bg-card border border-border rounded-xl p-3.5 shadow-xs cursor-pointer hover:shadow-card transition-shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate text-foreground">
            {job.customerName}
          </p>
          <p className="text-xs text-muted-foreground">
            {job.customerPhone ? (
              <a
                href={`tel:${job.customerPhone}`}
                className="text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onCall?.(job.customerName, job.customerPhone, "job");
                }}
              >
                {job.customerPhone}
              </a>
            ) : null}
          </p>
        </div>
        <StatusBadge status={job.status} />
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Wrench size={11} />
          {deviceLabel(job.deviceType, tr)} {job.brand && `· ${job.brand}`}
        </span>
        <span className="flex items-center gap-1">
          <Calendar size={11} />
          {job.date}
        </span>
      </div>
      {assignedNames && (
        <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
          <User size={11} />
          {assignedNames}
        </p>
      )}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-primary">
          {formatMMK(job.serviceFee)}
        </span>
        {job.photoUrls.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {job.photoUrls.length} photo{job.photoUrls.length > 1 ? "s" : ""}
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ─── Job Detail Screen ────────────────────────────────────────────────────────
function JobDetail({
  job,
  staffList,
  jobs,
  onEdit,
  onDelete,
  onClose,
}: {
  job: Job;
  staffList: Staff[];
  jobs: Job[];
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const { tr } = useLang();
  const [showHistory, setShowHistory] = useState(false);
  const assignedStaff = staffList.filter((s) =>
    job.assignedStaffIds.includes(s.id),
  );
  const history = jobs.filter(
    (j) =>
      j.customerPhone &&
      j.customerPhone === job.customerPhone &&
      j.id !== job.id,
  );

  function handleShare() {
    const text = [
      "=== Oasis AC Service ===",
      `Customer: ${job.customerName}`,
      `Phone: ${job.customerPhone}`,
      `Address: ${job.customerAddress}`,
      `Device: ${deviceLabel(job.deviceType, tr)}${job.brand ? ` - ${job.brand}` : ""}`,
      job.hp ? `HP: ${job.hp}` : "",
      job.acType && job.deviceType === "AC" ? `AC Type: ${job.acType}` : "",
      `Problem: ${job.problem}`,
      job.gasType ? `Gas: ${job.gasType}` : "",
      `Date: ${job.date}`,
      `Status: ${job.status === "Done" ? tr("done") : tr("pending")}`,
      `Service Fee: ${formatMMK(job.serviceFee)}`,
      assignedStaff.length
        ? `Staff: ${assignedStaff.map((s) => s.name).join(", ")}`
        : "",
      job.notes ? `Notes: ${job.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    if (navigator.share) {
      navigator.share({ title: "Job Detail", text }).catch(() => {});
    } else {
      navigator.clipboard
        .writeText(text)
        .then(() => toast.success("Copied to clipboard!"));
    }
  }

  return (
    <div className="space-y-4">
      {/* Header actions */}
      <div className="flex gap-2 justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={handleShare}
          data-ocid="job.secondary_button"
        >
          <Share2 size={14} className="mr-1" />
          {tr("share")}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onEdit}
          data-ocid="job.edit_button"
        >
          <Pencil size={14} className="mr-1" />
          {tr("edit")}
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={onDelete}
          data-ocid="job.delete_button"
        >
          <Trash2 size={14} />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <InfoRow label={tr("customerName")} value={job.customerName} />
        <InfoRow
          label={tr("customerPhone")}
          value={job.customerPhone}
          icon={<Phone size={12} />}
          isPhone
        />
      </div>
      {job.customerAddress && (
        <InfoRow
          label={tr("customerAddress")}
          value={job.customerAddress}
          icon={<MapPin size={12} />}
        />
      )}

      <Separator />

      <div className="grid grid-cols-2 gap-3">
        <InfoRow
          label={tr("deviceType")}
          value={deviceLabel(job.deviceType, tr)}
        />
        {job.brand && <InfoRow label={tr("brand")} value={job.brand} />}
        {job.hp && <InfoRow label={tr("hp")} value={`${job.hp} HP`} />}
        {job.deviceType === "AC" && job.acType && (
          <InfoRow label={tr("acType")} value={job.acType} />
        )}
      </div>

      {job.problem && <InfoRow label={tr("problem")} value={job.problem} />}
      {job.gasType && <InfoRow label={tr("gasType")} value={job.gasType} />}

      <Separator />

      <div className="grid grid-cols-2 gap-3">
        <InfoRow
          label={tr("date")}
          value={job.date}
          icon={<Calendar size={12} />}
        />
        <div>
          <p className="text-xs text-muted-foreground mb-1">{tr("status")}</p>
          <StatusBadge status={job.status} />
        </div>
      </div>

      <InfoRow
        label={tr("serviceFee")}
        value={formatMMK(job.serviceFee)}
        highlight
      />

      {assignedStaff.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">
            {tr("assignedStaff")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {assignedStaff.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium"
              >
                <User size={10} /> {s.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {job.notes && <InfoRow label={tr("notes")} value={job.notes} />}

      {job.photoUrls.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">{tr("photos")}</p>
          <div className="flex flex-wrap gap-2">
            {job.photoUrls.map((url) => (
              <img
                key={url.slice(-20)}
                src={url}
                alt=""
                className="w-20 h-20 object-cover rounded-lg border border-border"
              />
            ))}
          </div>
        </div>
      )}

      {job.customerPhone && (
        <>
          <Separator />
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setShowHistory((p) => !p)}
            data-ocid="job.secondary_button"
          >
            <History size={14} className="mr-2" />
            {tr("customerHistory")} ({history.length})
          </Button>
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                {history.length === 0 ? (
                  <p
                    className="text-xs text-muted-foreground text-center py-3"
                    data-ocid="job.empty_state"
                  >
                    {tr("noHistory")}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {history.map((h) => (
                      <div
                        key={h.id}
                        className="bg-secondary rounded-lg p-2.5 text-xs"
                      >
                        <div className="flex justify-between">
                          <span className="font-medium">
                            {deviceLabel(h.deviceType, tr)} - {h.brand}
                          </span>
                          <StatusBadge status={h.status} />
                        </div>
                        <p className="text-muted-foreground mt-0.5">
                          {h.date} · {formatMMK(h.serviceFee)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      <Button
        variant="outline"
        className="w-full"
        onClick={onClose}
        data-ocid="job.close_button"
      >
        {tr("close")}
      </Button>
    </div>
  );
}

function InfoRow({
  label,
  value,
  icon,
  highlight,
  isPhone,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  highlight?: boolean;
  isPhone?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p
        className={`text-sm font-medium flex items-center gap-1 ${highlight ? "text-primary" : "text-foreground"}`}
      >
        {icon}
        {isPhone && value ? (
          <a href={`tel:${value}`} className="text-primary underline">
            {value}
          </a>
        ) : (
          value || "—"
        )}
      </p>
    </div>
  );
}

// ─── HOME TAB ─────────────────────────────────────────────────────────────────
function HomeTab({
  jobs,
  staffList,
  callLogs,
  onCall,
}: {
  jobs: Job[];
  staffList: Staff[];
  callLogs: CallLog[];
  onCall: (name: string, phone: string, context: string) => void;
}) {
  const { tr } = useLang();
  const week = getWeekDates();
  const month = getMonthDates();

  const weekJobs = jobs.filter((j) => jobInRange(j, week.start, week.end));
  const monthJobs = jobs.filter((j) => jobInRange(j, month.start, month.end));
  const recent = [...jobs]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 5);

  function SummaryCard({
    label,
    total,
    done,
    pending,
  }: { label: string; total: number; done: number; pending: number }) {
    return (
      <Card className="flex-1 border-border shadow-xs">
        <CardContent className="p-3">
          <p className="text-xs font-semibold text-muted-foreground mb-2">
            {label}
          </p>
          <p className="text-2xl font-bold text-foreground">{total}</p>
          <div className="flex gap-2 mt-1.5">
            <span className="text-xs text-green-600 font-medium">✓ {done}</span>
            <span className="text-xs text-amber-600 font-medium">
              ⏳ {pending}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4" data-ocid="home.section">
      {/* Header */}
      <div className="bg-primary rounded-2xl p-4 text-primary-foreground">
        <p className="text-xs opacity-80">Ko Htay Aung (Oasis)</p>
        <h1 className="text-xl font-bold mt-0.5">AC Service</h1>
        <p className="text-xs opacity-70 mt-1">
          {new Date().toLocaleDateString("en-GB", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="flex gap-3">
        <SummaryCard
          label={tr("thisWeek")}
          total={weekJobs.length}
          done={weekJobs.filter((j) => j.status === "Done").length}
          pending={weekJobs.filter((j) => j.status === "Pending").length}
        />
        <SummaryCard
          label={tr("thisMonth")}
          total={monthJobs.length}
          done={monthJobs.filter((j) => j.status === "Done").length}
          pending={monthJobs.filter((j) => j.status === "Pending").length}
        />
      </div>

      {/* Revenue this month */}
      <Card className="border-border shadow-xs">
        <CardContent className="p-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">
              {tr("thisMonth")} {tr("revenue")}
            </p>
            <p className="text-lg font-bold text-primary">
              {formatMMK(
                monthJobs.reduce((a, j) => a + (j.serviceFee || 0), 0),
              )}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <BarChart2 size={18} className="text-primary" />
          </div>
        </CardContent>
      </Card>

      {/* Recent Jobs */}
      <div>
        <p className="text-sm font-semibold text-foreground mb-2">
          {tr("recentJobs")}
        </p>
        {recent.length === 0 ? (
          <p
            className="text-xs text-muted-foreground text-center py-6"
            data-ocid="home.empty_state"
          >
            {tr("noJobs")}
          </p>
        ) : (
          <div className="space-y-2">
            {recent.map((j, idx) => (
              <div
                key={j.id}
                className="bg-card border border-border rounded-xl p-3 flex items-center gap-3"
                data-ocid={`home.item.${idx + 1}`}
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Wrench size={14} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {j.customerName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {deviceLabel(j.deviceType, tr)} · {j.date}
                  </p>
                </div>
                <StatusBadge status={j.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Staff count */}
      <Card className="border-border shadow-xs">
        <CardContent className="p-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{tr("staff")}</p>
            <p className="text-lg font-bold text-foreground">
              {staffList.length}
            </p>
          </div>
          <Users size={20} className="text-muted-foreground" />
        </CardContent>
      </Card>

      {/* Call Log */}
      <div>
        <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
          <Phone size={14} className="text-primary" />
          {tr("callLog")}
        </p>
        {callLogs.length === 0 ? (
          <p
            className="text-xs text-muted-foreground text-center py-6"
            data-ocid="home.call_log.empty_state"
          >
            {tr("noCallLogs")}
          </p>
        ) : (
          <div className="space-y-2">
            {callLogs.slice(0, 20).map((log, idx) => (
              <div
                key={log.id}
                className="bg-card border border-border rounded-xl p-3 flex items-center gap-3"
                data-ocid={`home.call_log.item.${idx + 1}`}
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Phone size={13} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {log.customerName}
                  </p>
                  <a
                    href={`tel:${log.customerPhone}`}
                    className="text-xs text-primary"
                    onClick={() =>
                      onCall(log.customerName, log.customerPhone, log.context)
                    }
                  >
                    {log.customerPhone}
                  </a>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0"
                  >
                    {log.context === "job"
                      ? tr("callContext_job")
                      : tr("callContext_staff")}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(log.calledAt).toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── JOBS TAB ─────────────────────────────────────────────────────────────────
function JobsTab({
  jobs,
  staffList,
  onJobsChange,
  onCall,
}: {
  jobs: Job[];
  staffList: Staff[];
  onJobsChange: (jobs: Job[]) => void;
  onCall: (name: string, phone: string, context: string) => void;
}) {
  const { tr } = useLang();
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editJob, setEditJob] = useState<Job | null>(null);
  const [viewJob, setViewJob] = useState<Job | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = jobs
    .filter((j) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        j.customerName.toLowerCase().includes(q) ||
        j.customerPhone.includes(q) ||
        j.brand.toLowerCase().includes(q);
      const matchFrom = !fromDate || j.date >= fromDate;
      const matchTo = !toDate || j.date <= toDate;
      return matchSearch && matchFrom && matchTo;
    })
    .sort((a, b) => b.updatedAt - a.updatedAt);

  function addJob(data: Omit<Job, "id" | "createdAt" | "updatedAt">) {
    const now = Date.now();
    const newJob: Job = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    const updated = [newJob, ...jobs];
    onJobsChange(updated);
    getBackend()
      .then((b) => b.addJob(jobToBackend(newJob)))
      .catch(() => {});
    setShowAdd(false);
    toast.success("Job added!");
  }

  function updateJob(data: Omit<Job, "id" | "createdAt" | "updatedAt">) {
    if (!editJob) return;
    const updated = jobs.map((j) =>
      j.id === editJob.id ? { ...editJob, ...data, updatedAt: Date.now() } : j,
    );
    onJobsChange(updated);
    const updatedJobItem = jobs.find((j) => j.id === editJob.id);
    if (updatedJobItem)
      getBackend()
        .then((b) =>
          b.updateJob(
            jobToBackend({ ...editJob, ...data, updatedAt: Date.now() }),
          ),
        )
        .catch(() => {});
    setEditJob(null);
    setViewJob(null);
    toast.success("Job updated!");
  }

  function deleteJob(id: string) {
    const updated = jobs.filter((j) => j.id !== id);
    onJobsChange(updated);
    getBackend()
      .then((b) => b.deleteJob(id))
      .catch(() => {});
    setViewJob(null);
    setDeleteId(null);
    toast.success("Job deleted!");
  }

  async function exportJobsPDF() {
    const JsPDF = await loadJsPDF();
    const doc = new JsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    let y = 20;

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Oasis AC Service - Jobs List", pageW / 2, y, { align: "center" });
    y += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const dateRange =
      fromDate || toDate
        ? `Date: ${fromDate || "..."} ~ ${toDate || "..."}`
        : "All Jobs";
    doc.text(dateRange, pageW / 2, y, { align: "center" });
    y += 6;
    doc.text(`Total: ${filtered.length} jobs`, pageW / 2, y, {
      align: "center",
    });
    y += 10;

    // Table header
    doc.setFillColor(34, 197, 94);
    doc.rect(14, y, pageW - 28, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text("Date", 16, y + 5.5);
    doc.text("Customer", 36, y + 5.5);
    doc.text("Phone", 80, y + 5.5);
    doc.text("Device", 108, y + 5.5);
    doc.text("Status", 148, y + 5.5);
    doc.text("Fee (MMK)", 168, y + 5.5);
    y += 10;

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    filtered.forEach((j, i) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      if (i % 2 === 0) {
        doc.setFillColor(240, 253, 244);
        doc.rect(14, y - 4, pageW - 28, 8, "F");
      }
      doc.setFontSize(8);
      doc.text((j.date || "").substring(0, 10), 16, y);
      doc.text((j.customerName || "").substring(0, 18), 36, y);
      doc.text((j.customerPhone || "").substring(0, 12), 80, y);
      const dev = (
        deviceLabel(j.deviceType, tr) + (j.brand ? ` ${j.brand}` : "")
      ).substring(0, 18);
      doc.text(dev, 108, y);
      doc.text(j.status || "", 148, y);
      doc.text(formatMMK(j.serviceFee), 165, y);
      y += 8;
    });

    const today = new Date().toISOString().slice(0, 10);
    doc.save(`oasis-jobs-${today}.pdf`);
    toast.success("Jobs PDF exported!");
  }

  return (
    <div className="flex flex-col gap-3" data-ocid="jobs.section">
      {/* Search */}
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={tr("search")}
          className="pl-8"
          data-ocid="jobs.search_input"
        />
      </div>

      {/* Date range filter */}
      <div className="flex gap-2 items-center">
        <Calendar size={14} className="text-muted-foreground shrink-0" />
        <Input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="flex-1 text-xs"
        />
        <span className="text-xs text-muted-foreground">—</span>
        <Input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="flex-1 text-xs"
        />
        {(fromDate || toDate) && (
          <Button
            size="icon"
            variant="ghost"
            className="shrink-0 h-8 w-8"
            onClick={() => {
              setFromDate("");
              setToDate("");
            }}
            data-ocid="jobs.secondary_button"
          >
            <X size={13} />
          </Button>
        )}
      </div>

      {/* Job count + PDF */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {filtered.length} {tr("totalJobs").toLowerCase()}
        </p>
        {filtered.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1 border-green-500 text-green-700 hover:bg-green-50"
            onClick={exportJobsPDF}
            data-ocid="jobs.export_pdf_button"
          >
            <Download size={13} />
            PDF
          </Button>
        )}
      </div>

      {/* Job list */}
      <AnimatePresence mode="popLayout">
        {filtered.length === 0 ? (
          <motion.p
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-sm text-muted-foreground py-10"
            data-ocid="jobs.empty_state"
          >
            {tr("noJobs")}
          </motion.p>
        ) : (
          filtered.map((j, idx) => (
            <div key={j.id} data-ocid={`jobs.item.${idx + 1}`}>
              <JobCard
                job={j}
                staffList={staffList}
                onClick={() => setViewJob(j)}
                onCall={onCall}
              />
            </div>
          ))
        )}
      </AnimatePresence>

      {/* FAB */}
      <button
        type="button"
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center z-30 hover:bg-primary/90 active:scale-95 transition-all"
        onClick={() => setShowAdd(true)}
        data-ocid="jobs.open_modal_button"
      >
        <Plus size={24} />
      </button>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent
          className="max-w-sm max-h-[90vh] overflow-y-auto"
          data-ocid="jobs.dialog"
        >
          <DialogHeader>
            <DialogTitle>{tr("addJob")}</DialogTitle>
          </DialogHeader>
          <JobForm
            staffList={staffList}
            onSave={addJob}
            onCancel={() => setShowAdd(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editJob} onOpenChange={(o) => !o && setEditJob(null)}>
        <DialogContent
          className="max-w-sm max-h-[90vh] overflow-y-auto"
          data-ocid="jobs.dialog"
        >
          <DialogHeader>
            <DialogTitle>{tr("editJob")}</DialogTitle>
          </DialogHeader>
          {editJob && (
            <JobForm
              initial={editJob}
              staffList={staffList}
              onSave={updateJob}
              onCancel={() => setEditJob(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewJob} onOpenChange={(o) => !o && setViewJob(null)}>
        <DialogContent
          className="max-w-sm max-h-[90vh] overflow-y-auto"
          data-ocid="jobs.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-base">
              {viewJob?.customerName}
            </DialogTitle>
          </DialogHeader>
          {viewJob && (
            <JobDetail
              job={viewJob}
              staffList={staffList}
              jobs={jobs}
              onEdit={() => {
                setEditJob(viewJob);
                setViewJob(null);
              }}
              onDelete={() => setDeleteId(viewJob.id)}
              onClose={() => setViewJob(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent className="max-w-xs" data-ocid="jobs.dialog">
          <DialogHeader>
            <DialogTitle>Delete Job</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{tr("deleteConfirm")}</p>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              data-ocid="jobs.cancel_button"
            >
              {tr("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && deleteJob(deleteId)}
              data-ocid="jobs.confirm_button"
            >
              {tr("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── STAFF TAB ────────────────────────────────────────────────────────────────
function StaffTab({
  staffList,
  jobs,
  onStaffChange,
  onCall,
}: {
  staffList: Staff[];
  jobs: Job[];
  onStaffChange: (s: Staff[]) => void;
  onCall: (name: string, phone: string, context: string) => void;
}) {
  const { tr } = useLang();
  const [showAdd, setShowAdd] = useState(false);
  const [editStaff, setEditStaff] = useState<Staff | null>(null);
  const [viewStaff, setViewStaff] = useState<Staff | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function addStaff(data: Omit<Staff, "id" | "createdAt">) {
    const newStaff: Staff = {
      ...data,
      id: generateId(),
      createdAt: Date.now(),
    };
    const updated = [...staffList, newStaff];
    onStaffChange(updated);
    getBackend()
      .then((b) => b.addStaff(staffToBackend(newStaff)))
      .catch(() => {});
    setShowAdd(false);
    toast.success("Staff added!");
  }

  function updateStaff(data: Omit<Staff, "id" | "createdAt">) {
    if (!editStaff) return;
    const updated = staffList.map((s) =>
      s.id === editStaff.id ? { ...editStaff, ...data } : s,
    );
    onStaffChange(updated);
    getBackend()
      .then((b) => b.updateStaff(staffToBackend({ ...editStaff, ...data })))
      .catch(() => {});
    setEditStaff(null);
    setViewStaff(null);
    toast.success("Staff updated!");
  }

  function deleteStaff(id: string) {
    const updated = staffList.filter((s) => s.id !== id);
    onStaffChange(updated);
    getBackend()
      .then((b) => b.deleteStaff(id))
      .catch(() => {});
    setViewStaff(null);
    setDeleteId(null);
    toast.success("Staff deleted!");
  }

  return (
    <div className="flex flex-col gap-3" data-ocid="staff.section">
      <AnimatePresence mode="popLayout">
        {staffList.length === 0 ? (
          <motion.p
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-sm text-muted-foreground py-10"
            data-ocid="staff.empty_state"
          >
            {tr("noStaff")}
          </motion.p>
        ) : (
          staffList.map((s, idx) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              data-ocid={`staff.item.${idx + 1}`}
              onClick={() => setViewStaff(s)}
              className="bg-card border border-border rounded-xl p-3.5 shadow-xs cursor-pointer hover:shadow-card transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                  {s.photoUrl ? (
                    <img
                      src={s.photoUrl}
                      alt={s.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={18} className="text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{s.name}</p>
                  {s.phone && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone size={10} />
                      <a
                        href={`tel:${s.phone}`}
                        className="text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCall(s.name, s.phone, "staff");
                        }}
                      >
                        {s.phone}
                      </a>
                    </p>
                  )}
                </div>
                <RoleBadge role={s.role} />
                <ChevronRight size={14} className="text-muted-foreground" />
              </div>
            </motion.div>
          ))
        )}
      </AnimatePresence>

      {/* FAB */}
      <button
        type="button"
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center z-30 hover:bg-primary/90 active:scale-95 transition-all"
        onClick={() => setShowAdd(true)}
        data-ocid="staff.open_modal_button"
      >
        <Plus size={24} />
      </button>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent
          className="max-w-sm max-h-[90vh] overflow-y-auto"
          data-ocid="staff.dialog"
        >
          <DialogHeader>
            <DialogTitle>{tr("addStaff")}</DialogTitle>
          </DialogHeader>
          <StaffForm onSave={addStaff} onCancel={() => setShowAdd(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editStaff} onOpenChange={(o) => !o && setEditStaff(null)}>
        <DialogContent
          className="max-w-sm max-h-[90vh] overflow-y-auto"
          data-ocid="staff.dialog"
        >
          <DialogHeader>
            <DialogTitle>{tr("editStaff")}</DialogTitle>
          </DialogHeader>
          {editStaff && (
            <StaffForm
              initial={editStaff}
              onSave={updateStaff}
              onCancel={() => setEditStaff(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewStaff} onOpenChange={(o) => !o && setViewStaff(null)}>
        <DialogContent
          className="max-w-sm max-h-[90vh] overflow-y-auto"
          data-ocid="staff.dialog"
        >
          <DialogHeader>
            <DialogTitle>{viewStaff?.name}</DialogTitle>
          </DialogHeader>
          {viewStaff && (
            <StaffDetail
              staff={viewStaff}
              jobs={jobs}
              onEdit={() => {
                setEditStaff(viewStaff);
                setViewStaff(null);
              }}
              onDelete={() => setDeleteId(viewStaff.id)}
              onClose={() => setViewStaff(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent className="max-w-xs" data-ocid="staff.dialog">
          <DialogHeader>
            <DialogTitle>Delete Staff</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{tr("deleteConfirm")}</p>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              data-ocid="staff.cancel_button"
            >
              {tr("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && deleteStaff(deleteId)}
              data-ocid="staff.confirm_button"
            >
              {tr("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StaffDetail({
  staff,
  jobs,
  onEdit,
  onDelete,
  onClose,
}: {
  staff: Staff;
  jobs: Job[];
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const { tr } = useLang();
  const staffJobs = jobs
    .filter((j) => j.assignedStaffIds.includes(staff.id))
    .sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={onEdit}
          data-ocid="staff.edit_button"
        >
          <Pencil size={14} className="mr-1" />
          {tr("edit")}
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={onDelete}
          data-ocid="staff.delete_button"
        >
          <Trash2 size={14} />
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
          {staff.photoUrl ? (
            <img
              src={staff.photoUrl}
              alt={staff.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <User size={24} className="text-primary" />
          )}
        </div>
        <div>
          <p className="font-bold text-base">{staff.name}</p>
          <RoleBadge role={staff.role} />
        </div>
      </div>

      {staff.phone && (
        <InfoRow
          label={tr("phone")}
          value={staff.phone}
          icon={<Phone size={12} />}
          isPhone
        />
      )}
      {staff.address && (
        <InfoRow
          label={tr("address")}
          value={staff.address}
          icon={<MapPin size={12} />}
        />
      )}
      {staff.notes && <InfoRow label={tr("notes")} value={staff.notes} />}

      <Separator />

      <div>
        <p className="text-sm font-semibold mb-2">
          {tr("jobHistory")} ({staffJobs.length})
        </p>
        {staffJobs.length === 0 ? (
          <p
            className="text-xs text-muted-foreground py-3 text-center"
            data-ocid="staff.empty_state"
          >
            {tr("noJobs")}
          </p>
        ) : (
          <div className="space-y-2">
            {staffJobs.slice(0, 10).map((j) => (
              <div key={j.id} className="bg-secondary rounded-lg p-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{j.customerName}</span>
                  <StatusBadge status={j.status} />
                </div>
                <p className="text-muted-foreground mt-0.5">
                  {deviceLabel(j.deviceType, tr)} {j.brand && `- ${j.brand}`} ·{" "}
                  {j.date}
                </p>
                <p className="text-primary font-medium mt-0.5">
                  {formatMMK(j.serviceFee)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={onClose}
        data-ocid="staff.close_button"
      >
        {tr("close")}
      </Button>
    </div>
  );
}

// ─── REPORTS TAB ──────────────────────────────────────────────────────────────
function ReportsTab({ jobs }: { jobs: Job[] }) {
  const { tr } = useLang();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const monthJobs = jobs.filter((j) => {
    const d = new Date(j.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  // Build weekly data
  const weeksData = [1, 2, 3, 4, 5]
    .map((w) => {
      const weekJobs = monthJobs.filter((j) => {
        const d = new Date(j.date);
        const weekNum = Math.ceil(d.getDate() / 7);
        return weekNum === w;
      });
      return {
        week: `W${w}`,
        done: weekJobs.filter((j) => j.status === "Done").length,
        pending: weekJobs.filter((j) => j.status === "Pending").length,
      };
    })
    .filter((w) => w.done + w.pending > 0);

  const totalDone = monthJobs.filter((j) => j.status === "Done").length;
  const totalPending = monthJobs.filter((j) => j.status === "Pending").length;
  const totalRevenue = monthJobs.reduce((a, j) => a + (j.serviceFee || 0), 0);

  const MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  }

  async function exportReport() {
    const JsPDF = await loadJsPDF();
    const doc = new JsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    let y = 20;

    // Title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Oasis AC Service - Monthly Report", pageW / 2, y, {
      align: "center",
    });
    y += 10;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Period: ${MONTHS[month]} ${year}`, pageW / 2, y, {
      align: "center",
    });
    y += 12;

    // Summary box
    doc.setDrawColor(34, 197, 94);
    doc.setLineWidth(0.5);
    doc.rect(14, y, pageW - 28, 28);
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.text(`Total Jobs: ${monthJobs.length}`, 20, y);
    doc.text(`Done: ${totalDone}`, 80, y);
    doc.text(`Pending: ${totalPending}`, 130, y);
    y += 8;
    doc.text(`Total Revenue: ${formatMMK(totalRevenue)}`, 20, y);
    y += 16;

    // Job list header
    doc.setFillColor(34, 197, 94);
    doc.rect(14, y, pageW - 28, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text("Date", 16, y + 5.5);
    doc.text("Customer", 40, y + 5.5);
    doc.text("Device", 90, y + 5.5);
    doc.text("Status", 135, y + 5.5);
    doc.text("Fee", 165, y + 5.5);
    y += 10;

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    monthJobs.forEach((j, i) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      if (i % 2 === 0) {
        doc.setFillColor(240, 253, 244);
        doc.rect(14, y - 4, pageW - 28, 8, "F");
      }
      doc.text(j.date || "", 16, y);
      const nameStr = (j.customerName || "").substring(0, 20);
      doc.text(nameStr, 40, y);
      const deviceStr = (
        deviceLabel(j.deviceType, tr) + (j.brand ? ` ${j.brand}` : "")
      ).substring(0, 22);
      doc.text(deviceStr, 90, y);
      doc.text(j.status || "", 135, y);
      doc.text(formatMMK(j.serviceFee), 160, y);
      y += 8;
    });

    doc.save(`oasis-report-${year}-${String(month + 1).padStart(2, "0")}.pdf`);
    toast.success("PDF exported!");
  }

  return (
    <div className="flex flex-col gap-4" data-ocid="reports.section">
      {/* Month selector */}
      <div className="flex items-center justify-between bg-card border border-border rounded-xl p-3">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={prevMonth}
          data-ocid="reports.secondary_button"
        >
          ‹
        </Button>
        <p className="text-sm font-semibold">
          {MONTHS[month]} {year}
        </p>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={nextMonth}
          data-ocid="reports.secondary_button"
        >
          ›
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-border shadow-xs">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">{tr("totalJobs")}</p>
            <p className="text-2xl font-bold text-foreground">
              {monthJobs.length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border shadow-xs">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">
              {tr("totalRevenue")}
            </p>
            <p className="text-base font-bold text-primary">
              {formatMMK(totalRevenue)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border shadow-xs">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">{tr("done")}</p>
            <p className="text-xl font-bold text-green-600">{totalDone}</p>
          </CardContent>
        </Card>
        <Card className="border-border shadow-xs">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">{tr("pending")}</p>
            <p className="text-xl font-bold text-amber-600">{totalPending}</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="border-border shadow-xs">
        <CardHeader className="p-3 pb-0">
          <CardTitle className="text-sm">{tr("monthly")}</CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          {weeksData.length === 0 ? (
            <p
              className="text-xs text-muted-foreground text-center py-6"
              data-ocid="reports.empty_state"
            >
              {tr("noJobs")}
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={weeksData}
                margin={{ top: 5, right: 5, bottom: 5, left: -20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.9 0.02 145)"
                />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar
                  dataKey="done"
                  name={tr("done")}
                  fill="oklch(0.52 0.18 145)"
                  radius={[3, 3, 0, 0]}
                />
                <Bar
                  dataKey="pending"
                  name={tr("pending")}
                  fill="oklch(0.75 0.18 65)"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Export */}
      <Button
        className="w-full bg-primary text-primary-foreground"
        onClick={exportReport}
        data-ocid="reports.primary_button"
      >
        <Download size={14} className="mr-2" />
        {tr("exportPDF")}
      </Button>
    </div>
  );
}

// ─── SETTINGS TAB ─────────────────────────────────────────────────────────────
function LoginSettingsSection({ lang }: { lang: Language }) {
  const [newUsername, setNewUsername] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  function handleChangeUsername(e: React.FormEvent) {
    e.preventDefault();
    if (!newUsername.trim()) return;
    const creds = loadCredentials();
    saveCredentials({ ...creds, username: newUsername.trim() });
    toast.success(
      lang === "my" ? "Username ပြောင်းပြီးပါပြီ" : "Username updated",
    );
    setNewUsername("");
  }

  function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    const creds = loadCredentials();
    if (currentPw.trim() !== creds.password) {
      toast.error(
        lang === "my" ? "လက်ရှိ Password မှားသည်" : "Current password is wrong",
      );
      return;
    }
    if (newPw.length < 4) {
      toast.error(
        lang === "my"
          ? "Password အနည်းဆုံး ၄ လုံး ရှိရမည်"
          : "Password must be at least 4 characters",
      );
      return;
    }
    if (newPw !== confirmPw) {
      toast.error(
        lang === "my" ? "Password နှစ်ခု မတူညီပါ" : "Passwords do not match",
      );
      return;
    }
    saveCredentials({ ...creds, password: newPw.trim() });
    toast.success(
      lang === "my" ? "Password ပြောင်းပြီးပါပြီ" : "Password updated",
    );
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
  }

  function handleReset() {
    if (
      window.confirm(
        lang === "my" ? "Default credentials သို့ပြန်ရမည်လား?" : "Reset to default?",
      )
    ) {
      saveCredentials(DEFAULT_CREDENTIALS);
      toast.success(
        lang === "my"
          ? "Default credentials ပြန်သတ်မှတ်ပြီးပါပြီ"
          : "Reset to default credentials",
      );
    }
  }

  return (
    <div className="space-y-4">
      {/* Change Username */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">
          {lang === "my" ? "Username ပြောင်းရန်" : "Change Username"}
        </p>
        <form onSubmit={handleChangeUsername} className="flex gap-2">
          <Input
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder={lang === "my" ? "Username အသစ်" : "New username"}
            className="text-sm"
            data-ocid="settings.username.input"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!newUsername.trim()}
            data-ocid="settings.username.save_button"
          >
            {lang === "my" ? "သိမ်းမည်" : "Save"}
          </Button>
        </form>
      </div>
      <Separator />
      {/* Change Password */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">
          {lang === "my" ? "Password ပြောင်းရန်" : "Change Password"}
        </p>
        <form onSubmit={handleChangePassword} className="space-y-2">
          <Input
            type="password"
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
            placeholder={lang === "my" ? "လက်ရှိ Password" : "Current password"}
            className="text-sm"
            data-ocid="settings.current_password.input"
          />
          <Input
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            placeholder={lang === "my" ? "Password အသစ်" : "New password"}
            className="text-sm"
            data-ocid="settings.new_password.input"
          />
          <Input
            type="password"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            placeholder={
              lang === "my" ? "Password အသစ် အတည်ပြုမည်" : "Confirm new password"
            }
            className="text-sm"
            data-ocid="settings.confirm_password.input"
          />
          <Button
            type="submit"
            size="sm"
            className="w-full"
            disabled={!currentPw || !newPw || !confirmPw}
            data-ocid="settings.password.save_button"
          >
            {lang === "my" ? "Password ပြောင်းမည်" : "Change Password"}
          </Button>
        </form>
      </div>
      <Separator />
      {/* Reset to Default */}
      <Button
        variant="outline"
        size="sm"
        className="w-full text-destructive border-destructive hover:bg-destructive/10"
        onClick={handleReset}
        data-ocid="settings.reset_credentials.button"
      >
        {lang === "my" ? "Default သို့ပြန်ရမည်" : "Reset to Default"}
      </Button>
    </div>
  );
}

function SettingsTab({
  lang,
  onLangChange,
  theme,
  onThemeChange,
  onClearCallLogs,
  onLogout,
}: {
  lang: Language;
  onLangChange: (l: Language) => void;
  theme: "light" | "dark";
  onThemeChange: (t: "light" | "dark") => void;
  onClearCallLogs: () => void;
  onLogout: () => void;
}) {
  const { tr } = useLang();
  return (
    <div className="flex flex-col gap-4" data-ocid="settings.section">
      {/* Theme */}
      <Card className="border-border shadow-xs">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            {theme === "dark" ? (
              <Moon size={18} className="text-primary" />
            ) : (
              <Sun size={18} className="text-primary" />
            )}
            <p className="font-semibold text-sm">
              {lang === "my" ? "ရောင်ချောင်မျိုး" : "Display Mode"}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onThemeChange("light")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors flex items-center justify-center gap-2 ${
                theme === "light"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border text-foreground"
              }`}
              data-ocid="settings.toggle"
            >
              <Sun size={14} />
              {lang === "my" ? "အလင်းမော်ဒ်" : "Light Mode"}
            </button>
            <button
              type="button"
              onClick={() => onThemeChange("dark")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors flex items-center justify-center gap-2 ${
                theme === "dark"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border text-foreground"
              }`}
              data-ocid="settings.toggle"
            >
              <Moon size={14} />
              {lang === "my" ? "ညစ်မော်ဒ်" : "Dark Mode"}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Language */}
      <Card className="border-border shadow-xs">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Globe size={18} className="text-primary" />
            <p className="font-semibold text-sm">{tr("language")}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onLangChange("en")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                lang === "en"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border text-foreground"
              }`}
              data-ocid="settings.toggle"
            >
              English
            </button>
            <button
              type="button"
              onClick={() => onLangChange("my")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                lang === "my"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border text-foreground"
              }`}
              data-ocid="settings.toggle"
            >
              မြန်မာ
            </button>
          </div>
        </CardContent>
      </Card>

      {/* App Info */}
      <Card className="border-border shadow-xs">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Info size={18} className="text-primary" />
            <p className="font-semibold text-sm">
              {lang === "my" ? "အက်ပ် အကြောင်း" : "App Information"}
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">App Name</span>
              <span className="text-xs font-medium">Ko Htay Aung (Oasis)</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">
                {tr("version")}
              </span>
              <Badge variant="secondary" className="text-xs">
                1.0.0
              </Badge>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">
                {tr("developer")}
              </span>
              <span className="text-xs font-medium">Zwe Maung Maung</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features List */}
      <Card className="border-border shadow-xs">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 size={18} className="text-primary" />
            <p className="font-semibold text-sm">
              {lang === "my" ? "App လုပ်ဆောင်ချက်များ" : "App Features"}
            </p>
          </div>
          <div className="space-y-3">
            {[
              {
                icon: (
                  <Briefcase
                    size={15}
                    className="text-primary shrink-0 mt-0.5"
                  />
                ),
                en: "Job Management",
                my: "လုပ်ငန်း မှတ်တမ်း",
                desc:
                  lang === "my"
                    ? "AC, ရေခဲသေတ္တာ, အဝတ်လျှော်စက် ပြုပြင်မှတ်တမ်း"
                    : "AC, Fridge, Washing Machine service records",
              },
              {
                icon: (
                  <Users size={15} className="text-primary shrink-0 mt-0.5" />
                ),
                en: "Staff Management",
                my: "ဝန်ထမ်း စီမံခန့်ခွဲမှု",
                desc:
                  lang === "my"
                    ? "ဝန်ထမ်းအချက်အလက်, ဓာတ်ပုံ, လုပ်ငန်းသမိုင်း"
                    : "Staff profiles, photos, job history, roles",
              },
              {
                icon: (
                  <User size={15} className="text-primary shrink-0 mt-0.5" />
                ),
                en: "Customer Records",
                my: "ဖောက်သည် မှတ်တမ်း",
                desc:
                  lang === "my"
                    ? "ဖုန်းနံပါတ်ဖြင့် သမိုင်းရှာဖွေမှု, ဖုန်းခေါ်ဆိုမှတ်တမ်း"
                    : "Phone-based history lookup, call logs",
              },
              {
                icon: (
                  <ShoppingBag
                    size={15}
                    className="text-primary shrink-0 mt-0.5"
                  />
                ),
                en: "Inventory",
                my: "ကုန်ပစ္စည်း",
                desc:
                  lang === "my"
                    ? "အရောင်းစာရင်း နှင့် အဝယ်စာရင်း (MMK)"
                    : "Sales & purchase records with MMK totals",
              },
              {
                icon: (
                  <BarChart2
                    size={15}
                    className="text-primary shrink-0 mt-0.5"
                  />
                ),
                en: "Reports",
                my: "အစီရင်ခံစာ",
                desc:
                  lang === "my"
                    ? "လစဉ်/အပတ်စဉ် chart, PDF ထုတ်ယူနိုင်"
                    : "Monthly/weekly charts, PDF export",
              },
              {
                icon: (
                  <Globe size={15} className="text-primary shrink-0 mt-0.5" />
                ),
                en: "Multi-device Sync",
                my: "စက်ပစ္စည်းအားလုံး sync",
                desc:
                  lang === "my"
                    ? "Link တစ်ခုတည်းမှ ဖုန်းတိုင်း data တူညီ"
                    : "All devices see the same data via one link",
              },
              {
                icon: (
                  <Download
                    size={15}
                    className="text-primary shrink-0 mt-0.5"
                  />
                ),
                en: "PDF Export",
                my: "PDF ထုတ်ယူ",
                desc:
                  lang === "my"
                    ? "Jobs, Inventory, Report တို့ PDF ဆွဲနိုင်"
                    : "One-click PDF for jobs, inventory, reports",
              },
              {
                icon: (
                  <Phone size={15} className="text-primary shrink-0 mt-0.5" />
                ),
                en: "Direct Call",
                my: "တိုက်ရိုက်ဖုန်းခေါ်",
                desc:
                  lang === "my"
                    ? "ဖောက်သည်/ဝန်ထမ်း ဖုန်းနံပါတ် နှိပ်ပြီး ခေါ်နိုင်"
                    : "Tap any phone number to call directly",
              },
              {
                icon: (
                  <Moon size={15} className="text-primary shrink-0 mt-0.5" />
                ),
                en: "Dark / Light Mode",
                my: "အမှောင်/အလင်း မုဒ်",
                desc:
                  lang === "my"
                    ? "မျက်နှာပြင် ရောင်ချောင်မျိုး ရွေးချယ်နိုင်"
                    : "Switch display theme anytime",
              },
              {
                icon: (
                  <ShieldCheck
                    size={15}
                    className="text-primary shrink-0 mt-0.5"
                  />
                ),
                en: "Secure Login",
                my: "လုံခြုံသောဝင်ရောက်မှု",
                desc:
                  lang === "my"
                    ? "Username/Password ဝင်ရောက် + Session မှတ်သား"
                    : "Username/password auth with persistent session",
              },
            ].map((feat) => (
              <div
                key={feat.en}
                className="flex gap-3 py-1.5 border-b border-border last:border-0"
              >
                {feat.icon}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground">
                    {lang === "my" ? feat.my : feat.en}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card className="border-border shadow-xs">
        <CardContent className="p-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary mx-auto flex items-center justify-center mb-3">
            <Wrench size={28} className="text-primary-foreground" />
          </div>
          <p className="text-sm font-bold text-foreground">
            Ko Htay Aung (Oasis)
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            AC Service Management App
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Air Con · Refrigerator · Washing Machine
          </p>
        </CardContent>
      </Card>

      {/* Clear Call Log */}
      <Card className="border-border shadow-xs">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Phone size={18} className="text-primary" />
              <p className="font-semibold text-sm">{tr("callLog")}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive border-destructive hover:bg-destructive/10"
              data-ocid="settings.clear_call_log.button"
              onClick={() => {
                if (
                  window.confirm(
                    lang === "my"
                      ? "မှတ်တမ်းများ အားလုံး ဖျက်မည်လား?"
                      : "Clear all call logs?",
                  )
                ) {
                  onClearCallLogs();
                }
              }}
            >
              {tr("clearCallLog")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Login Settings */}
      <Card className="border-border shadow-xs">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <KeyRound size={18} className="text-primary" />
            <p className="font-semibold text-sm">
              {lang === "my" ? "Login ဆက်တင်များ" : "Login Settings"}
            </p>
          </div>
          <LoginSettingsSection lang={lang} />
        </CardContent>
      </Card>

      {/* Logout */}
      <Card className="border-border shadow-xs">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LogOut size={18} className="text-destructive" />
              <p className="font-semibold text-sm text-destructive">
                {lang === "my" ? "ထွက်မည်" : "Logout"}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive border-destructive hover:bg-destructive/10"
              data-ocid="settings.logout.button"
              onClick={() => {
                if (
                  window.confirm(
                    lang === "my" ? "App မှ ထွက်မည်လား?" : "Logout from app?",
                  )
                ) {
                  onLogout();
                }
              }}
            >
              <LogOut size={14} className="mr-1" />
              {lang === "my" ? "ထွက်မည်" : "Logout"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground pb-2">
        © {new Date().getFullYear()}. Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          caffeine.ai
        </a>
      </p>
    </div>
  );
}

// ─── INVENTORY TAB ────────────────────────────────────────────────────────────
function InventoryTab({
  lang,
  sales,
  setSales,
  purchases,
  setPurchases,
}: {
  lang: Language;
  sales: SaleItem[];
  setSales: (items: SaleItem[]) => void;
  purchases: PurchaseItem[];
  setPurchases: (items: PurchaseItem[]) => void;
}) {
  const tr = (key: TKey) => t[lang][key];
  const [subTab, setSubTab] = useState<"sales" | "purchases">("sales");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<
    SaleItem | PurchaseItem | null
  >(null);

  const emptySaleForm = {
    date: new Date().toISOString().slice(0, 10),
    deviceType: "AC",
    brand: "",
    model: "",
    quantity: 1,
    unitPrice: 0,
    customerName: "",
    notes: "",
  };
  const emptyPurchaseForm = {
    date: new Date().toISOString().slice(0, 10),
    deviceType: "AC",
    brand: "",
    model: "",
    quantity: 1,
    unitPrice: 0,
    supplierName: "",
    notes: "",
  };

  const [form, setForm] = useState<
    typeof emptySaleForm | typeof emptyPurchaseForm
  >(emptySaleForm);

  function openAdd() {
    setEditingItem(null);
    setForm(
      subTab === "sales" ? { ...emptySaleForm } : { ...emptyPurchaseForm },
    );
    setDialogOpen(true);
  }

  function openEdit(item: SaleItem | PurchaseItem) {
    setEditingItem(item);
    if (subTab === "sales") {
      const s = item as SaleItem;
      setForm({
        date: s.date,
        deviceType: s.deviceType,
        brand: s.brand,
        model: s.model,
        quantity: s.quantity,
        unitPrice: s.unitPrice,
        customerName: s.customerName,
        notes: s.notes,
      });
    } else {
      const p = item as PurchaseItem;
      setForm({
        date: p.date,
        deviceType: p.deviceType,
        brand: p.brand,
        model: p.model,
        quantity: p.quantity,
        unitPrice: p.unitPrice,
        supplierName: p.supplierName,
        notes: p.notes,
      });
    }
    setDialogOpen(true);
  }

  function handleSave() {
    const totalPrice = (form.quantity ?? 0) * (form.unitPrice ?? 0);
    if (subTab === "sales") {
      const f = form as typeof emptySaleForm;
      if (editingItem) {
        const updated = sales.map((s) =>
          s.id === editingItem.id ? { ...s, ...f, totalPrice } : s,
        );
        setSales(updated);
        const item = updated.find((s) => s.id === editingItem.id);
        if (item)
          getBackend()
            .then((b) => b.updateSale(saleToBackend(item)))
            .catch(() => {});
      } else {
        const newItem: SaleItem = {
          id: generateId(),
          ...f,
          totalPrice,
          createdAt: Date.now(),
        };
        const updated = [newItem, ...sales];
        setSales(updated);
        getBackend()
          .then((b) => b.addSale(saleToBackend(newItem)))
          .catch(() => {});
      }
    } else {
      const f = form as typeof emptyPurchaseForm;
      if (editingItem) {
        const updated = purchases.map((p) =>
          p.id === editingItem.id ? { ...p, ...f, totalPrice } : p,
        );
        setPurchases(updated);
        const item = updated.find((p) => p.id === editingItem.id);
        if (item)
          getBackend()
            .then((b) => b.updatePurchase(purchaseToBackend(item)))
            .catch(() => {});
      } else {
        const newItem: PurchaseItem = {
          id: generateId(),
          ...f,
          totalPrice,
          createdAt: Date.now(),
        };
        const updated = [newItem, ...purchases];
        setPurchases(updated);
        getBackend()
          .then((b) => b.addPurchase(purchaseToBackend(newItem)))
          .catch(() => {});
      }
    }
    setDialogOpen(false);
  }

  function handleDelete(id: string) {
    if (!window.confirm(tr("deleteConfirm"))) return;
    if (subTab === "sales") {
      const updated = sales.filter((s) => s.id !== id);
      setSales(updated);
      getBackend()
        .then((b) => b.deleteSale(id))
        .catch(() => {});
    } else {
      const updated = purchases.filter((p) => p.id !== id);
      setPurchases(updated);
      getBackend()
        .then((b) => b.deletePurchase(id))
        .catch(() => {});
    }
  }

  const sortedSales = [...sales].sort((a, b) => (a.date < b.date ? 1 : -1));
  const sortedPurchases = [...purchases].sort((a, b) =>
    a.date < b.date ? 1 : -1,
  );
  const totalSales = sales.reduce((sum, s) => sum + s.totalPrice, 0);
  const totalPurchases = purchases.reduce((sum, p) => sum + p.totalPrice, 0);

  const deviceBadgeColor = (dt: string) => {
    if (dt === "AC")
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    if (dt === "Refrigerator")
      return "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300";
    return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
  };

  const deviceLabel = (dt: string) => {
    if (dt === "AC") return tr("ac");
    if (dt === "Refrigerator") return tr("refrigerator");
    return tr("washingMachine");
  };

  async function exportInventoryPDF() {
    const JsPDF = await loadJsPDF();
    const doc = new JsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const isSales = subTab === "sales";
    const items = isSales ? sortedSales : sortedPurchases;
    const total = isSales ? totalSales : totalPurchases;
    const title = isSales
      ? "Oasis AC Service - Sales Records"
      : "Oasis AC Service - Purchase Records";
    let y = 20;

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(title, pageW / 2, y, { align: "center" });
    y += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const today = new Date().toISOString().slice(0, 10);
    doc.text(`Generated: ${today}`, pageW / 2, y, { align: "center" });
    y += 12;

    // Summary box
    doc.setDrawColor(34, 197, 94);
    doc.setLineWidth(0.5);
    doc.rect(14, y, pageW - 28, 16);
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text(`Total Records: ${items.length}`, 20, y);
    doc.text(`Total: ${formatMMK(total)}`, 100, y);
    y += 16;

    // Table header
    doc.setFillColor(34, 197, 94);
    doc.rect(14, y, pageW - 28, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text("Date", 16, y + 5.5);
    doc.text("Device", 40, y + 5.5);
    doc.text("Brand/Model", 75, y + 5.5);
    doc.text("Qty", 120, y + 5.5);
    doc.text(isSales ? "Customer" : "Supplier", 132, y + 5.5);
    doc.text("Total", 168, y + 5.5);
    y += 10;

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    items.forEach((item, i) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      if (i % 2 === 0) {
        doc.setFillColor(240, 253, 244);
        doc.rect(14, y - 4, pageW - 28, 8, "F");
      }
      doc.text(item.date || "", 16, y);
      doc.text(deviceLabel(item.deviceType).substring(0, 14), 40, y);
      const bm = (
        (item.brand || "") + (item.model ? ` ${item.model}` : "")
      ).substring(0, 20);
      doc.text(bm, 75, y);
      doc.text(String(item.quantity), 120, y);
      const party = isSales
        ? (item as SaleItem).customerName
        : (item as PurchaseItem).supplierName;
      doc.text((party || "").substring(0, 16), 132, y);
      doc.text(formatMMK(item.totalPrice), 162, y);
      y += 8;
    });

    const fname = isSales
      ? `oasis-sales-${today}.pdf`
      : `oasis-purchases-${today}.pdf`;
    doc.save(fname);
    toast.success("PDF exported!");
  }

  const isSalesForm = subTab === "sales";

  return (
    <div className="flex flex-col h-full pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="text-base font-bold text-foreground">
          {tr("inventory")}
        </h1>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={exportInventoryPDF}
            className="gap-1"
            data-ocid="inventory.export_pdf_button"
          >
            <Download size={14} />
            PDF
          </Button>
          <Button
            size="sm"
            onClick={openAdd}
            className="gap-1"
            data-ocid="inventory.primary_button"
          >
            <Plus size={16} />
            {subTab === "sales" ? tr("addSale") : tr("addPurchase")}
          </Button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex mx-4 mt-3 mb-2 rounded-lg overflow-hidden border border-border">
        <button
          type="button"
          onClick={() => setSubTab("sales")}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${subTab === "sales" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}
          data-ocid="inventory.sales.tab"
        >
          {tr("sales")}
        </button>
        <button
          type="button"
          onClick={() => setSubTab("purchases")}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${subTab === "purchases" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}
          data-ocid="inventory.purchases.tab"
        >
          {tr("purchases")}
        </button>
      </div>

      {/* Summary card */}
      <div className="mx-4 mb-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-3 px-4">
            <p className="text-xs text-muted-foreground">
              {subTab === "sales"
                ? tr("totalSalesRevenue")
                : tr("totalPurchaseCost")}
            </p>
            <p className="text-xl font-bold text-primary">
              {formatMMK(subTab === "sales" ? totalSales : totalPurchases)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 space-y-2">
        {subTab === "sales" &&
          (sortedSales.length === 0 ? (
            <p
              className="text-center text-sm text-muted-foreground py-10"
              data-ocid="inventory.sales.empty_state"
            >
              {tr("noSales")}
            </p>
          ) : (
            sortedSales.map((item, idx) => (
              <Card key={item.id} data-ocid={`inventory.sales.item.${idx + 1}`}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${deviceBadgeColor(item.deviceType)}`}
                        >
                          {deviceLabel(item.deviceType)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {item.date}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-foreground truncate">
                        {item.brand} {item.model}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} × {formatMMK(item.unitPrice)} ={" "}
                        <span className="font-semibold text-foreground">
                          {formatMMK(item.totalPrice)}
                        </span>
                      </p>
                      {item.customerName && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.customerName}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
                        data-ocid={`inventory.sales.edit_button.${idx + 1}`}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive"
                        data-ocid={`inventory.sales.delete_button.${idx + 1}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ))}
        {subTab === "purchases" &&
          (sortedPurchases.length === 0 ? (
            <p
              className="text-center text-sm text-muted-foreground py-10"
              data-ocid="inventory.purchases.empty_state"
            >
              {tr("noPurchases")}
            </p>
          ) : (
            sortedPurchases.map((item, idx) => (
              <Card
                key={item.id}
                data-ocid={`inventory.purchases.item.${idx + 1}`}
              >
                <CardContent className="py-3 px-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${deviceBadgeColor(item.deviceType)}`}
                        >
                          {deviceLabel(item.deviceType)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {item.date}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-foreground truncate">
                        {item.brand} {item.model}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} × {formatMMK(item.unitPrice)} ={" "}
                        <span className="font-semibold text-foreground">
                          {formatMMK(item.totalPrice)}
                        </span>
                      </p>
                      {item.supplierName && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.supplierName}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
                        data-ocid={`inventory.purchases.edit_button.${idx + 1}`}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive"
                        data-ocid={`inventory.purchases.delete_button.${idx + 1}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm" data-ocid="inventory.dialog">
          <DialogHeader>
            <DialogTitle>
              {editingItem
                ? isSalesForm
                  ? tr("editSale")
                  : tr("editPurchase")
                : isSalesForm
                  ? tr("addSale")
                  : tr("addPurchase")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{tr("date")}</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, date: e.target.value }))
                  }
                  className="text-sm"
                  data-ocid="inventory.date.input"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{tr("deviceType")}</Label>
                <Select
                  value={form.deviceType}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, deviceType: v }))
                  }
                >
                  <SelectTrigger
                    className="text-sm"
                    data-ocid="inventory.devicetype.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AC">{tr("ac")}</SelectItem>
                    <SelectItem value="Refrigerator">
                      {tr("refrigerator")}
                    </SelectItem>
                    <SelectItem value="Washing Machine">
                      {tr("washingMachine")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{tr("brand")}</Label>
                <Input
                  value={form.brand}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, brand: e.target.value }))
                  }
                  className="text-sm"
                  data-ocid="inventory.brand.input"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{tr("model")}</Label>
                <Input
                  value={form.model}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, model: e.target.value }))
                  }
                  className="text-sm"
                  data-ocid="inventory.model.input"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{tr("quantity")}</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      quantity: Number.parseInt(e.target.value) || 1,
                    }))
                  }
                  className="text-sm"
                  data-ocid="inventory.quantity.input"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{tr("unitPrice")} (MMK)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.unitPrice}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      unitPrice: Number.parseInt(e.target.value) || 0,
                    }))
                  }
                  className="text-sm"
                  data-ocid="inventory.unitprice.input"
                />
              </div>
            </div>
            <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
              <span className="text-muted-foreground text-xs">
                {tr("totalPrice")}:{" "}
              </span>
              <span className="font-semibold text-primary">
                {formatMMK((form.quantity ?? 0) * (form.unitPrice ?? 0))}
              </span>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">
                {isSalesForm ? tr("customerName") : tr("supplierName")}
              </Label>
              <Input
                value={
                  isSalesForm
                    ? (form as typeof emptySaleForm).customerName
                    : (form as typeof emptyPurchaseForm).supplierName
                }
                onChange={(e) =>
                  setForm((p) =>
                    isSalesForm
                      ? { ...p, customerName: e.target.value }
                      : { ...p, supplierName: e.target.value },
                  )
                }
                className="text-sm"
                data-ocid="inventory.party.input"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{tr("notes")}</Label>
              <Textarea
                value={form.notes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, notes: e.target.value }))
                }
                className="text-sm resize-none"
                rows={2}
                data-ocid="inventory.notes.textarea"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              data-ocid="inventory.cancel_button"
            >
              {tr("cancel")}
            </Button>
            <Button onClick={handleSave} data-ocid="inventory.save_button">
              {tr("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
type Tab = "home" | "jobs" | "staff" | "reports" | "settings" | "inventory";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(() => isLoggedIn());
  const [lang, setLang] = useState<Language>(() => loadLanguage() as Language);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("theme") as "light" | "dark") ?? "light";
  });
  const [tab, setTab] = useState<Tab>("home");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const tr = (k: TKey) => t[lang][k] ?? t.en[k] ?? k;

  function recordCall(
    customerName: string,
    customerPhone: string,
    context: string,
  ) {
    const log: CallLog = {
      id: generateId(),
      customerName,
      customerPhone,
      calledAt: Date.now(),
      context,
    };
    const updated = [log, ...callLogs].slice(0, 200);
    setCallLogs(updated);
    getBackend()
      .then((b) => b.addCallLog(callLogToBackend(log)))
      .catch(() => {});
  }

  function clearCallLogs() {
    setCallLogs([]);
    getBackend()
      .then((b) => b.clearCallLogs())
      .catch(() => {});
  }

  function handleLogout() {
    clearSession();
    setLoggedIn(false);
  }

  function handleLangChange(l: Language) {
    setLang(l);
    saveLanguage(l);
  }

  function handleThemeChange(t: "light" | "dark") {
    setTheme(t);
    localStorage.setItem("theme", t);
    if (t === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: getBackend is a stable module singleton
  useEffect(() => {
    if (!loggedIn) return;
    let cancelled = false;
    async function fetchAll() {
      try {
        const b = await getBackend();
        const [bJobs, bStaff, bSales, bPurchases, bCallLogs, bCreds] =
          await Promise.all([
            b.getJobs(),
            b.getStaff(),
            b.getSales(),
            b.getPurchases(),
            b.getCallLogs(),
            b.getCredentials(),
          ]);
        if (cancelled) return;
        setJobs(bJobs.map(jobFromBackend));
        setStaffList(bStaff.map(staffFromBackend));
        setSales(bSales.map(saleFromBackend));
        setPurchases(bPurchases.map(purchaseFromBackend));
        setCallLogs(bCallLogs.map(callLogFromBackend));
        // Sync credentials from backend to localStorage
        if (bCreds.username && bCreds.password) {
          localStorage.setItem(
            "oasis_credentials",
            JSON.stringify({
              username: bCreds.username,
              password: bCreds.password,
            }),
          );
        }
      } catch (err) {
        console.error("Failed to load data from backend", err);
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    }
    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [loggedIn]);

  const navItems: { id: Tab; icon: React.ReactNode; label: TKey }[] = [
    { id: "home", icon: <Home size={20} />, label: "home" },
    { id: "jobs", icon: <Briefcase size={20} />, label: "jobs" },
    { id: "staff", icon: <Users size={20} />, label: "staff" },
    { id: "reports", icon: <BarChart2 size={20} />, label: "reports" },
    { id: "settings", icon: <Settings size={20} />, label: "settings" },
    { id: "inventory", icon: <ShoppingBag size={20} />, label: "inventory" },
  ];

  if (!loggedIn) {
    return <LoginScreen onLogin={() => setLoggedIn(true)} />;
  }

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg animate-pulse">
          <Wrench size={22} className="text-primary-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">ဒေတာ လဝင်နေသည်...</p>
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <LangCtx.Provider value={{ lang, tr }}>
      <div className="min-h-screen bg-background flex justify-center">
        <div className="w-full max-w-[430px] relative flex flex-col min-h-screen">
          {/* Page header */}
          <header className="sticky top-0 z-20 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <Wrench size={16} className="text-primary-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-xs leading-none text-muted-foreground">
                Ko Htay Aung
              </p>
              <p className="text-sm font-bold leading-tight text-foreground">
                Oasis AC Service
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                handleThemeChange(theme === "dark" ? "light" : "dark")
              }
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              data-ocid="settings.toggle"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    lang === "my" ? "App မှ ထွက်မည်လား?" : "Logout from app?",
                  )
                ) {
                  handleLogout();
                }
              }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              data-ocid="header.logout.button"
              aria-label="Logout"
            >
              <LogOut size={18} />
            </button>
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
              >
                {tab === "home" && (
                  <HomeTab
                    jobs={jobs}
                    staffList={staffList}
                    callLogs={callLogs}
                    onCall={recordCall}
                  />
                )}
                {tab === "jobs" && (
                  <JobsTab
                    jobs={jobs}
                    staffList={staffList}
                    onJobsChange={setJobs}
                    onCall={recordCall}
                  />
                )}
                {tab === "staff" && (
                  <StaffTab
                    staffList={staffList}
                    jobs={jobs}
                    onStaffChange={setStaffList}
                    onCall={recordCall}
                  />
                )}
                {tab === "reports" && <ReportsTab jobs={jobs} />}
                {tab === "inventory" && (
                  <InventoryTab
                    lang={lang}
                    sales={sales}
                    setSales={setSales}
                    purchases={purchases}
                    setPurchases={setPurchases}
                  />
                )}
                {tab === "settings" && (
                  <SettingsTab
                    lang={lang}
                    onLangChange={handleLangChange}
                    theme={theme}
                    onThemeChange={handleThemeChange}
                    onClearCallLogs={clearCallLogs}
                    onLogout={handleLogout}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Bottom navigation */}
          <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card border-t border-border bottom-nav z-20">
            <div className="flex">
              {navItems.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors ${
                    tab === item.id
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-ocid={`nav.${item.id}.link`}
                >
                  {item.icon}
                  <span className="text-[10px] font-medium">
                    {tr(item.label)}
                  </span>
                  {tab === item.id && (
                    <span className="absolute bottom-0 w-6 h-0.5 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>
          </nav>
        </div>
      </div>
      <Toaster richColors position="top-center" />
    </LangCtx.Provider>
  );
}
