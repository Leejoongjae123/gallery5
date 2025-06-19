"use client";
import React from "react";
// Button import 임시 제거
// import { Button } from "@heroui/react";
// react-icons 직접 가져오기
import { MdOutlineImage } from "react-icons/md";
import { IoImagesOutline } from "react-icons/io5";
import { BiBookOpen } from "react-icons/bi";
import { FiGift } from "react-icons/fi";
import { TbHandshake } from "react-icons/tb";
import { FaRegCalendar } from "react-icons/fa";

import {
  GalleryHorizontalEnd, // 갤러리, 작품 나열
  Frame, // 전시, 액자
  Palette, // 예술 관련
  Newspaper, // 매거진, 잡지
  BookOpen, // 매거진, 브로셔
  CalendarDays, // 이벤트 일정
  Ticket, // 티켓, 이벤트 입장권
  Handshake, // 제휴, 협력
  Users, // 제휴, 협력, 커뮤니티
  PanelLeft,
} from "lucide-react";
import { RiShoppingBag2Line } from "react-icons/ri";
import { LuBook } from "react-icons/lu";
import { LuAlarmClock } from "react-icons/lu";
import { PiSwatches } from "react-icons/pi";
import { FaCalendarAlt } from "react-icons/fa";
import { FaHouseCircleCheck } from "react-icons/fa6";
import { FaBook } from "react-icons/fa";
import { FaShopify } from "react-icons/fa";
import { FaHandsHelping } from "react-icons/fa";
import { MdEventAvailable } from "react-icons/md";

import Link from "next/link";
import Image from "next/image";

export function CategoryButtons() {
  return (
    <div className="grid grid-cols-4 gap-2 px-4 w-full justify-evenly items-center">
      <Link href="/exhibitions" className="flex flex-col items-center col-span-1">
        <div className="flex flex-col items-center text-sm bg-gray-100 rounded-xl cursor-pointer hover:bg-gray-200 w-[60px] h-[60px] justify-center shadow-md">
          <FaCalendarAlt className="w-7 h-7 text-[#007AFF]" />
        </div>
        <div className="flex w-full justify-center items-center mt-2">
          <span className="text-[10px] font-bold">전시회</span>
        </div>
      </Link>
      <Link href="/galleries" className="flex flex-col items-center col-span-1">
        <div className="flex flex-col items-center text-sm bg-gray-100 rounded-xl cursor-pointer hover:bg-gray-200 w-[60px] h-[60px] justify-center shadow-md">
          <FaHouseCircleCheck className="w-7 h-7 text-[#007AFF] scale-125" />
        </div>
        <div className="flex w-full justify-center items-center mt-2">
          <span className="text-[10px] font-bold">갤러리</span>
        </div>
      </Link>
      <Link href="/magazineList" className="flex flex-col items-center col-span-1">
        <div className="flex flex-col items-center text-sm bg-gray-100 rounded-xl cursor-pointer hover:bg-gray-200 w-[60px] h-[60px] justify-center shadow-md">
          <FaBook className="w-7 h-7 text-[#007AFF]" />
        </div>
        <div className="flex w-full justify-center items-center mt-2">
          <span className="text-[10px] font-bold">매거진</span>
        </div>
      </Link>
      <Link href="/artstore" className="flex flex-col items-center col-span-1">
        <div className="flex flex-col items-center text-sm bg-gray-100 rounded-xl cursor-pointer hover:bg-gray-200 w-[60px] h-[60px] justify-center shadow-md">
          <FaShopify className="w-7 h-7 text-[#007AFF] scale-125" />
        </div>
        <div className="flex w-full justify-center items-center mt-2">
          <span className="text-[10px] font-bold">아트샵</span>
        </div>
      </Link>
    </div>
  );
}
