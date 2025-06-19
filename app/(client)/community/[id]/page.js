"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { Button, Spinner, Divider } from "@heroui/react";
import { HiOutlineClock, HiOutlineUser, HiOutlineEye, HiOutlineStar, HiOutlineLink } from "react-icons/hi";
import Link from "next/link";

export default function CommunityDetail() {
  const { id } = useParams();
  const supabase = createClient();
  const router = useRouter();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [likeLoading, setLikeLoading] = useState(false);
  const [copyMsg, setCopyMsg] = useState("");

  useEffect(() => {
    const fetchPost = async () => {
      const { data, error } = await supabase
        .from("community_post")
        .select("*")
        .eq("id", id)
        .single();
      if (error || !data) {
        router.replace("/community");
      } else {
        setPost(data);
        setLoading(false);
        // 조회수 +1
        supabase
          .from("community_post")
          .update({ views: (data.views || 0) + 1 })
          .eq("id", id);
      }
    };
    if (id) fetchPost();
  }, [id]);

  const handleLike = async () => {
    if (!post) return;
    setLikeLoading(true);
    // 증가 후 값을 돌려받기 위해 row_level update
    const { data, error } = await supabase
      .from("community_post")
      .update({ likes: post.likes + 1 })
      .eq("id", id)
      .select()
      .single();
    setLikeLoading(false);
    if (!error && data) setPost(data);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyMsg("링크 복사 완료!");
      setTimeout(() => setCopyMsg(""), 2000);
    } catch (e) {
      alert("복사 실패: " + e.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-screen">
        <Spinner variant="wave" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-[700px] mx-auto px-4 py-6 gap-6">
      {/* 제목 영역 */}
      <div className="w-full">
        <div className="flex items-start gap-2 mb-2">
          <span className="inline-block bg-blue-600 text-white text-[11px] font-semibold rounded px-1.5 py-[2px]">커뮤니티</span>
          <h1 className="text-2xl font-bold break-words leading-snug flex-1">{post.title}</h1>
        </div>
        {/* 메타 정보 */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
          <HiOutlineClock className="w-3 h-3" /> {new Date(post.created_at).toLocaleString("ko-KR")}
          <HiOutlineUser className="w-3 h-3" /> {post.nickname || post.user_id || "익명"}
          {typeof post.views !== "undefined" && (<><HiOutlineEye className="w-3 h-3" /> {post.views}</>)}
          <HiOutlineStar className="w-3 h-3" /> {post.likes}
          {/* 링크 복사 */}
          <button onClick={handleCopyLink} className="ml-auto flex items-center gap-1 text-blue-600 hover:underline">
            <HiOutlineLink className="w-4 h-4" /> 복사
          </button>
        </div>
      </div>

      <Divider className="bg-gray-300" />

      {/* 본문 */}
      <div className="w-full whitespace-pre-wrap leading-relaxed text-[15px]">
        {post.content}
      </div>

      <Divider className="bg-gray-300" />

      {/* 추천 버튼 */}
      <div className="w-full flex justify-center">
        <Button
          color="warning"
          size="lg"
          radius="sm"
          isLoading={likeLoading}
          onPress={handleLike}
          className="font-semibold px-8 py-3 text-[15px]"
        >
          👍 추천하기 ({post.likes})
        </Button>
      </div>

      {/* 목록으로 */}
      <div className="self-end">
        <Button size="sm" variant="light" onPress={() => router.back()}>
          목록으로
        </Button>
      </div>

      {copyMsg && <div className="text-xs text-green-600 mt-1">{copyMsg}</div>}
    </div>
  );
} 