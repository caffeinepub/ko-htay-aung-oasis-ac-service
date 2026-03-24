import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface PurchaseItem {
    id: string;
    model: string;
    supplierName: string;
    date: string;
    createdAt: bigint;
    notes: string;
    quantity: bigint;
    deviceType: string;
    brand: string;
    unitPrice: number;
    totalPrice: number;
}
export interface Job {
    hp: string;
    id: string;
    acType: string;
    customerName: string;
    status: string;
    photoUrls: Array<string>;
    customerPhone: string;
    date: string;
    createdAt: bigint;
    photoUrl?: string;
    serviceFee: number;
    updatedAt: bigint;
    customerAddress: string;
    notes: string;
    deviceType: string;
    assignedStaffIds: Array<string>;
    brand: string;
    problem: string;
    gasType: string;
}
export interface Staff {
    id: string;
    name: string;
    createdAt: bigint;
    role: string;
    photoUrl?: string;
    address: string;
    notes: string;
    phone: string;
}
export interface CallLog {
    id: string;
    customerName: string;
    context: string;
    customerPhone: string;
    calledAt: bigint;
}
export interface SaleItem {
    id: string;
    customerName: string;
    model: string;
    date: string;
    createdAt: bigint;
    notes: string;
    quantity: bigint;
    deviceType: string;
    brand: string;
    unitPrice: number;
    totalPrice: number;
}
export interface backendInterface {
    addCallLog(item: CallLog): Promise<void>;
    addJob(item: Job): Promise<void>;
    addPurchase(item: PurchaseItem): Promise<void>;
    addSale(item: SaleItem): Promise<void>;
    addStaff(item: Staff): Promise<void>;
    clearCallLogs(): Promise<void>;
    deleteJob(id: string): Promise<void>;
    deletePurchase(id: string): Promise<void>;
    deleteSale(id: string): Promise<void>;
    deleteStaff(id: string): Promise<void>;
    getCallLogs(): Promise<Array<CallLog>>;
    getCredentials(): Promise<{
        username: string;
        password: string;
    }>;
    getJobs(): Promise<Array<Job>>;
    getPurchases(): Promise<Array<PurchaseItem>>;
    getSales(): Promise<Array<SaleItem>>;
    getStaff(): Promise<Array<Staff>>;
    setCredentials(username: string, password: string): Promise<void>;
    updateJob(item: Job): Promise<void>;
    updatePurchase(item: PurchaseItem): Promise<void>;
    updateSale(item: SaleItem): Promise<void>;
    updateStaff(item: Staff): Promise<void>;
}
