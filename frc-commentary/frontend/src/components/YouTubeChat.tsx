import React from "react";

export function YouTubeChat({ videoId }: { videoId: string }) {
  if (!videoId) {
    return (
      <div className="empty-state">
        No YouTube video ID set. Open Settings and paste in the live stream's video ID.
      </div>
    );
  }

  const domain = typeof window !== "undefined" ? window.location.hostname : "localhost";
  const src = `https://www.youtube.com/live_chat?v=${encodeURIComponent(videoId)}&embed_domain=${domain}`;

  return <iframe className="chat-frame" src={src} title="YouTube live chat" />;
}
