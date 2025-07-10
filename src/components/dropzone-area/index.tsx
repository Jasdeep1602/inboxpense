'use client';

import { useDropzone } from 'react-dropzone';
import { XMLParser } from 'fast-xml-parser';
import { extractTransactionsFromSMS } from '@/lib/extractTransactions';
import { useTransactionStore } from '@/store/transactionStore';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline'; // You can use any icon library

export function DropzoneArea() {
  const setTransactions = useTransactionStore((state) => state.setTransactions);

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();
    reader.onload = () => {
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
      });
      const parsed = parser.parse(reader.result as string);
      const smsList = parsed?.smses?.sms || [];
      const txns = extractTransactionsFromSMS(
        Array.isArray(smsList) ? smsList : [smsList]
      );
      setTransactions(txns);
    };
    reader.readAsText(file);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/xml': ['.xml'] },
  });

  return (
    <div
      {...getRootProps()}
      className='max-w-xl mx-auto border-3 border-dashed border-blue-300 bg-blue-50/60 rounded-2xl p-8 text-center cursor-pointer transition hover:bg-blue-100 flex flex-col items-center gap-3 shadow-sm'
      style={{ minHeight: 'auto' }}>
      <input {...getInputProps()} />
      <CloudArrowUpIcon className='h-16 w-16 text-blue-400 mb-2 opacity-30' />
      <p className='text-lg font-semibold text-blue-900'>
        {isDragActive
          ? 'Drop the SMS backup here…'
          : 'Upload SMS backup (.xml)'}
      </p>
      <p className='text-xs text-blue-700 opacity-80'>
        Drag & drop your SMS XML file here, or click to select file
      </p>
    </div>
  );
}
