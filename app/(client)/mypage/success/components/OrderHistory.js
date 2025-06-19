"use client";
import React, { useEffect, useState } from "react";
import { Button, Card, CardBody, Spinner, Divider, Badge } from "@heroui/react";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import { FaPlus } from "react-icons/fa";
import Link from "next/link";
import { FaCalendar } from "react-icons/fa6";
import { FaMoneyBillWaveAlt } from "react-icons/fa";
import dayjs from "dayjs";
import { motion } from "framer-motion";
import { toast } from "@heroui/toast";

const OrderHistory = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleOrders, setVisibleOrders] = useState(4);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const supabase = createClient();
        
        // payment_ticket 테이블에서 사용자 주문 내역과 exhibition 정보 함께 가져오기
        // 무료티켓(0원)은 used도 노출, 유료티켓은 success만 노출
        const { data: ticketData, error: ticketError } = await supabase
          .from('payment_ticket')
          .select('*, exhibition_id(*)')
          .order('created_at', { ascending: false })
          .eq("user_id", user.id)
        
        if (ticketError) {
          console.log("주문 내역을 가져오는 중 오류가 발생했습니다:", ticketError);
          return;
        }
        
        console.log('ticketData:', ticketData)
        setOrders(ticketData || []);
      } catch (error) {
        console.log("주문 내역을 가져오는 중 오류가 발생했습니다:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const loadMoreOrders = () => {
    setVisibleOrders(prevVisible => prevVisible + 3);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40 w-full">
        <Spinner variant="wave" color="primary" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 w-full">
        <p className="text-gray-500">주문 내역이 없습니다.</p>
      </div>
    );
  }

  // used(입장완료) 아닌 것들 먼저, 종료일 빠른 순서로 정렬
  const sortedOrders = [
    ...orders
      .filter(order => order.status !== 'used')
      .sort((a, b) => {
        const aEnd = a.exhibition_id?.end_date ? new Date(a.exhibition_id.end_date) : new Date(8640000000000000);
        const bEnd = b.exhibition_id?.end_date ? new Date(b.exhibition_id.end_date) : new Date(8640000000000000);
        return aEnd - bEnd;
      }),
    ...orders.filter(order => order.status === 'used')
  ];

  return (
    <div className="w-full">
      <div className="w-full flex justify-center mb-2">
        <span className="text-xs text-gray-500">티켓 카드를 클릭하면 QR을 확인할 수 있습니다.</span>
      </div>
      <div className="flex flex-col items-center gap-4 w-full">
        <div className="grid gap-4 w-full">
          {sortedOrders.slice(0, visibleOrders).map((order) => {
            const today = dayjs().startOf('day');
            const endDate = order.exhibition_id?.end_date ? dayjs(order.exhibition_id.end_date).endOf('day') : null;
            const isExpired = endDate && today.isAfter(endDate, 'day');
            const handleCardClick = (e) => {
              if (isExpired) {
                e.preventDefault();
                toast.error("사용불가", "전시가 종료되어 티켓 사용이 불가합니다.");
                return;
              }
            };
            return (
              <Link
                key={order.order_id}
                href={`/mypage/order-detail?order_id=${order.order_id}&exhibition_id=${order.exhibition_id.id}&user_id=${user.id}&people_count=${order.people_count}&amount=${order.amount}&created_at=${encodeURIComponent(order.created_at)}`}
                className="w-full no-underline"
                onClick={handleCardClick}
                style={isExpired ? { pointerEvents: 'auto', opacity: 0.6, cursor: 'not-allowed' } : {}}
              >
                <Card 
                  className="w-full hover:shadow-md transition-shadow duration-200 relative"
                  isPressable
                >
                  <CardBody className="flex gap-4 flex-row justify-center items-center">
                    <div className="relative w-24 h-24 flex-shrink-0 rounded overflow-hidden">
                      {order.exhibition_id && order.exhibition_id.photo ? (
                        <Image
                          src={order.exhibition_id.photo}
                          alt={order.exhibition_id.contents || "전시회 이미지"}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-xs">이미지 없음</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col w-full min-w-0">
                      <div className="flex flex-row justify-between items-start">
                        <div className="flex flex-col min-w-0">
                          <div className="text-base font-bold truncate flex items-center gap-2">
                            {(order.exhibition_id?.contents?.length > 10
                              ? order.exhibition_id.contents.slice(0, 10) + "..."
                              : order.exhibition_id?.contents) || "알 수 없는 전시회"}
                            {order.status === 'used' && (
                              <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold flex items-center">
                                <svg className="w-3 h-3 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.071 7.071a1 1 0 01-1.414 0l-3.536-3.535a1 1 0 111.414-1.415l2.829 2.829 6.364-6.364a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                사용됨
                              </span>
                            )}
                            {order.status !== 'used' && order.exhibition_id?.end_date && (() => {
                              const today = dayjs();
                              const endDate = dayjs(order.exhibition_id.end_date);
                              const daysLeft = endDate.diff(today, 'day');
                              if (daysLeft >= 0) {
                                return (
                                  <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-bold flex items-center">
                                    <svg className="w-3 h-3 mr-1 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1a1 1 0 102 0V3a1 1 0 00-1-1zm6 0a1 1 0 00-1 1v1a1 1 0 102 0V3a1 1 0 00-1-1zM4.22 5.22a1 1 0 011.42 0l.71.7a1 1 0 01-1.42 1.42l-.7-.71a1 1 0 010-1.41zm9.19.7a1 1 0 011.42-1.42l.7.71a1 1 0 01-1.41 1.42l-.71-.71zM10 6a4 4 0 00-4 4v2a4 4 0 004 4 4 4 0 004-4v-2a4 4 0 00-4-4zm-2 4a2 2 0 114 0v2a2 2 0 11-4 0v-2zm-6 2a1 1 0 011-1h1a1 1 0 110 2H3a1 1 0 01-1-1zm14 0a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zm-9.78 3.78a1 1 0 011.42 0l.71.7a1 1 0 01-1.42 1.42l-.7-.71a1 1 0 010-1.41zm9.19.7a1 1 0 011.42-1.42l.7.71a1 1 0 01-1.41 1.42l-.71-.71zM10 18a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" /></svg>
                                  종료 {daysLeft}일 전
                                </span>
                              );
                            }
                            return null;
                          })()}
                          </div>
                        </div>
                      </div>

                      <Divider orientation="horizontal" className="bg-gray-300 my-2" />
                      
                      <div className="text-xs flex flex-col my-2">
                        <div className="flex flex-row gap-1 items-center">
                          <FaMoneyBillWaveAlt className="w-3 h-3 text-[#007AFF]" />
                          <span>결제금액: {Number(order.amount).toLocaleString()}원</span>
                        </div>
                        <div className="flex flex-row gap-1 items-center mt-1">
                          <FaCalendar className="w-3 h-3 text-[#007AFF]" />
                          <span>인원: {order.people_count}명 / 주문일: {new Date(order.created_at).toLocaleDateString('ko-KR')}</span>
                        </div>
                      </div>
                      {/* 티켓 확인(클릭) 깜빡임 효과 */}
                      <motion.div
                        className="absolute bottom-2 right-4 flex items-center gap-1 select-none"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <span className="text-[11px] font-bold text-blue-600">티켓 확인(클릭)</span>
                      </motion.div>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            );
          })}
          {sortedOrders.length > visibleOrders && (
            <div className="flex justify-center w-full mt-2">
              <button
                className="text-gray-500 text-2xl font-bold hover:cursor-pointer px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200"
                onClick={() => setVisibleOrders(visibleOrders + 4)}
                aria-label="더보기"
              >
                ...
              </button>
            </div>
          )}
        </div>

        {orders.length > visibleOrders && (
          <div className="flex justify-center mt-4 mb-8">
            <FaPlus
              className="text-gray-500 text-2xl font-bold hover:cursor-pointer"
              onClick={loadMoreOrders}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory; 