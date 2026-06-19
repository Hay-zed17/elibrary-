import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "E-Library Dashboard",
  description: "Modern E-Library for PDFs, DOCX, and PPT files",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
