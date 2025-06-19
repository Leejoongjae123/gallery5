import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // FormData에서 파일 받기
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: '파일이 없습니다.' },
        { status: 400 }
      );
    }

    // 파일 크기 제한 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: '파일 크기는 5MB 이하여야 합니다.' },
        { status: 400 }
      );
    }

    // 이미지 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: '이미지 파일만 업로드 가능합니다.' },
        { status: 400 }
      );
    }

    // 파일명 생성 (타임스탬프 + 원본 파일명)
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_'); // 특수문자 제거
    const fileName = `${timestamp}_${originalName}`;

    // 파일을 ArrayBuffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // sharp로 WebP 변환
    const webpBuffer = await sharp(uint8Array).webp({ quality: 80 }).toBuffer();
    const webpFileName = `${timestamp}_${originalName.replace(/\.[^.]+$/, '')}.webp`;

    // Supabase Storage에 WebP 업로드
    const { data, error } = await supabase.storage
      .from('product')
      .upload(webpFileName, webpBuffer, {
        contentType: 'image/webp',
        upsert: false
      });

    if (error) {
      return NextResponse.json(
        { error: '파일 업로드에 실패했습니다: ' + error.message },
        { status: 500 }
      );
    }

    // 업로드된 파일의 공개 URL 생성
    const { data: urlData } = supabase.storage
      .from('product')
      .getPublicUrl(data.path);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      fileName: webpFileName
    });

  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 