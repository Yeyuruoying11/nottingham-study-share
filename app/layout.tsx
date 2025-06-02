import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthContextProvider } from '@/contexts/AuthContext'
import AISchedulerProvider from '@/components/AISchedulerProvider'
import Head from 'next/head'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap'
})

export const metadata: Metadata = {
  title: '诺丁汉留学圈 - 分享你的留学故事',
  description: '专为诺丁汉大学留学生打造的社交分享平台，分享留学攻略、生活经验、美食推荐等内容',
  keywords: '诺丁汉大学,留学,攻略,分享,社交,英国留学',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 32 32\'><rect width=\'32\' height=\'32\' fill=\'%2316a34a\'/><text x=\'16\' y=\'24\' font-family=\'Arial\' font-size=\'20\' font-weight=\'bold\' text-anchor=\'middle\' fill=\'white\'>N</text></svg>',
  },
  other: {
    'permissions-policy': 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <head>
        <meta name="permissions-policy" content="accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()" />
      </head>
      <body className={inter.className} suppressHydrationWarning={true}>
        <AuthContextProvider>
          <AISchedulerProvider />
          <div suppressHydrationWarning={true}>
          {children}
          </div>
        </AuthContextProvider>
      </body>
    </html>
  )
} 