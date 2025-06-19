"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function ClientAuthGuard() {
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const guard = async () => {
      // 1) 현재 세션 얻기
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.log("세션 조회 오류:", sessionError);
        return;
      }

      // 2) 세션은 있지만 프로필이 없거나 role이 'client'가 아니면,
      if (session?.user?.id) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        // 프로필 자체가 없거나, client 권한이 아닌 경우
        if (profileError || !profile || profile.role !== "client") {
          // 강제 로그아웃
          await supabase.auth.signOut();
          // 클라이언트 로그인 페이지로 이동
          router.replace("/mypage");
        }
      }
    };

    guard();
  }, [router, supabase]);

  return null;
} 