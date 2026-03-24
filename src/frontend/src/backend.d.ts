import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;

export interface BackendStaff {
    id: string;
    name: string;
    role: string;
    phone: string;
    address: string;
    notes: string;
    photoUrl: [] | [string];
    createdAt: bigint;
}

export interface BackendJob {
    id: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    deviceType: string;
    brand: string;
    hp: string;
    acType: string;
    problem: string;
    gasType: string;
    status: string;
    date: string;
    assignedStaffIds: Array<string>;
    serviceFee: number;
    notes: string;
    photoUrl: [] | [string];
    photoUrls: Array<string>;
    createdAt: bigint;
    updatedAt: bigint;
}

export interface BackendCallLog {
    id: string;
    customerName: string;
    customerPhone: string;
    calledAt: bigint;
    context: string;
}

export interface BackendSaleItem {
    id: string;
    date: string;
    deviceType: string;
    brand: string;
    model: string;
    quantity: bigint;
    unitPrice: number;
    totalPrice: number;
    customerName: string;
    notes: string;
    createdAt: bigint;
}

export interface BackendPurchaseItem {
    id: string;
    date: string;
    deviceType: string;
    brand: string;
    model: string;
    quantity: bigint;
    unitPrice: number;
    totalPrice: number;
    supplierName: string;
    notes: string;
    createdAt: bigint;
}

export interface backendInterface {
    getStaff: () => Promise<Array<BackendStaff>>;
    addStaff: (item: BackendStaff) => Promise<undefined>;
    updateStaff: (item: BackendStaff) => Promise<undefined>;
    deleteStaff: (id: string) => Promise<undefined>;

    getJobs: () => Promise<Array<BackendJob>>;
    addJob: (item: BackendJob) => Promise<undefined>;
    updateJob: (item: BackendJob) => Promise<undefined>;
    deleteJob: (id: string) => Promise<undefined>;

    getCallLogs: () => Promise<Array<BackendCallLog>>;
    addCallLog: (item: BackendCallLog) => Promise<undefined>;
    clearCallLogs: () => Promise<undefined>;

    getSales: () => Promise<Array<BackendSaleItem>>;
    addSale: (item: BackendSaleItem) => Promise<undefined>;
    updateSale: (item: BackendSaleItem) => Promise<undefined>;
    deleteSale: (id: string) => Promise<undefined>;

    getPurchases: () => Promise<Array<BackendPurchaseItem>>;
    addPurchase: (item: BackendPurchaseItem) => Promise<undefined>;
    updatePurchase: (item: BackendPurchaseItem) => Promise<undefined>;
    deletePurchase: (id: string) => Promise<undefined>;

    getCredentials: () => Promise<{ username: string; password: string }>;
    setCredentials: (username: string, password: string) => Promise<undefined>;
}
