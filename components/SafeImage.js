import Image from 'next/image';

export default function SafeImage({ src, alt, width = 200, height = 200, priority, ...props }) {
  const allowList = [
    'teaelrzxuigiocnukwha.supabase.co',
    'picsum.photos',
    // 필요시 추가
  ];
  try {
    const url = new URL(src);
    if (allowList.some(domain => url.hostname.endsWith(domain))) {
      return (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority ? true : undefined}
          {...props}
        />
      );
    }
  } catch (e) {
    // src가 상대경로 등 URL 파싱 불가 시 img fallback
  }
  return <img src={src} alt={alt} width={width} height={height} {...props} />;
} 