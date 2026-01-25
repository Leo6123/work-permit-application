import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * POST /api/pdf/convert
 * 將 PDF 文件轉換成 HTML（暫時停用，返回 null）
 */
export async function POST(request: NextRequest) {
  // PDF 轉換功能暫時停用，使用預設 HTML 實現
  return NextResponse.json({ 
    html: null,
    message: 'PDF 轉換功能暫時停用，使用預設 HTML 實現'
  });
}

/**
 * GET /api/pdf/convert?templatePath=...
 * 從範本路徑轉換 PDF（暫時停用，返回 null）
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const templatePath = searchParams.get('templatePath');

    if (!templatePath) {
      return NextResponse.json(
        { error: '請提供範本路徑' },
        { status: 400 }
      );
    }

    // 檢查文件是否存在
    const publicPath = path.join(process.cwd(), 'public', templatePath);
    try {
      await fs.access(publicPath);
      // 文件存在，但 PDF 轉換功能暫時停用
      return NextResponse.json({ 
        html: null,
        message: 'PDF 範本存在，但轉換功能暫時停用，使用預設 HTML 實現'
      });
    } catch {
      // 文件不存在
      return NextResponse.json({ 
        html: null,
        message: 'PDF 範本不存在，使用預設 HTML 實現'
      });
    }
  } catch (error) {
    console.error('PDF 處理錯誤:', error);
    return NextResponse.json({ 
      html: null,
      message: 'PDF 處理失敗，使用預設 HTML 實現'
    });
  }
}
