import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap'
})

export const metadata: Metadata = {
  title: '诺丁汉留学圈 - 分享你的留学故事',
  description: '专为诺丁汉大学留学生打造的社交分享平台，分享留学攻略、生活经验、美食推荐等内容',
  keywords: '诺丁汉大学,留学,攻略,分享,社交,英国留学',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
} 