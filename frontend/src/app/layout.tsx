import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Web3Provider } from "@/components/providers/Web3Provider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Indexr - The Vanguard of Web3",
  description: "Non-custodial crypto baskets with recurring investments. Invest in diversified crypto portfolios with one click.",
  keywords: ["crypto", "index fund", "DeFi", "blockchain", "investment", "Arbitrum"],
  authors: [{ name: "Indexr" }],
  openGraph: {
    title: "Indexr - The Vanguard of Web3",
    description: "Non-custodial crypto baskets with recurring investments",
    url: "https://indexr.xyz",
    siteName: "Indexr",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Indexr - The Vanguard of Web3",
    description: "Non-custodial crypto baskets with recurring investments",
    creator: "@Indexr_xyz",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-surface-50 font-sans antialiased dark:bg-surface-950">
        <Web3Provider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#18181b",
                color: "#fff",
                borderRadius: "12px",
              },
              success: {
                iconTheme: {
                  primary: "#22c55e",
                  secondary: "#fff",
                },
              },
              error: {
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "#fff",
                },
              },
            }}
          />
        </Web3Provider>
      </body>
    </html>
  );
}

