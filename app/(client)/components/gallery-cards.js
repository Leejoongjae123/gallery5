"use client";
import { Card, CardBody, Divider, Skeleton, Spinner } from "@heroui/react";
import { FaRegCalendar } from "react-icons/fa";
import { IoMdPin } from "react-icons/io";
import { FaRegStar } from "react-icons/fa";
import { FaStar } from "react-icons/fa";
import { FaRegBookmark, FaBookmark } from "react-icons/fa6";
import Link from "next/link";
import { FaPlusCircle } from "react-icons/fa";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import useBookmarkStore from "./bookmarkStore";
import { addToast } from "@heroui/react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export default function GalleryCards({ selectedTab, user }) {
  const [gallerys, setGallerys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 10;
  const supabase = createClient();

  // 이전 탭 저장을 위한 ref 추가
  const prevTabRef = useRef(selectedTab);
  // 데이터 로딩 상태를 추적하는 ref
  const isLoadingRef = useRef(false);
  // 슬라이더 ref
  const sliderRef = useRef(null);
  // 드래그 상태를 추적하는 ref
  const isDraggingRef = useRef(false);
  // 슬라이더 요소에서만 동작하도록 체크하는 ref
  const isSliderClickRef = useRef(false);

  // Zustand 북마크 스토어에서 상태와 함수 가져오기
  const { bookmarks, setBookmarks } = useBookmarkStore();

  // 북마크 상태 확인하는 함수
  const isBookmarked = (galleryId) => {
    return bookmarks.some((bookmark) => bookmark.gallery_id === galleryId);
  };

  // 북마크 토글 함수
  const toggleBookmark = async (e, gallery) => {
    e.preventDefault(); // 링크 이벤트 방지
    e.stopPropagation(); // 이벤트 버블링 방지

    if (!user) {
      // 사용자가 로그인하지 않은 경우 처리
      alert("북마크를 추가하려면 로그인이 필요합니다.");
      return;
    }

    const isCurrentlyBookmarked = isBookmarked(gallery.id);

    try {
      if (isCurrentlyBookmarked) {
        // 북마크 삭제
        const { error } = await supabase
          .from("bookmark")
          .delete()
          .eq("user_id", user.id)
          .eq("gallery_id", gallery.id);

        if (error) throw error;

        // Zustand 스토어에서 북마크 제거
        setBookmarks(
          bookmarks.filter((bookmark) => bookmark.gallery_id !== gallery.id)
        );

        // 북마크 삭제 토스트 표시
        addToast({
          title: "북마크 삭제",
          description: `${gallery.name} 북마크가 삭제되었습니다.`,
          color: "danger",
        });
      } else {
        // 북마크 추가
        const { data, error } = await supabase
          .from("bookmark")
          .insert({
            user_id: user.id,
            gallery_id: gallery.id,
            created_at: new Date().toISOString(),
          })
          .select();

        if (error) throw error;

        // Zustand 스토어에 북마크 추가
        setBookmarks([...bookmarks, data[0]]);

        // 북마크 추가 토스트 표시
        addToast({
          title: "북마크 추가",
          description: `${gallery.name} 북마크에 추가되었습니다.`,
          color: "success",
        });
      }
    } catch (error) {
      console.error("북마크 토글 에러:", error);

      // 에러 토스트 표시
      addToast({
        title: "오류 발생",
        description: "북마크 처리 중 오류가 발생했습니다.",
        color: "danger",
        variant: "solid",
        timeout: 3000,
      });
    }
  };

  // 슬라이더 이동 함수 - 강제 이동 대신 자연스러운 스와이핑만 사용
  const slideLeft = () => {
    // 슬라이더의 자연스러운 스와이핑만 사용하고 강제 이동은 제거
  };

  const slideRight = () => {
    // 슬라이더의 자연스러운 스와이핑만 사용하고 강제 이동은 제거
  };

  // 사용자의 북마크 목록 가져오기
  const fetchBookmarks = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("bookmark")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;

      // 북마크 데이터를 Zustand 스토어에 저장
      setBookmarks(data || []);
    } catch (error) {
      console.error("북마크 로드 에러:", error);
    }
  }, [user, supabase, setBookmarks]);

  // 컴포넌트 마운트 시 북마크 로드
  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const getGallerys = useCallback(
    async (pageNum = 1, append = false) => {
      // 이미 로딩 중이면 중복 호출 방지
      if (isLoadingRef.current) return;

      try {
        setLoading(true);
        isLoadingRef.current = true;

        // 페이지네이션을 위한 범위 계산
        const from = (pageNum - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        // 기본 쿼리 시작
        let query = supabase
          .from("gallery")
          .select("*", { count: "exact" })
          .order("blog_review_count", { ascending: false });

        // selectedTab에 따라 쿼리 조건 추가
        if (selectedTab === "recommended") {
          query = query.eq("isRecommended", true);
        } else if (selectedTab === "new") {
          query = query.eq("isNew", true);
        } else if (selectedTab === "now") {
          query = query.eq("isNow", true);
        }

        // 페이지네이션 적용
        const { data, error, count } = await query.range(from, to);

        if (error) {
          console.log(
            "갤러리 데이터를 불러오는 중 오류가 발생했습니다:",
            error
          );
          return;
        }

        // 더 불러올 데이터가 있는지 확인
        setHasMore(count > from + data.length);

        // 데이터 설정 (추가 또는 덮어쓰기)
        if (append) {
          setGallerys((prevGallerys) => [...prevGallerys, ...(data || [])]);
        } else {
          setGallerys(data || []);
        }
      } finally {
        setLoading(false);
        isLoadingRef.current = false;
      }
    },
    [selectedTab, supabase, PAGE_SIZE]
  );

  // 더 많은 데이터 로드하는 함수
  const loadMore = useCallback(() => {
    if (loading || !hasMore || isLoadingRef.current) return;

    const nextPage = page + 1;
    setPage(nextPage);
    getGallerys(nextPage, true);
  }, [loading, hasMore, page, getGallerys]);

  useEffect(() => {
    // 탭이 변경된 경우에만 데이터를 다시 불러옵니다
    if (prevTabRef.current !== selectedTab) {
      setPage(1);
      getGallerys(1, false);
      prevTabRef.current = selectedTab;
    } else if (page === 1 && gallerys.length === 0) {
      // 첫 로드 시에만 데이터를 불러옵니다
      getGallerys(1, false);
    }
  }, [selectedTab, getGallerys, page, gallerys.length]);

  // 로딩 상태에서 사용할 스켈레톤 UI 컴포넌트
  const SkeletonCard = ({ index }) => (
    <div className="w-[200px] h-[300px] flex-shrink-0">
      <Card className="w-[200px] space-y-5 p-4" radius="lg" shadow="none">
        <Skeleton className="rounded-lg">
          <div className="h-24 rounded-lg bg-default-300" />
        </Skeleton>
        <div className="space-y-3">
          <Skeleton className="w-3/5 rounded-lg">
            <div className="h-3 w-3/5 rounded-lg bg-default-200" />
          </Skeleton>
          <Skeleton className="w-4/5 rounded-lg">
            <div className="h-3 w-4/5 rounded-lg bg-default-200" />
          </Skeleton>
          <Skeleton className="w-2/5 rounded-lg">
            <div className="h-3 w-2/5 rounded-lg bg-default-300" />
          </Skeleton>
        </div>
      </Card>
    </div>
  );

  // 갤러리 카드 컴포넌트 - 메모이제이션을 위해 내부 로직과 분리
  const GalleryCard = useCallback(
    ({ gallery, index }) => (
      <motion.div
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ 
          duration: 0.5,
          delay: index * 0.05
        }}
        className="flex-shrink-0"
      >
        <Link
          href={`/galleries/${gallery.id}`}
          className="flex-shrink-0 w-[200px] h-[247px] block"
          onClick={(e) => {
            // 드래그 중에는 링크 이동을 방지
            if (isDraggingRef.current) {
              e.preventDefault();
            }
          }}
        >
          <Card className="h-[247px] overflow-hidden shadow hover:shadow-lg transition-shadow rounded-3xl">
            <div className="relative">
              <Image
                src={gallery.thumbnail || "/images/noimage.jpg"}
                alt={gallery.name || "갤러리 이미지"}
                width={200}
                height={153}
                className="h-[153px] w-full object-cover"
                unoptimized={gallery.thumbnail ? false : true}
              />
              {/* <div
                className="absolute top-2 right-2 z-10 p-1 rounded-full bg-white/70"
                onClick={(e) => toggleBookmark(e, gallery)}
              >
                {isBookmarked(gallery.id) ? (
                  <FaBookmark className="text-red-500 text-lg" />
                ) : (
                  <FaRegBookmark className="text-gray-600 text-lg" />
                )}
              </div> */}
            </div>
            <CardBody className="flex flex-col justify-between h-full">
              <div className="text-[16px] font-bold">{gallery.name}</div>
              <div className="text-[10px] ">
                <p className="line-clamp-1 text-[#BDBDBD]">
                  {gallery.address || "주소 정보 없음"}
                </p>
              </div>
              <div className="flex text-sm justify-between items-center">
                <div className=" rounded-md text-[10px] text-[#BDBDBD] ">평균별점</div>
                <div className="flex items-center gap-x-1">
                  <span className="text-[10px] text-[#007AFF]">{gallery.visitor_rating || "1.0"}</span>
                  <FaStar className="text-[#007AFF] w-[12px] h-[12px] align-middle relative top-[1px]" />
                </div>
              </div>
            </CardBody>
          </Card>
        </Link>
      </motion.div>
    ),
    [isBookmarked, toggleBookmark]
  );

  // 탭에 따른 제목 표시
  const getTabTitle = () => {
    switch (selectedTab) {
      case "recommended":
        return "추천 갤러리";
      case "new":
        return "신규 갤러리";
      case "now":
        return "전시 갤러리";
      default:
        return "모든 갤러리";
    }
  };

  // 마우스 이벤트 핸들러 개선
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
        // 감속 효과를 줄이고 1:1 이동으로 변경
        const walk = (startX - x) * 1.0;
        slider.scrollLeft = scrollLeft + walk;
      };
      
      // 마우스 업 이벤트 핸들러
      const onMouseUp = (e) => {
        isSliderClickRef.current = false;
        slider.style.cursor = "grab";
        
        // 드래그 상태 해제 시간 더 단축
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

  // 터치 이벤트 핸들러 개선
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
        // 더 자연스러운 터치 이동을 위한 1:1 매핑
        const walk = (startX - x) * 1.0;
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
    <div className="w-[90%] max-w-md overflow-hidden">
      <AnimatePresence mode="wait">
        {loading && page === 1 ? (
          // 로딩 중 스켈레톤 UI - 이제 하나의 슬라이더로 표시
          <motion.div
            key="skeletons"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full"
          >
            <div
              className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide"
              style={{ scrollBehavior: "smooth" }}
            >
              {Array(8)
                .fill()
                .map((_, index) => (
                  <SkeletonCard key={index} index={index} />
                ))}
            </div>
          </motion.div>
        ) : (
          // 단일 캐러셀로 변경된 갤러리 표시
          <motion.div
            key="galleries"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full relative overflow-hidden"
          >
            {/* 갤러리 슬라이더 */}
            <div
              ref={sliderRef}
              className="flex overflow-x-auto gap-4 pb-1 scrollbar-hide h-full px-2 slider-container"
              style={{
                scrollSnapType: "x mandatory",
                scrollBehavior: "auto",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                WebkitOverflowScrolling: "touch",
                cursor: "grab",
                touchAction: "pan-x", 
              }}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
            >
              {/* 슬라이더 배경 div 제거하고 직접 이벤트 적용 */}
              <motion.div 
                className="flex gap-4 relative z-10"
                initial={{ x: 20 }}
                animate={{ x: 0 }}
                transition={{ type: "spring", stiffness: 150, damping: 20 }}
              >
                {gallerys.map((gallery, index) => (
                  <GalleryCard key={gallery.id} gallery={gallery} index={index} />
                ))}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}