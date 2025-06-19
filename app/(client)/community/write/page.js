"use client";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Button, Textarea, Input } from "@heroui/react";

export default function CommunityWrite() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async () => {
    if (!title || !content) {
      alert("제목과 내용을 입력하세요");
      return;
    }
    setIsSaving(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      alert("로그인이 필요합니다");
      router.push("/login");
      return;
    }
    const { error, data } = await supabase.from("community_post").insert({
      title,
      content,
      user_id: session.user.id,
      likes: 0,
      created_at: new Date().toISOString(),
    }).select().single();
    setIsSaving(false);
    if (error) {
      console.log("error", error);
      alert("저장 실패");
    } else {
      router.replace(`/community/${data.id}`);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-[600px] mx-auto px-4 py-6 gap-4">
      <h1 className="text-2xl font-bold">게시글 작성</h1>
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="제목"
      />
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="내용"
        minRows={8}
      />
      <Button color="primary" isLoading={isSaving} onPress={handleSubmit} className="w-full">
        등록
      </Button>
    </div>
  );
} 