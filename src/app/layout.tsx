import type { Metadata } from "next";
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import "./globals.css";

export const sansFont = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: "Chuchu",
  description: "Momento de disfrutar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en" className={`${sansFont.variable}`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: { borderRadius: '12px', fontWeight: 600 },
            success: { iconTheme: { primary: '#8e44ad', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  );
}
