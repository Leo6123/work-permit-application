# PDF 範本使用說明

## 如何上傳 PDF 範本

1. 將您的熱加工操作許可證 PDF 範本文件命名為 `hot-work-permit-template.pdf`
2. 將文件放置在此資料夾 (`public/templates/`) 中
3. 系統會自動載入並轉換此 PDF 範本

## PDF 範本要求

- **檔案格式**: PDF
- **檔案名稱**: `hot-work-permit-template.pdf` (必須完全匹配)
- **建議尺寸**: A4 (210mm × 297mm)
- **文字格式**: 建議使用可選取的文字（非圖片格式），以便系統正確提取文字內容

## 資料填入

系統會自動將以下資料填入 PDF 範本：

- `{{personnelType}}` - 人員類型（員工/承包商）
- `{{contractorName}}` - 承包商名稱（如果是承包商）
- `{{date}}` - 日期
- `{{workOrderNumber}}` - 工作編號
- `{{areaSupervisor}}` - 作業區域主管
- `{{operationLocation}}` - 操作地點
- `{{workToBePerformed}}` - 要執行的作業
- `{{operatorName}}` - 操作員姓名
- `{{fireWatcherName}}` - 防火監視員姓名
- `{{employeeChecked}}` - 員工選項的 checked 屬性
- `{{contractorChecked}}` - 承包商選項的 checked 屬性

## 注意事項

- 如果 PDF 範本不存在或載入失敗，系統會自動使用預設的 HTML 實現
- PDF 轉 HTML 可能無法完美保留所有格式和樣式
- 建議在 PDF 範本中使用簡單的文字和表格結構，以獲得最佳轉換效果
