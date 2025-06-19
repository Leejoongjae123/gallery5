import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import fetch from 'node-fetch';

const supabase = createClient(
  'https://teaelrzxuigiocnukwha.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlYWVscnp4dWlnaW9jbnVrd2hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE1ODkzMTIsImV4cCI6MjA1NzE2NTMxMn0.H9MLjMOBFXSaq0O6mX8GQlZaVAbk0ZBFn3ABtX2WIws'
);

const buckets = ['events', 'avatars', 'magazine', 'banner', 'exhibition', 'gallery', 'product', 'notification'];

async function convertAndMigrate(bucket) {
  const { data: files } = await supabase.storage.from(bucket).list('', { limit: 1000 });
  for (const file of files) {
    if (file.name.match(/\.(jpg|jpeg|png)$/i)) {
      const { data: fileData } = await supabase.storage.from(bucket).download(file.name);
      const buffer = Buffer.from(await fileData.arrayBuffer());
      const webpBuffer = await sharp(buffer).webp({ quality: 80 }).toBuffer();
      const webpName = file.name.replace(/\.[^.]+$/, '.webp');
      await supabase.storage.from(bucket).upload(webpName, webpBuffer, { upsert: true, contentType: 'image/webp' });
      console.log(`[${bucket}] ${file.name} → ${webpName} 변환 완료`);
    }
  }
  if (bucket === 'exhibition') {
    const { data: subFiles } = await supabase.storage.from(bucket).list('exhibition', { limit: 1000 });
    for (const file of subFiles || []) {
      if (file.name.match(/\.(jpg|jpeg|png)$/i)) {
        const filePath = `exhibition/${file.name}`;
        const { data: fileData } = await supabase.storage.from(bucket).download(filePath);
        const buffer = Buffer.from(await fileData.arrayBuffer());
        const webpBuffer = await sharp(buffer).webp({ quality: 80 }).toBuffer();
        const webpName = filePath.replace(/\.[^.]+$/, '.webp');
        await supabase.storage.from(bucket).upload(webpName, webpBuffer, { upsert: true, contentType: 'image/webp' });
        console.log(`[${bucket}/exhibition] ${filePath} → ${webpName} 변환 완료`);
      }
    }
  }
  if (bucket === 'gallery') {
    const { data: subFiles } = await supabase.storage.from(bucket).list('gallery', { limit: 1000 });
    for (const file of subFiles || []) {
      if (file.name.match(/\.(jpg|jpeg|png)$/i)) {
        const filePath = `gallery/${file.name}`;
        const { data: fileData } = await supabase.storage.from(bucket).download(filePath);
        const buffer = Buffer.from(await fileData.arrayBuffer());
        const webpBuffer = await sharp(buffer).webp({ quality: 80 }).toBuffer();
        const webpName = filePath.replace(/\.[^.]+$/, '.webp');
        await supabase.storage.from(bucket).upload(webpName, webpBuffer, { upsert: true, contentType: 'image/webp' });
        console.log(`[${bucket}/gallery] ${filePath} → ${webpName} 변환 완료`);
      }
    }
  }
  if (bucket === 'product') {
    const { data: subFiles } = await supabase.storage.from(bucket).list('product', { limit: 1000 });
    for (const file of subFiles || []) {
      if (file.name.match(/\.(jpg|jpeg|png)$/i)) {
        const filePath = `product/${file.name}`;
        const { data: fileData } = await supabase.storage.from(bucket).download(filePath);
        const buffer = Buffer.from(await fileData.arrayBuffer());
        const webpBuffer = await sharp(buffer).webp({ quality: 80 }).toBuffer();
        const webpName = filePath.replace(/\.[^.]+$/, '.webp');
        await supabase.storage.from(bucket).upload(webpName, webpBuffer, { upsert: true, contentType: 'image/webp' });
        console.log(`[${bucket}/product] ${filePath} → ${webpName} 변환 완료`);
      }
    }
  }
}

async function migrateExternalImages(table, column, bucket) {
  const { data: rows, error } = await supabase.from(table).select(`id,${column}`);
  if (error) {
    console.error(`[${table}] 테이블 조회 실패:`, error);
    return;
  }
  for (const row of rows || []) {
    const url = row[column];
    if (url && !url.includes('supabase.co')) {
      try {
        const response = await fetch(url);
        const buffer = await response.buffer();
        const webpBuffer = await sharp(buffer).webp({ quality: 80 }).toBuffer();
        const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.webp`;
        await supabase.storage.from(bucket).upload(fileName, webpBuffer, { contentType: 'image/webp', upsert: true });
        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
        await supabase.from(table).update({ [column]: publicUrl }).eq('id', row.id);
        console.log(`[${table}] 외부 → 내부 이관: ${url} → ${publicUrl}`);
      } catch (e) {
        console.error(`[${table}] 이관 실패:`, url, e);
      }
    }
  }
}

(async () => {
  for (const bucket of buckets) {
    await convertAndMigrate(bucket);
  }
  await migrateExternalImages('gallery', 'thumbnail', 'gallery');
  await migrateExternalImages('exhibition', 'photo', 'exhibition');
  // await migrateExternalImages('magazine', 'thumbnail', 'magazine'); // 컬럼명 확인 필요, 주석 처리
  // gallery 버킷의 gallery/ 하위 폴더만 변환
  await (async () => {
    const { data: subFiles } = await supabase.storage.from('gallery').list('gallery', { limit: 1000 });
    for (const file of subFiles || []) {
      if (file.name.match(/\.(jpg|jpeg|png)$/i)) {
        const filePath = `gallery/${file.name}`;
        const { data: fileData } = await supabase.storage.from('gallery').download(filePath);
        const buffer = Buffer.from(await fileData.arrayBuffer());
        const webpBuffer = await sharp(buffer).webp({ quality: 80 }).toBuffer();
        const webpName = filePath.replace(/\.[^.]+$/, '.webp');
        await supabase.storage.from('gallery').upload(webpName, webpBuffer, { upsert: true, contentType: 'image/webp' });
        console.log(`[gallery/gallery] ${filePath} → ${webpName} 변환 완료`);
      }
    }
  })();
  // product 버킷의 product/ 하위 폴더만 변환
  await (async () => {
    const { data: subFiles } = await supabase.storage.from('product').list('product', { limit: 1000 });
    for (const file of subFiles || []) {
      if (file.name.match(/\.(jpg|jpeg|png)$/i)) {
        const filePath = `product/${file.name}`;
        const { data: fileData } = await supabase.storage.from('product').download(filePath);
        const buffer = Buffer.from(await fileData.arrayBuffer());
        const webpBuffer = await sharp(buffer).webp({ quality: 80 }).toBuffer();
        const webpName = filePath.replace(/\.[^.]+$/, '.webp');
        await supabase.storage.from('product').upload(webpName, webpBuffer, { upsert: true, contentType: 'image/webp' });
        console.log(`[product/product] ${filePath} → ${webpName} 변환 완료`);
      }
    }
  })();
})(); 