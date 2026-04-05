import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { SnackbarProvider } from '@/components/core/SnackbarContext';
import type { Metadata } from 'next';

// Cấu hình font
const outfit = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Hệ thống Bầu cử - Blind Vote',
  description: 'Hệ thống bầu cử ẩn danh sử dụng blockchain',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={outfit.className}>
        <SnackbarProvider>{children}</SnackbarProvider>
      </body>
    </html>
  );
}
