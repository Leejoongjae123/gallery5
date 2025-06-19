"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button, Select, SelectItem } from "@heroui/react";

export default function DBManagePage() {
  const [users, setUsers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showAlarmUI, setShowAlarmUI] = useState(false);
  const [exhibitions, setExhibitions] = useState([]);
  const [selectedExhibition, setSelectedExhibition] = useState("");
  const supabase = createClient();

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from('profiles').select('id, full_name, email, created_at');
      if (!error) setUsers(data);
    };
    const fetchExhibitions = async () => {
      const { data, error } = await supabase.from('exhibition').select('id, contents');
      if (!error) setExhibitions(data);
    };
    fetchUsers();
    fetchExhibitions();
  }, []);

  const handleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === users.length) setSelectedIds([]);
    else setSelectedIds(users.map(u => u.id));
  };

  const handleDeselectAll = () => setSelectedIds([]);

  const handleSendAlarm = async () => {
    if (!selectedExhibition || selectedIds.length === 0) return;
    const now = new Date().toISOString();
    const message = "관람객님이 방문한 곳에 새로운 전시가 시작되었습니다!";
    const inserts = selectedIds.map(user_id => ({
      user_id,
      exhibition_id: selectedExhibition,
      message,
      created_at: now,
    }));
    const { error } = await supabase.from("notification").insert(inserts);
    if (error) {
      alert("알림 발송 실패: " + error.message);
    } else {
      alert("알림이 정상적으로 발송되었습니다!");
      setShowAlarmUI(false);
      setSelectedExhibition("");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">DB관리 - 전체 회원 정보</h1>
      <div className="flex items-center mb-2 gap-2">
        <Button size="sm" color="primary" onClick={() => setShowAlarmUI(v => !v)}>
          전시회 알람 발송
        </Button>
        <Button size="sm" color="default" onClick={handleDeselectAll}>선택 해제</Button>
        <span className="text-sm text-gray-500">선택된 회원: {selectedIds.length}명</span>
      </div>
      {showAlarmUI && (
        <div className="flex items-center gap-2 mb-4">
          <Select
            label="전시회 선택"
            selectedKeys={selectedExhibition ? new Set([String(selectedExhibition)]) : new Set([])}
            onSelectionChange={keys => setSelectedExhibition(String(keys.values().next().value) || "")}
            renderValue={() => {
              const e = exhibitions.find(e => String(e.id) === String(selectedExhibition));
              return e ? `${e.contents} (${e.id})` : "전시회를 선택하세요";
            }}
            className="min-w-[200px]"
          >
            <SelectItem key="" value="">전시회를 선택하세요</SelectItem>
            {exhibitions.map(e => (
              <SelectItem key={e.id} value={e.id}>{e.contents} ({e.id})</SelectItem>
            ))}
          </Select>
          <Button size="sm" color="success" disabled={!selectedExhibition || selectedIds.length === 0} onClick={handleSendAlarm}>
            발송
          </Button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">
                <input type="checkbox" checked={selectedIds.length === users.length && users.length > 0} onChange={handleSelectAll} />
              </th>
              <th className="p-2 border">user_id</th>
              <th className="p-2 border">이름</th>
              <th className="p-2 border">이메일</th>
              <th className="p-2 border">가입일</th>
            </tr>
          </thead>
          <tbody>
            {users && users.length > 0 ? users.map(u => (
              <tr key={u.id}>
                <td className="p-2 border text-center">
                  <input type="checkbox" checked={selectedIds.includes(u.id)} onChange={() => handleSelect(u.id)} />
                </td>
                <td className="p-2 border">{u.id}</td>
                <td className="p-2 border">{u.full_name || '-'}</td>
                <td className="p-2 border">{u.email || '-'}</td>
                <td className="p-2 border">{u.created_at ? u.created_at.slice(0, 19).replace('T', ' ') : '-'}</td>
              </tr>
            )) : (
              <tr><td colSpan={5} className="text-center p-4">회원 정보가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 