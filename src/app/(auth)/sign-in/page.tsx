'use client';

import { signInwithGoogle } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useState } from 'react';

export default function Signin() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);

    try {
      const { url } = await signInwithGoogle('/dashboard');
      if (url) {
        window.location.href = url;
      } else {
        console.error('Failed to get sign-in URL');
        // You might want to show a toast notification here
      }
    } catch (error) {
      console.error('Sign-in error:', error);
      // Handle error - show toast notification
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4'>
      <div className='w-full max-w-md'>
        <Card className='shadow-xl border-0 bg-white/80 backdrop-blur-sm'>
          <CardHeader className='text-center space-y-2 pb-4'>
            <div className='flex items-center gap-2 mb-6 justify-center'>
              <span className='inline-block text-2xl'>📥</span>
              <h1 className='text-2xl font-extrabold tracking-tight text-blue-900'>
                Inbo<span className='text-blue-600'>X</span>pense
              </h1>
            </div>
            <CardTitle className='text-2xl font-bold text-gray-900'>
              Welcome Back
            </CardTitle>
            <CardDescription className='text-gray-600'>
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>

          <CardContent className='space-y-6'>
            <form action={handleSignIn} className='space-y-4'>
              <Button
                className=' cursor-pointer w-full h-12 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm transition-all duration-200 hover:shadow-md font-medium'
                type='submit'
                disabled={isLoading}>
                {isLoading ? (
                  <div className='flex items-center justify-center gap-2'>
                    <div className='w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin'></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className='flex items-center justify-center gap-3'>
                    <svg viewBox='0 0 24 24' className='w-5 h-5'>
                      <path
                        fill='#4285F4'
                        d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                      />
                      <path
                        fill='#34A853'
                        d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                      />
                      <path
                        fill='#FBBC05'
                        d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
                      />
                      <path
                        fill='#EA4335'
                        d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </div>
                )}
              </Button>
            </form>

            <div className='text-center'>
              <p className='text-sm text-gray-500 leading-relaxed'>
                By signing in, there are no terms and conditions to accept.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
