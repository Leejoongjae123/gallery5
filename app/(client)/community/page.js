"use client";
import { useEffect, useState, Suspense } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button, Divider, Spinner } from "@heroui/react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { HiOutlineClock, HiOutlineTag, HiOutlineUser, HiOutlineEye, HiOutlineStar } from "react-icons/hi";

const PAGE_SIZE = 10;

function CommunityPageContent() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = parseInt(searchParams.get("page") || "1", 10);

  const [bestPosts, setBestPosts] = useState([]);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [searchField, setSearchField] = useState(searchParams.get("field") || "title_content");
  const [keyword, setKeyword] = useState(searchParams.get("q") || "");

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);

      // 베스트 4개
      const {
        data: best,
        error: bestErr,
      } = await supabase
        .from("community_post")
        .select("*, comments:community_comment(count)")
        .gte("likes", 10)
        .order("likes", { ascending: false })
        .limit(4);

      if (bestErr) console.log("bestErr", bestErr);
      setBestPosts(best || []);

      // 최신글 + 페이징 (베스트 제외)
      let query = supabase
        .from("community_post")
        .select("*, comments:community_comment(count)", { count: "exact" })
        .order("created_at", { ascending: false });

      // 검색
      if (keyword) {
        if (searchField === "title") query = query.ilike("title", `%${keyword}%`);
        else if (searchField === "content") query = query.ilike("content", `%${keyword}%`);
        else query = query.or(`title.ilike.%${keyword}%,content.ilike.%${keyword}%`);
      }

      const { data: list, error: listErr, count } = await query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      if (listErr) console.log("listErr", listErr);
      setPosts(list || []);
      setTotalCount(count || 0);
      setIsLoading(false);
    };
    fetchPosts();
  }, [page]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const changePage = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage);
    router.push(`/community?${params.toString()}`);
  };

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (keyword) params.set("q", keyword); else params.delete("q");
    params.set("field", searchField);
    params.set("page", "1");
    router.push(`/community?${params.toString()}`);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-[600px] mx-auto px-4 py-6">
      <div className="w-full flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">커뮤니티</h1>
        <Link href="/community/write">
          <Button color="primary">글쓰기</Button>
        </Link>
      </div>

      {/* 베스트 */}
      {bestPosts.length > 0 && (
        <div className="w-full mb-6">
          <h2 className="text-lg font-bold mb-2">🔥 베스트 게시글</h2>
          <div className="flex flex-col gap-2">
            {bestPosts.map((p) => (
              <li key={p.id} className="bg-[#e9f4ff] border-b border-blue-300 first:border-t border-blue-300">
                <Link href={`/community/${p.id}`} className="flex flex-col px-3 py-2 hover:bg-[#e0efff]">
                  <div className="flex items-center mb-1">
                    <span className="inline-block bg-blue-500 text-white text-[11px] rounded-sm px-1.5 py-[1px] mr-2">인기</span>
                    <span className="text-[15px] font-semibold break-keep">{p.title}{p.comments?.[0]?.count>0 && ` [${p.comments[0].count}]`}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-gray-600">
                    <HiOutlineClock className="w-3 h-3" /> {new Date(p.created_at).toLocaleDateString("ko-KR")} 
                    <HiOutlineTag className="w-3 h-3" /> {p.category || "커뮤니티"}
                    <HiOutlineUser className="w-3 h-3" /> {p.nickname || "익명"}
                    <HiOutlineEye className="w-3 h-3" /> {p.views || 0}
                    <HiOutlineStar className="w-3 h-3" /> {p.likes}
                  </div>
                </Link>
              </li>
            ))}
          </div>
          <Divider className="my-6 bg-gray-300" />
        </div>
      )}

      {/* 최신글 */}
      <h2 className="text-lg font-bold mb-2 w-full">최신 게시글</h2>
      {isLoading ? (
        <Spinner variant="wave" />
      ) : (
        <ul className="w-full flex flex-col gap-[2px]">
          {posts.map((p) => (
            <li key={p.id} className="border-b border-gray-300 first:border-t border-gray-300">
              <Link href={`/community/${p.id}`} className="flex flex-col px-3 py-[7px] hover:bg-gray-50">
                <span className="text-[15px] font-medium break-keep">{p.title}{p.comments?.[0]?.count>0 && ` [${p.comments[0].count}]`}</span>
                <div className="flex items-center gap-2 text-[11px] text-gray-600">
                  <HiOutlineClock className="w-3 h-3" /> {new Date(p.created_at).toLocaleDateString("ko-KR")} 
                  <HiOutlineTag className="w-3 h-3" /> {p.category || "커뮤니티"}
                  <HiOutlineUser className="w-3 h-3" /> {p.nickname || "익명"}
                  <HiOutlineEye className="w-3 h-3" /> {p.views || 0}
                  <HiOutlineStar className="w-3 h-3" /> {p.likes}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* 검색바 */}
      <div className="flex items-center gap-2 w-full border p-2 rounded">
        <select value={searchField} onChange={(e)=>setSearchField(e.target.value)} className="border px-2 py-1 text-sm rounded">
          <option value="title_content">제목+내용</option>
          <option value="title">제목</option>
          <option value="content">내용</option>
        </select>
        <input value={keyword} onChange={(e)=>setKeyword(e.target.value)} placeholder="검색어" className="flex-grow border px-2 py-1 text-sm rounded" />
        <button onClick={handleSearch} className="border px-4 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200">검색</button>
      </div>

      {/* 액션 버튼 */}
      <div className="flex justify-between w-full mt-3">
        <button className="border px-4 py-1 text-sm rounded bg-white hover:bg-gray-50">인기글</button>
        <Link href="/community/write" className="border px-4 py-1 text-sm rounded bg-white hover:bg-gray-50 flex items-center gap-1">
          ✏️ 쓰기
        </Link>
      </div>

      {/* 페이지네이션 */}
      <div className="flex flex-col items-center gap-3 mt-4 w-full">
        <div className="flex items-center gap-2">
          <button className="border px-3 py-1 text-sm rounded bg-white hover:bg-gray-50" disabled={page===1} onClick={()=>changePage(page-1)}>이전</button>
          {Array.from({ length: totalPages }, (_, i)=>i+1).slice(0,5).map(num=>(
            <button key={num} onClick={()=>changePage(num)} className={`border px-3 py-1 text-sm rounded ${num===page?"bg-gray-200 font-semibold":"bg-white hover:bg-gray-50"}`}>{num}</button>
          ))}
          <button className="border px-3 py-1 text-sm rounded bg-white hover:bg-gray-50" disabled={page===totalPages} onClick={()=>changePage(page+1)}>다음</button>
        </div>
        <div className="text-sm">{page} / {totalPages}</div>
      </div>
    </div>
  );
}

export default function CommunityPage() {
  return (
    <Suspense>
      <CommunityPageContent />
    </Suspense>
  );
} 