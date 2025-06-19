'use client'
import React from "react";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminSignOutAction } from "../actions";
import { usePathname } from "next/navigation";
export default function Sidebar({ onItemClick }) {
  const menuItems = [
    { icon: "lucide:layout-dashboard", label: "갤러리관리", href: "/admin/gallery" },
    { icon: "lucide:layout-dashboard", label: "전시회관리", href: "/admin/exhibition" },
    { icon: "lucide:users", label: "작가관리", href: "/admin/artist" },
    { icon: "lucide:shopping-bag", label: "제품관리", href: "/admin/product" },
    { icon: "lucide:newspaper", label: "소식등록", href: "/admin/magazine" },
    { icon: "lucide:image", label: "배너수정", href: "/admin/banner" },
    { icon: "lucide:ticket", label: "티켓구매내역", href: "/admin/payment-ticket" },
    { icon: "lucide:ticket-plus", label: "티켓수동발급", href: "/admin/payment-ticket/manual-issue" },
    { icon: "lucide:database", label: "DB관리", href: "/admin/db-manage" },
    { icon: "lucide:credit-card", label: "크레딧구매내역", href: "/admin/payment-credit" },
    { icon: "lucide:log-out", label: "로그아웃", href: "" },
    { icon: "lucide:users", label: "갤러리 페이지로 이동", href: "/gallery" },
  ];

  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-2 p-4">
      {/* Logo Area */}
      <div className="flex items-center gap-2 px-2 mb-6">
        <Link href="/admin/gallery">
          <Image src="/logo/logo.png" alt="logo" width={50} height={50} />
        </Link>
        <span className="font-bold text-xl">관리자 메뉴</span>
      </div>

      {/* Navigation Items */}
      <nav className="flex flex-col gap-2">
        {menuItems.map((item) => (
          item.label === "로그아웃" ? (
            <form action={adminSignOutAction} key={item.label}>
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
              variant={item.label === "갤러리 페이지로 이동" ? "" : "flat"}
              color={pathname === item.href ? "primary" : "default"}
              className="justify-start"
              fullWidth
              onPress={() => {
                router.push(item.href);
                if (onItemClick) onItemClick();
              }}
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
