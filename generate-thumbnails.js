const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // 서비스 롤 키 필요!
);

const BUCKET = 'gallery'; // 실제 사용중인 버킷명

async function generateThumbnails() {
  // 1. 버킷의 모든 이미지 리스트 가져오기
  const { data: files, error } = await supabase.storage.from(BUCKET).list('', { limit: 1000 });
  if (error) throw error;

  for (const file of files) {
    if (file.name.startsWith('thumbnails/')) continue; // 이미 썸네일이면 건너뜀
    if (!file.name.match(/\.(jpg|jpeg|png|webp)$/i)) continue; // 이미지 파일만

    // 2. 이미지 다운로드
    const { data, error: downloadError } = await supabase.storage.from(BUCKET).download(file.name);
    if (downloadError) continue;

    // 3. sharp로 썸네일 생성
    const buffer = Buffer.from(await data.arrayBuffer());
    const thumbnail = await sharp(buffer)
      .resize(400, 200)
      .jpeg({ quality: 70 })
      .toBuffer();

    // 4. 썸네일 업로드
    const thumbPath = `thumbnails/${file.name}`;
    await supabase.storage.from(BUCKET).upload(thumbPath, thumbnail, {
      upsert: true,
      contentType: 'image/jpeg'
    });

    console.log(`썸네일 생성 완료: ${thumbPath}`);
  }
}

generateThumbnails().then(() => {
  console.log('모든 썸네일 생성 완료!');
  process.exit(0);
}); 