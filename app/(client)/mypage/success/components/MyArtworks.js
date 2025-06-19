"use client";
import React, { useEffect, useState } from "react";
import { Card, CardBody, Image, Button, Spinner, addToast } from "@heroui/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { FaPlusCircle } from "react-icons/fa";
import { motion } from "framer-motion";
import { PiNotePencil } from "react-icons/pi";
import { FaEdit } from "react-icons/fa";

export default function MyArtworks({ user, profile }) {
  const [artworks, setArtworks] = useState([]);
  const [displayedArtworks, setDisplayedArtworks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const itemsPerPage = 8;
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // 사용자가 로그인한 경우에만 데이터 가져오기
    if (user?.id) {
      fetchUserArtworks();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // 작품이 로드되면 첫 페이지 표시
    if (artworks.length > 0) {
      updateDisplayedArtworks();
    }
  }, [artworks]);

  const fetchUserArtworks = async () => {
    try {
      setIsLoading(true);
      // product 테이블에서 artist_id가 현재 사용자 ID와 일치하는 작품 데이터 가져오기
      const { data, error } = await supabase
        .from('product')
        .select('*')
        .eq('artist_id', user.id);

      if (error) {
        console.log('작품 불러오기 오류:', error);
        return;
      }

      // 데이터가 있으면 setArtworks로 설정
      setArtworks(data || []);
    } catch (error) {
      console.log('오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateDisplayedArtworks = () => {
    const startIndex = 0;
    const endIndex = page * itemsPerPage;
    const itemsToShow = artworks.slice(startIndex, endIndex);
    setDisplayedArtworks(itemsToShow);
    setHasMore(endIndex < artworks.length);
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    
    // setTimeout을 사용하여 상태 업데이트 후 실행되도록 보장
    setTimeout(() => {
      updateDisplayedArtworks();
    }, 0);
  };

  return (
    <div className="grid grid-cols-4 gap-4 w-full">
      {isLoading ? (
        <div className="col-span-4 flex justify-center py-8">
          <Spinner variant="wave" color="primary" />
        </div>
      ) : (
        <>
          {artworks.length > 0 ? (
            displayedArtworks.map((artwork) => (
              <motion.div
                key={artwork.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="col-span-1"
              >
                <Card shadow="none" className="relative">
                  <CardBody className="p-0">
                    <Link href={`/product/${artwork.id}`}>
                      <img
                        src={artwork?.image?.[0] || "/noimage.jpg"}
                        alt={artwork.title}
                        className="object-cover w-full aspect-square"
                      />
                    </Link>
                    
                    {/* 연필 아이콘 추가 */}
                    <div
                      className="absolute bg-white bottom-0 right-0 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        router.push(`/product/edit/${artwork.id}`);
                      }}
                    >
                      <FaEdit className="text-gray-700 text-sm m-1" />
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="col-span-4 text-center py-8 text-gray-500">
              등록된 작품이 없습니다.
            </div>
          )}
        </>
      )}
      
      {!isLoading && artworks.length > 0 && (
        <div className="col-span-4 flex justify-center my-4">
          {hasMore ? (
            <FaPlusCircle
              className="text-gray-500 text-2xl font-bold hover:cursor-pointer hover:scale-110 transition-transform"
              onClick={loadMore}
            />
          ) : (
            <div className="text-gray-500 text-sm">
              더 이상 작품이 없습니다
            </div>
          )}
        </div>
      )}

      <div className="col-span-4 text-center text-[12px] text-gray-500 font-bold mt-4">
        현재등록 {artworks.length}건 / 신규등록 가능 수 {profile?.artist_credit}건
      </div>
      {profile?.isArtistApproval === true && (
        <>
          <Button
            onPress={() => {
              if (profile?.artist_credit === 0) {
                addToast({
                  title: "알림", 
                  description: "결제 후 신규작품을 등록해주세요.",
                  color: "danger"
                });

                setTimeout(() => {
                  router.push("/payment");
                }, 2000);
                return
              }
              router.push("/addProduct");
            }}
            className="col-span-4 bg-black text-white text-[16px] h-12"
          >
            신규작품 등록하기
          </Button>
          {/*
          <button
            type="button"
            tabIndex="0"
            className="z-0 group relative inline-flex items-center justify-center box-border appearance-none select-none whitespace-nowrap font-normal subpixel-antialiased overflow-hidden tap-highlight-transparent data-[pressed=true]:scale-[0.97] outline-none data-[focus-visible=true]:z-10 data-[focus-visible=true]:outline-2 data-[focus-visible=true]:outline-focus data-[focus-visible=true]:outline-offset-2 px-4 min-w-20 gap-2 rounded-medium [&>svg]:max-w-[theme(spacing.8)] transition-transform-colors-opacity motion-reduce:transition-none data-[hover=true]:opacity-hover col-span-4 bg-[#007AFF] text-white text-[16px] h-12"
          >
            결제하기
          </button>
          */}
        </>
      )}
    </div>
  );
}
