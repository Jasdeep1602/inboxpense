import { DriveFile } from '@/types';
import { CacheManager } from './cache';

export class DriveService {
  private cacheManager: CacheManager;

  constructor(cacheManager: CacheManager) {
    this.cacheManager = cacheManager;
  }

  // Fetch files with proper error handling and caching
  async fetchFiles(): Promise<DriveFile[]> {
    const cache = this.cacheManager.get();

    // Return cached files if valid
    if (cache?.files && this.cacheManager.isValid()) {
      console.log('Using cached files list:', cache.files.length, 'files');
      return cache.files;
    }

    try {
      console.log('Fetching files from Google Drive...');
      const { listSmsFiles } = await import('@/utils/google-drive');
      const files = await listSmsFiles();
      console.log('Fetched files:', files.length);
      this.cacheManager.set({ files });
      return files;
    } catch (error) {
      console.error('Failed to fetch files:', error);
      // Return cached files if available, even if stale
      return cache?.files || [];
    }
  }

  // Fetch file content with proper typing
  async fetchFileContent(fileId: string): Promise<string> {
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
  }

  // Check if Drive service is available
  async isDriveServiceAvailable(): Promise<boolean> {
    try {
      const { listSmsFiles } = await import('@/utils/google-drive');
      return typeof listSmsFiles === 'function';
    } catch {
      return false;
    }
  }
}
