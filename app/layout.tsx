import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Malka Foundation Helper',
  description: 'Private organizational portal for Malka Foundation'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
