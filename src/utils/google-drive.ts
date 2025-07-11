import { createClient } from './supabase/client';

// Helper to get access token
async function getDriveAccessToken() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.provider_token) {
    throw new Error('No Google access token available');
  }

  return session.provider_token;
}

// Search for a file by name
export async function findFileByName(fileName: string) {
  const accessToken = await getDriveAccessToken();

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(
      fileName
    )}'`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to search files');
  }

  const data = await response.json();
  return data.files[0]; // Returns first matching file
}

// Get file content by ID
export async function getFileContent(fileId: string) {
  const accessToken = await getDriveAccessToken();

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/xml', // Specify you want XML
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to get file content');
  }

  return await response.text(); // Get raw XML content
}

export async function listSmsFiles() {
  const accessToken = await getDriveAccessToken();

  // Search for files matching the SMS pattern
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name contains 'sms-' and name contains '.xml'`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to search files');
  }

  const data = await response.json();
  return data.files || [];
}
