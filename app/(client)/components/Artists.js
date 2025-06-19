"use client";
import React, { useState, useEffect, useRef } from "react";
import { FaChevronRight, FaChevronLeft } from "react-icons/fa";
import { Card, CardBody, Skeleton } from "@heroui/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

function getWebpImageUrl(url) {
  if (!url) return "/noimage.jpg";
  if (url.endsWith(".webp")) return url;
  return url.replace(/\.(jpg|jpeg|png)$/i, ".webp");
}

const Artists = () => {
  const router = useRouter();
  const [artists, setArtists] = useState([]);
  const [works, setWorks] = useState([]);
  const [recommendedWorks, setRecommendedWorks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  
  // 슬라이더 ref
  const artistSliderRef = useRef(null);
  const workSliderRef = useRef(null);
  const recommendedSliderRef = useRef(null);
  
  // 슬라이더 설정
  const sliderSettings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    arrows: false,
    variableWidth: true,
    swipeToSlide: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2,
        }
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
        }
      }
    ]
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 아티스트 데이터 가져오기
        const { data: artistsData, error: artistsError } = await supabase
          .from("profiles")
          .select("*")
          .eq("isArtist", true)
          .eq("isArtistApproval", true)
          .order("created_at", { ascending: false });

        if (artistsError) throw artistsError;
        setArtists(artistsData);

        // 최신 작품 5개 가져오기
        const { data: worksData, error: worksError } = await supabase
          .from("product")
          .select("*, artist_id(*)")
          .order("created_at", { ascending: false });

        if (worksError) throw worksError;
        setWorks((worksData || []).filter(item => item.artist_id?.isArtistApproval === true));

        // 추천 작품 5개 가져오기
        const { data: recommendedData, error: recommendedError } =
          await supabase
            .from("product")
            .select("*, artist_id(*)")
            .eq("isRecommended", true)
            .limit(5);

        if (recommendedError) throw recommendedError;
        setRecommendedWorks((recommendedData || []).filter(item => item.artist_id?.isArtistApproval === true));

        setIsLoading(false);
      } catch (error) {
        console.log("Error fetching data:", error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleItemClick = (e, path) => {
    router.push(path);
  };
  
  // 슬라이더 이전/다음 버튼 핸들러
  const goPrev = (sliderRef) => {
    if (sliderRef.current) {
      sliderRef.current.slickPrev();
    }
  };
  
  const goNext = (sliderRef) => {
    if (sliderRef.current) {
      sliderRef.current.slickNext();
    }
  };

  // 스켈레톤 아티스트 카드
  const SkeletonArtistCard = ({ index }) => (
    <div key={`skeleton-artist-${index}`} className="flex-shrink-0">
      <div className="flex-shrink-0">
        <Skeleton className="w-[100px] h-[100px] rounded-lg" />
        <div className="mt-2">
          <Skeleton className="w-16 h-4 rounded-md mx-auto" />
        </div>
      </div>
    </div>
  );

  // 스켈레톤 작품 카드
  const SkeletonWorkCard = ({ index }) => (
    <div key={`skeleton-work-${index}`} className="flex-shrink-0">
      <Skeleton className="w-[150px] h-[225px] rounded-lg" />
      <div className="mt-2">
        <Skeleton className="w-24 h-3 rounded-md" />
        <Skeleton className="w-16 h-3 rounded-md mt-1" />
      </div>
    </div>
  );

  // 아티스트 카드 컴포넌트
  const ArtistCard = ({ artist, index }) => (
    <motion.div
      key={artist.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ 
        duration: 0.3, 
        delay: index * 0.05
      }}
      className="flex-shrink-0 w-[100px] h-full block px-1 py-1"
    >
      <Card  className="h-full overflow-hidden shadow hover:shadow-lg transition-shadow rounded-xl">
        <div
          onClick={(e) => handleItemClick(e, `/artist/${artist.id}`)}
          className="relative cursor-pointer w-[100px] aspect-square"
        >
          <Image
            src={artist.avatar_url || "/noimage.jpg"}
            alt="artist"
            fill
            className="object-cover rounded-lg w-full h-full bg-white"
            draggable="false"
          />
        </div>
        <CardBody className="flex flex-col justify-between p-3">
          <h3 className="text-xs font-bold w-full text-center">
            {artist.artist_name}
          </h3>
        </CardBody>
      </Card>
    </motion.div>
  );

  // 작품 카드 컴포넌트
  const WorkCard = ({ work, index, size = "normal" }) => (
    <motion.div
      key={work.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ 
        duration: 0.3, 
        delay: index * 0.05
      }}
      className={`flex ${size === "normal" ? "w-[150px]" : "w-[125px]"} h-full px-1`}
    >
      <Card
        className={`h-full ${size === "normal" ? "w-[150px]" : "w-[125px]"} overflow-hidden hover:shadow-md transition-shadow rounded-xl`}
        shadow="none"
      >
        <div
          onClick={(e) => handleItemClick(e, `/product/${work.id}`)}
          className={`relative cursor-pointer ${size === "normal" ? "w-full" : "h-[150px] w-[125px]"}`}
        >
          {size === "normal" ? (
            <>
              <div className="w-[150px] aspect-[2/3] relative">
                <Image
                  src={getWebpImageUrl(work.image[0])}
                  alt="works"
                  fill
                  className="object-contain rounded-lg bg-white"
                  draggable="false"
                />
              </div>
              <div className="flex flex-col gap-1 p-2 bg-white">
                <h3 className="text-[13px] w-full text-start font-medium">
                  {work.name}
                </h3>
                <p className="text-[10px] text-start text-gray-600">
                  {work.size} {work.make_method}
                </p>
                <p className="text-[14px] text-start font-bold">
                  ₩{work.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                </p>
              </div>
            </>
          ) : (
            <>
              <Image
                src={getWebpImageUrl(work.image[0])}
                alt="bestofweek"
                fill
                className="object-contain rounded-lg bg-white"
                draggable="false"
              />
            </>
          )}
        </div>
        {size !== "normal" && (
          <div className="flex flex-col justify-between p-3">
            <h3 className="text-xs w-full text-start">{work.name}</h3>
            <p className="text-[12px] text-start font-bold">
              ₩{work.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            </p>
          </div>
        )}
      </Card>
    </motion.div>
  );

  // 슬라이더 내비게이션 버튼 컴포넌트
  const SliderNavigation = ({ prevHandler, nextHandler }) => (
    <div className="flex items-center gap-2 absolute right-0 top-[-30px]">
      <button
        onClick={prevHandler}
        className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-300 bg-white text-gray-500 hover:bg-gray-100"
      >
        <FaChevronLeft size={12} />
      </button>
      <button
        onClick={nextHandler}
        className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-300 bg-white text-gray-500 hover:bg-gray-100"
      >
        <FaChevronRight size={12} />
      </button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center w-[90%]">
        <div className="flex flex-row items-center justify-between w-full">
          <div className="flex flex-col items-center justify-center text-[18px] font-bold">
            아티스트
          </div>
          <div className="flex flex-row items-center justify-center ">
            <p className="text-[#007AFF] text-sm font-bold">SEE ALL</p>
            <FaChevronRight className="text-[#007AFF] text-sm font-bold" />
          </div>
        </div>
        <div className="w-full overflow-x-auto no-scrollbar mt-4 scrollbar-hide">
          <div className="flex gap-4 pb-4">
            {Array(5)
              .fill(null)
              .map((_, index) => (
                <SkeletonArtistCard key={index} index={index} />
              ))}
          </div>
        </div>
        
        <div className="flex flex-row items-center justify-between w-full mt-8">
          <div className="flex flex-col items-center justify-center text-[18px] font-bold">
            최신 작품
          </div>
          <div className="flex flex-row items-center justify-center ">
            <p className="text-[#007AFF] text-sm font-bold">SEE ALL</p>
            <FaChevronRight className="text-[#007AFF] text-sm font-bold" />
          </div>
        </div>
        <div className="w-full overflow-x-auto no-scrollbar mt-4 scrollbar-hide">
          <div className="flex gap-4 pb-4">
            {Array(5)
              .fill(null)
              .map((_, index) => (
                <SkeletonWorkCard key={index} index={index} />
              ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[90%] max-w-full overflow-hidden my-4">
      <div className="flex flex-row items-center justify-between w-full">
        <div className="flex flex-col items-center justify-center text-[18px] font-bold">
          아티스트
        </div>
        <div
          onClick={() => router.push("/artists")}
          className="flex flex-row items-center justify-center cursor-pointer"
        >
          <p className="text-[#007AFF] text-sm font-bold">SEE ALL</p>
          <FaChevronRight className="text-[#007AFF] text-sm font-bold" />
        </div>
      </div>
      {/* 아티스트 가로방향 캐러샐*/}
      <div className="w-full overflow-x-auto scrollbar-hide py-2">
        <div className="flex flex-row gap-4">
          {artists.map((artist, index) => (
            <div key={artist.id} className="min-w-[100px]">
              <ArtistCard artist={artist} index={index} />
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex flex-row items-center justify-between w-full mt-8">
        <div className="flex flex-col items-center justify-center text-[18px] font-bold">
          최신 작품
        </div>
        <div
          onClick={() => router.push("/artstore")}
          className="flex flex-row items-center justify-center cursor-pointer"
        >
          <p className="text-[#007AFF] text-sm font-bold">SEE ALL</p>
          <FaChevronRight className="text-[#007AFF] text-sm font-bold" />
        </div>
      </div>
      {/* 작품 가로방향 캐러샐 */}
      <div className="w-full overflow-x-auto scrollbar-hide py-2">
        <div className="flex flex-row gap-4">
          {works.map((work, index) => (
            <div key={work.id} className="min-w-[150px]">
              <WorkCard work={work} index={index} size="normal" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Top of Week 가로방향 캐러샐 */}
      <div className="flex flex-row items-center justify-between w-full mt-8">
        <div className="flex flex-col items-center justify-center text-[18px] font-bold">
          Top of Week
        </div>
        <div
          onClick={() => router.push("/artstore")}
          className="flex flex-row items-center justify-center cursor-pointer"
        >
          <p className="text-[#007AFF] text-sm font-bold">SEE ALL</p>
          <FaChevronRight className="text-[#007AFF] text-sm font-bold" />
        </div>
      </div>
      <div className="w-full overflow-x-auto scrollbar-hide py-2">
        <div className="flex flex-row gap-4">
          {recommendedWorks.map((work, index) => (
            <div key={work.id} className="min-w-[150px]">
              <WorkCard work={work} index={index} size="small" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Artists;
