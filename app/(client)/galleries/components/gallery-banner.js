"use client";
import React, { useState, useEffect } from "react";
import { Card, CardBody, Skeleton } from "@heroui/react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import Image from "next/image";

export function GalleryBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // 배너 데이터 가져오기
  const getBanners = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("banner")
        .select("*")
        .eq("type", "gallery") // 갤러리 관련 배너만 필터
        .order("id", { ascending: false });
        
      if (error) {
        console.error("배너 데이터를 가져오는 중 오류 발생:", error);
      }
      
      // 배너 데이터가 없거나 불러오지 못한 경우 기본 배너 준비
      if (!data || data.length === 0) {
        setBanners([
          {
            id: 1,
            title: "갤러리 투어 신청하기",
            description: "전문 큐레이터와 함께하는 특별한 갤러리 투어에 참여하세요",
            url: "https://picsum.photos/800/400?random=1",
            link: "/galleries/tour"
          },
          {
            id: 2,
            title: "이달의 신규 갤러리",
            description: "새롭게 오픈한 갤러리를 만나보세요",
            url: "https://picsum.photos/800/400?random=2", 
            link: "/galleries?filter=new"
          }
        ]);
      } else {
        setBanners(data);
      }
    } catch (error) {
      console.error("배너 데이터를 가져오는 중 오류 발생:", error);
      
      // 오류 발생 시 기본 배너 설정
      setBanners([
        {
          id: 1,
          title: "갤러리 투어 신청하기",
          description: "전문 큐레이터와 함께하는 특별한 갤러리 투어에 참여하세요",
          url: "https://picsum.photos/800/400?random=1",
          link: "/galleries/tour"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getBanners();
  }, []);

  // 자동 슬라이드 기능
  useEffect(() => {
    if (banners.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    }, 5000); // 5초마다 변경
    
    return () => clearInterval(interval);
  }, [banners.length]);

  // 터치 이벤트 핸들러 (모바일 스와이프)
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) { // 왼쪽으로 스와이프
      setCurrentSlide((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    }

    if (touchStart - touchEnd < -75) { // 오른쪽으로 스와이프
      setCurrentSlide((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
    }
  };

  return (
    <div 
      className="relative py-5 w-full flex justify-center items-center"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <Card className="w-[90%] max-w-[600px] mx-auto" shadow="sm">
        <CardBody className="p-0 overflow-hidden">
          {loading ? (
            <Skeleton className="w-full h-[150px] rounded-lg" />
          ) : banners.length > 0 && (
            <Link href={banners[currentSlide]?.link || "#"} className="block">
              <div className="relative">
                <Image
                  src={
                    banners[currentSlide]?.url
                      ? banners[currentSlide].url.includes('/thumbnails/')
                        ? banners[currentSlide].url
                        : banners[currentSlide].url.replace('/gallery/', '/gallery/thumbnails/')
                      : `https://picsum.photos/800/200?random=${currentSlide}`
                  }
                  alt={banners[currentSlide]?.title || `배너 ${currentSlide + 1}`}
                  width={800}
                  height={200}
                  priority
                  className="w-full h-[150px] object-cover"
                  style={{ borderRadius: '16px' }}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <h3 className="text-white font-bold text-lg">
                    {banners[currentSlide]?.title || "갤러리 배너"}
                  </h3>
                  <p className="text-white/90 text-sm">
                    {banners[currentSlide]?.description || ""}
                  </p>
                </div>
              </div>
            </Link>
          )}
        </CardBody>
      </Card>
      
      {banners.length > 1 && (
        <div className="absolute bottom-7 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                currentSlide === index ? 'bg-[#007AFF]' : 'bg-[#B8B8B8]'
              }`}
              aria-label={`배너 ${index + 1}로 이동`}
            />
          ))}
        </div>
      )}
    </div>
  );
} 