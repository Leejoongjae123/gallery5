"use client";
import { Card, CardBody, Divider, Skeleton, Spinner } from "@heroui/react";
import { FaRegCalendar } from "react-icons/fa";
import { IoMdPin } from "react-icons/io";
import { FaRegStar } from "react-icons/fa";
import { FaRegBookmark, FaBookmark } from "react-icons/fa6";
import Link from "next/link";
import { FaPlusCircle } from "react-icons/fa";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { addToast } from "@heroui/react";
import Image from "next/image";

export default function GalleryCards({ selectedTab, user }) {
  const [gallerys, setGallerys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 1;
  const supabase = createClient();

  const getGallerys = useCallback(
    async (pageNum = 1, append = false) => {
      try {
        setLoading(true);

        // 페이지네이션을 위한 범위 계산
        const from = (pageNum - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        // 기본 쿼리 시작
        let query = supabase.from("gallery").select("*", { count: "exact" });

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
          setGallerys((prev) => [...prev, ...(data || [])]);
        } else {
          setGallerys(data || []);
        }
      } finally {
        setLoading(false);
      }
    },
    [selectedTab, supabase, PAGE_SIZE]
  );

  // 더 많은 데이터 로드하는 함수
  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;

    const nextPage = page + 1;
    setPage(nextPage);
    getGallerys(nextPage, true);
  }, [loading, hasMore, page, getGallerys]);

  useEffect(() => {
    // 탭이 변경되면 페이지를 1로 리셋하고 데이터를 다시 불러옵니다
    setPage(1);
    getGallerys(1);
  }, [getGallerys]);

  // 실제 데이터가 없을 경우 대비 기본 데이터 (실제 데이터가 있으면 사용하지 않음)
  const defaultExhibitions = Array(5).fill({
    title: "수원 갤러리",
    subtitle: "전국 최대 규모 갤러리",
    date: "2024.03.15 - 2024.04.15",
    location: "서울 강남구",
    review: "4.0(225)",
  });

  return (
    <div className="flex flex-col items-center gap-4 w-full justify-center">
      <div className="grid gap-4 w-full justify-items-center">
        {loading && page === 1
          ? // 처음 로딩 중 스켈레톤 UI 표시
            <div className="w-full max-w-[600px] flex items-center gap-3 justify-center mx-auto">
              <div>
                <Skeleton className="flex rounded-full w-12 h-12" />
              </div>
              <div className="w-full flex flex-col gap-2">
                <Skeleton className="h-3 w-36 rounded-lg" />
                <Skeleton className="h-3 w-24 rounded-lg" />
              </div>
            </div>
          : // 데이터 로드 완료 후 실제 갤러리 목록 표시
            gallerys.map((gallery, index) => (
              <Card key={index} className="w-full ">
                <Link
                  href={`/galleries/${gallery.id || index + 1}`}
                  className="w-full"
                >
                  <CardBody className="flex gap-4 flex-row w-full h-full">
                    <img
                      src={
                        gallery.thumbnail
                          ? gallery.thumbnail.includes('/thumbnails/')
                            ? gallery.thumbnail
                            : gallery.thumbnail.replace('/gallery/', '/gallery/thumbnails/')
                          : "/images/noimage.jpg"
                      }
                      alt={gallery.name || "갤러리 이미지"}
                      className="w-24 h-24 object-cover rounded"
                    />
                    <div className="flex flex-col w-full">
                      <div className="flex flex-col">
                        <div className="text-lg font-bold">
                          {gallery.name || ""}
                        </div>
                      </div>

                      <Divider
                        orientation="horizontal"
                        className=" bg-gray-300"
                      />
                      <div className="text-xs flex flex-col my-2">
                        <div className="flex flex-row gap-1">
                          <Image src="/exhibition/미니지도.svg" alt="calendar" width={15} height={15} />
                          {gallery.address || "서울 강남구"}
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Link>
              </Card>
            ))}

        {/* 추가 데이터 로딩 중 표시 */}
        {loading && page > 1 && (
          <div className="flex justify-center w-full py-4">
            <Spinner variant="wave" size="lg" color="danger" />
          </div>
        )}
      </div>

      {/* 플러스 버튼을 항상 중앙에 고정하고 마진 추가 */}
      {hasMore ? (
        <div className="flex justify-center w-full my-1 mb-4">
          <FaPlusCircle
            className="text-gray-500 text-2xl font-bold hover:cursor-pointer hover:scale-110 transition-transform"
            onClick={loadMore}
          />
        </div>
      ) : (
        <div className="text-gray-500 text-sm my-8 text-center">
          모든 갤러리를 불러왔습니다
        </div>
      )}
    </div>
  );
}
