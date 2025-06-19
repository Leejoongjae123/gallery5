"use client";
import { Card, CardBody, Divider, Skeleton, Spinner } from "@heroui/react";
import { FaRegCalendar } from "react-icons/fa";
import { IoMdPin } from "react-icons/io";
import { FaRegStar, FaStar } from "react-icons/fa";
import { FaRegBookmark, FaBookmark } from "react-icons/fa6";
import Link from "next/link";
import { FaPlusCircle } from "react-icons/fa";
import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import useBookmarkStore from "./bookmarkStore";
import { addToast } from "@heroui/react";
// 캐러셀용 아이콘 추가
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";

export default function GalleryCards({ selectedTab, user }) {
  const [gallerys, setGallerys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 6; // 카드 개수를 6개로 변경
  const supabase = createClient();
  
  // 캐러셀 관련 상태 추가
  const carouselRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Zustand 북마크 스토어에서 상태와 함수 가져오기
  const { bookmarks, setBookmarks } = useBookmarkStore();

  // 북마크 상태 확인하는 함수
  const isBookmarked = (galleryId) => {
    return bookmarks.some((bookmark) => bookmark.gallery_id === galleryId);
  };

  // 북마크 토글 함수
  const toggleBookmark = async (e, gallery) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      addToast({
        title: "로그인이 필요합니다",
        description: "북마크 기능을 사용하려면 로그인하세요.",
        type: "warning",
      });
      return;
    }

    try {
      if (isBookmarked(gallery.id)) {
        // 북마크 삭제
        const bookmarkToRemove = bookmarks.find(b => b.gallery_id === gallery.id);
        if (bookmarkToRemove) {
          const { error } = await supabase
            .from('bookmarks')
            .delete()
            .eq('id', bookmarkToRemove.id);
          
          if (error) throw error;
          
          // 로컬 상태 업데이트
          setBookmarks(bookmarks.filter(b => b.id !== bookmarkToRemove.id));
          
          addToast({
            title: "북마크 제거됨",
            description: "갤러리가 북마크에서 제거되었습니다.",
            type: "success",
          });
        }
      } else {
        // 북마크 추가
        const { data, error } = await supabase
          .from('bookmarks')
          .insert([
            { 
              user_id: user.id, 
              gallery_id: gallery.id,
              gallery_name: gallery.name,
              gallery_thumbnail: gallery.thumbnail || "/images/noimage.jpg",
              gallery_address: gallery.address
            }
          ])
          .select();
        
        if (error) throw error;
        
        // 로컬 상태 업데이트
        if (data && data.length > 0) {
          setBookmarks([...bookmarks, data[0]]);
          
          addToast({
            title: "북마크 추가됨",
            description: "갤러리가 북마크에 추가되었습니다.",
            type: "success",
          });
        }
      }
    } catch (error) {
      console.error("북마크 토글 에러:", error);
      addToast({
        title: "오류 발생",
        description: "북마크 처리 중 오류가 발생했습니다.",
        type: "error",
      });
    }
  };

  // 북마크 불러오기
  const fetchBookmarks = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      if (data) {
        setBookmarks(data);
      }
    } catch (error) {
      console.error("북마크 불러오기 에러:", error);
    }
  }, [user, supabase, setBookmarks]);

  // 갤러리 데이터 가져오기
  const getGallerys = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase.from('gallerys').select('*');
      
      // 탭에 따른 필터링
      if (selectedTab && selectedTab !== '전체') {
        query = query.eq('category', selectedTab);
      }
      
      // 페이징 처리
      query = query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      if (data.length < PAGE_SIZE) {
        setHasMore(false);
      }
      
      if (page === 1) {
        setGallerys(data);
      } else {
        setGallerys((prev) => [...prev, ...data]);
      }
    } catch (error) {
      console.error("갤러리 불러오기 에러:", error);
      addToast({
        title: "오류 발생",
        description: "갤러리 데이터를 불러오는 중 오류가 발생했습니다.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [supabase, selectedTab, page, PAGE_SIZE]);

  // 더 불러오기
  const loadMore = () => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1);
    }
  };
  
  // 캐러셀 네비게이션 함수 
  const scrollToNext = () => {
    if (carouselRef.current && currentIndex < gallerys.length - 3) {
      setCurrentIndex(currentIndex + 1);
      const cardWidth = 280 + 16; // 카드 너비(280px) + 간격(16px)
      carouselRef.current.scrollTo({
        left: (currentIndex + 1) * cardWidth,
        behavior: 'smooth'
      });
    }
  };

  const scrollToPrev = () => {
    if (carouselRef.current && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      const cardWidth = 280 + 16; // 카드 너비(280px) + 간격(16px)
      carouselRef.current.scrollTo({
        left: (currentIndex - 1) * cardWidth,
        behavior: 'smooth'
      });
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    getGallerys();
  }, [getGallerys, page, selectedTab]);

  // 북마크 불러오기
  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  // 지역 추출 함수 (주소에서 첫 번째 단어를 가져옴)
  const extractRegion = (address) => {
    if (!address) return "서울";
    const parts = address.split(' ');
    return parts[0] || "서울";
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full justify-center">
      {/* 캐러셀 네비게이션 버튼 */}
      <div className="flex justify-between w-full max-w-[900px] px-2 mb-2">
        <button 
          onClick={scrollToPrev} 
          disabled={currentIndex === 0 || loading}
          className={`p-2 rounded-full ${currentIndex === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
          aria-label="이전 갤러리 보기"
        >
          <IoIosArrowBack size={24} />
        </button>
        
        <button 
          onClick={scrollToNext} 
          disabled={currentIndex >= gallerys.length - 3 || loading}
          className={`p-2 rounded-full ${currentIndex >= gallerys.length - 3 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
          aria-label="다음 갤러리 보기"
        >
          <IoIosArrowForward size={24} />
        </button>
      </div>
      
      {/* 캐러셀 컨테이너 */}
      <div 
        ref={carouselRef}
        className="w-full max-w-[900px] overflow-x-auto flex gap-4 snap-x snap-mandatory pb-4 px-2 hide-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {loading && page === 1
          ? // 처음 로딩 중 스켈레톤 UI 표시
            Array(PAGE_SIZE)
              .fill()
              .map((_, index) => (
                <div
                  key={index}
                  className="min-w-[280px] flex-shrink-0 snap-center"
                >
                  <div className="w-full flex flex-col gap-2">
                    <Skeleton className="h-48 w-full rounded-lg" />
                    <Skeleton className="h-4 w-36 rounded-lg" />
                    <Skeleton className="h-3 w-24 rounded-lg" />
                  </div>
                </div>
              ))
          : // 데이터 로드 완료 후 실제 갤러리 목록 표시 (캐러셀 형태)
            gallerys.map((gallery, index) => (
              <Card 
                key={index} 
                className="min-w-[280px] flex-shrink-0 snap-center shadow-md hover:shadow-lg transition-shadow overflow-hidden"
              >
                <Link
                  href={`/galleries/${gallery.id || index + 1}`}
                  className="w-full h-full flex flex-col"
                >
                  <div className="relative">
                    <img
                      src={gallery.thumbnail || "/images/noimage.jpg"}
                      alt={gallery.name || "갤러리 이미지"}
                      className="w-full h-48 object-cover"
                    />
                    {/* 지역명 오버레이 */}
                    <div className="absolute top-4 left-4 bg-white/90 px-3 py-1 rounded-md">
                      <span className="font-semibold">{extractRegion(gallery.address)}</span>
                    </div>
                    <div 
                      className="absolute top-4 right-4" 
                      onClick={(e) => toggleBookmark(e, gallery)}
                    >
                      {isBookmarked(gallery.id) ? (
                        <FaBookmark className="text-red-500 text-xl cursor-pointer" />
                      ) : (
                        <FaRegBookmark className="text-white text-xl cursor-pointer drop-shadow-md" />
                      )}
                    </div>
                  </div>
                  <CardBody className="flex flex-col p-4">
                    <div className="text-lg font-bold line-clamp-1">
                      {gallery.name || ""}
                    </div>
                    <div className="text-sm text-gray-600 line-clamp-1 mt-1">
                      {gallery.address || "서울 중로구 인사동 6"}
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="text-sm text-gray-700">평균별점</div>
                      <div className="flex items-center gap-1">
                        <span className="text-blue-500 font-semibold">
                          {gallery.visitor_rating || "3.5"}
                        </span>
                        <FaStar className="text-[#007AFF] w-[12px] h-[12px] align-middle relative top-[1px]" />
                      </div>
                    </div>
                  </CardBody>
                </Link>
              </Card>
            ))}
      </div>

      {/* 추가 데이터 로딩 중 표시 */}
      {loading && page > 1 && (
        <div className="flex justify-center w-full py-4">
          <Spinner variant="wave" size="lg" color="primary" />
        </div>
      )}

      {hasMore ? (
        <FaPlusCircle
          className="text-red-500 text-2xl font-bold hover:cursor-pointer mb-8"
          onClick={loadMore}
        />
      ) : (
        <div className="text-gray-500 text-sm mb-8">
          모든 갤러리를 불러왔습니다
        </div>
      )}
    </div>
  );
} 