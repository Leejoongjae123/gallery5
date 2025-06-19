"use client";
import React, { useState } from "react";
import { Card, CardBody, Divider, addToast } from "@heroui/react";
import { FaRegCalendar } from "react-icons/fa";
import { IoMdPin } from "react-icons/io";
import { FaRegStar } from "react-icons/fa";
import { FaRegBookmark, FaBookmark } from "react-icons/fa6";
import Link from "next/link";
import { FaPlusCircle } from "react-icons/fa";
import { FaStar } from "react-icons/fa";
import { FaMap } from "react-icons/fa";
import { FaMoneyBillWaveAlt } from "react-icons/fa";
import { FaCalendar } from "react-icons/fa6";
import { motion } from "framer-motion";

// 개별 아이템 애니메이션
const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.3,
      ease: "easeOut"
    } 
  }
};

// 컨테이너 애니메이션 (자식 요소들을 순차적으로 표시)
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1 // 각 자식 요소가 0.1초 간격으로 나타남
    }
  }
};

export function ExhibitionCards({
  exhibitions,
  user,
  bookmarks,
  toggleBookmark,
  isBookmarked,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  // const exhibitions = Array(5).fill({
  //   title: "수원 갤러리",
  //   subtitle: "김광석 초대전 전시회",
  //   date: "2024.03.15 - 2024.04.15",
  //   location: "서울 강남구",
  //   review: "4.0(225)",
  // });

  return (
    <>
      <motion.div 
        className="flex flex-col items-center gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex flex-col gap-4 w-full justify-center items-center">
          {exhibitions.map((exhibition, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              className="w-full"
            >
              <Card classNames={{body: 'px-2 py-1 '}} shadow="sm">
                <Link href={`/exhibition/${exhibition.id}`}>
                  <CardBody className="grid grid-cols-7 items-center justify-center gap-x-3">
                    <div className="col-span-2">
                      <img
                        src={
                          exhibition.photo
                            ? exhibition.photo
                            : "/images/noimage.jpg"
                        }
                        alt={exhibition.title}
                        className="w-20 h-20 object-cover rounded"
                      />
                    </div>

                    <div className="flex flex-col col-span-5">
                      <div className="flex flex-row justify-between items-start">
                        <div className="flex flex-col flex-1">
                          <div className="text-[10px] text-gray-500">
                            {exhibition.naver_gallery_url?.name || exhibition.gallery?.name || '미등록'}
                          </div>
                          <div className="text-base font-semibold">
                            {exhibition.name}
                          </div>
                          <div className="text-[12px] font-bold mb-2">
                            {exhibition.contents}
                          </div>
                          <div className="flex items-center w-full">
                            <Divider orientation="horizontal" className="bg-gray-300 mb-2 w-full" />
                          </div>
                        </div>
                        <div className="flex-shrink-0 ml-2" onClick={(e) => toggleBookmark(e, exhibition)}
                             aria-label={isBookmarked(exhibition.id) ? "북마크 삭제" : "북마크 추가"}
                             role="button"
                             tabIndex={0}
                        >
                          {isBookmarked(exhibition.id) ? (
                            <FaBookmark className="text-red-500 text-lg bg-gray-300 rounded-full p-1 cursor-pointer font-bold" />
                          ) : (
                            <FaRegBookmark className="text-white font-bold text-lg bg-gray-300 rounded-full p-1 cursor-pointer" />
                          )}
                        </div>
                      </div>

                      <div className="text-xs flex flex-col mt-0">
                        <div className="flex flex-row gap-1 text-[10px]">
                          <FaCalendar className="text-[#007AFF] w-[12px] h-[12px] align-middle relative top-[1px]" />
                          {exhibition.start_date?.replace(/(\d{4})(\d{2})(\d{2})/, "$1년$2월$3일")} ~ {exhibition.end_date?.replace(/(\d{4})(\d{2})(\d{2})/, "$1년$2월$3일")}
                        </div>
                        <div className="flex flex-row gap-1 text-[10px]">
                          <FaMoneyBillWaveAlt className="text-[#007AFF] w-[12px] h-[12px] align-middle relative top-[2px]" />
                          {exhibition.price?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} 원
                        </div>
                        <div className="flex flex-row gap-1 text-[10px]">
                          <FaStar className="text-[#007AFF] w-[12px] h-[12px] align-middle relative top-[1px]" />
                          {exhibition.review_average === 0 ? "1.0" : exhibition.review_average?.toFixed(1) || "1.0"} ({exhibition.review_count || 0})
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Link>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </>
  );
}
