import type { backendInterface as BaseBackendInterface } from "./backend";
import { createActorWithConfig } from "./config";

export interface AppBackend extends BaseBackendInterface {
  getStaff: () => Promise<any[]>;
  addStaff: (item: any) => Promise<void>;
  updateStaff: (item: any) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
  getJobs: () => Promise<any[]>;
  addJob: (item: any) => Promise<void>;
  updateJob: (item: any) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
  getCallLogs: () => Promise<any[]>;
  addCallLog: (item: any) => Promise<void>;
  clearCallLogs: () => Promise<void>;
  getSales: () => Promise<any[]>;
  addSale: (item: any) => Promise<void>;
  updateSale: (item: any) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;
  getPurchases: () => Promise<any[]>;
  addPurchase: (item: any) => Promise<void>;
  updatePurchase: (item: any) => Promise<void>;
  deletePurchase: (id: string) => Promise<void>;
  getCredentials: () => Promise<{ username: string; password: string }>;
  setCredentials: (username: string, password: string) => Promise<void>;
}

let _backend: AppBackend | null = null;

export async function getBackend(): Promise<AppBackend> {
  if (!_backend) {
    _backend = (await createActorWithConfig()) as AppBackend;
  }
  return _backend;
}
