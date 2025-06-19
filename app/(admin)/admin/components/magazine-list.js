"use client";

import { useState, useEffect } from "react";
import {
  Input,
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Pagination,
  Button,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { createClient } from "@/utils/supabase/client";
import { debounce } from "lodash";
import Link from "next/link";

export function MagazineList({ 
  onSelectMagazine,
  selectedKeys,
  onSelectionChange,
  onCreateMagazine,
  onRefresh,
  refreshToggle,
  setRefreshToggle
}) {
  const [search, setSearch] = useState("");
  const [magazines, setMagazines] = useState([]);
  const itemsPerPage = 5;
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(10);
  const supabase = createClient();

  const GetMagazines = async () => {
    const offset = (page - 1) * itemsPerPage;
    console.log('GetMagazines 함수 호출됨 - 페이지:', page, '검색어:', search);
    
    let query = supabase.from("magazine").select("*", {
      count: "exact",
    }).order('id', { ascending: false })
      .range(offset, offset + itemsPerPage - 1);
    
    // search 값이 있을 경우 필터 추가
    if (search.trim()) {
      query = query.or(`title.ilike.%${search}%, subtitle.ilike.%${search}%, contents.ilike.%${search}%`);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('매거진 데이터 조회 중 오류:', error);
    }
    console.log('매거진 데이터 조회 결과:', data?.length, '건, 총:', count, '건');
    setMagazines(data || []);
    setTotal(Math.ceil(count / itemsPerPage));
  };

  // 외부에서 호출할 수 있는 새로고침 함수 추가
  const refreshMagazines = () => {
    console.log('refreshMagazines 함수 호출됨 - 매거진 목록 새로고침');
    GetMagazines();
  };

  // onRefresh props가 존재하면 refreshMagazines 함수 전달
  useEffect(() => {
    if (onRefresh) {
      console.log('MagazineList: onRefresh 함수에 refreshMagazines 함수 전달');
      onRefresh(refreshMagazines);
    }
  }, [onRefresh]);

  useEffect(() => {
    if (refreshToggle !== undefined) {
      console.log('MagazineList: refreshToggle 변경 감지 - 매거진 목록 새로고침');
      GetMagazines();
    }
  }, [refreshToggle]);

  // debounce 적용한 검색 함수
  const debouncedSearch = debounce(() => {
    GetMagazines();
  }, 500);

  useEffect(() => {
    debouncedSearch();
    // 컴포넌트 언마운트 시 debounce 취소
    return () => {
      debouncedSearch.cancel();
    };
  }, [page, search]);

  // 페이지 변경 처리 함수
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  // 매거진 선택 처리
  const handleSelectionChange = (keys) => {
    onSelectionChange(keys);
    const selectedKey = Array.from(keys)[0];

    if (selectedKey) {
      const magazine = magazines.find((m) => m.id === Number(selectedKey));
      if (magazine) onSelectMagazine({ ...magazine });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-4 items-center justify-end gap-4">
        <Button
          className="text-white col-span-4 md:col-span-1 md:col-start-4"
          color="primary"
          variant="solid"
          onPress={onCreateMagazine}
        >
          <Icon icon="lucide:plus" className="mr-1" />새 매거진 등록
        </Button>
      </div>
      <div className="flex items-center gap-4 w-full">
        <Input
          placeholder="매거진 검색..."
          value={search}
          onValueChange={setSearch}
          startContent={
            <Icon icon="lucide:search" className="text-default-400" />
          }
          className="w-full"
        />
      </div>
      <div className="overflow-x-auto w-full">
      <Table
        className="min-w-[600px] "
        classNames={{ wrapper: "p-0" }}
        shadow="none"
        variant="bordered"
        aria-label="매거진 목록"
        selectionMode="single"
        selectedKeys={selectedKeys}
        onSelectionChange={handleSelectionChange}
      >
        <TableHeader>
          <TableColumn className="w-1/4">제목</TableColumn>
          <TableColumn className="w-1/4">부제목</TableColumn>
          <TableColumn className="w-1/4">내용</TableColumn>
          <TableColumn className="w-1/4">작성일</TableColumn>
        </TableHeader>
        <TableBody>
          {magazines.map((magazine) => (
            <TableRow key={magazine.id}>
              <TableCell>{magazine.title}</TableCell>
              <TableCell>{magazine.subtitle}</TableCell>
              <TableCell className="overflow-hidden whitespace-nowrap text-ellipsis max-w-[200px]" title={magazine.content}>
                {magazine.contents}
              </TableCell>
              <TableCell>
                {magazine.created_at ? new Date(magazine.created_at).toLocaleString("ko-KR") : "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
      <div className="flex justify-center w-full">
        <Pagination 
          page={page} 
          total={total} 
          initialPage={1}
          onChange={handlePageChange} 
          showControls
        />
      </div>
    </div>
  );
}
