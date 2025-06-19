"use client";
import React, { useState, useEffect } from "react";
import { Card, CardBody, Divider } from "@heroui/react";
import { FaRegCalendar } from "react-icons/fa";
import { FaRegStar } from "react-icons/fa";
import { FaRegBookmark, FaBookmark } from "react-icons/fa6";
import Link from "next/link";
import { FaPlusCircle } from "react-icons/fa";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import { LuWallet } from "react-icons/lu";
import { FaTag } from "react-icons/fa6";
import { Spinner } from "@heroui/spinner";
import { FaMoneyBillWaveAlt } from "react-icons/fa";
import { FaCalendar } from "react-icons/fa6";
import { IoMdPin } from "react-icons/io";


export default function BookmarkedExhibition({ user, alarmExhibition }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [bookmarkedExhibitions, setBookmarkedExhibitions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [displayCount, setDisplayCount] = useState(5); // 한 번에 표시할 개수
  const supabase = createClient();
  // console.log('user22:', user)

  useEffect(() => {
    // 북마크 데이터를 가져오는 함수
    const fetchBookmarkedExhibitions = async () => {
      try {
        setIsLoading(true);
        
        // supabase에서 북마크 데이터 직접 가져오기
        const { data: bookmarkData, error: bookmarkError } = await supabase
          .from('bookmark')
          .select('*')
          .eq('user_id', user.id);
          
        if (bookmarkError) {
          throw new Error('북마크 데이터를 불러오는데 실패했습니다');
        }
        
        // 북마크된 전시회 정보를 불러옴
        const exhibitionsData = await Promise.all(
          bookmarkData
            .filter(bookmark => bookmark.exhibition_id) // exhibition_id가 null이 아닌 항목만 필터링
            .map(async (bookmark) => {
              // supabase에서 전시회 정보 직접 가져오기
              const { data: exhibition, error: exhibitionError } = await supabase
                .from('exhibition')
                .select('*, gallery(*)')
                .eq('id', bookmark.exhibition_id)
                .single();
                
              if (exhibitionError || !exhibition) {
                return null;
              }
              
              return {
                ...exhibition,
                isBookmarked: true
              };
            })
        );

        // 북마크된 갤러리 정보를 불러옴
        const galleriesData = await Promise.all(
          bookmarkData
            .filter(bookmark => bookmark.gallery_id) // gallery_id가 null이 아닌 항목만 필터링
            .map(async (bookmark) => {
              // supabase에서 갤러리 정보 직접 가져오기
              const { data: gallery, error: galleryError } = await supabase
                .from('gallery')
                .select('*')
                .eq('id', bookmark.gallery_id)
                .single();
                
              if (galleryError || !gallery) {
                return null;
              }
              
              return {
                ...gallery,
                isBookmarked: true,
                type: 'gallery'
              };
            })
        );
        
        // 북마크된 상품 정보를 불러옴
        const productsData = await Promise.all(
          bookmarkData
            .filter(bookmark => bookmark.product_id) // product_id가 null이 아닌 항목만 필터링
            .map(async (bookmark) => {
              // supabase에서 상품 정보 직접 가져오기
              const { data: product, error: productError } = await supabase
                .from('product')
                .select('*, artist_id(*)')
                .eq('id', bookmark.product_id)
                .single();
                
              if (productError || !product) {
                return null;
              }
              
              return {
                ...product,
                isBookmarked: true,
                type: 'product'
              };
            })
        );
        
        // null 값 제거 후 상태 업데이트
        const validExhibitions = exhibitionsData.filter(item => item !== null);
        const validGalleries = galleriesData.filter(item => item !== null);
        const validProducts = productsData.filter(item => item !== null);
        setBookmarkedExhibitions([...validExhibitions, ...validGalleries, ...validProducts]);
      } catch (error) {
        console.log('북마크 가져오기 오류:', error);
        // 오류 발생 시 빈 배열로 설정
        setBookmarkedExhibitions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookmarkedExhibitions();
  }, []);

  // 알림 전시회가 있으면 최상단에 강제 노출 (중복 방지)
  let finalExhibitions = bookmarkedExhibitions;
  if (alarmExhibition) {
    const alreadyExists = bookmarkedExhibitions.some(e => e.id === alarmExhibition.id);
    if (!alreadyExists) {
      finalExhibitions = [alarmExhibition, ...bookmarkedExhibitions];
    } else {
      // 이미 있으면 해당 전시회를 맨 앞으로 이동
      finalExhibitions = [
        ...bookmarkedExhibitions.filter(e => e.id === alarmExhibition.id),
        ...bookmarkedExhibitions.filter(e => e.id !== alarmExhibition.id)
      ];
    }
  }

  // 더보기 버튼 클릭 시 실행되는 함수
  const loadMoreExhibitions = () => {
    if (displayCount + 5 >= bookmarkedExhibitions.length) {
      setDisplayCount(bookmarkedExhibitions.length);
      setHasMore(false);
    } else {
      setDisplayCount(displayCount + 5);
    }
  };

  // 북마크 해제 함수
  const handleUnbookmark = async (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    let filter = { user_id: user.id };
    if (item.type === 'gallery') filter.gallery_id = item.id;
    else if (item.type === 'product') filter.product_id = item.id;
    else filter.exhibition_id = item.id;
    try {
      const { error } = await supabase.from('bookmark').delete().match(filter);
      if (error) throw error;
      setBookmarkedExhibitions(prev => prev.filter(i => {
        if (item.type === 'gallery') return !(i.id === item.id && i.type === 'gallery');
        if (item.type === 'product') return !(i.id === item.id && i.type === 'product');
        return !(i.id === item.id && !i.type);
      }));
    } catch (err) {
      console.log('북마크 해제 오류:', err);
    }
  };

  // 로딩 중일 때 표시할 컴포넌트
  if (isLoading) {
    return <div className="text-center py-4">
      <Spinner variant="wave" color="primary" />
    </div>;
  }

  // 아이템 타입에 따른 링크 URL 생성
  const getItemUrl = (item) => {
    if (item.type === 'gallery') return `/gallery/${item.id}`;
    if (item.type === 'product') return `/product/${item.id}`;
    return `/exhibition/${item.id}`;
  };

  // 가격 형식화 (천 단위 콤마)
  const formatPrice = (price) => {
    return price?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <>
      <div className="flex flex-col items-center gap-4 w-full px-2 justify-center">
        <div className="grid gap-4 w-full justify-center items-center">
          {finalExhibitions.length > 0 ? (
            finalExhibitions.slice(0, displayCount).map((item, index) => (
              <Card key={index} className="w-full relative">
                <Link href={getItemUrl(item)}>
                  <CardBody className="flex gap-4 flex-row justify-center items-center">
                    {/* 북마크 해제 버튼 */}
                    <div className="absolute top-2 right-2 z-10" onClick={e => handleUnbookmark(e, item)}>
                      <FaBookmark className="text-red-500 text-lg bg-gray-300 rounded-full p-1 cursor-pointer font-bold" title="즐겨찾기 해제" />
                    </div>
                    <img
                      src={item.type === 'gallery' 
                        ? item.thumbnail 
                        : item.type === 'product'
                          ? (item.image && item.image.length > 0 ? item.image[0] : "/noimage.jpg")
                          : item.photo}
                      alt={item.type === 'product' ? item.name : item.title || item.contents}
                      className="w-24 h-24 object-cover rounded flex-shrink-0"
                    />
                    <div className="flex flex-col w-full min-w-0">
                      <div className="flex flex-row justify-between items-start">
                        <div className="flex flex-col min-w-0">
                          <div className="text-xs text-gray-500 sm:text-xs text-[11px] max-[390px]:text-[10px]">
                            {item.type === 'gallery' 
                              ? '갤러리' 
                              : item.type === 'product'
                                ? '작품'
                                : '전시회'}
                          </div>
                          <div className="text-lg font-bold truncate sm:text-lg text-[13px] max-[390px]:text-[12px]">
                            {item.type === 'gallery' 
                              ? item.name 
                              : item.type === 'product'
                                ? item.name
                                : item.contents}
                          </div>
                        </div>
                      </div>

                      <Divider
                        orientation="horizontal"
                        className="bg-gray-300"
                      />
                      <div className="text-xs flex flex-col my-2 sm:text-xs text-[11px] max-[390px]:text-[10px]">
                        {item.type === 'gallery' ? (
                          <div className="flex flex-row gap-1 items-center">
                            <IoMdPin className="w-3 h-3 text-[#007AFF]" />
                            {item.address}
                          </div>
                        ) : item.type === 'product' ? (
                          <>
                            <div className="flex flex-row gap-1 items-center ">
                              <FaMoneyBillWaveAlt className="w-3 h-3 text-[#007AFF]" />
                              ₩{formatPrice(item.price)}원
                            </div>
                            
                            
                            {item.artist_id && (
                              <div className="flex flex-row gap-1 items-center">
                                <FaTag className="w-3 h-3 text-[#007AFF]" />
                                {item.artist_id.artist_name || '작가 정보 없음'}
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="flex flex-row gap-1 items-center">
                              <FaCalendar className="w-3 h-3 text-[#007AFF]" />
                              {item.start_date?.substring(0,4)}년 {item.start_date?.substring(4,6)}월 {item.start_date?.substring(6,8)}일 ~ {item.end_date?.substring(0,4)}년 {item.end_date?.substring(4,6)}월 {item.end_date?.substring(6,8)}일
                            </div>
                            <div className="flex flex-row gap-1 items-center">
                              <IoMdPin className="w-3 h-3 text-[#007AFF]" />
                              {item.gallery?.address || '-'}
                            </div>
                            <div className="flex flex-row gap-1 items-center">
                              <FaMoneyBillWaveAlt className="w-3 h-3 text-[#007AFF]" />
                              {formatPrice(item.price)}원
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Link>
              </Card>
            ))
          ) : (
            <div className="text-center py-4">북마크한 항목이 없습니다.</div>
          )}
        </div>
        
        {bookmarkedExhibitions.length > 0 && (
          <div className="flex flex-col items-center my-2">
            {hasMore && displayCount < bookmarkedExhibitions.length ? (
              <FaPlusCircle 
                className="text-gray-500 text-2xl font-bold hover:cursor-pointer" 
                onClick={loadMoreExhibitions}
              />
            ) : displayCount > 0 && !hasMore && bookmarkedExhibitions.length > 5 ? (
              <div className="text-center py-2 text-gray-500">더 이상 표시할 항목이 없습니다.</div>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}
