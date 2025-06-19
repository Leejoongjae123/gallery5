import { useRouter } from 'next/router';
import { useSupabase } from '@supabase/auth-helpers-react';
import { useUser } from '@supabase/auth-helpers-react';
import { useEffect, useState } from 'react';

const SuccessPage = () => {
  const router = useRouter();
  const supabase = useSupabase();
  const user = useUser();
  const [isArtist, setIsArtist] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (user) {
      setUser(user);
      // profiles 동기화: 이름/이메일 저장
      supabase.from('profiles').upsert({
        id: user.id,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
        email: user.email,
      });
      // ...이하 기존 코드 유지
      const { data: profileData, error: profileError } = supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .eq('isArtistApproval', true)
        .single();  
      if (profileData) {
        setIsArtist(profileData.isArtist);
        setProfile(profileData);
      }
    } else {
      // 로그인되지 않은 경우 로그인 페이지로 리디렉션
      router.push("/mypage");
    }
  }, [user, supabase, router]);

  return (
    <div>
      {/* 기존 코드 유지 */}
    </div>
  );
};

export default SuccessPage; 