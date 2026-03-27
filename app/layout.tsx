import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PrintOps',
  description: 'Business operations system for your print brokerage',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className="h-full bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  )
}
