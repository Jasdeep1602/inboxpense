/* eslint-disable @typescript-eslint/no-unused-vars */
import { DriveFile } from '@/types';

export class FileManager {
  // Format timestamp from filename
  static formatFileName(name: string): string {
    const match = name.match(
      /sms-(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\.xml/
    );
    if (!match) return name;

    const [_, year, month, day, hour, minute, second] = match;
    return new Date(
      `${year}-${month}-${day}T${hour}:${minute}:${second}`
    ).toLocaleString();
  }

  // Get the latest file from a list of files
  static getLatestFile(files: DriveFile[]): DriveFile | null {
    if (!files.length) return null;
    return files.reduce((prev, current) =>
      prev.name > current.name ? prev : current
    );
  }

  // Validate file name format
  static isValidSmsFileName(name: string): boolean {
    return /^sms-\d{14}\.xml$/.test(name);
  }

  // Extract date from filename
  static extractDateFromFileName(name: string): Date | null {
    const match = name.match(
      /sms-(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\.xml/
    );
    if (!match) return null;

    const [_, year, month, day, hour, minute, second] = match;
    return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
  }

  // Sort files by date (newest first)
  static sortFilesByDate(files: DriveFile[]): DriveFile[] {
    return [...files].sort((a, b) => {
      const dateA = this.extractDateFromFileName(a.name);
      const dateB = this.extractDateFromFileName(b.name);
      if (!dateA || !dateB) return 0;
      return dateB.getTime() - dateA.getTime();
    });
  }
}
