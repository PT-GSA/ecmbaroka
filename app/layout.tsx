import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  title: "Susu Baroka - Susu Steril Impor",
  description: "Order Susu Steril berkualitas tinggi dari Susu Baroka. Sistem pembayaran manual dan pengiriman terpercaya.",
  keywords: [
    "Susu Steril Impor",
    "Susu Steril",
    "Susu Impor",
    "Susu Baroka",
    "Susu steril berkualitas",
    "Susu steril import",
  ],
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      nosnippet: false,
    },
  },
  openGraph: {
    title: "Susu Baroka - Susu Steril Impor",
    description:
      "Order Susu Steril berkualitas tinggi dari Susu Baroka. Sistem pembayaran manual dan pengiriman terpercaya.",
    url: "/",
    siteName: "Susu Baroka",
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: "/rose.jpg",
        width: 1200,
        height: 630,
        alt: "Produk Susu Steril Impor Rasa Rose",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Susu Baroka - Susu Steril Impor",
    description:
      "Order Susu Steril berkualitas tinggi dari Susu Baroka. Sistem pembayaran manual dan pengiriman terpercaya.",
    images: ["/rose.jpg"],
    creator: "@SusuBaroka",
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-16x16.svg', sizes: '16x16', type: 'image/svg+xml' },
      { url: '/favicon-32x32.svg', sizes: '32x32', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.svg', sizes: '180x180', type: 'image/svg+xml' },
    ],
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        suppressHydrationWarning={true}
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        {process.env.NEXT_PUBLIC_AHREFS_KEY ? (
          <Script
            src="https://analytics.ahrefs.com/analytics.js"
            strategy="afterInteractive"
            data-key={process.env.NEXT_PUBLIC_AHREFS_KEY}
          />
        ) : null}
      </body>
    </html>
  );
}
