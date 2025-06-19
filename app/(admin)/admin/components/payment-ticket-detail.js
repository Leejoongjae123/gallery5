"use client";
import React, { useState, useEffect } from "react";
import { Input, Button, useDisclosure, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { Icon } from "@iconify/react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { useToast } from "@/utils/toast";
import { addToast } from "@heroui/toast";

export function PaymentTicketDetail({
  ticket,
  selectedKeys,
  setSelectedKeys,
  onRefresh,
  refreshToggle,
  setRefreshToggle,
  selectedTicket,
  setSelectedTicket,
}) {
  const [exhibitionContent, setExhibitionContent] = useState("");
  const [userName, setUserName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();
  const toast = useToast();
  
  // 취소 확인 모달 관련 상태
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isResultOpen, onOpen: onResultOpen, onClose: onResultClose } = useDisclosure();
  const [resultMessage, setResultMessage] = useState("");

  useEffect(() => {
    if (ticket) {
      fetchRelatedData();
    }
  }, [ticket]);

  console.log("ticket:", ticket)

  const fetchRelatedData = async () => {
    try {
      // 전시회 정보 가져오기
      if (ticket.exhibition_id) {
        const { data: exhibitionData, error: exhibitionError } = await supabase
          .from("exhibition")
          .select("contents")
          .eq("id", ticket?.exhibition_id?.id)
          .single();

        if (!exhibitionError && exhibitionData) {
          setExhibitionContent(exhibitionData.contents || "");
        }
      }

      // 사용자 정보 가져오기
      if (ticket.user_id) {
        const { data: userData, error: userError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", ticket?.user_id?.id)
          .single();

        if (!userError && userData) {
          setUserName(userData.full_name || "");
        } else {
          // user_metadata에서 full_name을 확인하기 위한 추가 처리
          const { data, error: authError } = await supabase.auth.getUser(ticket.user_id);
          
          if (!authError && data.user && data.user.user_metadata && data.user.user_metadata.full_name) {
            setUserName(data.user.user_metadata.full_name);
          }
        }
      }
    } catch (error) {
      console.error("관련 데이터 조회 오류:", error);
    }
  };

  if (!ticket) return null;

  const handleCancel = () => {
    setSelectedTicket(null);
    setSelectedKeys(new Set([]));
  };

  // 결제 취소 모달 표시
  const showCancelConfirmation = () => {
    if (ticket.status === "cancel") {
      toast.error("취소 불가", "이미 취소된 결제입니다.");
      return;
    }
    onOpen();
  };

  // 결제 취소 처리 함수
  const handlePaymentCancel = async () => {
    onClose(); // 확인 모달 닫기
    setIsLoading(true);
    try {
      if (!ticket.payment_key) {
        // 무료티켓(결제키 없음): DB 상태만 변경
        const { error } = await supabase
          .from("payment_ticket")
          .update({ status: "cancel" })
          .eq("id", ticket.id);
        if (error) {
          setResultMessage(`결제 취소 중 오류가 발생했습니다: ${error.message}`);
          onResultOpen();
          setIsLoading(false);
          return;
        }
        toast.success("결제 취소 완료", "무료티켓이 성공적으로 취소되었습니다.");
        if (onRefresh) {
          onRefresh();
          setRefreshToggle(prev => prev + 1);
        }
        setIsLoading(false);
        return;
      }
      // 유료 결제: 기존 로직(API 호출)
      const response = await fetch('/api/payment/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentKey: ticket.payment_key,
          cancelReason: "관리자 취소",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setResultMessage(`결제 취소 중 오류가 발생했습니다: ${data.message || '알 수 없는 오류'}`);
        onResultOpen();
        setIsLoading(false);
        return;
      }

      if (data.success) {
        toast.success("결제 취소 완료", "결제가 성공적으로 취소되었습니다.");
        // 티켓 상태를 최신 정보로 업데이트
        const { data: updatedTicket, error: ticketError } = await supabase
          .from("payment_ticket")
          .select("*,exhibition_id(*),user_id(*)")
          .eq("id", ticket.id)
          .single();
        if (!ticketError && updatedTicket) {
          setSelectedTicket(updatedTicket);
        }
        if (onRefresh) {
          onRefresh();
          setRefreshToggle(prev => prev + 1);
        }
      } else {
        setResultMessage(`결제 취소 실패: ${data.message}`);
        onResultOpen();
      }
    } catch (error) {
      console.error('결제 취소 처리 오류:', error);
      setResultMessage(`결제 취소 처리 중 오류가 발생했습니다: ${error.message}`);
      onResultOpen();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">티켓 구매 상세 정보</h2>
        <Button variant="flat" onPress={handleCancel}>
          <Icon icon="lucide:x" className="text-lg mr-1" />
          닫기
        </Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
        <Input
          className="col-span-2 md:col-span-1"
          label="ID"
          value={ticket.id || ""}
          isDisabled
        />
        <Input
          className="col-span-2 md:col-span-1"
          label="구매일시"
          value={ticket.created_at ? new Date(ticket.created_at).toLocaleString() : ""}
          isDisabled
        />
        <Input
          className="col-span-2 md:col-span-1"
          label="주문ID"
          value={ticket.order_id || ""}
          isDisabled
        />
        <Input
          className="col-span-2 md:col-span-1"
          label="결제키"
          value={ticket.payment_key || ""}
          isDisabled
        />
        <Input
          className="col-span-2 md:col-span-1"
          label="사용자 이름"
          value={ticket.user_id.full_name || ""}
          isDisabled
        />
        <Input
          className="col-span-2 md:col-span-1"
          label="금액"
          value={ticket.amount || 0}
          isDisabled
        />
        <Input
          className="col-span-2 md:col-span-1"
          label="인원수"
          value={ticket.people_count || 0}
          isDisabled
        />
        <Input
          className="col-span-2 md:col-span-1"
          label="상태"
          value={ticket.status || ""}
          isDisabled
        />
        <Input
          className="col-span-2 md:col-span-1"
          label="전시회명"
          value={ticket.exhibition_id.contents || ""}
          isDisabled
        />
        <div className="col-span-2 md:col-span-1 flex justify-between items-center">
          <Input
            className="w-full"
            label="전시URL"
            value={`/exhibition/${ticket.exhibition_id.id}` || ""}
            isDisabled
          />
          <Link className="w-full" href={`/exhibition/${ticket.exhibition_id.id}`} target="_blank">
            바로가기
          </Link>
        </div>
        <Button 
          color="danger" 
          className="col-span-2" 
          variant="flat" 
          onPress={showCancelConfirmation}
          isDisabled={isLoading || ticket.status === "cancel"}
          isLoading={isLoading}
        >
          결제취소
        </Button>
      </div>

      {/* 결제 취소 확인 모달 */}
      <Modal isOpen={isOpen} onClose={onClose} size="sm">
        <ModalContent>
          <ModalHeader>결제 취소 확인</ModalHeader>
          <ModalBody>
            <p>정말로 이 결제를 취소하시겠습니까?</p>
            <p className="text-sm text-default-500 mt-2">
              결제번호: {ticket.payment_key}
            </p>
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="light" onPress={onClose}>
              취소
            </Button>
            <Button color="danger" onPress={handlePaymentCancel}>
              결제취소
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 결제 취소 결과 모달 */}
      <Modal isOpen={isResultOpen} onClose={onResultClose} size="sm">
        <ModalContent>
          <ModalHeader>결제 취소 결과</ModalHeader>
          <ModalBody>
            <p>{resultMessage}</p>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onPress={onResultClose}>
              확인
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
} 