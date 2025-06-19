'use client'

import React, { useEffect, useState } from "react";
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from "@heroui/react";
import { createClient } from "@/utils/supabase/client";
import useUserInfoStore from "../store/userInfo";

export default function VisitorPage() {
  const [exhibitions, setExhibitions] = useState([]);
  const [selectedExhibition, setSelectedExhibition] = useState("");
  const [ticketBuyers, setTicketBuyers] = useState([]);
  const [userNames, setUserNames] = useState({});
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const supabase = createClient();
  const { userInfo } = useUserInfoStore();

  // 1. 갤러리 url로 전시회 목록 조회
  useEffect(() => {
    if (!userInfo?.url) return;
    const fetchExhibitions = async () => {
      const { data, error } = await supabase
        .from("exhibition")
        .select("id, contents")
        .eq("naver_gallery_url", userInfo.url);
      if (!error && data) setExhibitions(data);
      else setExhibitions([]);
    };
    fetchExhibitions();
  }, [userInfo?.url]);

  // 전체 유저 목록 불러오기
  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from('profiles').select('id, full_name, email');
      if (!error && data) setUsers(data);
      else setUsers([]);
    };
    fetchUsers();
  }, []);

  // users 상태 콘솔 출력
  useEffect(() => {
    console.log("users 상태:", users);
  }, [users]);

  // 2. 전시회 선택 시 티켓 구매자 조회
  useEffect(() => {
    if (!selectedExhibition) {
      setTicketBuyers([]);
      setUserNames({});
      return;
    }
    const fetchTicketsAndNames = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("payment_ticket")
        .select("id, user_id, created_at, status")
        .eq("exhibition_id", Number(selectedExhibition))
        .order("created_at", { ascending: false });
      if (!error && data) {
        setTicketBuyers(data);
        // user_id 배열 추출
        const userIds = [...new Set(data.map(t => t.user_id).filter(Boolean))];
        if (userIds.length > 0) {
          const { data: profiles, error: profileError } = await supabase
            .from("profiles")
            .select("id, name, full_name, display_name")
            .in("id", userIds);
          if (!profileError && profiles) {
            // id: name 매핑
            const nameMap = {};
            profiles.forEach(p => {
              nameMap[p.id] = p.name || p.full_name || p.display_name || "-";
            });
            setUserNames(nameMap);
          } else {
            setUserNames({});
          }
        } else {
          setUserNames({});
        }
      } else {
        setTicketBuyers([]);
        setUserNames({});
      }
      setLoading(false);
    };
    fetchTicketsAndNames();
  }, [selectedExhibition]);

  return (
    <div className="w-full h-full p-8">
      <h1 className="text-2xl font-bold mb-6 mt-16 sm:mt-0">관람객 관리</h1>
      <h2 className="text-lg font-semibold mb-2">티켓 구매자 리스트</h2>
      <div className="mb-4">
        <label htmlFor="exhibition-select" className="mr-2 font-medium">전시회 선택:</label>
        <select
          id="exhibition-select"
          value={selectedExhibition}
          onChange={e => setSelectedExhibition(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="">전시회를 선택하세요</option>
          {exhibitions.map(ex => (
            <option key={ex.id} value={ex.id}>{ex.contents}</option>
          ))}
        </select>
      </div>
      <Table aria-label="티켓 구매자 리스트" className="min-w-[400px]">
        <TableHeader>
          <TableColumn>이름</TableColumn>
          <TableColumn>구매시간</TableColumn>
          <TableColumn>사용여부</TableColumn>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={3} className="text-center">로딩 중...</TableCell></TableRow>
          ) : ticketBuyers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-gray-400">구매 내역이 없습니다.</TableCell>
            </TableRow>
          ) : (
            ticketBuyers.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{(() => {
                  const user = users.find(u => String(u.id) === String(t.user_id));
                  return user ? (user.full_name || user.email || user.id) : "-";
                })()}</TableCell>
                <TableCell>{t.created_at ? new Date(t.created_at).toLocaleString() : "-"}</TableCell>
                <TableCell>{t.status === "used" ? "사용됨" : t.status === "success" ? "미사용" : t.status}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <div className="text-xs text-gray-400 mt-4">※ 이름, 구매시간, 사용여부만 표시합니다.</div>
    </div>
  );
} 