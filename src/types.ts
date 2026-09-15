export type User = {
  id: number;
  uid: string;
  email: string;
  createdAt: string;
};

export type Entry = {
  id: number;
  userId: number;
  amount: string;
  type: 'earning' | 'expense';
  note: string | null;
  date: string;
  createdAt: string;
};

export type DashboardData = {
  balance: number;
  totalEarning: number;
  totalExpense: number;
  entries: Entry[];
};
