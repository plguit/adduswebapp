/**
 * Media Utility Helper
 * Converts video URLs (Google Drive, YouTube, Vimeo, Direct MP4) into embeddable player objects.
 */

export function isLikelyVideoUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const str = url.trim().toLowerCase();
  const cleanPath = str.split('?')[0].split('#')[0];
  if (
    cleanPath.endsWith('.mp4') ||
    cleanPath.endsWith('.webm') ||
    cleanPath.endsWith('.mov') ||
    cleanPath.endsWith('.m4v') ||
    cleanPath.endsWith('.mkv') ||
    str.startsWith('/videos/') ||
    str.startsWith('blob:') ||
    str.startsWith('data:video/')
  ) {
    return true;
  }
  if (
    str.includes('youtube.com') ||
    str.includes('youtu.be') ||
    str.includes('vimeo.com') ||
    str.includes('drive.google.com')
  ) {
    return true;
  }
  return false;
}

export function detectVideoAspectRatio(itemOrUrl, title = '', category = '') {
  let combined = '';
  if (typeof itemOrUrl === 'object' && itemOrUrl !== null) {
    if (itemOrUrl.aspectRatio) return itemOrUrl.aspectRatio;
    combined = `${itemOrUrl.mediaUrl || ''} ${itemOrUrl.thumbnail || ''} ${itemOrUrl.title || ''} ${itemOrUrl.subtitle || ''} ${itemOrUrl.category || ''}`.toLowerCase();
  } else {
    combined = `${itemOrUrl || ''} ${title || ''} ${category || ''}`.toLowerCase();
  }

  if (
    combined.includes('portrait') ||
    combined.includes('vertical') ||
    combined.includes('reel') ||
    combined.includes('shorts') ||
    combined.includes('tiktok') ||
    combined.includes('story') ||
    combined.includes('9:16') ||
    combined.includes('9-16') ||
    combined.includes('resort presentation') ||
    combined.includes('model')
  ) {
    return 'portrait';
  }
  return 'landscape';
}

export function getEmbeddableVideoUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const str = url.trim();

  // 1. Google Drive Links:
  // e.g. https://drive.google.com/file/d/1ABC123xyz/view?usp=sharing
  // e.g. https://drive.google.com/open?id=1ABC123xyz
  const driveMatch = str.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || str.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    return {
      type: 'iframe',
      url: `https://drive.google.com/file/d/${driveMatch[1]}/preview`
    };
  }

  // 2. YouTube Links:
  // e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ
  // e.g. https://youtu.be/dQw4w9WgXcQ
  // e.g. https://www.youtube.com/shorts/dQw4w9WgXcQ
  const ytMatch = str.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]+)/);
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'iframe',
      url: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0&rel=0`
    };
  }

  // 3. Vimeo Links:
  // e.g. https://vimeo.com/123456789
  const vimeoMatch = str.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      type: 'iframe',
      url: `https://player.vimeo.com/video/${vimeoMatch[1]}`
    };
  }

  // 4. Direct video files or blob URLs (.mp4, .webm, .mov, /videos/...)
  const cleanPath = str.split('?')[0].split('#')[0].toLowerCase();
  const isDirectVideo =
    cleanPath.endsWith('.mp4') ||
    cleanPath.endsWith('.webm') ||
    cleanPath.endsWith('.mov') ||
    cleanPath.endsWith('.m4v') ||
    cleanPath.endsWith('.mkv') ||
    str.startsWith('/videos/') ||
    str.startsWith('blob:') ||
    str.startsWith('data:video/');

  if (isDirectVideo) {
    return {
      type: 'video',
      url: str
    };
  }

  // If it's a general URL containing 'drive.google'
  if (str.includes('drive.google.com')) {
    const idExtract = str.match(/([a-zA-Z0-9_-]{25,})/);
    if (idExtract && idExtract[1]) {
      return {
        type: 'iframe',
        url: `https://drive.google.com/file/d/${idExtract[1]}/preview`
      };
    }
  }

  return {
    type: 'video',
    url: str
  };
}
