import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layouts/theme-provider";
import { SidebarProvider } from "ui/sidebar";
import { AppSidebar } from "@/components/layouts/app-sidebar";
import { AppHeader } from "@/components/layouts/app-header";
import { Toaster } from "ui/sonner";
import "./api/mcp/mcp-manager";
import { MCPConnectionStatus } from "@/components/mcp-connection-status";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Create Next App?",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SidebarProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <AppSidebar />
            <main className="relative w-full flex flex-col h-screen">
              <AppHeader />
              <div className="flex-1 overflow-hidden">
                <div className="container mx-auto px-4 py-2">
                  <MCPConnectionStatus />
                </div>
                {children}
              </div>
            </main>
            <Toaster richColors />
          </ThemeProvider>
        </SidebarProvider>
      </body>
    </html>
  );
}
