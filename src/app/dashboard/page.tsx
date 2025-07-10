'use client';

import { signOut } from '../../actions/auth';
import { DropzoneArea } from '@/components/dropzone-area';
import { TransactionList } from '@/components/transaction-list';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const handleSignOut = async () => {
    await signOut();
    router.replace('/sign-in');
  };
  return (
    <main className='max-w-2xl mx-auto py-10 px-4 bg-slate-50 min-h-screen'>
      <div className='flex items-center gap-2 mb-6'>
        <span className='inline-block text-3xl'>📥</span>
        <h1 className='text-3xl font-extrabold tracking-tight text-blue-900'>
          Inbo<span className='text-blue-600'>X</span>pense
        </h1>
      </div>
      <form action={handleSignOut} className='flex flex-col items-center gap-4'>
        <Button className='w-full max-w-sm' type='submit'>
          Sign out
        </Button>{' '}
      </form>
      <DropzoneArea />
      <TransactionList />
    </main>
  );
}
