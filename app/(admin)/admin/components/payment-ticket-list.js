"use client";
import { useState, useEffect, useRef } from "react";
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
  addToast,
  Progress,
  Select,
  SelectItem,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { createClient } from "@/utils/supabase/client";
import { debounce } from "lodash";
import * as XLSX from "xlsx";

export function PaymentTicketList({
  onSelectTicket,
  selectedKeys,
  onSelectionChange,
  onRefresh,
  refreshToggle,
  setRefreshToggle,
  selectedTicket,
  setSelectedTicket,
}) {
  const [search, setSearch] = useState("");
  const [tickets, setTickets] = useState([]);
  const itemsPerPage = 10;
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(10);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [progressVisible, setProgressVisible] = useState(false);
  const [progressStatus, setProgressStatus] = useState("");
  const supabase = createClient();
  console.log('ticket', tickets)
  useEffect(() => {
    console.log("PaymentTicketList: 티켓 구매 목록 업데이트됨", tickets.length, "건");
  }, [tickets]);

  const GetTickets = async () => {
    const offset = (page - 1) * itemsPerPage;
    let query = supabase
      .from("payment_ticket")
      .select("*,exhibition_id(*),user_id(*)", { count: "exact" })
      .order("id", { ascending: false })
      .range(offset, offset + itemsPerPage - 1);

    if (search.trim()) {
      if (/^\d+$/.test(search.trim())) {
        // 숫자만 입력된 경우: 전시회ID로 필터
        query = query.eq('exhibition_id', Number(search.trim()));
      } else {
        query = query.or(
          `order_id.ilike.%${search}%`,
          `payment_key.ilike.%${search}%`,
          `exhibition_id.contents.ilike.%${search}%`
        );
      }
    }

    const { data, error, count } = await query;
    if (error) {
      console.error("티켓 데이터 조회 중 오류:", error);
    }
    setTickets(data || []);
    setTotal(Math.ceil(count / itemsPerPage));
  };

  // 외부에서 호출할 수 있는 새로고침 함수 추가
  const refreshTickets = () => {
    GetTickets();
  };

  useEffect(() => {
    GetTickets();
  }, []);

  useEffect(() => {
    if (onRefresh) {
      onRefresh(refreshTickets);
    }
  }, [onRefresh]);

  useEffect(() => {
    if (refreshToggle) {
      GetTickets();
    }
  }, [refreshToggle]);

  const debouncedSearch = debounce(() => {
    GetTickets();
  }, 500);

  useEffect(() => {
    debouncedSearch();
    return () => {
      debouncedSearch.cancel();
    };
  }, [page, search]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleSelectionChange = (keys) => {
    onSelectionChange(keys);
    const selectedKey = Array.from(keys)[0];
    if (selectedKey) {
      const ticket = tickets.find((a) => a.id === Number(selectedKey));
      if (ticket) {
        onSelectTicket(ticket);
        setSelectedTicket(ticket);
      }
    } else {
      setSelectedTicket(null);
    }
  };

  const handleExcelDownload = async () => {
    try {
      setUploading(true);
      const { data, error } = await supabase
        .from("payment_ticket")
        .select("*")
        .order("id", { ascending: false });
      if (error) throw error;
      if (!data || data.length === 0) {
        addToast({
          title: "데이터 없음",
          description: "다운로드할 티켓 데이터가 없습니다.",
          color: "warning",
        });
        setUploading(false);
        return;
      }
      const worksheet = XLSX.utils.json_to_sheet(
        data.map((ticket) => ({
          주문ID: ticket.order_id || "",
          결제키: ticket.payment_key || "",
          금액: ticket.amount || 0,
          인원수: ticket.people_count || 0,
          상태: ticket.status || "",
        }))
      );
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "티켓구매내역");
      XLSX.writeFile(workbook, "payment_ticket_list.xlsx");
      addToast({
        title: "엑셀 다운로드 완료",
        description: `총 ${data.length}개의 티켓 데이터가 엑셀 파일로 다운로드되었습니다.`,
        color: "success",
      });
    } catch (error) {
      console.error("엑셀 다운로드 중 오류:", error);
      addToast({
        title: "다운로드 오류",
        description: `엑셀 다운로드 중 오류가 발생했습니다: ${error.message}`,
        color: "danger",
      });
    } finally {
      setUploading(false);
    }
  };

  const getProgressColor = () => {
    switch (progressStatus) {
      case "success":
        return "success";
      case "failed":
        return "danger";
      default:
        return "primary";
    }
  };

  // 렌더링 시 전시회ID(숫자) 검색이면 프론트에서 직접 필터링
  const filteredTickets = search.trim() && /^\d+$/.test(search)
    ? tickets.filter(ticket => ticket.exhibition_id?.id?.toString().includes(search))
    : tickets;

  return (
    <div className="space-y-4 PaymentTicketList">
      <div className="flex items-center gap-4 w-full">
        <Input
          placeholder="주문ID, 결제키, 유저ID, 전시회명, 전시회ID 검색..."
          value={search}
          onValueChange={setSearch}
          startContent={<Icon icon="lucide:search" className="text-default-400" />}
          className="w-full"
        />
        <Button onPress={handleExcelDownload} isLoading={uploading} color="primary">
          <Icon icon="lucide:download" className="text-lg mr-1" />
          엑셀 다운로드
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table
          classNames={{ wrapper: "p-0" }}
          className="min-w-[900px]"
          shadow="none"
          variant="bordered"
          aria-label="티켓 구매 목록 테이블"
          selectionMode="single"
          selectedKeys={selectedKeys}
          onSelectionChange={handleSelectionChange}
        >
          <TableHeader>
            <TableColumn>ID</TableColumn>
            <TableColumn>구매일시</TableColumn>
            <TableColumn>전시회명</TableColumn>
            <TableColumn>주문ID</TableColumn>
            <TableColumn>결제키</TableColumn>
            <TableColumn>금액</TableColumn>
            <TableColumn>인원수</TableColumn>
            <TableColumn>상태</TableColumn>
          </TableHeader>
          <TableBody emptyContent={"티켓 구매 데이터가 없습니다."} items={filteredTickets || []}>
            {(ticket) => (
              <TableRow key={ticket.id}>
                <TableCell>{ticket.id}</TableCell>
                <TableCell>{ticket.created_at ? new Date(ticket.created_at).toLocaleString() : "-"}</TableCell>
                <TableCell>{ticket.exhibition_id?.contents ? `${ticket.exhibition_id.contents} (ID: ${ticket.exhibition_id.id})` : '-'}</TableCell>
                <TableCell>{ticket.order_id || "-"}</TableCell>
                <TableCell>{ticket.payment_key || "-"}</TableCell>
                <TableCell>{ticket.amount || 0}</TableCell>
                <TableCell>{ticket.people_count || 0}</TableCell>
                <TableCell>{ticket.status || "-"}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-center w-full">
        <Pagination total={total} page={page} onChange={handlePageChange} showControls />
      </div>
    </div>
  );
} 