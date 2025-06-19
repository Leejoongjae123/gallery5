"use client";
import React, { useState } from "react";
import { Card, CardBody, Divider } from "@heroui/react";
import { FaRegCalendar } from "react-icons/fa";
import { IoMdPin } from "react-icons/io";
import { FaRegStar } from "react-icons/fa";
import { FaRegBookmark, FaBookmark } from "react-icons/fa6";
import Link from "next/link";
import { FaStar } from "react-icons/fa";
import { FaMap } from "react-icons/fa";
import { motion } from "framer-motion";
import Image from "next/image";
import SafeImage from '@/components/SafeImage';

export function GalleryCards({ galleries, user, bookmarks, toggleBookmark, isBookmarked }) {
  // 갤러리 카드 애니메이션 설정
  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };
  
  return (
    <div className="w-full">
      <div className="flex flex-col items-center gap-4 w-full">
        {galleries.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">검색 결과가 없습니다</p>
          </div>
        ) : (
          <motion.div 
            className="flex flex-col gap-4 justify-center items-center w-full"
            variants={container}
            initial="hidden"
            animate="visible"
          >
            {galleries.map((gallery, index) => (
              <motion.div key={index} variants={item} className="w-full">
                <Card shadow="sm" className="hover:cursor-pointer w-full">
                  <Link href={`/galleries/${gallery.id}`}>
                    <CardBody className="flex gap-4 flex-row w-full">
                      <SafeImage
                        src={gallery.thumbnail ? gallery.thumbnail : `https://picsum.photos/200/200?random=${index}`}
                        alt={gallery.name || gallery.title}
                        width={96}
                        height={96}
                        className="w-24 h-24 object-cover rounded"
                        priority={index === 0}
                        loading={index === 0 ? "eager" : "lazy"}
                      />
                      <div className="flex flex-col w-full">
                        <div className="flex flex-row justify-between items-start mb-2">
                          <div className="flex flex-col">
                            
                            <div className="text-[12px] font-bold">
                              {gallery.name || gallery.subtitle}
                            </div>
                          </div>
                          <div 
                            onClick={(e) => toggleBookmark(e, gallery)}
                            className="cursor-pointer"
                          >
                            {user && isBookmarked && isBookmarked(gallery.id) ? (
                              <FaBookmark className="text-red-500 text-lg bg-gray-300 rounded-full p-1 font-bold" />
                            ) : (
                              <FaRegBookmark className="text-white text-lg bg-gray-300 rounded-full p-1 font-bold" />
                            )}
                          </div>
                        </div>

                        <Divider
                          orientation="horizontal"
                          className=" bg-gray-300"
                        />
                        <div className="text-xs flex flex-col my-2">
                          <div className="flex flex-row gap-1 text-[10px]">
                            <FaMap className="w-3 h-3 text-[#007AFF]" />
                            {gallery.address || gallery.location}
                          </div>
                          <div className="flex flex-row gap-1 text-[10px]">
                            <FaStar className="w-3 h-3 text-[#007AFF]" />

                            {gallery.visitor_rating || "1.0"}({gallery.blog_review_count || 0})
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Link>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
