import './globals.css'
import { ThemeProvider } from './contexts/ThemeContext'

export const metadata = {
  title: 'SN Photo Collector',
  description: '掃描條碼並收集照片的 Web 應用程式',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon-32.svg', sizes: '32x32', type: 'image/svg+xml' },
      { url: '/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
      { url: '/icon.svg', sizes: '512x512', type: 'image/svg+xml' }
    ],
    apple: [
      { url: '/apple-touch-icon.svg', sizes: '180x180', type: 'image/svg+xml' }
    ],
    shortcut: '/icon-32.svg'
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SN Photo Collector'
  },
  formatDetection: {
    telephone: false
  }
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#4F46E5',
  colorScheme: 'light dark'
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh-TW">
      <head>
        <meta name="theme-color" content="#4F46E5" />
      </head>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}