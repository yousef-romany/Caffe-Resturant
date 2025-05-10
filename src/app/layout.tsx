import type { Metadata } from 'next';
import { GeistSans } from 'next/font/google'; // Corrected import for GeistSans
import { GeistMono } from 'next/font/google'; // Corrected import for GeistMono
import './globals.css';
import { ThemeProvider } from '@/components/custom/ThemeProvider';
import { Toaster } from "@/components/ui/toaster";

const geistSans = GeistSans({ // Corrected usage
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = GeistMono({ // Corrected usage
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Cafe POS Express',
  description: 'Restaurant and Cafe POS System',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
