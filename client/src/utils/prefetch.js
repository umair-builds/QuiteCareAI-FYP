/**
 * Utility to prefetch videos to the browser cache for zero-latency transitions.
 * Creates hidden <link rel="preload"> elements or uses fetch to cache them.
 */
import { R2_URL } from '../services/api';

export const prefetchVideos = (signsArray) => {
  if (!signsArray || signsArray.length === 0) return;
  
  // Cache the next 2-3 signs
  const toPrefetch = signsArray.slice(0, 3);
  
  toPrefetch.forEach(sign => {
    if (!sign) return;
    
    const videoUrl = `${R2_URL}/${sign}.mp4`;
    
    // Create a preload link if it doesn't exist
    let link = document.querySelector(`link[href="${videoUrl}"]`);
    if (!link) {
      link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'video';
      link.href = videoUrl;
      link.type = 'video/mp4';
      document.head.appendChild(link);
    }
  });
};
