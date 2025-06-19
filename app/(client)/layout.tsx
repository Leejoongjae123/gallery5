import DeployButton from "@/components/deploy-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import HeaderAuth from "@/components/header-auth";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { Geist, Noto_Sans_KR } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "@/app/globals.css";
import { HeroUIProvider } from "@heroui/react";
import { Input } from "@heroui/react";
import { Icon } from "@iconify/react";
import { FaRegBookmark } from "react-icons/fa";
import BottomNavigation from "@/app/(client)/components/BottomNavigationbar";
import Providers from "@/app/(client)/components/providers";
import Link from "next/link";
import Navbar from "@/app/(client)/components/Navbar";
import "@/app/mobile-fixed.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "미술예술랭",
  description: "갤러리 전시회 정보를 손쉽게 찾아보세요",
};

export function generateViewport() {
  return {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    // 추가적인 동적 설정이 필요할 경우 여기에 로직 추가
  };
}

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
  display: "swap",
});

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${notoSansKR.className} ${geistSans.className}`} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          forcedTheme="light"
          disableTransitionOnChange
        >
          <Providers>
            <div className="mobile-fixed-width">
              <main className="w-full h-full pb-16">
                <Navbar />
                {children}
              </main>
              <BottomNavigation />
            </div>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
