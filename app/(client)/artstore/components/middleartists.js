"use client";
import { Card, CardBody, Skeleton, CardFooter, Divider } from "@heroui/react";
import { FaRegStar } from "react-icons/fa";
import { FaStar } from "react-icons/fa";
import { FaRegBookmark, FaBookmark } from "react-icons/fa6";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import Link from "next/link";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import Slider from "react-slick";
import "./product-slider.css";

export default function ExhibitionLayout({ exhibitions, user, bookmarks, toggleBookmark, isBookmarked }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [topCards, setTopCards] = useState([]);
  const [carouselItems, setCarouselItems] = useState([]);
  const [bookmarkedProducts, setBookmarkedProducts] = useState({});
  const [artists, setArtists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [banners, setBanners] = useState([]);
  const [bannersLoading, setBannersLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const router = useRouter();
  const supabase = createClient();
  
  // 더미 데이터 - 3개의 캐러셀 아이템
  const dummyItems = [
    { id: 1, name: "전시회 1", contents: "전시회 내용 1", photo: "/noimage.jpg" },
    { id: 2, name: "전시회 2", contents: "전시회 내용 2", photo: "/noimage.jpg" },
    { id: 3, name: "전시회 3", contents: "전시회 내용 3", photo: "/noimage.jpg" }
  ];

  // 로그인한 사용자 정보 가져오기
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUser(session.user);
      }
    };

    fetchUser();
  }, []);
  
  // 배너 데이터 가져오기
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setBannersLoading(true);
        const { data, error } = await supabase.from("banner").select("*");
        
        if (error) {
          console.log('배너 데이터를 불러오는 중 오류 발생:', error);
          return;
        }

        setBanners(data || []);
        setBannersLoading(false);
      } catch (error) {
        console.log('배너 데이터 로딩 오류:', error);
        setBannersLoading(false);
      }
    };

    fetchBanners();
  }, []);
  
  
  // 작가 데이터 가져오기
  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('isArtist', true)
          .eq('isArtistApproval', true)
          .limit(20);

        if (error) {
          console.log('작가 데이터를 불러오는 중 오류 발생:', error);
          return;
        }

        setArtists(data || []);
        setIsLoading(false);
      } catch (error) {
        console.log('작가 데이터 로딩 오류:', error);
        setIsLoading(false);
      }
    };

    fetchArtists();
  }, []);
  
  // 상품 데이터 가져오기
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setProductsLoading(true);
        // 1. 승인된 작가 id 리스트 조회
        const { data: approvedArtists, error: artistError } = await supabase
          .from('profiles')
          .select('id')
          .eq('isArtist', true)
          .eq('isArtistApproval', true);
        if (artistError) {
          console.log('승인 작가 조회 오류:', artistError);
          setProducts([]);
          setProductsLoading(false);
          return;
        }
        const approvedArtistIds = (approvedArtists || []).map(a => a.id);
        // 2. 모든 상품 불러오기
        const { data, error } = await supabase
          .from('product')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) {
          console.log('상품 데이터를 불러오는 중 오류 발생:', error);
          setProducts([]);
          setProductsLoading(false);
          return;
        }
        // 3. 승인된 작가의 상품만 남김
        setProducts((data || []).filter(item => approvedArtistIds.includes(item.artist_id)));
        setProductsLoading(false);
      } catch (error) {
        console.log('상품 데이터 로딩 오류:', error);
        setProducts([]);
        setProductsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // 북마크 데이터 가져오기
  useEffect(() => {
    const fetchBookmarks = async () => {
      // 로그인한 사용자만 북마크 정보를 가져옴
      if (!currentUser) return;
      
      try {
        const { data, error } = await supabase
          .from('bookmark')
          .select('*')
          .eq('user_id', currentUser.id);

        if (error) {
          console.log('북마크 데이터를 불러오는 중 오류 발생:', error);
          return;
        }

        // 북마크된 제품들을 객체로 변환 (product_id를 키로, bookmark.id를 값으로 저장)
        const bookmarkMap = {};
        data.forEach(bookmark => {
          bookmarkMap[bookmark.product_id] = bookmark.id;
        });

        setBookmarkedProducts(bookmarkMap);
      } catch (error) {
        console.log('북마크 데이터 로딩 오류:', error);
      }
    };

    fetchBookmarks();
  }, [currentUser]);
  
  // 상단 카드와 캐러셀 아이템 설정
  useEffect(() => {
    if (banners && banners.length > 0) {
      // 배너 데이터가 있으면 사용
      setCarouselItems(banners);
    } else if (exhibitions && exhibitions.length) {
      // 배너 데이터가 없고 exhibitions 데이터가 있으면 사용
      setCarouselItems(exhibitions);
    } else {
      // 둘 다 없으면 더미 데이터 사용
      setCarouselItems(dummyItems);
    }
  }, [exhibitions, banners]);

  // 슬라이더 설정
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: true,
    adaptiveHeight: false,
    
    beforeChange: (oldIndex, newIndex) => {
      setCurrentSlide(newIndex);
    },
    customPaging: (i) => (
      <div
        className={`w-2 h-2 mx-1 rounded-full ${
          i === currentSlide ? "bg-[#007AFF]" : "bg-white"
        }`}
      />
    ),
    dotsClass: "slick-dots custom-dots"
  };

  // 커스텀 화살표 컴포넌트
  const PrevArrow = (props) => {
    const { className, style, onClick } = props;
    return (
      <div
        className={className}
        style={{ ...style, display: "block", left: "10px", zIndex: 1 }}
        onClick={onClick}
      >
        <FaChevronLeft className="text-white text-xl" />
      </div>
    );
  };

  const NextArrow = (props) => {
    const { className, style, onClick } = props;
    return (
      <div
        className={className}
        style={{ ...style, display: "block", right: "10px", zIndex: 1 }}
        onClick={onClick}
      >
        <FaChevronRight className="text-white text-xl" />
      </div>
    );
  };

  // 북마크 토글 함수
  const toggleProductBookmark = async (productId) => {
    // 로그인한 사용자만 북마크 기능 사용 가능
    if (!currentUser) {
      router.push('/mypage?redirect_to=/artstore');
      return;
    }

    try {
      if (bookmarkedProducts[productId]) {
        // 이미 북마크가 있으면 삭제
        const { error } = await supabase
          .from('bookmark')
          .delete()
          .eq('id', bookmarkedProducts[productId]);

        if (error) {
          console.log('북마크 삭제 오류:', error);
          return;
        }

        // 북마크 상태 업데이트
        const updatedBookmarks = { ...bookmarkedProducts };
        delete updatedBookmarks[productId];
        setBookmarkedProducts(updatedBookmarks);
      } else {
        // 북마크가 없으면 새로 추가
        const { data, error } = await supabase
          .from('bookmark')
          .insert([
            { user_id: currentUser.id, product_id: productId }
          ])
          .select();

        if (error) {
          console.log('북마크 추가 오류:', error);
          return;
        }

        // 북마크 상태 업데이트
        setBookmarkedProducts({
          ...bookmarkedProducts,
          [productId]: data[0].id
        });
      }
    } catch (error) {
      console.log('북마크 토글 중 오류 발생:', error);
    }
  };

  // 로딩 상태에서 사용할 스켈레톤 UI 컴포넌트
  const SkeletonCard = () => (
    <div className="w-full h-[180px]">
      <Card className="w-full space-y-5 p-4" radius="lg" shadow="none">
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
        </div>
      </Card>
    </div>
  );

  // 제품 스켈레톤 UI 컴포넌트
  const ProductSkeletonCard = () => (
    <Card shadow="none" classNames={{base: 'gap-x-2 w-full',body: 'gap-x-2'}}>
      <CardBody className="flex flex-row justify-center items-center">
        <Skeleton className="rounded-lg h-[80px] w-[80px]" />
        <div className="flex flex-col flex-grow ml-2 gap-2">
          <Skeleton className="rounded-lg h-4 w-3/4" />
          <Skeleton className="rounded-lg h-4 w-1/2" />
          <Skeleton className="rounded-lg h-4 w-1/3" />
        </div>
        <Skeleton className="rounded-lg h-[30px] w-[30px]" />
      </CardBody>
    </Card>
  );

  // 전시회 카드 컴포넌트
  const ExhibitionCard = useCallback(({ exhibition }) => (
    <Link href={`/exhibition/${exhibition.id}`} className="block w-full">
      <Card className="h-[240px] overflow-hidden shadow hover:shadow-lg transition-shadow rounded-xl">
        <div className="relative">
          <img
            src={exhibition.photo || "/images/noimage.jpg"}
            alt={exhibition.name || "전시회 이미지"}
            className="h-[140px] w-full object-cover"
          />
        </div>
        <CardBody className="flex flex-col justify-between h-[100px] p-3">
          <div className="text-[16px] font-bold line-clamp-1">{exhibition.contents}</div>
          <div className="text-[10px]">
            <p className="line-clamp-1 text-[#BDBDBD]">
              {exhibition.gallery?.address || "주소 정보 없음"}
            </p>
          </div>
          <div className="flex text-sm justify-between items-center">
            <div className="rounded-md text-[10px] text-[#BDBDBD]">평균별점</div>
            <div className="flex items-center gap-x-1">
              <span className="text-[10px] text-[#007AFF]">{exhibition.review_average || "1.0"}</span>
              <FaStar className="text-[#007AFF]" />
            </div>
          </div>
        </CardBody>
      </Card>
    </Link>
  ), []);

  // 이미지만 있는 간단한 캐러셀 아이템 컴포넌트
  const SimpleCarouselItem = useCallback(({ item }) => {
    // 배너 또는 전시회 데이터에 따라 적절한 필드 사용
    const imageUrl = item.url || item.photo || "/noimage.jpg";
    const altText = item.title || item.name || "이미지";
    
    return (
      <div className="w-full relative">
        <img
          src={imageUrl}
          alt={altText}
          className="w-full aspect-[335/148] object-contain bg-white rounded-xl"
        />
      </div>
    );
  }, []);

  function getWebpImageUrl(url) {
    if (!url) return "/noimage.jpg";
    if (url.endsWith(".webp")) return url;
    return url.replace(/\.(jpg|jpeg|png)$/i, ".webp");
  }

  console.log('MiddleArtists products:', products);

  return (
    <div className="w-full max-w-full overflow-hidden my-4">
      <div className="w-full">
        {/* 상단 3개 카드 - 작가 프로필 */}
        <div className="w-full overflow-x-auto scrollbar-hide py-2">
          <div className="flex flex-row gap-4">
            {isLoading ? (
              Array(5).fill().map((_, index) => (
                <div key={`skeleton-${index}`} className="min-w-[100px]">
                  <SkeletonCard />
                </div>
              ))
            ) : (
              artists.map((artist, index) => (
                <div key={`artist-${artist.id}`} className="min-w-[100px]">
                  <Card 
                    className="min-w-[100px] m-1" 
                    shadow="sm" 
                    radius="lg"
                    isPressable
                    onPress={() => router.push(`/artist/${artist.id}`)}
                  >
                    <CardBody className="p-0 relative w-full aspect-square">
                      <Image 
                        src={artist.avatar_url || "/noimage.jpg"} 
                        alt="아티스트 이미지" 
                        className="w-full h-full object-cover bg-white" 
                        fill 
                      />
                    </CardBody>
                    <CardFooter className="flex justify-center">  
                      <div className="flex flex-row items-center justify-between w-full">
                        <p className="text-[14px] font-medium line-clamp-1 text-[#606060] text-center w-full">
                          {artist.artist_name || artist.full_name || "작가이름"}
                        </p>
                      </div>
                    </CardFooter>
                  </Card>
                </div>
              ))
            )}
          </div>
        </div>
        
        <Divider orientation="horizontal" className="my-4" />
        <div className="w-full">
          {productsLoading ? (
            // 상품 로딩 중일 때 스켈레톤 UI 표시
            Array(5).fill().map((_, index) => (
              <div key={`product-skeleton-${index}`}>
                <ProductSkeletonCard />
                {index < 4 && <Divider orientation="horizontal" className="my-2" />}
              </div>
            ))
          ) : (
            products.length > 0 ? (
              products.map((product, index) => (
                <div key={`product-${product.id}`}>
                  <Card 
                    shadow="none" 
                    classNames={{base: 'gap-x-2 w-full',body: 'gap-x-2'}}
                    isPressable
                    onPress={() => router.push(`/product/${product.id}`)}
                  >
                    <CardBody className="flex flex-row justify-center items-center ">
                      <div className="w-[80px] h-[80px] relative">
                        <Image src={getWebpImageUrl(product.image[0])} alt="product image" className="w-full h-full object-contain bg-white" fill />
                      </div>
                      <div className="flex flex-col flex-grow ml-2">
                        <p className="text-[14px] font-medium line-clamp-1 text-[#606060]">{product.name}</p>
                        <p className="text-[14px] font-medium line-clamp-1 text-[#606060]">{product.size} </p>
                        <p className="text-[14px] font-medium line-clamp-1 text-[#606060]">₩{product.price?.toLocaleString()}</p>
                        
                      </div>
                      <div className="items-center bg-gray-300 rounded-lg p-2 h-[30px] w-[30px] flex justify-center items-center">
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            toggleProductBookmark(product.id);
                          }}
                          className="cursor-pointer"
                        >
                          {!!bookmarkedProducts[product.id] ? (
                            <FaBookmark className="text-red-500 h-6 w-6 p-1.5 opacity-80 rounded-lg" />
                          ) : (
                            <FaRegBookmark className="text-white h-6 w-6 p-1.5 opacity-80 rounded-lg" />
                          )}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                  {index < products.length - 1 && <Divider orientation="horizontal" className="my-2" />}
                </div>
              ))
            ) : (
              <div className="w-full text-center text-gray-400 py-8">등록된 작품이 없습니다.</div>
            )
          )}
        </div>
      </div>
    </div>
  );
} 