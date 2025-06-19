"use client";
import React, { Suspense } from "react";
import { GalleryCards } from "./components/gallery-cards";
import { GallerySlider } from "./components/gallery-slider";
import { GalleryBanner } from "./components/gallery-banner";
import { Tabs, Tab, Button, Select, SelectItem, Spinner, Checkbox, addToast, Skeleton, Divider, Pagination } from "@heroui/react";
import { FaChevronLeft } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { FaPlusCircle } from "react-icons/fa";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useSearchParams } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa6";
import { FiPlusCircle } from "react-icons/fi";
import { FaRegStar, FaStar } from "react-icons/fa";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

function GalleryListContent() {
  const router = useRouter();
  const searchParams = useSearchParams({ suspense: true });
  const isBookmarkParam = searchParams.get('isBookmark');
  
  const [selectedTab, setSelectedTab] = useState("all");
  const [galleries, setGalleries] = useState([]);
  const [featuredGalleries, setFeaturedGalleries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingFeatured, setLoadingFeatured] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedRegion, setSelectedRegion] = useState("");
  const [isBookmark, setIsBookmark] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [user, setUser] = useState(null);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);
  const [highRatingGalleries, setHighRatingGalleries] = useState([]);
  const [tabLoading, setTabLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const ITEMS_PER_PAGE = 5;

  // 애니메이션 설정
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } }
  };

  useEffect(() => {
    if (isBookmarkParam) {
      setIsBookmark(true);
    }
  }, [isBookmarkParam]);

  const supabase = createClient();

  // 사용자 정보 가져오기 - 최초 렌더링 시 한 번만 실행
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      }
      setInitialized(true);
    };
    fetchUser();
  }, []);

  // 탭이 변경될 때 갤러리 데이터 초기화
  useEffect(() => {
    if (initialized) {
      setCurrentPage(1);
      setTabLoading(true);
      fetchGalleries(1);
    }
  }, [selectedTab, isBookmark, selectedRegion, initialized]);

  // 페이지가 변경될 때 갤러리 데이터 로드
  useEffect(() => {
    if (initialized) {
      fetchGalleries(currentPage);
    }
  }, [currentPage, initialized]);

  // 추천 갤러리와 별점 높은 갤러리 동시에 가져오기
  useEffect(() => {
    const fetchFeaturedGalleries = async () => {
      if (!initialized) return;
      
      try {
        // 병렬로 두 요청 실행
        const [featuredResponse, highRatingResponse] = await Promise.all([
          supabase
            .from("gallery")
            .select("*")
            .order("blog_review_count", { ascending: false })
            .eq('isRecommended', true)
            .limit(10),
            
          supabase
            .from("gallery")
            .select("*")
            .order("visitor_rating", { ascending: false })
            .eq('pick', true)
            .limit(9)
        ]);
        
        if (featuredResponse.error) throw featuredResponse.error;
        if (highRatingResponse.error) throw highRatingResponse.error;
        
        setFeaturedGalleries(featuredResponse.data || []);
        setHighRatingGalleries(highRatingResponse.data || []);
      } catch (error) {
        console.log("갤러리 데이터를 가져오는 중 오류:", error);
      }
    };
    
    if (initialized) {
      fetchFeaturedGalleries();
    }
  }, [initialized]);

  // 북마크 가져오기 함수
  const fetchBookmarks = async () => {
    if (!user) return;
    
    try {
      setLoadingBookmarks(true);
      
      const { data, error } = await supabase
        .from('bookmark')
        .select('*')
        .eq('user_id', user.id)
        .not('gallery_id', 'is', null);
        
      if (error) throw error;
      
      setBookmarks(data || []);
    } catch (error) {
      console.log('북마크 로드 에러:', error);
    } finally {
      setLoadingBookmarks(false);
    }
  };

  // 사용자 정보가 있으면 북마크 로드
  useEffect(() => {
    if (user) {
      fetchBookmarks();
    }
  }, [user]);

  // 갤러리 데이터 가져오기
  const fetchGalleries = async (pageNum = currentPage) => {
    setLoading(true);
    
    try {
      // 북마크 필터가 활성화되어 있지만 사용자가 로그인하지 않은 경우
      if (isBookmark && !user) {
        setGalleries([]);
        setTotalPages(1);
        setTotalCount(0);
        setLoading(false);
        setTabLoading(false);
        return;
      }
      
      // 북마크 필터가 활성화되어 있지만 북마크 데이터가 아직 로드되지 않은 경우
      if (isBookmark && loadingBookmarks) {
        setLoading(false);
        setTabLoading(false);
        return; // 북마크 데이터가 로드될 때까지 대기
      }
      
      let query = supabase
        .from("gallery")
        .select("*", { count: "exact" })
        .order("blog_review_count", { ascending: false });
      
      // 선택된 탭에 따라 필터 적용
      if (selectedTab === "now") {
        query = query.eq('isNow', true);
      } else if (selectedTab === "new") {
        query = query.eq('isNew', true);
      }
      
      // 지역 필터 적용
      if (selectedRegion) {
        query = query.ilike('address', `%${selectedRegion}%`);
      }
      
      // 북마크 필터 적용
      if (isBookmark && user) {
        // null이 아닌 유효한 gallery_id만 필터링
        const bookmarkedIds = bookmarks
          .filter(b => b.gallery_id !== null)
          .map(b => b.gallery_id);
        
        if (bookmarkedIds.length === 0) {
          // 북마크가 없거나 모두 null인 경우 빈 결과 반환
          setGalleries([]);
          setTotalPages(1);
          setTotalCount(0);
          setLoading(false);
          setTabLoading(false);
          return;
        }
        
        query = query.in('id', bookmarkedIds);
      }
      
      const { data, error, count } = await query
        .range((pageNum - 1) * ITEMS_PER_PAGE, pageNum * ITEMS_PER_PAGE - 1);
      
      if (error) throw error;
      
      setGalleries(data || []);
      setTotalCount(count || 0);
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
      
    } catch (error) {
      console.log("갤러리 데이터를 가져오는 중 오류:", error);
    } finally {
      setLoading(false);
      setTabLoading(false);
    }
  };

  // 페이지 변경 핸들러
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  
  // 북마크 상태 확인하는 함수
  const isBookmarked = (galleryId) => {
    return bookmarks.some(bookmark => bookmark.gallery_id === galleryId);
  };
  
  // 북마크 토글 함수
  const toggleBookmark = async (e, gallery) => {
    e.preventDefault(); // 링크 이벤트 방지
    e.stopPropagation(); // 이벤트 버블링 방지
    
    if (!user) {
      // 사용자가 로그인하지 않은 경우 처리
      addToast({
        title: "로그인 필요",
        description: "북마크를 추가하려면 로그인이 필요합니다.",
        color: "warning",
      });
      return;
    }
    
    const isCurrentlyBookmarked = isBookmarked(gallery.id);
    
    try {
      if (isCurrentlyBookmarked) {
        // 북마크 삭제
        const { error } = await supabase
          .from('bookmark')
          .delete()
          .eq('user_id', user.id)
          .eq('gallery_id', gallery.id);
          
        if (error) throw error;
        
        // 북마크 목록에서 제거
        setBookmarks(bookmarks.filter(bookmark => bookmark.gallery_id !== gallery.id));
        
        // 북마크 삭제 토스트 표시
        addToast({
          title: "북마크 삭제",
          description: `${gallery.name} 북마크가 삭제되었습니다.`,
          color: "danger",
        });
      } else {
        // 북마크 추가
        const { data, error } = await supabase
          .from('bookmark')
          .insert({
            user_id: user.id,
            gallery_id: gallery.id,
            created_at: new Date().toISOString()
          })
          .select();
          
        if (error) throw error;
        
        // 북마크 목록에 추가
        setBookmarks([...bookmarks, data[0]]);
        
        // 북마크 추가 토스트 표시
        addToast({
          title: "북마크 추가",
          description: `${gallery.name} 북마크에 추가되었습니다.`,
          color: "success",
        });
      }
    } catch (error) {
      console.log('북마크 토글 에러:', error);
      
      // 에러 토스트 표시
      addToast({
        title: "오류 발생",
        description: "북마크 처리 중 오류가 발생했습니다.",
        color: "danger",
        variant: "solid",
        timeout: 3000
      });
    }
  };

  // URL 매개변수 업데이트 함수
  const updateBookmarkUrlParam = (isBookmarked) => {
    const url = new URL(window.location);
    if (isBookmarked) {
      url.searchParams.set("isBookmark", "true");
    } else {
      url.searchParams.delete("isBookmark");
    }
    window.history.pushState({}, "", url);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="bg-white flex items-center w-[90%] justify-between">
        <Button
          isIconOnly
          variant="light"
          className="mr-2"
          onPress={() => router.push("/")}
        >
          <FaArrowLeft className="text-xl" />
        </Button>
        <h2 className="text-lg font-bold text-center flex-grow">갤러리</h2>
        <div className="w-10"></div>
      </div>
      
      {/* 상단 갤러리 슬라이더 - 가로 스크롤 형태 */}
      <div className="w-[90%] mt-4 mb-2">
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-[18px] font-bold">인기 갤러리</h3>
        </div>
        <AnimatePresence>
          {!initialized ? (
            <div className="w-full overflow-x-auto flex space-x-4 pb-2 scrollbar-hide">
              {Array(4).fill(null).map((_, index) => (
                <div key={`skeleton-slider-${index}`} className="flex-shrink-0 w-[180px]">
                  <Skeleton className="w-[180px] h-[240px] rounded-lg" />
                </div>
              ))}
            </div>
          ) : (
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={fadeIn}
            >
              <GallerySlider 
                galleries={featuredGalleries} 
                loading={false}
                user={user}
                toggleBookmark={toggleBookmark}
                isBookmarked={isBookmarked}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* 커스텀 탭바 및 필터 영역 */}
      <div className="w-[90%] flex flex-col mb-4">
        {/* 커스텀 탭바 - 전체 폭의 2/3 크기로 중앙 정렬 */}
        <div className="flex w-full border-t border-gray-200 mb-2">
          <div className="w-1/6"></div>
          <div className="flex w-2/3">
            <button
              className={`text-[12px] flex-1 py-3 text-center font-medium ${selectedTab === "all" ? "border-t-4 border-black text-black" : "text-gray-500"}`}
              onClick={() => setSelectedTab("all")}
            >
              전체
            </button>
            <button
              className={`text-[12px] flex-1 py-3 text-center font-medium ${selectedTab === "now" ? "border-t-4 border-black text-black" : "text-gray-500"}`}
              onClick={() => setSelectedTab("now")}
            >
              전시중
            </button>
            <button
              className={`text-[12px] flex-1 py-3 text-center font-medium ${selectedTab === "new" ? "border-t-4 border-black text-black" : "text-gray-500"}`}
              onClick={() => setSelectedTab("new")}
            >
              신규
            </button>
          </div>
          <div className="w-1/6"></div>
        </div>
        
        {/* 필터 영역 */}
        <div className="flex justify-between items-center w-full bg-white mb-4">
          <Select
            aria-label="지역 선택"
            selectedKeys={selectedRegion ? [selectedRegion] : []}
            onChange={(e)=>setSelectedRegion(e.target.value)}
            className="w-1/4"
            placeholder="지역"
            size="sm"
          >
            <SelectItem key="서울" value="서울">서울</SelectItem>
            <SelectItem key="인천" value="인천">인천</SelectItem>
            <SelectItem key="경기" value="경기">경기</SelectItem>
            <SelectItem key="대전" value="대전">대전</SelectItem>
            <SelectItem key="충북" value="충북">충북</SelectItem>
            <SelectItem key="충남" value="충남">충남</SelectItem>
            <SelectItem key="대구" value="대구">대구</SelectItem>
            <SelectItem key="경북" value="경북">경북</SelectItem>
            <SelectItem key="경남" value="경남">경남</SelectItem>
            <SelectItem key="부산" value="부산">부산</SelectItem>
            <SelectItem key="울산" value="울산">울산</SelectItem>
            <SelectItem key="광주" value="광주">광주</SelectItem>
            <SelectItem key="전남" value="전남">전남</SelectItem>
            <SelectItem key="전북" value="전북">전북</SelectItem>
            <SelectItem key="강원" value="강원">강원</SelectItem>
            <SelectItem key="제주" value="제주">제주</SelectItem>
          </Select>
          
          <Checkbox 
            size="sm"
            color="primary" 
            isSelected={isBookmark} 
            onChange={(e) => {
              setIsBookmark(e.target.checked);
              updateBookmarkUrlParam(e.target.checked);
            }}
          >
            북마크
          </Checkbox>
        </div>
        
        {/* 갤러리 카드 */}
        {tabLoading ? (
          <div className="flex justify-center items-center w-full my-4">
            <Spinner variant="wave" size="md" color="primary" />
          </div>
        ) : (
          <>
            <AnimatePresence>
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                className="w-full"
              >
                <GalleryCards 
                  galleries={galleries} 
                  user={user} 
                  bookmarks={bookmarks}
                  toggleBookmark={toggleBookmark}
                  isBookmarked={isBookmarked}
                />
              </motion.div>
            </AnimatePresence>
            
            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-6">
                <Pagination
                  total={totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  showControls
                  color="primary"
                  size="lg"
                />
              </div>
            )}
            
            {/* 데이터가 없을 때 메시지 */}
            {galleries.length === 0 && !loading && !tabLoading && (
              <div className="flex justify-center items-center h-40">
                <p className="text-gray-500">갤러리가 없습니다</p>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* 별점 높은 갤러리 섹션 */}
      <Divider
        orientation="horizontal"
        className="w-[90%] my-4 bg-[#eee]"
      />
      <div className="w-[90%] flex flex-col justify-center items-center mb-24">
        <div className="w-full flex justify-between items-center">
          <h1 className="text-[18px] font-bold">예술랭픽</h1>
        </div>

        <AnimatePresence>
          {!initialized ? (
            <div className="w-full grid grid-cols-3 gap-4 mt-6">
              {Array(3).fill(null).map((_, index) => (
                <div key={`skeleton-rating-${index}`} className="space-y-2">
                  <Skeleton className="w-full h-[100px] rounded-lg" />
                  <Skeleton className="w-2/3 h-4 rounded-lg" />
                  <Skeleton className="w-1/2 h-3 rounded-lg" />
                </div>
              ))}
            </div>
          ) : (
            <motion.div 
              className="w-full"
              initial="hidden"
              animate="visible"
              variants={fadeIn}
            >
              <div className="w-full grid grid-cols-3 gap-4 mt-6">
                {highRatingGalleries.length > 0 ? (
                  highRatingGalleries.map((gallery, index) => (
                    <motion.div 
                      key={gallery.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <Link href={`/galleries/${gallery.id}`}>
                        <img
                          src={gallery.thumbnail || "/placeholder-gallery.jpg"}
                          alt={gallery.name}
                          className="w-full h-[100px] aspect-square object-cover rounded-lg"
                          loading="lazy"
                        />
                        <div className="text-[14px] font-bold line-clamp-1">
                          {gallery.name || "이름 없음"}
                        </div>
                        <div className="text-[13px] text-gray-500 flex items-center justify-start gap-1">
                          <span className="text-[#007AFF]">
                            <FaStar />
                          </span>
                          <span>
                            {gallery.visitor_rating || "0"} ({gallery.blog_review_count || "0"})
                          </span>
                        </div>
                      </Link>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-3 flex justify-center items-center h-40">
                    <p className="text-gray-500">데이터가 없습니다</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function LoadingComponent() {
  return (
    <div className="w-full flex justify-center items-center h-[200px]">
      <Spinner variant="wave" color="primary" />
    </div>
  );
}

export default function GalleryList() {
  return (
    <Suspense fallback={<LoadingComponent />}>
      <GalleryListContent />
    </Suspense>
  );
}
