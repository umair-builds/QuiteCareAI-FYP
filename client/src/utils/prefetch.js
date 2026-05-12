/**
 * Utility to prefetch videos to the browser cache for zero-latency transitions.
 * Accepts an array of fully-resolved video URLs (not raw sign words).
 * URL generation is centralised in VideoStage.jsx to avoid format mismatches.
 */
export const prefetchVideos = (urlsArray) => {
  if (!urlsArray || urlsArray.length === 0) return;

  // Prefetch the first 3 URLs
  const toPrefetch = urlsArray.slice(0, 3);

  toPrefetch.forEach(videoUrl => {
    if (!videoUrl) return;

    // Create a preload link if it doesn't already exist
    let link = document.querySelector(`link[href="${videoUrl}"]`);
    if (!link) {
      link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'fetch';
      link.href = videoUrl;
      link.type = 'video/mp4';
      document.head.appendChild(link);
    }
  });
};
