import type { Metadata } from "next";
import { Fraunces, DM_Sans, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import { VaultProvider } from "@/lib/vault-context";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const hindi = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-hindi",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "HealthVault India — Medical bills, reports & claims",
  description:
    "Upload medical bills and prescriptions, track expenses, organise family records, insurance claims and hospital visits. AI extracts structured data from PDFs and images.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${hindi.variable}`}>
      <body className="font-sans antialiased">
        <VaultProvider>{children}</VaultProvider>
      </body>
    </html>
  );
}
