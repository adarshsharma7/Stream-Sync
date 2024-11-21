import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster"
import AuthProvider from "@/context/AuthProvider";
import { UserProvider } from '@/context/context'

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "YouTube Clone - Enhanced Video Sharing Platform",
  description: "Experience an upgraded video platform with advanced features like real-time chat, stories, video comments search, and direct sharing. Enjoy a seamless video-sharing and interactive experience, built with modern web technologies.",
  keywords: "YouTube Clone, video sharing platform, real-time chat, stories, video comments search, direct video sharing, interactive video app, modern web application, enhanced YouTube features",
  author: "Adarsh Sharma",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <AuthProvider >
        <UserProvider>
          <body className={inter.className}>
            {children}
            < Toaster />
          
          </body>
        </UserProvider>
      </AuthProvider>

    </html >
  );
}