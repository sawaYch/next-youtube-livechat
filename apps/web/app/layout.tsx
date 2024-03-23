import StoreProvider from '@/stores/store-provider';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import './globals.css';

import Background from '@/components/Background';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Next YouTube Livechat (Demo)',
  description: 'Next YouTube Livechat (Demo)',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={cn('overflow-x-hidden', inter.className)}>
        <ThemeProvider
          attribute='class'
          defaultTheme='dark'
          enableSystem
          disableTransitionOnChange
        >
          <StoreProvider>
            <Background />
            <Toaster />
            <TooltipProvider>{children}</TooltipProvider>
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
