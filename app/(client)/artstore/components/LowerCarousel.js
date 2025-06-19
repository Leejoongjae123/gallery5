import React, { useState, useEffect, useRef } from "react";
import { Card, CardBody } from "@heroui/react";
import { FaRegStar, FaStar } from "react-icons/fa";
import { FaRegBookmark, FaBookmark } from "react-icons/fa6";
import { useRouter } from "next/navigation";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";

function getWebpImageUrl(url) {
  if (!url) return "/noimage.jpg";
  if (url.endsWith(".webp")) return url;
  return url.replace(/\.(jpg|jpeg|png)$/i, ".webp");
}

export default function LowerCarousel() {
  const router = useRouter();
  const [artItems, setArtItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const supabase = createClient();
  const sliderRef = useRef(null);

  useEffect(() => {
    const fetchTopProducts = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('product')
          .select('*')
          .eq('isTopOfWeek', true)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('이번 주 인기 상품을 불러오는 중 오류 발생:', error);
          return;
        }

        // 데이터를 그대로 설정
        setArtItems(data || []);
      } catch (error) {
        console.error('상품 데이터 로딩 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopProducts();
  }, []);

  const toggleLike = (id) => {
    setArtItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, liked: !item.liked } : item
      )
    );
  };

  const toggleBookmark = (id) => {
    setArtItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, bookmarked: !item.bookmarked } : item
      )
    );
  };

  const handleCardClick = (id, e) => {
    // 드래그 중이면 페이지 이동 방지
    if (!isDragging) {
      router.push(`/product/${id}`);
    }
  };

  // react-slick 설정
  const settings = {
    dots: false,
    arrows: false,
    infinite: false,
    speed: 500,
    slidesToShow: 2.5,
    slidesToScroll: 1,
    swipeToSlide: true,
    touchThreshold: 10,
    cssEase: "cubic-bezier(0.23, 1, 0.32, 1)",
    beforeChange: () => setIsDragging(true),
    afterChange: () => {
      // 슬라이드 변경 후 약간의 지연시간을 두고 드래그 상태 해제
      setTimeout(() => {
        setIsDragging(false);
      }, 100);
    }
  };
  console.log('artItems:', artItems)

  if (loading) {
    return (
      <div className="w-full overflow-hidden my-4">
        <div className="flex gap-4 pb-4">
          {[1, 2, 3].map((_, index) => (
            <div key={index} className="flex-shrink-0 w-[127px]">
              <div className="bg-gray-200 h-[150px] rounded-xl animate-pulse"></div>
              <div className="mt-2 bg-gray-200 h-4 w-3/4 rounded animate-pulse"></div>
              <div className="mt-1 bg-gray-200 h-4 w-1/2 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 상품이 없는 경우
  if (artItems.length === 0) {
    return (
      <div className="w-full overflow-hidden my-4 text-center py-8">
        <p className="text-gray-500">이번 주 인기 상품이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto scrollbar-hide my-4">
      <div className="flex flex-row gap-4">
        {artItems.map((item) => (
          <div key={item.id} className="pr-4 min-w-[127px]">
            <Card 
              className="cursor-pointer rounded-xl overflow-hidden shadow-sm h-full flex flex-col"
            >
              <div 
                onClick={(e) => handleCardClick(item.id, e)} 
                className="relative w-[127px] h-[150px] mx-auto"
              >
                <Image
                  src={getWebpImageUrl(item.image[0])}
                  alt={item.name}
                  className="w-full h-full object-contain bg-white rounded-2xl"
                  fill
                />
              </div>
              <CardBody className="p-3" onClick={(e) => handleCardClick(item.id, e)}>
                <p className="text-[14px] font-medium line-clamp-1 text-[#606060]">
                  {item.name}
                </p>
                <p className="text-[14px] text-black font-bold mt-1">
                  {item.price ? `₩${Number(item.price).toLocaleString()}` : ""}
                </p>
              </CardBody>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
