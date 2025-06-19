"use client";
import React, { useState, useRef, useCallback } from "react";
import { Card, CardBody, Skeleton } from "@heroui/react";
import { FaRegBookmark, FaBookmark } from "react-icons/fa6";
import Link from "next/link";
import { motion } from "framer-motion";

export function GallerySlider({ galleries, loading, user, toggleBookmark, isBookmarked }) {
  // 슬라이더 ref
  const sliderRef = useRef(null);
  // 드래그 상태를 추적하는 ref
  const isDraggingRef = useRef(false);
  // 슬라이더 요소에서만 동작하도록 체크하는 ref
  const isSliderClickRef = useRef(false);

  // 애니메이션 설정
  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const item = {
    hidden: { opacity: 0, x: 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5 }
    }
  };

  // 마우스 이벤트 핸들러
  const handleMouseDown = useCallback((e) => {
    isSliderClickRef.current = true;
    e.preventDefault();
    
    if (sliderRef.current) {
      isDraggingRef.current = false;
      sliderRef.current.style.cursor = "grabbing";
      
      const slider = sliderRef.current;
      const startX = e.pageX;
      const scrollLeft = slider.scrollLeft;
      
      // 마우스 이동 이벤트 핸들러
      const onMouseMove = (e) => {
        if (!isSliderClickRef.current) return;
        
        e.preventDefault();
        isDraggingRef.current = true;
        
        const x = e.pageX;
        // 자연스러운 1:1 이동으로 변경
        const walk = startX - x;
        slider.scrollLeft = scrollLeft + walk;
      };
      
      // 마우스 업 이벤트 핸들러
      const onMouseUp = (e) => {
        isSliderClickRef.current = false;
        slider.style.cursor = "grab";
        
        // 드래그 상태 해제 시간 단축
        setTimeout(() => {
          isDraggingRef.current = false;
        }, 10);
        
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };
      
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    }
  }, []);

  // 터치 이벤트 핸들러
  const handleTouchStart = useCallback((e) => {
    isSliderClickRef.current = true;
    
    if (sliderRef.current) {
      isDraggingRef.current = false;
      const slider = sliderRef.current;
      const startX = e.touches[0].clientX;
      const scrollLeft = slider.scrollLeft;
      
      // 터치 이동 이벤트 핸들러
      const onTouchMove = (e) => {
        if (!isSliderClickRef.current) return;
        
        isDraggingRef.current = true;
        
        const x = e.touches[0].clientX;
        // 자연스러운 1:1 이동으로 변경
        const walk = startX - x;
        slider.scrollLeft = scrollLeft + walk;
      };
      
      // 터치 종료 이벤트 핸들러
      const onTouchEnd = () => {
        isSliderClickRef.current = false;
        
        // 지연시간 최소화
        setTimeout(() => {
          isDraggingRef.current = false;
        }, 10);
        
        slider.removeEventListener("touchmove", onTouchMove);
        slider.removeEventListener("touchend", onTouchEnd);
      };
      
      slider.addEventListener("touchmove", onTouchMove, { passive: false });
      slider.addEventListener("touchend", onTouchEnd);
    }
  }, []);

  return (
    <div className="w-full">
      {loading ? (
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {Array(5)
            .fill(null)
            .map((_, index) => (
              <div key={index} className="flex-shrink-0 w-[200px]">
                <Card className="w-[200px] h-[240px]">
                  <Skeleton className="w-full h-[140px]" />
                  <CardBody className="p-3">
                    <Skeleton className="w-3/4 h-4 mb-2" />
                    <Skeleton className="w-1/2 h-3" />
                  </CardBody>
                </Card>
              </div>
            ))}
        </div>
      ) : (
        <motion.div
          className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide"
          ref={sliderRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          variants={container}
          initial="hidden"
          animate="visible"
          style={{ 
            cursor: "grab", 
            scrollBehavior: "auto",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
            touchAction: "pan-x"
          }}
        >
          {galleries.length === 0 ? (
            <div className="text-center py-10 w-full">
              <p className="text-gray-500">갤러리가 없습니다</p>
            </div>
          ) : (
            galleries.map((gallery, index) => (
              <motion.div key={index} className="flex-shrink-0 w-[200px] pl-1" variants={item}>
                <Card shadow="sm" className="w-[200px] h-[240px] overflow-hidden transition-shadow">
                  <Link 
                    href={`/galleries/${gallery.id}`}
                    onClick={(e) => {
                      // 드래그 중에는 링크 이동을 방지
                      if (isDraggingRef.current) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <div className="relative">
                      <img
                        src={gallery.thumbnail ? gallery.thumbnail : `https://picsum.photos/400/300?random=${index}`}
                        alt={gallery.name || "갤러리 이미지"}
                        className="w-full h-[140px] object-cover"
                      />
                      <div 
                        className="absolute top-2 right-2 z-10 p-1 rounded-full bg-white/70"
                        onClick={(e) => {
                          e.preventDefault();
                          toggleBookmark(e, gallery);
                        }}
                      >
                        {user && isBookmarked && isBookmarked(gallery.id) ? (
                          <FaBookmark className="text-red-500 text-lg" />
                        ) : (
                          <FaRegBookmark className="text-gray-300 text-md text-white p-0.5" />
                        )}
                      </div>
                    </div>
                    <CardBody className="p-3">
                      <h3 className="font-bold text-md line-clamp-1">{gallery.name}</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{gallery.address}</p>
                    </CardBody>
                  </Link>
                </Card>
              </motion.div>
            ))
          )}
        </motion.div>
      )}
    </div>
  );
} 