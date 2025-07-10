import { format } from 'date-fns';
import { Transaction, MonthlyGroup } from '@/types';

export function groupByMonth(transactions: Transaction[]): MonthlyGroup[] {
  // Sort transactions by date descending
  const sortedTxns = [...transactions].sort(
    (a, b) => Number(b.date) - Number(a.date)
  );

  const groups: Record<string, MonthlyGroup> = {};

  for (const txn of sortedTxns) {
    const monthKey = format(new Date(+txn.date), 'yyyy-MM');
    if (!groups[monthKey]) {
      groups[monthKey] = {
        month: format(new Date(+txn.date), 'MMMM yyyy'),
        totalCredit: 0,
        totalDebit: 0,
        transactions: [],
      };
    }
    if (txn.type === 'credit') groups[monthKey].totalCredit += txn.amount;
    else groups[monthKey].totalDebit += txn.amount;
    groups[monthKey].transactions.push(txn);
  }

  return Object.values(groups).sort(
    (a, b) => new Date(b.month).getTime() - new Date(a.month).getTime()
  );
}
