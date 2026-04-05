export function formatDate(ts: number | string | null): string | null {
  if (!ts) return null;
  const d = new Date(Number(ts));
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDatetime(ts: number | string | null): string | null {
  if (!ts) return null;
  const d = new Date(Number(ts));
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function shortenWallet(addr: string | null | undefined): string {
  if (!addr || addr.length < 12) return addr || '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}
