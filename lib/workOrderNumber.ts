/**
 * 生成工單編號
 * 格式：EHS + yyyy + mm + dd + HH + MM
 * 例如：EHS202601171430 (2026年01月17日14:30)
 */
export function generateWorkOrderNumber(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  
  return `EHS${year}${month}${day}${hours}${minutes}`;
}

/**
 * 從申請時間生成工單編號
 */
export function getWorkOrderNumberFromDate(date: Date | string): string {
  return generateWorkOrderNumber(new Date(date));
}
