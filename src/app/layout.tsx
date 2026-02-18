import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Redis Desktop Viewer | Advanced Redis GUI",
    template: "%s | Redis Desktop Viewer",
  },
  description: "A modern, powerful, and user-friendly GUI for Redis. Manage your keys, view data, and monitor performance with ease.",
  keywords: ["Redis", "GUI", "Database", "Management", "Viewer", "Desktop", "Electron", "Next.js", "React"],
  authors: [{ name: "Redis GUI Team" }],
  creator: "Redis GUI Team",
  publisher: "Redis GUI Team",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://redis-gui.com"), // Replace with actual domain
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Redis Desktop Viewer",
    description: "The ultimate GUI for Redis management.",
    url: "https://redis-gui.com",
    siteName: "Redis Desktop Viewer",
    images: [
      {
        url: "/og-image.png", // Ensure this image exists or is placeholder
        width: 1200,
        height: 630,
        alt: "Redis Desktop Viewer",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Redis Desktop Viewer",
    description: "Manage your Redis instances with a beautiful and powerful GUI.",
    creator: "@redisgui", // Replace with actual handle
    images: ["/twitter-image.png"], // Ensure this exists
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
    other: {
      rel: "apple-touch-icon-precomposed",
      url: "/icon.svg",
    },
  },
  manifest: "/site.webmanifest",
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-950 text-zinc-100 min-h-screen`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
