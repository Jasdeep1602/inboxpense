import { XMLParser } from 'fast-xml-parser';
import { extractTransactionsFromSMS } from '@/lib/extractTransactions';
import { Transaction } from '@/types';

export class XMLProcessor {
  private parser: XMLParser;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      isArray: (name) => name === 'sms',
    });
  }

  // Process XML content with proper typing and debugging
  processXmlContent(content: string): {
    transactions: Transaction[];
    debugInfo: string;
  } {
    try {
      console.log('Processing XML content, length:', content.length);

      const parsed = this.parser.parse(content);
      console.log('Parsed XML structure:', {
        hasSmses: !!parsed?.smses,
        smsCount: parsed?.smses?.sms?.length || 0,
        firstSms: parsed?.smses?.sms?.[0] || 'No SMS found',
      });

      const smsList = parsed?.smses?.sms || [];

      if (!Array.isArray(smsList)) {
        console.warn('SMS list is not an array:', smsList);
        return {
          transactions: [],
          debugInfo: 'SMS list is not an array format',
        };
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

      const debugInfo = `Processed ${smsList.length} SMS messages, found ${transactions.length} transactions`;

      return { transactions, debugInfo };
    } catch (error) {
      console.error('XML parsing error:', error);
      const debugInfo = `XML parsing failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
      return {
        transactions: [],
        debugInfo,
      };
      throw new Error('Failed to parse XML content');
    }
  }

  // Validate XML structure
  validateXmlStructure(content: string): boolean {
    try {
      const parsed = this.parser.parse(content);
      return !!(parsed?.smses?.sms && Array.isArray(parsed.smses.sms));
    } catch {
      return false;
    }
  }

  // Get SMS count from XML
  getSmsCount(content: string): number {
    try {
      const parsed = this.parser.parse(content);
      return parsed?.smses?.sms?.length || 0;
    } catch {
      return 0;
    }
  }
}
