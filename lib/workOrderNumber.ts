/**
 * 生成工單編號（使用台灣時區 UTC+8）
 * 格式：EHS + yyyy + mm + dd + HH + MM
 * 例如：EHS202601171430 (2026年01月17日14:30)
 */
export function generateWorkOrderNumber(date: Date = new Date()): string {
  // 使用 Intl.DateTimeFormat 取得台灣時區的各個時間部分
  const formatter = new Intl.DateTimeFormat('zh-TW', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(date);
  const year = parts.find(p => p.type === 'year')?.value || '';
  const month = parts.find(p => p.type === 'month')?.value || '';
  const day = parts.find(p => p.type === 'day')?.value || '';
  const hour = parts.find(p => p.type === 'hour')?.value || '';
  const minute = parts.find(p => p.type === 'minute')?.value || '';
  
  return `EHS${year}${month}${day}${hour}${minute}`;
}

/**
 * 從申請時間生成工單編號
 */
export function getWorkOrderNumberFromDate(date: Date | string): string {
  return generateWorkOrderNumber(new Date(date));
}
