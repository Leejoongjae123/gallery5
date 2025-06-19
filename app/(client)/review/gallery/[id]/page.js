"use client";
import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  CardBody,
  Divider,
  Image,
  Textarea,
  Skeleton,
} from "@heroui/react";
import { FaChevronLeft } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { IoClose } from "react-icons/io5";
import { FaRegCalendar } from "react-icons/fa";
import { IoMdPin } from "react-icons/io";
import { FaRegStar } from "react-icons/fa";
import { FaRegBookmark } from "react-icons/fa6";
import Star from "./components/Star";
import { createClient } from "@/utils/supabase/client";
import { useParams } from "next/navigation";
import { addToast, ToastProvider } from "@heroui/react";

export default function page() {
  const [selectedFeelings, setSelectedFeelings] = useState([]);
  const { id } = useParams();
  const [gallery, setGallery] = useState(null);
  const [description, setDescription] = useState("");
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [rating, setRating] = React.useState(0);
  const [hoverRating, setHoverRating] = React.useState(0);
  const [user, setUser] = useState(null);
  const getUser = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (!data.user) {
      router.push("/mypage?redirect_to=/review/gallery/" + id);
    }
    if (error) {
      console.log("Error fetching user:", error);
    } else {
      setUser(data.user);
    }
  };

  useEffect(() => {
    getUser();
  }, []);

  const fetchGallery = async () => {
    const { data, error } = await supabase
      .from("gallery")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      console.log("Error fetching gallery:", error);
    } else {
      setGallery(data);
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchGallery();
  }, [id]);

  const handleFeelingClick = (feeling) => {
    if (selectedFeelings.includes(feeling)) {
      setSelectedFeelings(selectedFeelings.filter((item) => item !== feeling));
    } else {
      setSelectedFeelings([...selectedFeelings, feeling]);
    }
  };

  const router = useRouter();
  console.log("feeling:", selectedFeelings);

  const handleReviewSubmit = async () => {
    // 먼저 이 사용자가 이 갤러리에 대한 리뷰를 이미 작성했는지 확인
    const { data: existingReview, error: checkError } = await supabase
      .from("gallery_review")
      .select("*")
      .eq("gallery_id", id)
      .eq("user_id", user.id)
      .single();

    if (checkError) {
      console.log("기존 리뷰 확인 중 오류 발생:", checkError);
    }

    // 이미 리뷰가 존재하는 경우
    if (existingReview && existingReview.length > 0) {
      addToast({
        title: "리뷰 작성 불가",
        description: "이미 작성한 리뷰가 있어서 추가 작성은 불가합니다.",
        color: "danger",
      });
      router.push("/");
      return;
    }

    const maskedName = user.user_metadata?.name
      ? user.user_metadata.name.length > 1
        ? user.user_metadata.name[0] + '**'
        : user.user_metadata.name
      : user.email;
    // 리뷰가 존재하지 않는 경우 새로운 리뷰 작성
    const { data, error } = await supabase.from("gallery_review").insert({
      gallery_id: id,
      category: selectedFeelings,
      rating: rating,
      description: description,
      name: maskedName,
      user_id: user.id,
    });
    if (error) {
      console.log("Error submitting review:", error);
    } else {
      console.log("Review submitted successfully");
      addToast({
        title: "리뷰 작성 완료",
        description: "리뷰가 성공적으로 작성되었습니다.",
        color: "success",
      });
    }
    router.push("/");
  };

  return (
    <div className="flex flex-col items-center justify-center gap-y-4 w-full px-4 ">
      {user && (
        <>
          <div className="bg-white flex items-center w-full justify-between">
            <Button
              isIconOnly
              variant="light"
              className="mr-2"
              onPress={() => router.back()}
            >
              <IoClose className="text-xl" />
            </Button>
            <h2 className="text-lg font-bold text-center flex-grow">리뷰</h2>
            <div className="w-10"></div>
          </div>
          <div className="w-full flex flex-col gap-4 font-bold text-[20px] text-start">
            여기는 어떠셨나요?
          </div>
          {isLoading ? (
            <div className="max-w-[300px] w-full flex items-center gap-3 justify-center">
              <div>
                <Skeleton className="flex rounded-full w-12 h-12" />
              </div>
              <div className="w-full flex flex-col gap-2">
                <Skeleton className="h-3 w-3/5 rounded-lg" />
                <Skeleton className="h-3 w-full rounded-lg" />
              </div>
            </div>
          ) : (
            <Card className="w-full m-0">
              <CardBody className="flex gap-4 flex-row justify-center items-center">
                <img
                  src={gallery?.thumbnail||"/images/noimage.jpg"}
                  alt={gallery?.title}
                  className="w-24 h-24 object-cover rounded"
                />
                <div className="flex flex-col w-full">
                  <div className="flex flex-row justify-between items-start">
                    <div className="flex flex-col">
                      <div className="text-lg font-bold">{gallery?.name}</div>
                    </div>
                  </div>

                  <Divider orientation="horizontal" className=" bg-gray-300" />
                  <div className="text-xs flex flex-col my-2">
                    {gallery.start_date ? (
                      <>
                        <div className="flex flex-row gap-1">
                          <img
                            className="w-4 h-4"
                            src="/exhibition/미니달력.svg"
                            alt=""
                          />
                          {gallery?.start_date?.slice(0, 10)} ~{" "}
                          {gallery?.end_date?.slice(0, 10)}
                        </div>
                        <div className="flex flex-row gap-1">
                          <img
                            className="w-4 h-4"
                            src="/exhibition/미니지도.svg"
                            alt=""
                          />
                          {gallery?.address}
                        </div>
                        <div className="flex flex-row gap-1">
                          <img
                            className="w-4 h-4"
                            src="/exhibition/미니가격.png"
                            alt=""
                          />
                          {gallery?.price}
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-row gap-1">
                        <img
                          className="w-4 h-4"
                          src="/exhibition/미니지도.svg"
                          alt=""
                        />
                        {gallery?.address}
                      </div>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
          <div className="w-full flex flex-col gap-4">
            <Star
              rating={rating}
              hoverRating={hoverRating}
              setRating={setRating}
              setHoverRating={setHoverRating}
            />
          </div>
          {/* <div className="w-full flex flex-col gap-4 font-bold text-xl text-center">
            어떤 부분이 느껴졌나요?
          </div> */}
          {/* <div className="w-full flex flex-wrap gap-2 justify-center mb-6">
            {[
              "쾌적함",
              "프라이빗",
              "다양한경험",
              "친절",
              "애견동반",
              "주차편리",
              "높은수준",
              "시끌벅적",
              "별로",
            ].map((feeling) => (
              <Button
                key={feeling}
                variant="bordered"
                className={`${selectedFeelings.includes(feeling) ? "font-bold border-2 border-primary text-primary" : "border border-gray-300"}`}
                onPress={() => handleFeelingClick(feeling)}
              >
                {feeling}
              </Button>
            ))}
          </div> */}
          <div className="w-full flex flex-col gap-4 font-bold text-[15px] text-start">
            의견을 남겨주세요(선택)
          </div>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="내용을 작성해주세요"
            variant="bordered"
          />
          <div className="w-full flex flex-col gap-4 font-bold text-xl text-center mb-24">
            <Button
              color=""
              className="w-full font-bold bg-black text-white"
              onPress={handleReviewSubmit}
            >
              리뷰 작성완료
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
