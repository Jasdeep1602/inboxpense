/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { XMLParser } from 'fast-xml-parser';
import { extractTransactionsFromSMS } from '@/lib/extractTransactions';
import { useTransactionStore } from '@/store/transactionStore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Transaction, DriveFile, CacheData } from '@/types';
import { CACHE_KEY, CACHE_TTL } from '@/lib/constants';

export default function SmsXmlReader() {
  const [latestFile, setLatestFile] = useState<DriveFile | null>(null);
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [debugInfo, setDebugInfo] = useState<string>('');
  // Store actions
  const setTransactions = useTransactionStore((state) => state.setTransactions);

  // Get cached data with proper null checks
  const getCache = useCallback((): CacheData | null => {
    if (typeof window === 'undefined') return null;
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return cached ? (JSON.parse(cached) as CacheData) : null;
    } catch (error) {
      console.error('Cache read error:', error);
      return null;
    }
  }, []);

  // Set cache data with type validation
  const setCache = useCallback(
    (data: Partial<CacheData>): void => {
      if (typeof window === 'undefined') return;
      try {
        const currentCache = getCache() || {
          files: [],
          transactions: [],
          lastUpdated: 0,
        };
        const newCache: CacheData = {
          files: data.files || currentCache.files,
          transactions: data.transactions || currentCache.transactions,
          lastUpdated: data.lastUpdated ?? Date.now(),
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(newCache));
        console.log('Cache updated:', {
          filesCount: newCache.files.length,
          transactionsCount: newCache.transactions.length,
          lastUpdated: new Date(newCache.lastUpdated).toISOString(),
        });
      } catch (error) {
        console.error('Cache write error:', error);
      }
    },
    [getCache]
  );

  // Process XML content with proper typing and debugging
  const processXmlContent = useCallback((content: string): Transaction[] => {
    try {
      console.log('Processing XML content, length:', content.length);

      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        isArray: (name) => name === 'sms',
      });

      const parsed = parser.parse(content);
      console.log('Parsed XML structure:', {
        hasSmses: !!parsed?.smses,
        smsCount: parsed?.smses?.sms?.length || 0,
        firstSms: parsed?.smses?.sms?.[0] || 'No SMS found',
      });

      const smsList = parsed?.smses?.sms || [];

      if (!Array.isArray(smsList)) {
        console.warn('SMS list is not an array:', smsList);
        return [];
      }

      console.log(
        'Extracting transactions from',
        smsList.length,
        'SMS messages'
      );
      const transactions = extractTransactionsFromSMS(smsList);

      console.log('Extracted transactions:', {
        count: transactions.length,
        sample: transactions.slice(0, 3),
      });

      setDebugInfo(
        `Processed ${smsList.length} SMS messages, found ${transactions.length} transactions`
      );

      return transactions;
    } catch (error) {
      console.error('XML parsing error:', error);
      setDebugInfo(
        `XML parsing failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
      throw new Error('Failed to parse XML content');
    }
  }, []);

  // Fetch files with proper error handling and typing
  const fetchFiles = useCallback(async (): Promise<DriveFile[]> => {
    const cache = getCache();

    // Return cached files if valid
    if (
      cache?.files &&
      cache.lastUpdated &&
      Date.now() - cache.lastUpdated < CACHE_TTL
    ) {
      console.log('Using cached files list:', cache.files.length, 'files');
      return cache.files;
    }

    try {
      console.log('Fetching files from Google Drive...');
      const { listSmsFiles } = await import('@/utils/google-drive');
      const files = await listSmsFiles();
      console.log('Fetched files:', files.length);
      setCache({ files });
      return files;
    } catch (error) {
      console.error('Failed to fetch files:', error);
      // Return empty array if we can't fetch new files and have no cache
      return cache?.files || [];
    }
  }, [getCache, setCache]);

  // Fetch file content with proper typing
  const fetchFileContent = useCallback(
    async (fileId: string): Promise<string> => {
      try {
        console.log('Fetching file content for ID:', fileId);
        const { getFileContent } = await import('@/utils/google-drive');
        const content = await getFileContent(fileId);
        console.log('File content length:', content.length);
        return content;
      } catch (error) {
        console.error('Failed to fetch file content:', error);
        throw error;
      }
    },
    []
  );

  // Main processing function with proper error handling
  const fetchAndProcessLatestFile = useCallback(async (): Promise<void> => {
    setStatus('loading');
    setDebugInfo('Starting to fetch and process files...');

    try {
      const files = await fetchFiles();
      if (!files.length) {
        throw new Error('No SMS backup files found');
      }

      const latest = files.reduce((prev, current) =>
        prev.name > current.name ? prev : current
      );
      setLatestFile(latest);
      console.log('Latest file selected:', latest.name);

      const cache = getCache();
      let transactions: Transaction[] = [];

      if (
        cache?.transactions &&
        cache.transactions.length > 0 &&
        cache.lastUpdated &&
        Date.now() - cache.lastUpdated < CACHE_TTL
      ) {
        // Use cached transactions if available, fresh, and not empty
        transactions = cache.transactions;
        console.log('Using cached transactions:', transactions.length);
        setDebugInfo(`Using cached data: ${transactions.length} transactions`);
      } else {
        // Otherwise fetch and process new content
        setDebugInfo('Fetching new content...');
        console.log('Cache status:', {
          hasTransactions: !!cache?.transactions,
          transactionCount: cache?.transactions?.length || 0,
          lastUpdated: cache?.lastUpdated
            ? new Date(cache.lastUpdated).toISOString()
            : 'never',
          cacheAge: cache?.lastUpdated ? Date.now() - cache.lastUpdated : 'n/a',
          cacheTTL: CACHE_TTL,
        });

        const content = await fetchFileContent(latest.id);
        transactions = processXmlContent(content);

        // Always cache the result, even if empty (but log it)
        setCache({ transactions });

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
  }, [
    fetchFiles,
    fetchFileContent,
    processXmlContent,
    setCache,
    setTransactions,
    getCache,
  ]);

  // Initial load
  useEffect(() => {
    fetchAndProcessLatestFile();
  }, [fetchAndProcessLatestFile]);

  // Format timestamp from filename
  const formatFileName = useCallback((name: string): string => {
    const match = name.match(
      /sms-(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\.xml/
    );
    if (!match) return name;

    const [_, year, month, day, hour, minute, second] = match;
    return new Date(
      `${year}-${month}-${day}T${hour}:${minute}:${second}`
    ).toLocaleString();
  }, []);

  const handleRefresh = useCallback(
    async (force = false): Promise<void> => {
      if (force) {
        localStorage.removeItem(CACHE_KEY);
        console.log('Cache cleared');
      }
      await fetchAndProcessLatestFile();
    },
    [fetchAndProcessLatestFile]
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
          {formatFileName(latestFile.name)}
        </div>
      )}

      <div className='mt-2 text-sm text-gray-500'>
        {status === 'success' ? (
          <span className='text-green-600'>Transactions are ready</span>
        ) : (
          'Loading transaction data...'
        )}
      </div>

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
