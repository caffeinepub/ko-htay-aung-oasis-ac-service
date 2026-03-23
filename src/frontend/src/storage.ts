import type { CallLog, Job, PurchaseItem, SaleItem, Staff } from "./types";

const JOBS_KEY = "oasis_jobs";
const STAFF_KEY = "oasis_staff";
const LANG_KEY = "oasis_lang";
const CALL_LOGS_KEY = "oasis_call_logs";
const SALES_KEY = "oasis_sales";
const PURCHASES_KEY = "oasis_purchases";

export function loadJobs(): Job[] {
  try {
    const raw = localStorage.getItem(JOBS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveJobs(jobs: Job[]): void {
  localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
}

export function loadStaff(): Staff[] {
  try {
    const raw = localStorage.getItem(STAFF_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStaff(staff: Staff[]): void {
  localStorage.setItem(STAFF_KEY, JSON.stringify(staff));
}

export function loadCallLogs(): CallLog[] {
  try {
    const raw = localStorage.getItem(CALL_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCallLogs(logs: CallLog[]): void {
  localStorage.setItem(CALL_LOGS_KEY, JSON.stringify(logs));
}

export function loadSales(): SaleItem[] {
  try {
    const raw = localStorage.getItem(SALES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSales(items: SaleItem[]): void {
  localStorage.setItem(SALES_KEY, JSON.stringify(items));
}

export function loadPurchases(): PurchaseItem[] {
  try {
    const raw = localStorage.getItem(PURCHASES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePurchases(items: PurchaseItem[]): void {
  localStorage.setItem(PURCHASES_KEY, JSON.stringify(items));
}

export function loadLanguage(): string {
  return localStorage.getItem(LANG_KEY) || "en";
}

export function saveLanguage(lang: string): void {
  localStorage.setItem(LANG_KEY, lang);
}

export function formatMMK(amount: number): string {
  return `MMK ${amount.toLocaleString()}`;
}

export function generateId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString() + Math.random().toString(36).slice(2);
}
