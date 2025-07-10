'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Transaction } from '@/types';
import {
  ArrowDownCircleIcon,
  ArrowUpCircleIcon,
  BanknotesIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

export function TransactionCard({ txn }: { txn: Transaction }) {
  const [dateStr, setDateStr] = useState('');
  useEffect(() => {
    setDateStr(new Date(+txn.date).toLocaleString());
  }, [txn.date]);

  return (
    <Card className='shadow-md rounded-xl border w-full'>
      <CardContent className='p-4 flex flex-col gap-2'>
        <div className='flex justify-between items-center'>
          <span className='text-xs text-muted-foreground'>{dateStr}</span>
          {txn.status === 'failed' ? (
            <span className='flex items-center gap-1 px-2 py-0.5 rounded bg-red-100 text-red-700 text-xs font-semibold'>
              <ExclamationCircleIcon className='h-4 w-4' />
              Failed
            </span>
          ) : (
            <span className='flex items-center gap-1 px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs font-semibold'>
              <ArrowUpCircleIcon className='h-4 w-4' />
              Success
            </span>
          )}
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <span className='text-xl font-bold flex items-center gap-1'>
            {txn.type === 'credit' ? (
              <ArrowDownCircleIcon className='h-5 w-5 text-green-500 opacity-70' />
            ) : (
              <ArrowUpCircleIcon className='h-5 w-5 text-orange-500 opacity-70' />
            )}
            ₹{txn.amount.toFixed(2)}
          </span>
          <span
            className={
              txn.type === 'credit'
                ? 'flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 font-semibold'
                : 'flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-700 font-semibold'
            }>
            {txn.type === 'credit' ? 'Credit' : 'Debit'}
          </span>
          <span className='flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700'>
            <BanknotesIcon className='h-4 w-4 opacity-60' />
            {txn.mode}
          </span>
        </div>
        <div className='text-xs text-muted-foreground break-words'>
          {txn.body}
        </div>
      </CardContent>
    </Card>
  );
}
