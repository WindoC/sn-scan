import './globals.css'

export const metadata = {
  title: 'SN Photo Collector',
  description: '掃描條碼並收集照片的 Web 應用程式',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  )
}