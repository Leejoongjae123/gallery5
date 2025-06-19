"use client";

import React, { useState, useEffect } from "react";
import { ExhibitionList } from "../components/exhibition-list";
import { ExhibitionDetail } from "../components/exhibition-detail";
import { Button, Input, Pagination, Switch, Textarea,Spinner} from "@heroui/react";
import { Icon } from "@iconify/react";
import { createClient } from "@/utils/supabase/client";
import { addToast } from "@heroui/react";
import useUserInfoStore from "../store/userInfo";

import dynamic from "next/dynamic";

import { v4 as uuidv4 } from "uuid";
import DatePicker from "react-datepicker";
import { CalendarIcon } from "lucide-react";
import { format, parse } from "date-fns";
import { ko } from "date-fns/locale";

const FroalaEditor = dynamic(
  () => import("@/app/(admin)/admin/components/Froala"),
  {
    ssr: false,
    loading: () => <Spinner color='primary' variant='wave' />,
  }
);

// 날짜 범위를 포맷팅하는 함수
const formatDateRange = (startDate, endDate) => {
  try {
    // ISO 문자열에서 Date 객체 생성
    const start = new Date(startDate);
    const end = new Date(endDate);

    // 유효한 날짜인지 확인
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return `${startDate} ~ ${endDate}`;
    }

    // YYYY.MM.DD 형식으로 포맷팅
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}.${month}.${day}`;
    };

    return `${formatDate(start)} ~ ${formatDate(end)}`;
  } catch (error) {
    console.log("날짜 포맷팅 오류:", error);
    return `${startDate} ~ ${endDate}`;
  }
};

// ISO 날짜를 YYYY-MM-DD 형식으로 변환하는 함수
const formatDateForInput = (isoDate) => {
  if (!isoDate) return '';
  try {
    const date = new Date(isoDate);
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.log("날짜 변환 오류:", error);
    return '';
  }
};

export default function Exhibition() {
  const { userInfo } = useUserInfoStore();
  const supabase = createClient();
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [exhibitions, setExhibitions] = useState([]);
  const [selectedExhibition, setSelectedExhibition] = useState(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [selectedKey, setSelectedKey] = useState(new Set([]));
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [galleryInfo, setGalleryInfo] = useState(null);
  const itemsPerPage = 5;
  const [startDate, setStartDate] = useState(() => {
    const s = selectedExhibition?.start_date;
    return s ? parse(s, "yyyyMMdd", new Date()) : null;
  });
  const [endDate, setEndDate] = useState(() => {
    const e = selectedExhibition?.end_date;
    return e ? parse(e, "yyyyMMdd", new Date()) : null;
  });
  const [price, setPrice] = useState(selectedExhibition?.price || 0);
  const [reloadTimeout, setReloadTimeout] = useState(null);

  // 1. userInfo가 준비된 후에만 fetchAll 실행
  useEffect(() => {
    if (!userInfo?.url) return;
    const fetchAll = async () => {
      setIsLoading(true);
      // galleryInfo fetch
      let galleryData = null;
      try {
        const { data, error } = await supabase
          .from("gallery")
          .select("*")
          .eq("url", userInfo.url)
          .single();
        if (error) throw error;
        galleryData = data;
        setGalleryInfo(data);
      } catch (e) {
        setGalleryInfo(null);
      }
      setIsLoading(false);
      setIsReady(true);
    };
    fetchAll();
  }, [userInfo]);

  // 2. 페이지/검색어 변경 시에는 userInfo가 준비된 상태에서만 fetch
  useEffect(() => {
    if (!userInfo?.url) return;
    const fetchExhibitions = async () => {
      setIsLoading(true);
      try {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage - 1;
        let query = supabase
          .from("exhibition")
          .select("*", { count: "exact" })
          .range(start, end)
          .order("created_at", { ascending: false })
          .eq("naver_gallery_url", userInfo.url);
        if (searchTerm) {
          query = query.or(
            `name.ilike.%${searchTerm}%, contents.ilike.%${searchTerm}%, add_info.ilike.%${searchTerm}%`
          );
        }
        const { data, error, count } = await query;
        if (error) throw error;
        setExhibitions(data || []);
        setTotalPages(Math.ceil((count || 0) / itemsPerPage));
      } catch (e) {
        setExhibitions([]);
      }
      setIsLoading(false);
    };
    fetchExhibitions();
  }, [currentPage, searchTerm, userInfo]);

  useEffect(() => {
    if (selectedExhibition) {
      setStartDate(selectedExhibition.start_date ? parse(selectedExhibition.start_date, "yyyyMMdd", new Date()) : null);
      setEndDate(selectedExhibition.end_date ? parse(selectedExhibition.end_date, "yyyyMMdd", new Date()) : null);
      setPrice(selectedExhibition.price || 0);
    }
  }, [selectedExhibition]);

  useEffect(() => {
    if (!userInfo?.url) {
      // 3초(3000ms) 동안 userInfo가 세팅되지 않으면 강제 새로고침
      const timeout = setTimeout(() => {
        window.location.reload();
      }, 3000);
      setReloadTimeout(timeout);
    } else {
      // userInfo가 세팅되면 타이머 해제
      if (reloadTimeout) clearTimeout(reloadTimeout);
    }
    // 언마운트 시 타이머 해제
    return () => {
      if (reloadTimeout) clearTimeout(reloadTimeout);
    };
  }, [userInfo]);

  if (!isReady) {
    return (
      <div className="w-full h-full flex flex-col gap-4 py-20">
        <div className="w-full max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">전시 관리</h1>
          </div>
          <div className="flex flex-col items-center justify-center min-h-[300px]">
            <Spinner color="primary" />
            <div className="mt-4">데이터를 불러오는 중...</div>
          </div>
        </div>
      </div>
    );
  }

  // 신규 전시회 생성 핸들러
  const handleNewExhibition = () => {
    const galleryUrl = userInfo?.url || galleryInfo?.url || "";
    const galleryName = userInfo?.name || galleryInfo?.name || "";

    if (!galleryUrl || !galleryName) {
      addToast({
        title: "갤러리 정보 로딩 중",
        description: "잠시 후 다시 시도해 주세요.",
        color: "warning",
      });
      return;
    }
    setSelectedExhibition({
      name: "",
      contents: "",
      photo: "",
      start_date: "",
      end_date: "",
      working_hour: "",
      off_date: "",
      add_info: "",
      homepage_url: "",
      isFree: false,
      isRecommended: false,
      naver_gallery_url: galleryUrl,
      gallery_name: galleryName,
      price: 0,
    });
    setIsCreatingNew(true);
    setSelectedKey(new Set([]));
  };

  // 취소 핸들러
  const handleCancel = () => {
    if (isCreatingNew) {
      setIsCreatingNew(false);
    }
  };
  console.log("userInfo", userInfo);
  // 신규 전시회 저장 핸들러
  const handleSaveNew = async (newExhibition) => {
    try {
      // 날짜 값 처리 - 반드시 end_date도 포함되도록 확인
      const startDate = newExhibition.start_date || null;
      const endDate = newExhibition.end_date || null;

      console.log("신규 Supabase로 전송할 날짜 데이터:", {
        start_date: startDate,
        end_date: endDate,
      });

      // Supabase에 새 전시회 데이터 저장 - end_date 확인
      const { data, error } = await supabase
        .from("exhibition")
        .insert([
          {
            name: newExhibition.name || "",
            contents: newExhibition.contents || "",
            photo: newExhibition.photo || "",
            start_date: startDate,
            end_date: endDate, // 반드시 포함
            working_hour: newExhibition.working_hour || "",
            off_date: newExhibition.off_date || "",
            add_info: newExhibition.add_info || "",
            homepage_url: newExhibition.homepage_url || "",
            isFree: newExhibition.isFree || false,
            isRecommended: newExhibition.isRecommended || false,
            naver_gallery_url: userInfo.url,
            price: newExhibition.price || 0,
          },
        ])
        .select();

      if (error) throw error;

      // 저장된 데이터로 상태 업데이트
      const savedExhibition = data[0];
      setIsCreatingNew(false);
      setSelectedExhibition(savedExhibition);
      setSelectedKey(new Set([savedExhibition.id.toString()]));

      // 데이터 새로고침 대신 0.1초 뒤 강제 새로고침
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error("전시회 저장 중 오류 발생:", error);
    }
  };

  // 전시회 선택 핸들러
  const handleSelectExhibition = (exhibition) => {
    if (isCreatingNew) {
      setIsCreatingNew(false);
    }

    setSelectedExhibition(exhibition);
    setSelectedKey(new Set([exhibition.id.toString()]));
  };

  // 필드 값 변경 핸들러
  const handleFieldChange = (field, value) => {
    setSelectedExhibition({
      ...selectedExhibition,
      [field]: value,
    });
  };

  // 이미지 업로드 및 처리 핸들러
  const handleImageUpload = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      // 파일 크기 제한 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        addToast({
          title: "업로드 오류",
          description: "파일 크기는 5MB 이하여야 합니다.",
          color: "danger",
        });
        return;
      }

      // 파일 형식 제한
      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!validTypes.includes(file.type)) {
        addToast({
          title: "업로드 오류",
          description:
            "JPG, PNG, GIF, WEBP 형식의 이미지만 업로드할 수 있습니다.",
          color: "danger",
        });
        return;
      }

      // 업로드 중임을 표시
      setIsLoading(true);

      // 파일 이름은 고유하게 생성 (UUID + 원본 파일명)
      const fileExt = file.name.split(".").pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `exhibition/${fileName}`;

      // Supabase storage에 이미지 업로드
      const { data, error } = await supabase.storage
        .from("exhibition")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // 업로드된 이미지의 공개 URL 생성
      const { data: publicUrlData } = supabase.storage
        .from("exhibition")
        .getPublicUrl(filePath);

      // 이미지 URL을 전시회 정보에 저장
      handleFieldChange("photo", publicUrlData.publicUrl);

      addToast({
        title: "업로드 성공",
        description: "이미지가 성공적으로 업로드되었습니다.",
        color: "success",
      });
    } catch (error) {
      console.error("이미지 업로드 중 오류 발생:", error);
      addToast({
        title: "업로드 오류",
        description: `이미지 업로드 중 오류가 발생했습니다: ${error.message}`,
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 전시회 업데이트 핸들러
  const handleUpdate = async () => {
    if (!selectedExhibition) return;

    setIsLoading(true);
    try {
      // 날짜 값 처리 - 반드시 end_date도 포함되도록 확인
      const startDate = selectedExhibition.start_date || null;
      const endDate = selectedExhibition.end_date || null;

      // 디버깅을 위한 로그 추가
      console.log("Supabase로 전송할 날짜 데이터:", {
        start_date: startDate,
        end_date: endDate,
      });

      // DB 업데이트 전 end_date가 있는지 확인
      if (!endDate) {
        console.warn("end_date가 비어 있습니다. 업데이트 계속 진행합니다.");
      }

      // Supabase에 업데이트 데이터 저장
      const { error } = await supabase
        .from("exhibition")
        .update({
          name: selectedExhibition.name,
          contents: selectedExhibition.contents,
          photo: selectedExhibition.photo,
          start_date: startDate,
          end_date: endDate, // 반드시 포함
          working_hour: selectedExhibition.working_hour,
          off_date: selectedExhibition.off_date,
          add_info: selectedExhibition.add_info,
          homepage_url: selectedExhibition.homepage_url,
          isFree: selectedExhibition.isFree,
          isRecommended: selectedExhibition.isRecommended,
          naver_gallery_url: userInfo.url,
          price: selectedExhibition.price,
        })
        .eq("id", selectedExhibition.id);

      if (error) {
        console.error("Supabase 업데이트 에러:", error);
        throw error;
      }

      // 성공 메시지
      addToast({
        title: "저장 완료료",
        description: "전시회 정보가 성공적으로 업데이트되었습니다.",
        color: "success",
      });

      // 데이터 새로고침
      setTimeout(() => {
        fetchAll();
      }, 300);
    } catch (error) {
      console.error("전시회 업데이트 중 오류 발생:", error);
      addToast({
        title: "저장 실패",
        description: "전시회 정보 업데이트 중 오류가 발생했습니다.",
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 전시회 삭제 핸들러
  const handleDelete = async () => {
    if (!selectedExhibition) return;

    if (window.confirm("정말로 이 전시회를 삭제하시겠습니까?")) {
      try {
        // Supabase에서 전시회 삭제
        const { error } = await supabase
          .from("exhibition")
          .delete()
          .eq("id", selectedExhibition.id);

        if (error) throw error;

        // 상태 초기화
        setSelectedExhibition(null);
        setSelectedKey(new Set([]));

        // 데이터 새로고침 대신 0.1초 뒤 강제 새로고침
        setTimeout(() => {
          window.location.reload();
        }, 100);
      } catch (error) {
        addToast({
          title: "삭제 실패",
          description: "전시회 삭제 중 오류가 발생했습니다.",
          color: "danger",
        });
      }
    }
  };

  // 검색어 변경 핸들러
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1); // 검색 시 첫 페이지로 이동
  };

  // 페이지 변경 핸들러
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // selectedKey 변경 핸들러
  const handleKeyChange = (keys) => {
    setSelectedKey(keys);

    if (keys.size > 0) {
      const selectedId = Number(Array.from(keys)[0]);
      const exhibition = exhibitions.find((e) => e.id === selectedId);

      if (exhibition) {
        handleSelectExhibition(exhibition);
      }
    }
  };

  const handleRefresh = () => {
    if (!userInfo || !userInfo.url) {
      // userInfo 준비 전이면 fetch 시도하지 않음
      return;
    }
    setCurrentPage(1);
    setSearchTerm("");
    setTimeout(() => {
      fetchAll();
    }, 0);
  };

  console.log("userInfo:", userInfo);
  console.log("selectedExhibition:", selectedExhibition);

  return (
    <div className="w-full h-full flex flex-col gap-4 py-20">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">전시 관리</h1>
        </div>

        {/* 검색 및 신규 등록 영역 */}
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <Input
            placeholder="전시회 검색..."
            value={searchTerm}
            onValueChange={handleSearchChange}
            startContent={
              <Icon icon="lucide:search" className="text-default-400" />
            }
            className="w-full md:w-1/3"
          />
          <Button
            onClick={handleNewExhibition}
            className="bg-primary text-white"
            disabled={isCreatingNew || !galleryInfo}
          >
            <Icon icon="lucide:plus" className="text-lg mr-1" />
            신규 전시 등록
          </Button>
        </div>

        {/* 전시회 목록 영역 */}
        <section className="rounded-lg ">
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse border-spacing-0 min-w-[600px]">
              <thead className="bg-default-100">
                <tr>
                  <th className="p-3 text-left border-b w-1/2 max-w-[50%]">
                    등록된전시
                  </th>
                  <th className="p-3 text-left border-b w-1/2">전시날짜</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="2" className="p-4 text-center">
                      데이터를 불러오는 중...
                    </td>
                  </tr>
                ) : exhibitions.length === 0 ? (
                  <tr>
                    <td colSpan="2" className="p-4 text-center">
                      전시회 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  exhibitions.map((exhibition) => (
                    <tr
                      key={exhibition.id}
                      className={`border-b cursor-pointer ${
                        selectedKey.has(exhibition.id.toString())
                          ? "bg-primary-100"
                          : ""
                      } `}
                      onClick={() => handleSelectExhibition(exhibition)}
                    >
                      {/* 제목 */}
                      <td className="p-3 w-1/2 max-w-xs whitespace-nowrap overflow-hidden text-ellipsis align-middle">
                        {exhibition.contents}
                      </td>
                      {/* 날짜 */}
                      <td className="p-3 w-1/2 max-w-xs whitespace-nowrap overflow-hidden text-ellipsis align-middle">
                        {exhibition.start_date && exhibition.end_date
                          ? formatDateRange(
                              exhibition.start_date,
                              exhibition.end_date
                            )
                          : "날짜 미설정"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* 페이지네이션 */}
          <div className="flex justify-center mt-4">
            <Pagination
              total={totalPages}
              initialPage={1}
              page={currentPage}
              onChange={handlePageChange}
            />
          </div>
        </section>

        {/* 전시회 상세 정보 영역 */}
        <section className="bg-content2 rounded-lg p-4">
          {isCreatingNew ? (
            <ExhibitionDetail
              galleryInfo={galleryInfo}
              isNew={true}
              onSave={handleSaveNew}
              onCancel={handleCancel}
              selectedKey={selectedKey}
            />
          ) : selectedExhibition ? (
            <div>
              <div className="flex justify-end space-x-2 mb-4">
                <Button
                  onClick={handleUpdate}
                  color="primary"
                  className="flex items-center"
                  isLoading={isLoading}
                >
                  <Icon icon="lucide:save" className="text-lg mr-1" />
                  {isCreatingNew ? "등록" : "수정한내용저장"}
                </Button>
                <Button
                  onClick={handleDelete}
                  color="danger"
                  variant="light"
                  className="flex items-center"
                >
                  <Icon icon="lucide:trash" className="text-lg mr-1" />
                  삭제
                </Button>
              </div>

              {/* 직접 편집 가능한 폼 영역 */}
              <form className="space-y-6 w-full lg:max-w-3xl lg:mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      전시회명
                    </label>
                    <Input
                      value={selectedExhibition.contents || ""}
                      onChange={(e) =>
                        handleFieldChange("contents", e.target.value)
                      }
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    이미지
                  </label>
                  <div className="flex flex-col gap-3">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center">
                      {selectedExhibition.photo ? (
                        <div className="relative w-full">
                          <img
                            src={selectedExhibition.photo}
                            alt={selectedExhibition.contents}
                            className="w-full h-48 object-cover rounded-md"
                          />
                          <Button
                            isIconOnly
                            color="danger"
                            variant="flat"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => handleFieldChange("photo", "")}
                          >
                            <Icon icon="lucide:x" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Icon
                            icon="lucide:image"
                            className="text-4xl text-gray-400 mb-2"
                          />
                          <p className="text-sm text-gray-500">
                            이미지 미리보기
                          </p>
                        </>
                      )}
                    </div>
                    <div>
                      <input
                        type="file"
                        id="photo-upload"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <label htmlFor="photo-upload">
                        <Button
                          as="span"
                          color="primary"
                          variant="flat"
                          size="sm"
                          className="flex items-center"
                        >
                          <Icon icon="lucide:upload" className="mr-1" />
                          {selectedExhibition.photo
                            ? "이미지 변경"
                            : "이미지 업로드"}
                        </Button>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium mb-1">
                      전시시작 *
                    </label>
                    <DatePicker
                      id="startDate"
                      locale={ko}
                      selected={startDate}
                      onChange={(date) => {
                        setStartDate(date);
                        handleFieldChange("start_date", format(date, "yyyyMMdd"));
                      }}
                      dateFormat="yyyy.MM.dd"
                      placeholderText="YYYY.MM.DD"
                      className="w-full border rounded p-2 pl-10"
                      calendarIcon={<CalendarIcon className="absolute left-3 top-3 text-gray-500" />}
                      renderCustomHeader={({
                        date,
                        decreaseMonth,
                        increaseMonth,
                        prevMonthButtonDisabled,
                        nextMonthButtonDisabled,
                      }) => (
                        <div className="flex items-center justify-between px-2 py-1 bg-white">
                          <button
                            onClick={decreaseMonth}
                            disabled={prevMonthButtonDisabled}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            ◀
                          </button>
                          <span className="font-medium">
                            {format(date, "yyyy.MM", { locale: ko })}
                          </span>
                          <button
                            onClick={increaseMonth}
                            disabled={nextMonthButtonDisabled}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            ▶
                          </button>
                        </div>
                      )}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium mb-1">
                      전시종료 *
                    </label>
                    <DatePicker
                      id="endDate"
                      locale={ko}
                      selected={endDate}
                      onChange={(date) => {
                        setEndDate(date);
                        handleFieldChange("end_date", format(date, "yyyyMMdd"));
                      }}
                      dateFormat="yyyy.MM.dd"
                      placeholderText="YYYY.MM.DD"
                      className="w-full border rounded p-2 pl-10"
                      calendarIcon={<CalendarIcon className="absolute left-3 top-3 text-gray-500" />}
                      renderCustomHeader={({
                        date,
                        decreaseMonth,
                        increaseMonth,
                        prevMonthButtonDisabled,
                        nextMonthButtonDisabled,
                      }) => (
                        <div className="flex items-center justify-between px-2 py-1 bg-white">
                          <button
                            onClick={decreaseMonth}
                            disabled={prevMonthButtonDisabled}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            ◀
                          </button>
                          <span className="font-medium">
                            {format(date, "yyyy.MM", { locale: ko })}
                          </span>
                          <button
                            onClick={increaseMonth}
                            disabled={nextMonthButtonDisabled}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            ▶
                          </button>
                        </div>
                      )}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      운영 시간
                    </label>
                    <Input
                      value={selectedExhibition.working_hour || ""}
                      onChange={(e) =>
                        handleFieldChange("working_hour", e.target.value)
                      }
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      휴관일
                    </label>
                    <Input
                      value={selectedExhibition.off_date || ""}
                      onChange={(e) =>
                        handleFieldChange("off_date", e.target.value)
                      }
                      className="w-full"
                    />
                  </div>
                </div>

                {/* 가격 입력 필드 (무료 여부 토글 대신) */}
                <div className="space-y-1">
                  <label htmlFor="price" className="block text-sm font-medium">
                    가격 (₩)
                  </label>
                  <input
                    id="price"
                    type="number"
                    value={price}
                    onChange={(e) => {
                      const v = Number(e.target.value) || 0;
                      setPrice(v);
                      handleFieldChange("price", v);
                    }}
                    onFocus={e => e.target.select()}
                    className="w-full border rounded p-2"
                    placeholder="₩0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    추가 정보
                  </label>
                  <div className="md:col-span-2">
                    <FroalaEditor
                      value={selectedExhibition.add_info || ""}
                      onChange={(content) =>
                        handleFieldChange("add_info", content)
                      }
                      placeholder="전시회에 대한 상세 정보를 입력하세요."
                      height={300}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    홈페이지 URL
                  </label>
                  <Input
                    value={selectedExhibition.homepage_url || ""}
                    onChange={(e) =>
                      handleFieldChange("homepage_url", e.target.value)
                    }
                    className="w-full"
                  />
                </div>
              </form>
            </div>
          ) : (
            <div className="text-center text-default-500 py-8">
              PC에서 사용을 권장합니다.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
