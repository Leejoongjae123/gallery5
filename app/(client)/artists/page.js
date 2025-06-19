"use client";
import React from "react";
import { Button, Skeleton } from "@heroui/react";
import { FaChevronLeft } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { Card, CardBody, Divider, CardFooter } from "@heroui/react";
import { FaPlusCircle } from "react-icons/fa";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useState, useEffect } from "react";
import { FaArrowLeft } from "react-icons/fa";
import Image from "next/image";
export default function ArtistList() {
  const [visibleCount, setVisibleCount] = useState(12);
  const [allLoaded, setAllLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();
  const [artists, setArtists] = useState([]);
  const [visibleArtists, setVisibleArtists] = useState([]);

  const getArtists = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('isArtist', true)
        .eq('isArtistApproval', true);
      
      if (error) {
        console.error('아티스트 데이터를 불러오는 중 오류 발생:', error);
        return;
      }

      setArtists(data || []);
      setVisibleArtists((data || []).slice(0, visibleCount));
      setAllLoaded((data || []).length <= visibleCount);
      setIsLoading(false);
    } catch (error) {
      console.error('데이터 로딩 오류:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getArtists();
  }, []);

  useEffect(() => {
    setVisibleArtists(artists.slice(0, visibleCount));
    setAllLoaded(artists.length <= visibleCount);
  }, [visibleCount, artists]);

  const loadMore = () => {
    const newVisibleCount = visibleCount + 12;
    setVisibleCount(newVisibleCount);
  };

  return (
    <div className="flex flex-col items-center justify-center">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center w-full h-full gap-y-6 mt-12">
          {[...Array(5)].map((_, index) => (
            <div
              key={index}
              className="max-w-[300px] w-full flex items-center gap-3"
            >
              <div>
                <Skeleton className="flex rounded-full w-12 h-12" />
              </div>
              <div className="w-full flex flex-col gap-2">
                <Skeleton className="h-3 w-3/5 rounded-lg" />
                <Skeleton className="h-3 w-4/5 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="bg-white flex items-center w-[90%] justify-between">
            <Button
              isIconOnly
              variant="light"
              className="mr-2"
              onPress={() => router.back()}
            >
              <FaArrowLeft className="text-xl" />
            </Button>
            <h2 className="text-lg font-bold text-center flex-grow">아티스트</h2>
            <div className="w-10"></div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4 w-[90%] mt-4">
            {visibleArtists.map((artist, index) => (
              <Card
                key={`artist-card-${index}`}
                classNames={{ base: "m-1" }}
                
                shadow="sm"
                radius="lg"
                isPressable
                onPress={() => router.push(`/artist/${artist.id}`)}
                className="hover:cursor-pointer"
              >
                <CardBody className="p-0">
                  <div className="relative w-full aspect-square">
                    <Image
                      src={artist.avatar_url || "/noimage.jpg"}
                      alt="아티스트 이미지"
                      className="object-cover rounded-2xl"
                      fill
                    />
                  </div>
                 <div className="flex flex-col items-center justify-center py-1">
                    <div className="text-sm font-medium leading-tight text-center line-clamp-2 break-keep">
                      {artist.artist_name || '이름 없음'}
                    </div>
                 </div>
                </CardBody>
              </Card>
            ))}
          </div>
          
          {!allLoaded && (
            <div className="flex justify-center my-4">
              <div onClick={loadMore} className="mb-4">
                <FaPlusCircle 
                  className="text-gray-500 text-2xl font-bold hover:cursor-pointer"
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
