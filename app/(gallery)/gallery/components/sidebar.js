'use client'
import React from "react";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { gallerySignOutAction } from "@/app/actions";
import { usePathname } from "next/navigation";
export default function Sidebar({ onItemClick }) {
  const menuItems = [
    { icon: "lucide:layout-dashboard", label: "마이페이지", href: "/gallery" },
    { icon: "lucide:newspaper", label: "신규전시등록", href: "/gallery/exhibition" },
    { icon: "lucide:image", label: "소식등록", href: "/gallery/news" },
    { icon: "lucide:users", label: "관람객 관리", href: "/gallery/visitor" },
    { icon: "lucide:log-out", label: "로그아웃", href: "" },
    { icon: "lucide:users", label: "관리자 페이지로 이동", href: "/admin" },
  ];

  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-2 p-4">
      {/* Logo Area */}
      <div className="flex items-center gap-2 px-2 mb-6">
        <Link href="/admin">
          <Image src="/logo/logo.png" alt="logo" width={50} height={50} />
        </Link>
        <span className="font-bold text-xl">갤러리 메뉴</span>
      </div>

      {/* Navigation Items */}
      <nav className="flex flex-col gap-2">
        {menuItems.map((item) => (
          item.label === "로그아웃" ? (
            <form action={gallerySignOutAction} key={item.label}>
              <Button
                type="submit"
                variant="flat"
                color="default"
                className="justify-start w-full"
                fullWidth
              >
                <Icon icon={item.icon} className="text-lg mr-2" />
                {item.label}
              </Button>
            </form>
          ) : (
            <Button
              key={item.label}
              variant={item.label === "관리자 페이지로 이동" ? "" : "flat"}
              color={pathname === item.href ? "primary" : "default"}
              className="justify-start"
              fullWidth
              onPress={() => router.push(item.href)}
            >
              <Icon icon={item.icon} className="text-lg mr-2" />
              {item.label}
            </Button>
          )
        ))}
      </nav>
    </div>
  );
}
