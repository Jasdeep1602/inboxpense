'use client';

import { signOut } from '@/actions/auth';
import { DropzoneArea } from '@/components/dropzone-area';
import { TransactionList } from '@/components/transaction-list';
import { Button } from '@/components/ui/button';
import SmsXmlReader from '@/components/xmlfileread';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const handleSignOut = async () => {
    await signOut();
    router.replace('/sign-in');
  };

  return (
    <div className='min-h-screen bg-slate-50'>
      {/* Header */}
      <header className='fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm shadow-sm border-b border-slate-200/50'>
        <div className='w-full px-4 py-4 flex items-center justify-between'>
          {/* Logo */}
          <div className='flex items-center gap-2'>
            <span className='inline-block text-2xl'>📥</span>
            <h1 className='text-2xl font-extrabold tracking-tight text-blue-900'>
              Inbo<span className='text-blue-600'>X</span>pense
            </h1>
          </div>

          {/* Sign Out Button */}
          <form action={handleSignOut}>
            <Button
              className='cursor-pointer'
              type='submit'
              variant='outline'
              size='sm'>
              Sign out
            </Button>
          </form>
        </div>
      </header>

      {/* Main Content */}
      <main className='max-w-2xl mx-auto pt-24 pb-10 px-4'>
        <DropzoneArea />
        <TransactionList />
        <SmsXmlReader />
      </main>
    </div>
  );
}
