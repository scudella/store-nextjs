import type {Metadata} from 'next'
import '@/app/globals.css'
import {GeistSans} from 'geist/font/sans'
import {GeistMono} from 'geist/font/mono'
import Navbar from '@/components/navbar/Navbar'
import Container from '@/components/global/Container'
import Providers from './providers'
import {ClerkProvider} from '@clerk/nextjs'

export const metadata: Metadata = {
  title: 'Next Store',
  description: 'A store built with Next.js',
}

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
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
