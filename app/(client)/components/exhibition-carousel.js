'use client'
import React, { useState, useEffect } from "react";
import { Card, CardBody, Skeleton } from "@heroui/react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export function ExhibitionCarousel() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const getBanners = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("banner").select("*").order("id", { ascending: false });
      if (error) {
        console.log("Error fetching banners:", error);
      }
      setBanners(data || []);
    } catch (error) {
      console.log("Error fetching banners:", error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    getBanners();
  }, []);

  // Slick 설정
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    pauseOnHover: true,
    arrows: false,
    dotsClass: "slick-dots custom-dots",
    customPaging: (i) => (
      <div className="dot-button" />
    )
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <motion.div
      className="relative py-5 w-full flex justify-center items-center"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <Card className="w-full" shadow="none">
        <CardBody className="p-0 w-full flex justify-center items-center">
          {loading ? (
            <div className="w-full space-y-5 p-4 flex justify-center items-center">
              <Card className="w-[90%]" radius="lg" shadow="none" >
                <Skeleton className="rounded-lg">
                  <div className="h-[200px] rounded-lg bg-default-300" />
                </Skeleton>
                
              </Card>
            </div>
          ) : (
            <motion.div
              className="w-[90%] relative scrollbar-hide"
              variants={itemVariants}
            >
              <Slider {...settings}>
                {banners.map((banner, index) => (
                  <div key={index} className="outline-none">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Image
                        src={
                          banner?.thumbnail_url ||
                          (banner?.url
                            ? banner.url.replace(/\.(jpg|jpeg|png)$/i, ".webp")
                            : "/noimage.jpg")
                        }
                        alt={banner?.title || `Slide ${index + 1}`}
                        width={400}
                        height={200}
                        quality={70}
                        priority={index === 0}
                        style={{ objectFit: "cover", borderRadius: "16px", outline: 'none', WebkitTapHighlightColor: 'transparent' }}
                        className="w-full h-[200px] rounded-2xl"
                      />
                    </motion.div>
                  </div>
                ))}
              </Slider>
            </motion.div>
          )}
        </CardBody>
      </Card>
      <style jsx global>{`
        .custom-dots {
          position: absolute;
          bottom: 10px;
          display: flex !important;
          justify-content: center;
          align-items: center;
          width: 100%;
          padding: 0;
          margin: 0;
          list-style: none;
          text-align: center;
          z-index: 10;
        }
        .custom-dots li {
          position: relative;
          display: inline-block;
          width: 12px;
          height: 12px;
          margin: 0 3px;
          padding: 0;
          cursor: pointer;
        }
        .custom-dots li button {
          font-size: 0;
          line-height: 0;
          display: block;
          width: 12px;
          height: 12px;
          padding: 0;
          cursor: pointer;
          color: transparent;
          border: 0;
          outline: none;
          background: transparent;
        }
        .custom-dots li .dot-button {
          display: block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: white;
          transition: all 0.3s ease;
        }
        .custom-dots li.slick-active .dot-button {
          background-color: #007AFF !important;
          width: 10px;
          height: 10px;
        }
        
        /* 이미지 클릭 시 하이라이트 제거 */
        img {
          -webkit-tap-highlight-color: transparent;
          outline: none;
          user-select: none;
        }
        
        /* 스크롤바 완전히 제거 */
        ::-webkit-scrollbar {
          display: none;
        }
        
        /* Firefox 대응 */
        * {
          scrollbar-width: none;
        }
        
        /* Slick 슬라이더 스크롤바 제거 */
        .slick-slider {
          overflow: hidden !important;
        }
        
        /* 슬라이더 아이템 아웃라인 제거 */
        .slick-slide, 
        .slick-slide * {
          outline: none !important;
        }
      `}</style>
    </motion.div>
  );
}