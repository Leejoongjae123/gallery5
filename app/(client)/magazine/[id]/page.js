"use client";
import React from "react";
import { Button, Card, CardBody, Divider, Image, Spinner } from "@heroui/react";
import { FaChevronLeft } from "react-icons/fa";
import { useRouter } from "next/navigation";
import MagazineCarousel from "./components/magazine-carousel";
import { useEffect, useState, use } from "react";
import { createClient } from "@/utils/supabase/client";
import {FaArrowLeft} from "react-icons/fa";
import { motion } from "framer-motion";

export default function page({params}) {
  const magazineId = use(params)['id'];
  const [magazine, setMagazine] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();
  
  const getMagazineData = async() => {
    try {
      const {data, error} = await supabase.from('magazine').select('*').eq('id', magazineId).single();
      setMagazine(data);
    } catch (error) {
      console.log("매거진 데이터 로드 중 오류:", error);
    } finally {
      setLoading(false);
    }
  }
  
  useEffect(() => {
    getMagazineData();
  }, []);
  console.log('magazine:',magazine);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-screen">
        <Spinner variant="wave" size="lg" color="primary" />
      </div>
    );
  }
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="flex flex-col items-center justify-center"
    >
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white flex items-center w-full h-12"
      >
        <div className="w-12 flex justify-start items-center">
          <Button
            isIconOnly
            variant="light"
            onPress={() => router.back()}
          >
            <FaArrowLeft className="text-xl" />
          </Button>
        </div>
        <h2 className="flex-1 text-lg font-bold text-center">매거진</h2>
        <div className="w-12" />
      </motion.div>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="w-[100%] flex flex-col gap-4"
      >
        <MagazineCarousel magazine={magazine}/>
      </motion.div>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4 }}
        className="flex flex-col gap-2 my-4 w-[100%] mb-24 px-8"
      >
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-[20px] font-bold"
        >
          {magazine.title}
        </motion.div>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="text-[15px] font-medium text-gray-500 flex items-center"
        >
          {magazine.subtitle === '전시나그네' && (
            <a href="https://www.instagram.com/exhibition_wanderer/" target="_blank" rel="noopener noreferrer">
              <span className="inline-block w-7 h-7 rounded-full bg-white shadow-lg mr-1 flex items-center justify-center">
                <img src="https://teaelrzxuigiocnukwha.supabase.co/storage/v1/object/public/notification//imgi_1_272626601_246980864252824_1484718971353683993_n.jpg" alt="author" className="w-5 h-5 rounded-full object-cover" style={{margin: '2px'}} />
              </span>
            </a>
          )}
          {magazine.subtitle}
        </motion.div>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-end text-[10px] text-[#494949]"
        >
          작성일 :{" "}{new Date(magazine.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
        </motion.div>
        <Divider orientation="horizontal" className="w-full my-2"/>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="text-[14px] text-black"
        >
          {/<[a-z][\s\S]*>/i.test(magazine.contents) || magazine.contents?.includes('<') ? (
            <div dangerouslySetInnerHTML={{ __html: magazine.contents
              .replace(/Powered by/g, '')
              .replace(/<a[^>]*froala[^>]*>.*?<\/a>/gi, '') }} />
          ) : (
            magazine.contents
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
