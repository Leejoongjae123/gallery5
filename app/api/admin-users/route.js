import { createClient } from '@supabase/supabase-js';

export async function GET(req) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  // 모든 유저 정보 가져오기 (관리자 권한 필요)
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  // 필요한 정보만 추출 (UID, display_name, email, provider)
  const users = data.users.map(u => ({
    id: u.id,
    email: u.email,
    display_name: u.user_metadata?.full_name || u.user_metadata?.name || u.email || u.id,
    provider: u.app_metadata?.provider || 'email',
  }));

  return new Response(JSON.stringify(users), { status: 200 });
} 