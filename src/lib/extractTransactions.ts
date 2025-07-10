import { Transaction } from '@/types';

interface SMS {
  '@_body'?: string;
  '@_date'?: string;
  [key: string]: string | undefined;
}

export function extractTransactionsFromSMS(smsList: SMS[]): Transaction[] {
  const results: Transaction[] = [];
  const amountRegex =
    /(?:credited(?:\s+with)?|debited(?:\s+by)?|spent|withdrawn|paid|received|purchase(?:\s+of)?|deposited|transferred|sent|added|deducted|reversed|refunded|failed|unsuccessful)[^₹Rs\d]*(?:INR|Rs\.?|₹)?\s*([\d,]+(?:\.\d{1,2})?)(?!\d)/i;
  // const upiRegex = /\b(?:UPI|GPay|Google Pay|PhonePe|Paytm)\b/i;
  // Add this regex for UPI IDs:
  const upiIdRegex = /\b[\w.-]+@[\w.-]+\b/i;
  const cardRegex = /\b(?:Card\s+\*\*\d{4}|credit card|debit card)\b/i;
  const bankRegex = /\b(?:A\/c\s+\w+|A\/c\s+XX\d+|account\s+number)\b/i;
  const failedRegex = /\b(failed|reversed|refund(?:ed)?|unsuccessful)\b/i;

  const upiAppPatterns: { [key: string]: RegExp } = {
    GPay: /\b(Google Pay|GPay|okgoogle)\b|@okgoogle/i,
    PhonePe: /\b(PhonePe|okphonepe)\b|@ybl/i,
    Paytm: /\b(Paytm|okpaytm)\b|@paytm/i,
    'Amazon Pay': /\b(Amazon Pay|okicici)\b|@apl/i,
    BHIM: /\b(BHIM)\b|@upi/i,
    Mobikwik: /@ikwik/i,
    Freecharge: /@freecharge/i,
    'Airtel Payments': /@airtel/i,
    ICICI: /@icici/i,
    SBI: /@sbi/i,
    HDFC: /@hdfcbank/i,
    // Add more as needed
  };

  for (const sms of smsList) {
    const body = (sms['@_body'] || '').replace(/\s+/g, ' ').trim();
    if (!body) continue;

    const amountMatch = body.match(amountRegex);
    if (!amountMatch) continue;

    const amountStr = amountMatch[1].replace(/,/g, '');
    if (!/^\d{1,8}(\.\d{1,2})?$/.test(amountStr)) continue;

    const amount = parseFloat(amountStr);
    if (isNaN(amount)) continue;

    const type = /credited|received/i.test(body) ? 'credit' : 'debit';

    let mode = 'UPI';
    for (const [app, pattern] of Object.entries(upiAppPatterns)) {
      if (pattern.test(body)) {
        mode = app;
        break;
      }
    }
    if (mode === 'UPI' && upiIdRegex.test(body)) {
      // If only a generic UPI ID is found, keep as 'UPI'
    } else if (mode === 'UPI') {
      // Fallbacks for card/bank/other
      if (cardRegex.test(body)) mode = 'Card';
      else if (bankRegex.test(body)) mode = 'Bank';
      else mode = 'Other';
    }

    const status = failedRegex.test(body) ? 'failed' : 'success';

    results.push({
      date: sms['@_date'] || '',
      body,
      amount,
      type,
      mode,
      status,
    });
  }

  return results;
}
