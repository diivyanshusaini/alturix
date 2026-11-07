export class ApiError extends Error { constructor(public status: number, msg: string) { super(msg); } }
export async function api<T = any>(method: string, url: string, body?: unknown): Promise<T> {
  if (url.startsWith('/api/public/projects') && sessionStorage.getItem('alturix_preview')) url += (url.includes('?') ? '&' : '?') + 'preview=1';
  const isForm = body instanceof FormData;
  const res = await fetch(url, { method, credentials: 'same-origin',
    headers: { 'x-requested-with': 'alturix', ...(body && !isForm ? { 'content-type': 'application/json' } : {}) },
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error || res.statusText);
  return data as T;
}
// Upload with progress (fetch has no upload progress).
export function uploadFiles(files: File[], folderId: number | null, onProgress: (p: number) => void): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const fd = new FormData(); files.forEach((f) => fd.append('files', f)); if (folderId) fd.append('folder_id', String(folderId));
    const x = new XMLHttpRequest(); x.open('POST', '/api/admin/assets'); x.setRequestHeader('x-requested-with', 'alturix');
    x.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    x.onload = () => (x.status < 300 ? resolve(JSON.parse(x.responseText)) : reject(new Error(JSON.parse(x.responseText || '{}').error || 'Upload failed')));
    x.onerror = () => reject(new Error('Network error')); x.send(fd);
  });
}
export const fmtSize = (n: number) => (n > 1e9 ? (n / 1e9).toFixed(1) + ' GB' : n > 1e6 ? (n / 1e6).toFixed(1) + ' MB' : Math.ceil(n / 1e3) + ' KB');
