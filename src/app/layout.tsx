import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Sidebar } from "@/components/layout/Sidebar";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Fammi Governance OS",
  description:
    "Mission control operasional Fammi — social enterprise edu-health yang mengantarkan 55 sekolah menuju target 4.000.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${jakarta.variable} ${jetbrains.variable}`}>
      <body className="min-h-screen bg-background text-text-primary font-display antialiased">
        <div className="mx-auto flex min-h-screen max-w-[1600px]">
          <Sidebar />
          <main className="flex-1 px-4 py-6 md:px-8 md:py-10 scrollbar-fammi">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
