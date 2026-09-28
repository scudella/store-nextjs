import type {Metadata} from 'next'
import {Geist, Geist_Mono} from 'next/font/google'
import '@/app/globals.css'
import Navbar from '@/components/navbar/Navbar'
import Container from '@/components/global/Container'
import Providers from './providers'
import {ClerkProvider} from '@clerk/nextjs'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Next Store',
  description: 'A store built with Next.js',
}

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClerkProvider>
          <Providers>
            <Navbar />
            <Container className='py-20'>{children}</Container>
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  )
}
