import React from 'react';

function Startup({ onFinished }) {
  const videoRef = React.useRef(null);

  React.useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.play();
      const handleVideoEnd = () => {
        onFinished();
      };
      video.addEventListener('ended', handleVideoEnd);
      return () => {
        video.removeEventListener('ended', handleVideoEnd);
      };
    }
  }, [onFinished]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <video ref={videoRef} src="/startup.mp4" muted="muted" />
    </div>
  );
}

export default Startup;
