"use client";
import React from "react";
import {
  Card,
  CardBody,
  Link,
  Skeleton,
} from "@heroui/react";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState, useRef } from "react";
import { IoIosArrowForward } from "react-icons/io";
import { useRouter } from "next/navigation";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Image from "next/image";

export function MagazineCarousel() {
  const [magazines, setMagazines] = useState([]);
  const [selected, setSelected] = useState("michelin");
  const [activeSlide, setActiveSlide] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchMagazines = async () => {
      const { data, error } = await supabase
        .from("magazine")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) {
        console.log("Error fetching magazines:", error);
      } else {
        setMagazines(data || []);
      }
    };

    fetchMagazines();
  }, []);

  const handleMagazineClick = (e, magazineId) => {
    // 스와이프 중에는 페이지 이동 방지
    if (!isDragging) {
      e.stopPropagation();
      router.push(`/magazine/${magazineId}`);
    }
  };

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    pauseOnHover: true,
    arrows: false,
    draggable: true,
    swipe: true,
    swipeToSlide: true,
    touchMove: true,
    touchThreshold: 5,
    useCSS: true,
    useTransform: true,
    customPaging: (i) => (
      <div
        className="dot-button"
        style={{
          backgroundColor: i === activeSlide ? "#007AFF" : "#FFFFFF",
        }}
      />
    ),
    dotsClass: "slick-dots flex justify-center absolute bottom-12 left-0 right-0 z-10 w-3",
    beforeChange: (current, next) => setActiveSlide(next),
    initialSlide: 0,
    responsive: [
      {
        breakpoint: 768,
        settings: {
          arrows: false,
          draggable: true,
          swipe: true
        }
      }
    ],
    swipeEvent: false,
    // 스와이프 관련 이벤트 핸들러 추가
    onSwipe: () => { setIsDragging(true); },
    afterChange: () => { 
      setTimeout(() => {
        setIsDragging(false);
      }, 100);
    }
  };

  return (
    <div className="space-y-4 w-full justify-center items-center px-5 relative">
      <div onClick={() => router.push("/magazineList")} className="absolute top-7 right-4 flex items-center justify-center z-10">
        <div className="text-[12px] text-[#007AFF] font-bold hover:text-[#007AFF]">SEE ALL </div>
        <IoIosArrowForward className="text-[#007AFF] font-bold" />
      </div>
      <div className="flex w-full border-t border-gray-200 mb-2">
        <div className="flex w-full justify-center">
          <button
            className={`text-[12px] py-3 text-center font-medium ${
              selected === "michelin" 
                ? "border-t-4 border-black text-black relative" 
                : "text-gray-500"
            }`}
            onClick={() => setSelected("michelin")}
          >
            <span className={`${selected === "michelin" ? "relative" : ""}`}>
              전시나그네 매거진
            </span>
          </button>
        </div>
      </div>
      {selected === "michelin" && (
        <div>
          {magazines.length > 0 ? (
            <div className="relative w-full bg-transparent p-0 m-0">
              <Slider {...settings} className="slick-container" ref={sliderRef}>
                {magazines.map((magazine, index) => (
                  <div key={index}>
                    <Card 
                      className="w-full bg-transparent shadow-none border-none rounded-none p-0 m-0"
                    >
                      <CardBody className="p-0 relative">
                        <div 
                          className="relative w-full h-[454px]"
                        >
                          <Image
                            src={
                              magazine?.photo[0]?.url ||
                              `/images/noimage.jpg`
                            }
                            alt={magazine?.title}
                            fill
                            sizes="100vw"
                            style={{ objectFit: "cover" }}
                            priority={index === 0}
                          />
                          <div 
                            className="absolute inset-0 flex items-center justify-center"
                            onClick={(e) => handleMagazineClick(e, magazine.id)}
                          >
                            <span className="sr-only">매거진 보기</span>
                          </div>
                        </div>
                        {/* 하단 edge에서부터 자연스러운 그림자(그라데이션) */}
                        <div className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none bg-gradient-to-t from-black/70 to-transparent z-10" />
                        {/* 텍스트는 그림자 위에 올림 */}
                        <div 
                          className="absolute bottom-10 left-0 right-0 px-4 pb-0 mb-0 text-white z-20"
                          onClick={(e) => handleMagazineClick(e, magazine.id)}
                        >
                          <h3 className="text-base font-bold line-clamp-2 break-keep mb-1">
                            {magazine.title}
                          </h3>
                          <div className="flex flex-row items-center gap-2 mt-1">
                            <span className="text-xs line-clamp-1 break-keep opacity-90">{magazine.subtitle || "매거진 내용"}</span>
                            {magazine.created_at && (
                              <span className="text-xs text-gray-300 ml-2">
                                {new Date(magazine.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\./g, '.').replace(/\s/g, '')}
                              </span>
                            )}
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </div>
                ))}
              </Slider>
              <style jsx global>{`
                .slick-container .slick-dots {
                  position: absolute;
                  bottom: 10px;
                  left: 0;
                  right: 0;
                  z-index: 10;
                  display: flex !important;
                  justify-content: center;
                  gap: 0.05rem;
                  padding: 0;
                  margin: 0;
                  list-style: none;
                }
                .slick-container .slick-dots li {
                  position: relative;
                  display: inline-block;
                  width: 10px;
                  height: 10px;
                  margin: 0 2px;
                  padding: 0;
                  cursor: pointer;
                }
                .slick-container .slick-dots li button {
                  font-size: 0;
                  line-height: 0;
                  display: block;
                  width: 8px;
                  height: 8px;
                  padding: 0;
                  cursor: pointer;
                  color: transparent;
                  border: 0;
                  outline: none;
                  background: transparent;
                }
                .slick-container .slick-dots li .dot-button {
                  display: block;
                  width: 8px;
                  height: 8px;
                  border-radius: 50%;
                }
                .slick-container .slick-dots li.slick-active .dot-button {
                  width: 10px;
                  height: 10px;
                }
                img {
                  -webkit-tap-highlight-color: transparent;
                  outline: none;
                  user-select: none;
                }
              `}</style>
            </div>
          ) : (
            <div className="flex justify-center items-center h-[300px]">
              <Skeleton className="w-full h-[300px]" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}