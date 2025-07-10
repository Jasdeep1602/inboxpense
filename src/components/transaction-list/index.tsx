'use client';

import { useMemo } from 'react';
import { useTransactionStore } from '@/store/transactionStore';
import { groupByMonth } from '@/lib/groupByMonth';
import { TransactionCard } from '@/components/transaction-card';

export function TransactionList() {
  const transactions = useTransactionStore((state) => state.transactions);
  const monthlyGroups = useMemo(
    () => groupByMonth(transactions),
    [transactions]
  );

  return (
    <div className='space-y-6 mt-6'>
      {monthlyGroups.map((group, index) => (
        <div key={index} className='space-y-2'>
          <div className='rounded-lg bg-blue-50/80 px-4 py-3 mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between border border-blue-100'>
            <h2 className='text-xl font-bold text-blue-800'>{group.month}</h2>
            <div className='flex gap-4 text-sm text-muted-foreground mt-2 sm:mt-0'>
              <span>
                Credit:{' '}
                <span className='font-semibold text-green-700'>
                  ₹{group.totalCredit.toFixed(2)}
                </span>
              </span>
              <span>
                Debit:{' '}
                <span className='font-semibold text-orange-700'>
                  ₹{group.totalDebit.toFixed(2)}
                </span>
              </span>
            </div>
          </div>
          <div className='flex flex-col gap-4 w-full max-w-xl mx-auto px-2 sm:px-0'>
            {group.transactions.map((txn, idx) => (
              <TransactionCard key={idx} txn={txn} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
