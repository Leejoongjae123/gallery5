#!/usr/bin/env node
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs/promises';

// 환경 변수 필요: SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('❌  SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 환경 변수가 없습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function ensureWebpForImage(url) {
  if (!url) return null;
  if (url.endsWith('.webp')) return null; // 이미 webp

  const webpUrl = url.replace(/\.(jpg|jpeg|png)$/i, '.webp');

  // Storage 경로 추출
  const match = url.match(/storage\.supabase\.co\/(?:v1\/object\/public\/)?([^/]+)\/(.*)$/);
  if (!match) return null;
  const bucket = match[1];
  const filepath = match[2];

  const webpPath = filepath.replace(/\.(jpg|jpeg|png)$/i, '.webp');

  // ===== 0) 아바타 버킷에 잘못 들어간 상품 이미지 처리 =====
  if (bucket === 'avatars') {
    try {
      // 원본 다운로드
      const { data: origRes, error: dlErr } = await supabase.storage.from('avatars').download(filepath);
      if (dlErr || !origRes) {
        console.error('avatars 다운로드 실패', filepath, dlErr?.message);
        return null;
      }
      const origBuf = Buffer.from(await origRes.arrayBuffer());
      const webpBuf = url.endsWith('.webp') ? origBuf : await sharp(origBuf).webp({ quality: 80 }).toBuffer();

      const targetBucket = 'product';
      const targetPath = `product/${path.basename(webpPath)}`; // product/product/<file>.webp

      // 업로드 (덮어쓰기 허용)
      const { error: upErr } = await supabase.storage.from(targetBucket).upload(targetPath, webpBuf, {
        contentType: 'image/webp', upsert: true
      });
      if (upErr) {
        console.error('product 버킷 업로드 실패', targetPath, upErr.message);
        return null;
      }

      const { data: pub } = supabase.storage.from(targetBucket).getPublicUrl(targetPath);
      console.log('🚚 avatars → product 이동', targetPath);
      return pub.publicUrl;
    } catch (e) {
      console.error('avatars 처리 중 예외', e);
      return null;
    }
  }

  // 이미 webp 존재하는지 확인
  const { data: existing } = await supabase.storage.from(bucket).list(path.dirname(webpPath), { search: path.basename(webpPath) });
  if (existing && existing.length) return webpUrl;

  // 원본 다운로드
  const { data: origRes, error: dlErr } = await supabase.storage.from(bucket).download(filepath);
  if (dlErr || !origRes) {
    console.error('다운로드 실패', filepath, dlErr?.message);
    return null;
  }
  const buf = Buffer.from(await origRes.arrayBuffer());
  // webp 변환
  const webpBuf = await sharp(buf).webp({ quality: 80 }).toBuffer();
  // 업로드
  const { error: upErr } = await supabase.storage.from(bucket).upload(webpPath, webpBuf, {
    contentType: 'image/webp', upsert: true
  });
  if (upErr) {
    console.error('업로드 실패', webpPath, upErr.message);
    return null;
  }
  console.log('✅ 생성', webpPath);
  return webpUrl;
}

async function run() {
  let page = 0;
  const pageSize = 100;
  while (true) {
    const { data: products, error } = await supabase
      .from('product')
      .select('id, image')
      .range(page * pageSize, page * pageSize + pageSize - 1);
    if (error) throw error;
    if (!products.length) break;

    for (const p of products) {
      if (!Array.isArray(p.image)) continue;
      let changed = false;
      const newImages = [];
      for (const img of p.image) {
        const newUrl = await ensureWebpForImage(img) || img;
        newImages.push(newUrl);
        if (newUrl !== img) changed = true;
      }
      if (changed) {
        const { error: upErr } = await supabase.from('product').update({ image: newImages }).eq('id', p.id);
        if (upErr) console.error('DB 업데이트 실패', p.id, upErr.message); else console.log('DB 업데이트', p.id);
      }
    }
    page += 1;
  }
  console.log('=== 완료 ===');
}

run(); 