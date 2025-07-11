# 📷 SN Photo Collector

一個基於 Next.js 的純前端 Web 應用程式，用於掃描條碼並收集相關照片。

## 🚀 功能特色

- 📱 使用手機或電腦攝影機掃描 2D 條碼
- 📸 為每個掃描的 SN（序號）拍攝照片
- 💾 使用瀏覽器本地儲存持久化資料
- 📦 將所有照片匯出為 ZIP 檔案，每個 SN 建立獨立資料夾
- 🔄 跨瀏覽器重新整理保持資料

## 🛠️ 技術堆疊

- **框架**: Next.js 14
- **條碼掃描**: html5-qrcode
- **檔案處理**: jszip
- **資料持久化**: localStorage
- **部署**: Vercel

## 🏃‍♂️ 快速開始

### 安裝依賴

```bash
npm install
```

### 開發模式

```bash
npm run dev
```

在瀏覽器中開啟 [http://localhost:3000](http://localhost:3000) 查看結果。

### 建置專案

```bash
npm run build
```

### 啟動生產版本

```bash
npm start
```

## 📱 使用方式

1. 開啟應用程式
2. 點擊「開始掃描」按鈕掃描條碼，或手動輸入 SN 序號
3. 選擇照片檔案進行拍攝或上傳
4. 重複步驟 2-3 收集更多照片
5. 點擊「下載 ZIP 檔案」匯出所有照片
6. 可選擇「清除全部」重置應用程式

## 🌐 部署到 Vercel

1. 將專案推送到 GitHub
2. 前往 [Vercel Dashboard](https://vercel.com/)
3. 匯入您的 GitHub 儲存庫
4. 設定框架為 `Next.js`
5. 使用預設設定進行部署

## 📝 注意事項

- 所有資料儲存在瀏覽器本地，不會同步到其他裝置
- 檔案大小受瀏覽器記憶體限制（localStorage 約 5MB）
- 需要現代瀏覽器支援攝影機存取功能
- 建議在 HTTPS 環境下使用以確保攝影機功能正常

## 🔮 未來改進

- [ ] 支援每個 SN 多張照片
- [ ] 新增照片編輯/刪除功能
- [ ] 使用 IndexedDB 替代 localStorage 以支援大型檔案
- [ ] 新增 PWA 支援（離線存取、可安裝）
- [ ] 新增雲端同步選項

## 📄 授權

MIT License