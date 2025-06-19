"use client";
import React, { useState } from "react";
import { Card, CardBody } from "@heroui/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// webp 변환 함수 (다른 페이지와 동일)
function getWebpImageUrl(url) {
  if (!url) return "/noimage.jpg";
  if (url.endsWith(".webp")) return url;
  return url.replace(/\.(jpg|jpeg|png)$/i, ".webp");
}

// 굵은 화살표 SVG 컴포넌트
function ThickArrow({ direction = 'left', size = 32 }) {
  return direction === 'left' ? (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 8L12 16L20 24" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 8L20 16L12 24" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function MagazineCarousel({magazine}) {
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
  // 모달 내 스와이프 상태
  const [modalTouchStart, setModalTouchStart] = useState(0);
  const [modalTouchEnd, setModalTouchEnd] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  // magazine.photo 배열에서 슬라이드 생성
  const slides = magazine?.photo || [];

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
    setTouchEnd(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    const deltaX = Math.abs(e.touches[0].clientX - touchStart);
    const deltaY = Math.abs(e.touches[0].clientY - (touchEnd?.clientY || 0));
    // 좌우 이동이 상하 이동보다 크면 상하 스크롤 방지
    if (deltaX > deltaY) {
      e.preventDefault();
    }
    setTouchEnd(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    const distance = touchStart - touchEnd;
    if (distance > 50) {
      // 왼쪽으로 스와이프
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    } else if (distance < -50) {
      // 오른쪽으로 스와이프
      setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    }
  };

  return (
    
    <div
      className="relative pt-2 pb-4 [touch-action:pan-x]"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {slides.length > 0 ? (
        <Card classNames={{base: "w-full rounded-none p-0"}} className="w-full rounded-none" >
          <CardBody className="p-0">
            
              <div className="relative w-full h-[40vh] md:h-[60vh] overflow-hidden">
                <AnimatePresence initial={false} custom={currentSlide}>
                  <motion.img
                    key={currentSlide}
                    src={getWebpImageUrl(slides[currentSlide]?.url) || `https://picsum.photos/800/400?random=${currentSlide}`}
                    alt={`${magazine?.title || ''} - 이미지 ${currentSlide + 1}`}
                    className="object-contain w-full h-full"
                    draggable={false}
                    onClick={() => {
                      setModalIndex(currentSlide);
                      setModalOpen(true);
                    }}
                    style={{ cursor: 'zoom-in' }}
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -100, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                </AnimatePresence>
              </div>
            
          </CardBody>
        </Card>
      ) : (
        <Card className="w-full">
          <CardBody className="p-0">
            <div className="relative w-full h-[40vh] md:h-[60vh] overflow-hidden">
              <img
                src={`https://picsum.photos/800/400?random=1`}
                alt="기본 이미지"
                className="object-contain w-full h-full"
                draggable={false}
              />
            </div>
          </CardBody>
        </Card>
      )}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 p-1">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              currentSlide === index
                ? "bg-red-500"
                : "bg-white border border-gray-300"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
      
      {/* 원본 이미지 모달 오버레이 */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center [touch-action:none]"
          style={{ touchAction: 'none' }}
          onClick={() => setModalOpen(false)}
          onTouchStart={e => {
            e.preventDefault();
            e.stopPropagation();
            setModalTouchStart(e.touches[0].clientX);
          }}
          onTouchEnd={e => {
            e.preventDefault();
            e.stopPropagation();
            if (Math.abs(modalTouchStart - e.changedTouches[0].clientX) < 10) {
              setModalOpen(false);
            }
          }}
        >
          {/* 좌측 화살표 */}
          {slides.length > 1 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-black/60 rounded-full w-12 h-12 flex items-center justify-center shadow-lg border-2 border-white/30 hover:bg-black/80 transition"
              onClick={e => {
                e.stopPropagation();
                setModalIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
                setZoomed(false);
              }}
              aria-label="이전 이미지"
            >
              <ThickArrow direction="left" size={32} />
            </button>
          )}
          <div
            className="flex items-center justify-center w-full h-[90vh] max-h-[90vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
            onTouchStart={e => setModalTouchStart(e.touches[0].clientX)}
            onTouchMove={e => setModalTouchEnd(e.touches[0].clientX)}
            onTouchEnd={() => {
              const distance = modalTouchStart - modalTouchEnd;
              if (distance > 50) {
                setModalIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
                setZoomed(false);
              } else if (distance < -50) {
                setModalIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
                setZoomed(false);
              }
            }}
          >
            <AnimatePresence initial={false} custom={modalIndex}>
              <motion.img
                key={modalIndex}
                src={getWebpImageUrl(slides[modalIndex]?.url) || `https://picsum.photos/800/400?random=${modalIndex}`}
                alt="원본 이미지"
                className={`object-contain w-auto h-full max-h-[90vh] mx-auto transition-transform duration-300 ${zoomed ? 'scale-150' : 'scale-100'}`}
                draggable={false}
                style={{ cursor: zoomed ? 'zoom-out' : 'zoom-in' }}
                onClick={() => setZoomed(z => !z)}
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -100, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            </AnimatePresence>
          </div>
          {/* 우측 화살표 */}
          {slides.length > 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-black/60 rounded-full w-12 h-12 flex items-center justify-center shadow-lg border-2 border-white/30 hover:bg-black/80 transition"
              onClick={e => {
                e.stopPropagation();
                setModalIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
                setZoomed(false);
              }}
              aria-label="다음 이미지"
            >
              <ThickArrow direction="right" size={32} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
