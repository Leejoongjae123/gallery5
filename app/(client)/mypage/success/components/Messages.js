"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Avatar, Card, CardBody, Spinner, Divider, Badge } from "@heroui/react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import Image from "next/image";
import { FaTag } from "react-icons/fa6";
import { FaMoneyBillWaveAlt } from "react-icons/fa";
import { MdDeleteForever } from "react-icons/md";
import { addToast } from "@heroui/react";
import { StreamChat } from 'stream-chat';
import { MdOutlineChat, MdMarkEmailRead, MdMarkEmailUnread } from "react-icons/md";

const Messages = ({ user }) => {
  const router = useRouter();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [chatStatuses, setChatStatuses] = useState({});
  
  useEffect(() => {
    const fetchChats = async () => {
      try {
        if (!user) return;
        
        const supabase = createClient();
        
        // 사용자가 참여한 모든 채팅 가져오기 (host_id 또는 user_id가 현재 사용자)
        const { data, error } = await supabase
          .from('chat_list')
          .select('*, product_id(*)')
          .or(`host_id.eq.${user.id},user_id.eq.${user.id}`);
        
        if (error) {
          console.log('채팅 목록 불러오기 오류:', error);
          return;
        }
        
        if (data) {
          setChats(data);
          
          // 채팅 참여자들의 프로필 정보를 가져오기
          const uniqueUserIds = new Set();
          data.forEach(chat => {
            if (chat.host_id !== user.id) uniqueUserIds.add(chat.host_id);
            if (chat.user_id !== user.id) uniqueUserIds.add(chat.user_id);
          });
          
          const profileData = {};
          for (const id of uniqueUserIds) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', id)
              .eq('isArtistApproval', true)
              .single();
            
            if (profile) {
              profileData[id] = profile;
            }
          }
          
          setProfiles(profileData);
          
          // GetStream에서 채팅 상태 가져오기
          await fetchStreamChannels(data);
        }
      } catch (error) {
        console.log('채팅 목록 불러오기 중 오류 발생:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [user]);
  
  // GetStream에서 채팅 목록과 마지막 메시지 정보를 함께 가져오기
  const fetchStreamChannels = async (chatList) => {
    try {
      if (!user || chatList.length === 0) return;
      
      // 스트림 토큰 가져오기
      const tokenResponse = await fetch('/api/stream/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      
      if (!tokenResponse.ok) {
        console.log('스트림 토큰 가져오기 실패');
        return;
      }
      
      const { token } = await tokenResponse.json();
      
      // 스트림 클라이언트 초기화 및 사용자 연결
      const chatClient = StreamChat.getInstance(process.env.NEXT_PUBLIC_STREAM_API_KEY);
      await chatClient.connectUser({ id: user.id }, token);
      
      // 사용자가 참여한 모든 채널 조회 (GetStream의 queryChannels 메서드 활용)
      const filter = { members: { $in: [user.id] } };
      const sort = [{ last_message_at: -1 }];
      
      const channels = await chatClient.queryChannels(filter, sort, {
        watch: true, // 실시간 업데이트 활성화
        state: true, // 채널 상태 포함
        messages: { limit: 10 } // 각 채널의 최근 메시지 10개 로드
      });
      
      // 채팅 상태 매핑
      const statuses = {};
      
      // 채널 ID와 채팅 ID 매핑을 위한 객체 생성
      const channelMapping = {};
      
      // 각 채팅방의 채널 ID 매핑 생성
      chatList.forEach(chat => {
        // 1. 기존 형식: productId-hostId-userId
        const channelId1 = `${chat.product_id.id}-${chat.host_id}-${chat.user_id}`;
        channelMapping[channelId1] = chat.id;
        
        // 2. chat_xxx 형식
        const channelId2 = `chat_${chat.id}`;
        channelMapping[channelId2] = chat.id;
        
        // 3. messaging:chat_xxx 형식 (cid 형식)
        const channelId3 = `messaging:chat_${chat.id}`;
        channelMapping[channelId3] = chat.id;
        
        // 4. 순수 숫자 ID만 추출한 맵핑도 추가 (chat_130 -> 130)
        const numericId = chat.id.toString();
        channelMapping[numericId] = chat.id;
        
        // 5. 채널 ID가 "chat_숫자" 형태일 경우를 대비해 숫자만 추출하여 매핑
        const match = channelId2.match(/chat_(\d+)/);
        if (match && match[1]) {
          channelMapping[match[1]] = chat.id;
        }
      });
      
      console.log('채널 ID 매핑 테이블:', channelMapping);
      
      // 채널별 마지막 메시지 정보 확인
      channels.forEach(channel => {
        // 여러 방식으로 채널 ID 추출 시도
        const channelId = channel.id;
        const cid = channel.cid; // 예: messaging:chat_130
        
        // cid에서 타입 제거 (messaging:chat_130 -> chat_130)
        const cidWithoutType = cid.split(':')[1];
        
        // chat_숫자 형태에서 숫자만 추출 (chat_130 -> 130)
        let numericId = null;
        const match = channelId.match(/chat_(\d+)/);
        if (match && match[1]) {
          numericId = match[1];
        }
        
        console.log('채널 정보:', { 
          id: channelId, 
          cid: cid,
          cidWithoutType: cidWithoutType,
          numericId: numericId
        });
        
        // 여러 ID 형식으로 매핑 시도
        let chatId = channelMapping[channelId] || 
                    channelMapping[cid] || 
                    channelMapping[cidWithoutType] || 
                    (numericId ? channelMapping[numericId] : null);
        
        // 추가 검사: channel.data에서 정보 확인
        if (!chatId && channel.data) {
          // 1. productId가 있는 경우
          if (channel.data.productId) {
            const matchedChat = chatList.find(chat => 
              chat.product_id.id.toString() === channel.data.productId.toString()
            );
            if (matchedChat) {
              chatId = matchedChat.id;
              console.log(`productId ${channel.data.productId}로 매칭된 채팅 ID:`, chatId);
            }
          }
          
          // 2. 채널 이름에 채팅 ID가 포함된 경우 (예: 채널 이름이 "chat_123"인 경우)
          if (channel.data.name && !chatId) {
            const nameMatch = channel.data.name.match(/chat_(\d+)/);
            if (nameMatch && nameMatch[1]) {
              const idFromName = nameMatch[1];
              const matchedChat = chatList.find(chat => chat.id.toString() === idFromName);
              if (matchedChat) {
                chatId = matchedChat.id;
                console.log(`채널 이름 ${channel.data.name}에서 추출한 ID로 매칭된 채팅:`, chatId);
              }
            }
          }
        }
        
        if (!chatId) {
          console.log('매핑되지 않은 채널:', { id: channelId, cid: cid });
          return; // 매핑된 채팅이 없는 경우 건너뜀
        }
        
        // 채널에 메시지가 있는지 확인
        const messages = channel.state.messages;
        if (messages && messages.length > 0) {
          // 마지막 메시지 가져오기
          const lastMessage = messages[messages.length - 1];
          
          // 마지막 메시지 발신자가 현재 사용자인지 확인
          const isMyLastMessage = lastMessage.user.id === user.id;
          
          statuses[chatId] = isMyLastMessage ? 'responded' : 'waiting';
          console.log(`채팅 ID ${chatId}의 마지막 메시지 발신자: ${lastMessage.user.id}, 상태: ${isMyLastMessage ? '응답 완료' : '응답 대기 중'}`);
        } else {
          // 메시지가 없는 경우
          statuses[chatId] = 'new';
          console.log(`채팅 ID ${chatId}에는 메시지가 없음, 상태: 새 채팅`);
        }
      });
      
      console.log('채팅별 최종 상태:', statuses);
      setChatStatuses(statuses);
      
      // 사용자 연결 해제
      await chatClient.disconnectUser();
      
    } catch (error) {
      console.log('Stream 채널 조회 오류:', error.message || error);
    }
  };

  const getLastMessageTime = (updatedAt) => {
    if (!updatedAt) return '';
    return formatDistanceToNow(new Date(updatedAt), { addSuffix: true, locale: ko });
  };

  const getChatPartnerName = (chat) => {
    const isHost = chat.host_id === user.id;
    const partnerId = isHost ? chat.user_id : chat.host_id;
    const partnerProfile = isHost ? chat.user_profiles : chat.profiles;
    
    if (partnerProfile) {
      return partnerProfile.full_name || partnerProfile.email || '이름 없음';
    }
    
    return '사용자';
  };

  const handleChatClick = (chat) => {
    // 원래 코드
    const isHost = chat.host_id === user.id;
    const userId = user.id;
    const hostId = isHost ? chat.user_id : chat.host_id;
    const productId = chat.product_id.id;
    
    router.push(`/chat?userId=${userId}&hostId=${hostId}&productId=${productId}`);
  };

  // 채팅 삭제 핸들러
  const handleDeleteChat = async (e, chat) => {
    e.stopPropagation(); // 이벤트 버블링 중지
    
    if (isDeleting) return; // 이미 삭제 중이면 중복 요청 방지
    
    try {
      setIsDeleting(true);
      
      if (!chat || !chat.id) {
        addToast({
          title: "오류 발생",
          description: "채팅 정보를 찾을 수 없습니다.",
          color: "danger",
        });
        return;
      }

      const isHost = chat.host_id === user.id;
      const userId = user.id;
      const hostId = isHost ? chat.user_id : chat.host_id;
      
      // 채널 ID 생성
      const channelId = `${chat.product_id.id}-${chat.host_id}-${chat.user_id}`;
      
      // 서버 측 API를 통해 채팅 삭제 요청
      const response = await fetch('/api/chat/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: chat.id,
          channelId: channelId,
          userId: userId,
          hostId: hostId,
          productId: chat.product_id.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        addToast({
          title: "삭제 실패",
          description: errorData.error || "채팅 삭제 중 오류가 발생했습니다.",
          color: "danger",
        });
        return;
      }

      const result = await response.json();
      console.log("채팅 삭제 결과:", result);

      addToast({
        title: "삭제 완료",
        description: "채팅이 성공적으로 삭제되었습니다.",
        color: "success",
      });

      // UI에서 삭제된 채팅 제거
      setChats(prevChats => prevChats.filter(c => c.id !== chat.id));
      
    } catch (error) {
      console.log("채팅 삭제 오류:", error);
      addToast({
        title: "오류 발생",
        description: "채팅 삭제 중 문제가 발생했습니다.",
        color: "danger",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // 채팅 상태에 따른 배지 렌더링
  const renderStatusBadge = (chatId) => {
    const status = chatStatuses[chatId];
    
    if (!status || status === 'unknown') {
      return null;
    }
    
    if (status === 'new') {
      return (
        <Badge color="secondary" className="font-medium flex items-center gap-1">
          <MdOutlineChat className="text-base" />
          <span>새로운 채팅</span>
        </Badge>
      );
    }
    
    if (status === 'waiting') {
      return (
        <Badge color="danger" className="font-medium flex items-center gap-1">
          <span className="text-sm font-bold text-red-500">연락을 기다리는 중</span>
        </Badge>
      );
    }
    
    if (status === 'responded') {
      return (
        <Badge color="success" className="font-medium flex items-center gap-1">
          <span className="text-sm font-bold text-green-500">연락 완료</span>
        </Badge>
      );
    }
    
    return null;
  };

  // 채팅 상태에 따른 카드 테두리 스타일 결정
  const getCardBorderStyle = (chatId) => {
    const status = chatStatuses[chatId];
    
    if (!status || status === 'unknown') {
      return '';
    }
    
    if (status === 'new') {
      return 'border-secondary';
    }
    
    if (status === 'waiting') {
      return 'border-info border-2';
    }
    
    if (status === 'responded') {
      return 'border-success';
    }
    
    return '';
  };

  // 가격 형식화 (천 단위 콤마)
  const formatPrice = (price) => {
    return price?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8 w-full">
        <Spinner variant="wave" color="primary" />
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 w-full">
        <p className="text-gray-500">메시지 내역이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="grid gap-4 w-full">
        {chats.map((chat) => (
          <Card 
            key={chat.id} 
            className={`w-full max-w-full ${getCardBorderStyle(chat.id)}`}
            isPressable
            onPress={() => handleChatClick(chat)}
          >
            <CardBody className="flex gap-4 flex-row justify-center items-center cursor-pointer">
              <div className="relative w-24 h-24 flex-shrink-0 rounded overflow-hidden">
                <Image 
                  src={chat.product_id.image[0] || "/noimage.jpg"} 
                  alt="제품 이미지" 
                  fill
                  className="object-cover"
                />
              </div>
              
              <div className="flex flex-col w-full min-w-0">
                <div className="flex flex-row justify-between items-start">
                  <div className="flex flex-col min-w-0">
                    <div className="text-xs text-gray-500">
                      채팅
                    </div>
                    <div className="text-lg font-bold truncate">
                      {chat.product_id.name}
                    </div>
                  </div>
                  
                  {/* 삭제 아이콘 추가 */}
                  <button 
                    onClick={(e) => handleDeleteChat(e, chat)}
                    disabled={isDeleting}
                    className={`text-gray-500 hover:text-gray-700 transition-colors ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    aria-label="채팅 삭제"
                  >
                    {isDeleting ? (
                      <Spinner size="sm" color="primary" />
                    ) : (
                      <MdDeleteForever size={22} className='text-[#007AFF] hover:scale-110' />
                    )}
                  </button>
                </div>

                <Divider orientation="horizontal" className="bg-gray-300" />
                
                <div className="text-xs flex flex-col my-2">
                  <div className="flex flex-row gap-1 items-center">
                    <FaMoneyBillWaveAlt className="w-3 h-3 text-[#007AFF]" />
                    {formatPrice(chat.product_id.price)}원
                  </div>
                  <div className="flex flex-row gap-1 items-center mt-1">
                    <span className="text-gray-500">
                      {getLastMessageTime(chat.updated_at)}
                    </span>
                  </div>
                  
                  {/* 응답 상태 표시 */}
                  <div className="mt-2 flex justify-end">
                    {renderStatusBadge(chat.id)}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Messages; 