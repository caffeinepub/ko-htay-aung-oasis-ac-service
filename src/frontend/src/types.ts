export interface Staff {
  id: string;
  name: string;
  role: string;
  phone: string;
  address: string;
  notes: string;
  photoUrl?: string;
  createdAt: number;
}

export interface Job {
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
  assignedStaffIds: string[];
  serviceFee: number;
  notes: string;
  photoUrl?: string;
  photoUrls: string[];
  createdAt: number;
  updatedAt: number;
}

export interface CallLog {
  id: string;
  customerName: string;
  customerPhone: string;
  calledAt: number;
  context: string;
}

export interface SaleItem {
  id: string;
  date: string;
  deviceType: string;
  brand: string;
  model: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  customerName: string;
  notes: string;
  createdAt: number;
}

export interface PurchaseItem {
  id: string;
  date: string;
  deviceType: string;
  brand: string;
  model: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  supplierName: string;
  notes: string;
  createdAt: number;
}

export type Language = "en" | "my";
