import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Find right target in right time",
  description: "this is what all investors have wanted to have so long",
};

function Navbar() {
  return (
    <nav className="shadow-md">
      <div className="flex justify-evenly items-center h-12">
          <a href="/" className="text-xl font-bold">
            AI Strategic Investment
          </a>
          <Link href="/download">
            Download
          </Link>
        </div>
    </nav>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
          <Navbar />
          {children}
          <Toaster />
      </body>
    </html>
  );
}
