import Array "mo:base/Array";
import MixinStorage "blob-storage/Mixin";

actor {
  include MixinStorage();

  public type Staff = {
    id : Text;
    name : Text;
    role : Text;
    phone : Text;
    address : Text;
    notes : Text;
    photoUrl : ?Text;
    createdAt : Int;
  };

  public type Job = {
    id : Text;
    customerName : Text;
    customerPhone : Text;
    customerAddress : Text;
    deviceType : Text;
    brand : Text;
    hp : Text;
    acType : Text;
    problem : Text;
    gasType : Text;
    status : Text;
    date : Text;
    assignedStaffIds : [Text];
    serviceFee : Float;
    notes : Text;
    photoUrl : ?Text;
    photoUrls : [Text];
    createdAt : Int;
    updatedAt : Int;
  };

  public type CallLog = {
    id : Text;
    customerName : Text;
    customerPhone : Text;
    calledAt : Int;
    context : Text;
  };

  public type SaleItem = {
    id : Text;
    date : Text;
    deviceType : Text;
    brand : Text;
    model : Text;
    quantity : Int;
    unitPrice : Float;
    totalPrice : Float;
    customerName : Text;
    notes : Text;
    createdAt : Int;
  };

  public type PurchaseItem = {
    id : Text;
    date : Text;
    deviceType : Text;
    brand : Text;
    model : Text;
    quantity : Int;
    unitPrice : Float;
    totalPrice : Float;
    supplierName : Text;
    notes : Text;
    createdAt : Int;
  };

  stable var staffData : [Staff] = [];
  stable var jobsData : [Job] = [];
  stable var callLogsData : [CallLog] = [];
  stable var salesData : [SaleItem] = [];
  stable var purchasesData : [PurchaseItem] = [];
  stable var credUsername : Text = "Oasis";
  stable var credPassword : Text = "oasis2000";

  // Staff
  public func getStaff() : async [Staff] { staffData };
  public func addStaff(item : Staff) : async () {
    staffData := Array.append(staffData, [item]);
  };
  public func updateStaff(item : Staff) : async () {
    staffData := Array.map<Staff, Staff>(staffData, func(s) {
      if (s.id == item.id) { item } else { s };
    });
  };
  public func deleteStaff(id : Text) : async () {
    staffData := Array.filter<Staff>(staffData, func(s) { s.id != id });
  };

  // Jobs
  public func getJobs() : async [Job] { jobsData };
  public func addJob(item : Job) : async () {
    jobsData := Array.append(jobsData, [item]);
  };
  public func updateJob(item : Job) : async () {
    jobsData := Array.map<Job, Job>(jobsData, func(j) {
      if (j.id == item.id) { item } else { j };
    });
  };
  public func deleteJob(id : Text) : async () {
    jobsData := Array.filter<Job>(jobsData, func(j) { j.id != id });
  };

  // Call Logs
  public func getCallLogs() : async [CallLog] { callLogsData };
  public func addCallLog(item : CallLog) : async () {
    callLogsData := Array.append(callLogsData, [item]);
  };
  public func clearCallLogs() : async () {
    callLogsData := [];
  };

  // Sales
  public func getSales() : async [SaleItem] { salesData };
  public func addSale(item : SaleItem) : async () {
    salesData := Array.append(salesData, [item]);
  };
  public func updateSale(item : SaleItem) : async () {
    salesData := Array.map<SaleItem, SaleItem>(salesData, func(s) {
      if (s.id == item.id) { item } else { s };
    });
  };
  public func deleteSale(id : Text) : async () {
    salesData := Array.filter<SaleItem>(salesData, func(s) { s.id != id });
  };

  // Purchases
  public func getPurchases() : async [PurchaseItem] { purchasesData };
  public func addPurchase(item : PurchaseItem) : async () {
    purchasesData := Array.append(purchasesData, [item]);
  };
  public func updatePurchase(item : PurchaseItem) : async () {
    purchasesData := Array.map<PurchaseItem, PurchaseItem>(purchasesData, func(p) {
      if (p.id == item.id) { item } else { p };
    });
  };
  public func deletePurchase(id : Text) : async () {
    purchasesData := Array.filter<PurchaseItem>(purchasesData, func(p) { p.id != id });
  };

  // Credentials
  public func getCredentials() : async { username : Text; password : Text } {
    { username = credUsername; password = credPassword };
  };
  public func setCredentials(username : Text, password : Text) : async () {
    credUsername := username;
    credPassword := password;
  };
};
