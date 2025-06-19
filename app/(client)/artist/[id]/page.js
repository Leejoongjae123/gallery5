"use client";
import React from "react";
import {
  Tabs,
  Tab,
  Card,
  CardBody,
  Button,
  Badge,
  Spinner,
  addToast,
  ToastProvider,
  Divider,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";

import { Icon } from "@iconify/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { FaPlusCircle } from "react-icons/fa";
import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { FiMapPin } from "react-icons/fi";
import { LuClock4 } from "react-icons/lu";
import { IoMdInformationCircleOutline } from "react-icons/io";
import { FaArrowLeft } from "react-icons/fa";
import { LuSend } from "react-icons/lu";
import Image from "next/image";
import { cn } from "@/utils/cn";

export default function App() {
  const [selected, setSelected] = useState("home");
  const [isLoading, setIsLoading] = useState(true);
  const [profiles, setProfiles] = useState(null);
  const [products, setProducts] = useState([]);
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [productsCount, setProductsCount] = useState(8);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const router = useRouter();
  const { id } = useParams();
  const supabase = createClient();

  const [gallery, setGallery] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notificationPage, setNotificationPage] = useState(1);
  const [hasMoreNotifications, setHasMoreNotifications] = useState(true);
  const notificationsPerPage = 3;

  const [reviews, setReviews] = useState([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [hasMoreReviews, setHasMoreReviews] = useState(true);
  const reviewsPerPage = 3;
  const [reviewStats, setReviewStats] = useState({
    average: 0,
    count: 0,
    fiveStars: 0,
    fourStars: 0,
    threeStars: 0,
    twoStars: 0,
    oneStars: 0,
  });

  const [isBookmarked, setIsBookmarked] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", id)
          .eq("isArtistApproval", true)
          .single();

        if (error) {
          console.log("프로필 불러오기 오류:", error);
        } else {
          setProfiles(data);
        }
      } catch (error) {
        console.log("프로필 불러오기 중 오류 발생:", error);
      }
    };
    fetchProfiles();

    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from("product")
          .select("*")
          .eq("artist_id", id);

        if (error) {
          console.log("작품 불러오기 오류:", error);
        } else {
          setProducts(data);
          setDisplayedProducts(data.slice(0, productsCount));
          setHasMoreProducts(data.length > productsCount);
          // 첫 번째 작품을 기본 선택
          if (data && data.length > 0) {
            setSelectedProduct(data[0]);
          }
        }
        setIsLoading(false);
      } catch (error) {
        console.log("작품 불러오기 중 오류 발생:", error);
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [id, productsCount]);

  // 더 보기 버튼 클릭 핸들러
  const handleLoadMore = () => {
    const newCount = productsCount + 8;
    setProductsCount(newCount);
    setDisplayedProducts(products.slice(0, newCount));
    setHasMoreProducts(products.length > newCount);
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
  };

  // 선택된 제품의 첫 번째 이미지 또는 기본 이미지
  const productImage = selectedProduct?.image?.length > 0
    ? selectedProduct.image[0]
    : profiles?.avatar_url || "/noimage.jpg";

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      {isLoading ? (
        <Spinner
          variant="wave"
          color="primary"
          className="w-full h-screen flex justify-center items-center"
        />
      ) : (
        <div className="flex flex-col items-center justify-center">
          {/* 상단 네비게이션 바 */}
          <div className="bg-white flex items-center justify-between w-full">
            <Button
              isIconOnly
              variant="light"
              className="mr-2"
              onPress={() => router.back()}
            >
              <FaArrowLeft className="text-xl" />
            </Button>
            <h2 className="text-lg font-medium"></h2>
          </div>

          {/* 단일 이미지 */}
          <div className="relative w-full flex justify-center items-center">
            
                <div 
                  className="w-full relative cursor-pointer"
                  onClick={() => {
                    if (selectedProduct) {
                      router.push(`/product/${selectedProduct.id}`);
                    }
                  }}
                >
                  <Image
                    src={productImage}
                    alt="작품 이미지"
                    className="w-full h-[40vh] object-cover rounded-b-3xl "
                    width={800}
                    height={600}
                    priority
                    
                  />
                </div>
            
          </div>

          {/* Artist Info */}
          <div className="w-[90%] flex flex-row justify-start my-4 gap-x-6">
            
            <div className="relative w-[52px] h-[52px]">
              <Image
                src={profiles?.avatar_url || "/noimage.jpg"}
                alt="아티스트 이미지"
                className="object-cover rounded-full"
                fill
              />
            </div>
            <div className="flex flex-col">
              <p>{profiles?.artist_name}</p>
              <p>{profiles?.artist_birth}</p>
            </div>
            
          </div>
          <Divider orientation="horizontal" className="w-[90%] my-2" />
          <div className="flex flex-col w-[90%]">
            <div className="flex flex-col gap-y-2">
              <h3 className="font-medium">작가 소개</h3>
              <p className="whitespace-pre-line">{profiles?.artist_intro}</p>
            </div>
          </div>
          <div className="w-[90%] flex flex-col gap-y-2">
            <div className="flex flex-col justify-center">
              <p>{profiles?.bio}</p>
            </div>

            {/* 작품 리스트 */}
            <div className="mt-4 ">
              <div className="flex flex-row justify-between">
              <div className="font-medium mb-2">작품 목록</div>
              <div className="text-gray-500 text-sm underline hover:cursor-pointer" onClick={() => setIsModalOpen(true)}>
                *활동검증자료
              </div>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                {displayedProducts.length > 0 ? (
                  displayedProducts.map((product) => (
                    <div
                      key={product.id}
                      className={`col-span-1 aspect-square mb-2 relative overflow-hidden rounded-lg w-full h-full cursor-pointer ${selectedProduct?.id === product.id ? "ring-2 ring-blue-500" : ""}`}
                      onClick={() => handleProductClick(product)}
                    >
                      <Image
                        src={
                          product.image && product.image.length > 0
                            ? product.image[0]
                            : "/noimage.jpg"
                        }
                        alt={product.title || "작품 이미지"}
                        fill
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))
                ) : (
                  <p className="col-span-2 text-center text-gray-500">
                    등록된 작품이 없습니다.
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center my-4 mb-24">
            {hasMoreProducts ? (
              <FaPlusCircle
                onClick={handleLoadMore}
                className="text-gray-300 text-2xl font-bold hover:cursor-pointer hover:text-gray-400"
              />
            ) : (
              displayedProducts.length > 0 && (
                <p className="text-gray-500 text-sm">
                  더 이상 작품이 없습니다.
                </p>
              )
            )}
          </div>
        </div>
      )}
      <Modal isOpen={isModalOpen} onOpenChange={setIsModalOpen}>
        <ModalContent>
          <ModalHeader>
            <h2>활동 검증 자료</h2>
          </ModalHeader>
          <ModalBody>
            <div className="whitespace-pre-line">
              {profiles?.artist_proof || "활동 검증 자료가 없습니다."}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onPress={() => setIsModalOpen(false)}>닫기</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <style jsx global>{`
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
      `}</style>
    </div>
  );
}
