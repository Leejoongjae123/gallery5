'use client'
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {createClient} from '@/utils/supabase/client';
import {useState,useEffect} from 'react'
export default function BottomNavigation() {
  const pathname = usePathname();
  const supabase = createClient();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-50">
      <div className="flex justify-around items-center h-16">
        <Link href="/" className={`flex flex-col items-center justify-center w-1/4 h-full ${pathname === '/' ? 'text-[#007AFF]' : 'text-gray-500 hover:text-[#007AFF]'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-xs mt-1">홈</span>
        </Link>
        <Link href="/magazineList" className={`flex flex-col items-center justify-center w-1/4 h-full ${pathname.startsWith('/magazine') ? 'text-[#007AFF]' : 'text-gray-500 hover:text-[#007AFF]'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5V6.5A2.5 2.5 0 016.5 4H20v13M4 19.5V21h16v-1.5" />
          </svg>
          <span className="text-xs mt-1">매거진</span>
        </Link>
        <Link href="/artstore" className={`flex flex-col items-center justify-center w-1/4 h-full ${pathname.startsWith('/artstore') ? 'text-[#007AFF]' : 'text-gray-500 hover:text-[#007AFF]'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14l1 12H4L5 8zm2-3a3 3 0 016 0v3" />
          </svg>
          <span className="text-xs mt-1">아트샵</span>
        </Link>
        
        <Link href="/mypage" className={`flex flex-col items-center justify-center w-1/4 h-full ${pathname.startsWith('/mypage') ? 'text-[#007AFF]' : 'text-gray-500 hover:text-[#007AFF]'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-xs mt-1">마이페이지</span>
        </Link>
      </div>
    </div>
  );
}