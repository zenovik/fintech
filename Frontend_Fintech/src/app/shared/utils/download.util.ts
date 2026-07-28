import { environment } from '../../../environments/environment';

export async function downloadAuthenticatedExport(downloadUrl: string, token: string, fileName = 'export.csv'): Promise<void> {
  const url = downloadUrl.startsWith('http') ? downloadUrl : `${environment.apiUrl.replace(/\/api$/, '')}${downloadUrl}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error('Export download failed');
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}
