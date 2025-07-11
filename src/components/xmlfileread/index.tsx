'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTransactionStore } from '@/store/transactionStore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Transaction, DriveFile } from '@/types';
import { CACHE_KEY, CACHE_TTL } from '@/lib/constants';

// Import the utils
import { CacheManager } from '@/lib/cache';
import { XMLProcessor } from '@/lib/xmlProcessor';
import { FileManager } from '@/lib/fileUtils';
import { DriveService } from '@/lib/driveService';

export default function SmsXmlReader() {
  const [latestFile, setLatestFile] = useState<DriveFile | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Store actions
  const setTransactions = useTransactionStore((state) => state.setTransactions);

  // Initialize services with useMemo to prevent recreation on every render
  const cacheManager = useMemo(
    () => new CacheManager(CACHE_KEY, CACHE_TTL),
    []
  );
  const xmlProcessor = useMemo(() => new XMLProcessor(), []);
  const driveService = useMemo(
    () => new DriveService(cacheManager),
    [cacheManager]
  );

  // Main processing function with proper error handling
  const fetchAndProcessLatestFile = useCallback(async (): Promise<void> => {
    setStatus('loading');
    setDebugInfo('Starting to fetch and process files...');

    try {
      const files = await driveService.fetchFiles();
      if (!files.length) {
        throw new Error('No SMS backup files found');
      }

      const latest = FileManager.getLatestFile(files);
      if (!latest) {
        throw new Error('No valid SMS backup file found');
      }

      setLatestFile(latest);
      console.log('Latest file selected:', latest.name);

      let transactions: Transaction[] = [];

      // Check if we should use cached data
      if (cacheManager.hasData() && cacheManager.isValid()) {
        const cache = cacheManager.get();
        transactions = cache!.transactions;
        console.log('Using cached transactions:', transactions.length);
        setDebugInfo(`Using cached data: ${transactions.length} transactions`);
        // Update the lastFetched from cache
        setLastFetched(cache!.lastUpdated);
      } else {
        // Otherwise fetch and process new content
        setDebugInfo('Fetching new content...');
        console.log('Cache status:', cacheManager.getStatus());

        const content = await driveService.fetchFileContent(latest.id);
        const result = xmlProcessor.processXmlContent(content);

        transactions = result.transactions;
        setDebugInfo(result.debugInfo);

        // Cache the result and update lastFetched
        cacheManager.set({ transactions });
        setLastFetched(Date.now());

        if (transactions.length === 0) {
          console.warn('No transactions found after processing');
          setDebugInfo(
            'No transactions found in SMS data - check extractTransactionsFromSMS function'
          );
        }
      }

      console.log('Setting transactions in store:', transactions.length);
      setTransactions(transactions);
      setStatus('success');
      toast.success(`Loaded ${transactions.length} transactions successfully`);
    } catch (error) {
      console.error('Processing error:', error);
      setStatus('error');
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to process SMS file';
      setDebugInfo(`Error: ${errorMessage}`);
      toast.error(errorMessage);
    }
  }, [cacheManager, xmlProcessor, driveService, setTransactions]);

  // Initial load
  useEffect(() => {
    fetchAndProcessLatestFile();
  }, [fetchAndProcessLatestFile]);

  const handleRefresh = useCallback(
    async (force = false): Promise<void> => {
      if (force) {
        cacheManager.clear();
      }
      await fetchAndProcessLatestFile();
    },
    [fetchAndProcessLatestFile, cacheManager]
  );

  if (status === 'loading') {
    return <LoadingState debugInfo={debugInfo} />;
  }

  if (status === 'error') {
    return (
      <ErrorState onRetry={() => handleRefresh(true)} debugInfo={debugInfo} />
    );
  }

  return (
    <div className='mb-8 p-6 bg-white rounded-lg shadow'>
      <div className='flex justify-between items-center mb-2'>
        <h2 className='text-lg font-semibold'>
          Latest SMS Backup
          {status === 'success' && <SuccessBadge />}
        </h2>
        <div className='flex gap-2'>
          <Button onClick={() => handleRefresh()} size='sm' variant='outline'>
            Refresh
          </Button>
          <Button
            onClick={() => handleRefresh(true)}
            size='sm'
            variant='outline'
            title='Force refresh and clear cache'>
            Hard Refresh
          </Button>
        </div>
      </div>

      {latestFile && (
        <div className='text-sm text-gray-600'>
          {FileManager.formatFileName(latestFile.name)}
        </div>
      )}

      <div className='mt-2 text-sm text-gray-500'>
        {status === 'success' ? (
          <span className='text-green-600'>Transactions are ready</span>
        ) : (
          'Loading transaction data...'
        )}
      </div>

      {/* Display last fetched time */}
      {lastFetched && (
        <div className='mt-1 text-xs text-gray-400'>
          Last fetched: {new Date(lastFetched).toLocaleString()}
        </div>
      )}

      {debugInfo && (
        <div className='mt-2 text-xs text-gray-400 bg-gray-50 p-2 rounded'>
          Debug: {debugInfo}
        </div>
      )}
    </div>
  );
}

// Typed sub-components
interface LoadingStateProps {
  debugInfo: string;
}

const LoadingState = ({ debugInfo }: LoadingStateProps) => (
  <div className='mb-8 p-6 bg-white rounded-lg shadow text-center space-y-2'>
    <div className='animate-pulse flex justify-center'>
      <div className='h-2 w-1/2 bg-gray-200 rounded'></div>
    </div>
    <p className='text-sm text-gray-500'>Processing latest SMS backup...</p>
    {debugInfo && (
      <div className='text-xs text-gray-400 bg-gray-50 p-2 rounded'>
        {debugInfo}
      </div>
    )}
  </div>
);

interface ErrorStateProps {
  onRetry: () => void;
  debugInfo: string;
}

const ErrorState = ({ onRetry, debugInfo }: ErrorStateProps) => (
  <div className='mb-8 p-6 bg-white rounded-lg shadow'>
    <div className='flex justify-between items-center mb-2'>
      <h2 className='text-lg font-semibold'>SMS Backup Error</h2>
      <Button onClick={onRetry} size='sm' variant='outline'>
        Retry
      </Button>
    </div>
    <div className='text-sm text-red-500'>
      Failed to load SMS backup. Please try again.
    </div>
    {debugInfo && (
      <div className='mt-2 text-xs text-gray-400 bg-gray-50 p-2 rounded'>
        Debug: {debugInfo}
      </div>
    )}
  </div>
);

const SuccessBadge = () => (
  <span className='ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full'>
    Loaded
  </span>
);
