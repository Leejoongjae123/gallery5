"use client";
import { useEffect, useState } from "react";
import { Button, Input, Select, SelectItem } from "@heroui/react";
import { createClient } from "@/utils/supabase/client";
import * as XLSX from "xlsx";

export default function ManualTicketIssuePage() {
  const [users, setUsers] = useState([]);
  const [exhibitions, setExhibitions] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedExhibition, setSelectedExhibition] = useState("");
  const [amount, setAmount] = useState(0);
  const [peopleCount, setPeopleCount] = useState(1);
  const [status, setStatus] = useState("success");
  const [message, setMessage] = useState("");
  const [tickets, setTickets] = useState([]);
  const [filterExhibition, setFilterExhibition] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const supabase = createClient();

  useEffect(() => {
    // 유저 리스트 불러오기 (profiles 테이블 직접 조회)
    const fetchUsers = async () => {
      const { data, error } = await supabase.from('profiles').select('id, full_name, email');
      if (!error) setUsers(data);
    };
    // 전시회 리스트 불러오기
    const fetchExhibitions = async () => {
      const { data, error } = await supabase.from("exhibition").select("id, contents, price");
      if (!error) setExhibitions(data);
    };
    // 티켓 발급 내역 불러오기
    const fetchTickets = async () => {
      const { data, error } = await supabase
        .from("payment_ticket")
        .select("id, user_id, order_id, exhibition_id, amount, people_count, status, created_at")
        .order("created_at", { ascending: false })
        .limit(30);
      if (!error) setTickets(data);
    };
    fetchUsers();
    fetchExhibitions();
    fetchTickets();
  }, []);

  useEffect(() => {
    // 전시회 선택 시 금액 자동 설정
    if (selectedExhibition) {
      const exhibition = exhibitions.find(e => String(e.id) === String(selectedExhibition));
      if (exhibition && typeof exhibition.price !== 'undefined') {
        setAmount(exhibition.price);
      }
    }
  }, [selectedExhibition, exhibitions]);

  const handleIssue = async () => {
    if (!selectedUser || !selectedExhibition) {
      setMessage("유저와 전시회를 모두 선택하세요.");
      return;
    }
    const orderId = `manual_${Date.now()}`;
    const { error } = await supabase.from("payment_ticket").insert({
      user_id: selectedUser,
      exhibition_id: selectedExhibition,
      amount,
      people_count: peopleCount,
      status,
      order_id: orderId,
      created_at: new Date().toISOString(),
    });
    if (error) setMessage("발급 실패: " + error.message);
    else setMessage("티켓이 정상적으로 발급되었습니다!");
  };

  // 발급 취소(삭제)
  const handleDelete = async (id) => {
    if (!window.confirm("정말로 이 발급 내역을 삭제하시겠습니까?")) return;
    const { error } = await supabase.from("payment_ticket").delete().eq("id", id);
    if (!error) setTickets(tickets.filter(t => t.id !== id));
  };

  // 엑셀 다운로드
  const handleExcelDownload = () => {
    const ws = XLSX.utils.json_to_sheet(tickets);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "티켓발급내역");
    XLSX.writeFile(wb, "manual_ticket_issued.xlsx");
  };

  // 인원수 변경 시 금액 자동 계산
  const handlePeopleCountChange = (value) => {
    setPeopleCount(value);
    const exhibition = exhibitions.find(e => String(e.id) === String(selectedExhibition));
    if (exhibition && typeof exhibition.price !== 'undefined') {
      setAmount(exhibition.price * value);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">관리자 티켓 수동 발급</h1>
      <div className="mb-4">
        <Select
          label="유저 선택 (user_id)"
          selectedKeys={selectedUser ? new Set([selectedUser]) : new Set([])}
          onSelectionChange={keys => setSelectedUser(keys.values().next().value || "")}
          renderValue={() => {
            const u = users.find(u => u.id === selectedUser);
            return u ? `${u.full_name || u.email || u.id} (${u.email || u.id})` : "유저를 선택하세요";
          }}
        >
          <SelectItem key="" value="">유저를 선택하세요</SelectItem>
          {users.map(u => (
            <SelectItem key={u.id} value={u.id}>
              {u.full_name || u.email || u.id} ({u.email || u.id})
            </SelectItem>
          ))}
        </Select>
      </div>
      <div className="mb-4">
        <Select
          label="전시회 선택 (exhibition_id)"
          selectedKeys={selectedExhibition ? new Set([String(selectedExhibition)]) : new Set([])}
          onSelectionChange={keys => setSelectedExhibition(String(keys.values().next().value) || "")}
          renderValue={() => {
            const e = exhibitions.find(e => String(e.id) === String(selectedExhibition));
            return e ? `${e.contents} (${e.id})` : "전시회를 선택하세요";
          }}
        >
          <SelectItem key="" value="">전시회를 선택하세요</SelectItem>
          {exhibitions.map(e => (
            <SelectItem key={e.id} value={e.id}>
              {e.contents} ({e.id})
            </SelectItem>
          ))}
        </Select>
      </div>
      <Input label="금액" type="number" value={amount} readOnly className="mb-4 bg-gray-100" />
      <Input label="인원수" type="number" value={peopleCount} onChange={e => handlePeopleCountChange(Number(e.target.value))} className="mb-4" />
      <Select label="상태" value={status} onChange={e => setStatus(e.target.value)} className="mb-4">
        <SelectItem key="success" value="success">success</SelectItem>
        <SelectItem key="used" value="used">used</SelectItem>
        <SelectItem key="cancel" value="cancel">cancel</SelectItem>
      </Select>
      <Button className="mt-4 w-full" onClick={handleIssue}>발급</Button>
      {message && <div className="mt-2 text-center text-red-500">{message}</div>}

      {/* 발급 내역 테이블 */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-bold">발급 내역</h2>
          <Button size="sm" color="primary" onClick={handleExcelDownload}>엑셀 다운로드</Button>
        </div>
        <div className="flex gap-2 mb-2">
          <Select
            label="상태별 검색"
            selectedKeys={filterStatus ? new Set([filterStatus]) : new Set([""])}
            onSelectionChange={keys => setFilterStatus(keys.values().next().value || "")}
            renderValue={() => {
              if (!filterStatus) return "전체";
              if (filterStatus === "success") return "success";
              if (filterStatus === "used") return "used";
              if (filterStatus === "cancel") return "cancel";
              return "전체";
            }}
            className="max-w-xs"
          >
            <SelectItem key="" value="">전체</SelectItem>
            <SelectItem key="success" value="success">success</SelectItem>
            <SelectItem key="used" value="used">used</SelectItem>
            <SelectItem key="cancel" value="cancel">cancel</SelectItem>
          </Select>
          <Select
            label="전시회별 검색"
            selectedKeys={filterExhibition ? new Set([String(filterExhibition)]) : new Set([""])}
            onSelectionChange={keys => setFilterExhibition(String(keys.values().next().value) || "")}
            renderValue={() => {
              if (!filterExhibition) return "전체";
              const e = exhibitions.find(e => String(e.id) === String(filterExhibition));
              return e ? `${e.contents} (${e.id})` : "전체";
            }}
            className="max-w-xs"
          >
            <SelectItem key="" value="">전체</SelectItem>
            {exhibitions.map(e => (
              <SelectItem key={e.id} value={e.id}>
                {e.contents} ({e.id})
              </SelectItem>
            ))}
          </Select>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">유저ID</th>
                <th className="p-2 border">구매번호</th>
                <th className="p-2 border">유저이름</th>
                <th className="p-2 border">전시회ID</th>
                <th className="p-2 border">금액</th>
                <th className="p-2 border">인원수</th>
                <th className="p-2 border">상태</th>
                <th className="p-2 border">발급일</th>
                <th className="p-2 border">취소</th>
              </tr>
            </thead>
            <tbody>
              {tickets
                .filter(t => (!filterExhibition || String(t.exhibition_id) === String(filterExhibition)))
                .filter(t => (!filterStatus || t.status === filterStatus))
                .map(t => {
                  const user = users.find(u => u.id === t.user_id);
                  return (
                    <tr key={t.id}>
                      <td className="p-2 border">{t.user_id}</td>
                      <td className="p-2 border">{t.order_id || '-'}</td>
                      <td className="p-2 border">{user ? (user.full_name || user.email || user.id) : '-'}</td>
                      <td className="p-2 border">{t.exhibition_id}</td>
                      <td className="p-2 border">{
                        (t.people_count > 1 && t.amount < 10000)
                          ? ((t.amount || 0) * (t.people_count || 1)).toLocaleString() + '원'
                          : (t.amount || 0).toLocaleString() + '원'
                      }</td>
                      <td className="p-2 border">{t.people_count}</td>
                      <td className="p-2 border">{t.status}</td>
                      <td className="p-2 border">{t.created_at ? t.created_at.slice(0, 19).replace('T', ' ') : ''}</td>
                      <td className="p-2 border">
                        <Button size="sm" color="danger" onClick={() => handleDelete(t.id)}>취소</Button>
                      </td>
                    </tr>
                  );
                })}
              {tickets.filter(t => (!filterExhibition || String(t.exhibition_id) === String(filterExhibition))).filter(t => (!filterStatus || t.status === filterStatus)).length === 0 && (
                <tr><td colSpan={8} className="text-center p-4">발급 내역이 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 