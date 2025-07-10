'use client';

import { signInwithGoogle } from '../../../actions/auth';
import { Button } from '@/components/ui/button';

export default function Signin() {
  const handleSignIn = async () => {
    console.log('Signin page loaded');

    const { url } = await signInwithGoogle('/dashboard');
    if (url) {
      window.location.href = url;
    } else {
      console.error('Failed to get sign-in URL');
    }
  };

  return (
    <div>
      signin
      <form action={handleSignIn} className='flex flex-col items-center gap-4'>
        <Button className='w-full max-w-sm' type='submit'>
          Sign in with Google
        </Button>{' '}
      </form>
    </div>
  );
}
