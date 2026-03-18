import React from 'react';

function Startup({ onFinished }) {
  const videoRef = React.useRef(null);

  React.useEffect(() => {
    const video = videoRef.current;
    let didFinish = false;

    const finish = () => {
      if (didFinish) return;
      didFinish = true;
      onFinished?.();
    };

    // Fallback: if the asset is missing or playback fails, we still need to leave the overlay.
    const timeoutId = window.setTimeout(() => {
      finish();
    }, 3500);

    if (!video) {
      finish();
      return () => window.clearTimeout(timeoutId);
    }

    const handleVideoEnd = () => finish();
    const handleVideoError = () => finish();

    video.addEventListener('ended', handleVideoEnd);
    video.addEventListener('error', handleVideoError);

    // `play()` can reject on autoplay restrictions or when the file doesn't exist.
    const playPromise = video.play();
    if (playPromise?.catch) {
      playPromise.catch(() => finish());
    }

    return () => {
      window.clearTimeout(timeoutId);
      video.removeEventListener('ended', handleVideoEnd);
      video.removeEventListener('error', handleVideoError);
    };
  }, [onFinished]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <video
        ref={videoRef}
        src="/startup.mp4"
        muted
        playsInline
        preload="auto"
      />
    </div>
  );
}

export default Startup;
