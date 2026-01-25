/**
 * PDF 轉 HTML 工具函數
 * 簡化版本 - 返回 null 表示使用預設 HTML 實現
 */

export interface PdfToHtmlOptions {
  scale?: number;
  includeImages?: boolean;
}

/**
 * 將 PDF 文件轉換成 HTML
 * 目前返回 null，使用預設的 HTML 實現
 * @param pdfPath PDF 文件路徑（相對於 public 資料夾）
 * @param options 轉換選項
 * @returns HTML 字串或 null
 */
export async function convertPdfToHtml(
  pdfPath: string,
  options: PdfToHtmlOptions = {}
): Promise<string | null> {
  // 目前返回 null，使用預設的 HTML 實現
  // 未來可以整合更完整的 PDF 轉換功能
  console.log('PDF 範本功能暫時停用，使用預設 HTML 實現');
  return null;
}

/**
 * 從 ArrayBuffer 或 Uint8Array 載入 PDF
 * 目前返回 null，使用預設的 HTML 實現
 * @param data PDF 二進位資料
 * @param options 轉換選項
 * @returns HTML 字串或 null
 */
export async function convertPdfBufferToHtml(
  data: ArrayBuffer | Uint8Array,
  options: PdfToHtmlOptions = {}
): Promise<string | null> {
  // 目前返回 null，使用預設的 HTML 實現
  console.log('PDF 範本功能暫時停用，使用預設 HTML 實現');
  return null;
}
