import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter, JetBrains_Mono, Sora } from "next/font/google";
import { Toaster } from "sonner";

import { cn } from "@/lib/utils";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap"
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://missnancy.ai"),
  title: {
    default: "Miss Nancy — The AI Agent That Actually Gets Things Done",
    template: "%s · Miss Nancy"
  },
  description:
    "Autonomous AI companion with a real authenticated workspace, streamed AI chat, persistent sessions, tasks, projects, memory, and billing.",
  applicationName: "Miss Nancy",
  openGraph: {
    title: "Miss Nancy — The AI Agent That Actually Gets Things Done",
    description:
      "Public marketing site + protected workspace with streamed AI chat, persistence, tasks, projects, memory, and real product foundations.",
    type: "website",
    siteName: "Miss Nancy"
  },
  twitter: {
    card: "summary_large_image",
    title: "Miss Nancy — The AI Agent That Actually Gets Things Done",
    description:
      "Real streamed AI chat, persistent sessions, structured work objects, and an authenticated workspace."
  }
};

export const viewport: Viewport = {
  themeColor: "#09090B",
  colorScheme: "dark"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark" suppressHydrationWarning>
        <body
          className={cn(
            inter.variable,
            sora.variable,
            jetbrainsMono.variable,
            "min-h-screen bg-background font-sans text-foreground antialiased"
          )}
        >
          {children}
          <Toaster
            position="top-right"
            theme="dark"
            toastOptions={{
              classNames: {
                toast:
                  "border border-zinc-800 bg-zinc-900/95 text-zinc-100 shadow-panel backdrop-blur-xl",
                title: "text-sm font-medium text-zinc-50",
                description: "text-sm text-zinc-400",
                actionButton: "bg-violet-500 text-white hover:bg-violet-400",
                cancelButton: "bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
              }
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
