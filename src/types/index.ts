export interface Transaction {
  date: string;
  body: string;
  amount: number;
  type: 'credit' | 'debit';
  mode: string;
  status?: 'success' | 'failed';
}

export interface MonthlyGroup {
  month: string;
  totalCredit: number;
  totalDebit: number;
  transactions: Transaction[];
}

export interface DriveFile {
  id: string;
  name: string;
}
export interface CacheData {
  files: DriveFile[];
  transactions: Transaction[];
  lastUpdated: number;
}
