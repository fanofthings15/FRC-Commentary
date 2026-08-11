import React from "react";

export function YouTubeChat({ videoId, height }: { videoId: string; height?: number | string }) {
  if (!videoId) {
    return (
      <div className="empty-state">
        No YouTube video ID set. Open Settings and paste in the live stream's video ID.
      </div>
    );
  }

  const domain = typeof window !== "undefined" ? window.location.hostname : "localhost";
  // dark_theme=1 forces YouTube's dark chat skin (light text on dark background).
  // Without this, some browser/OS theme combinations serve a broken light-on-light
  // style inside the iframe.
  const src = `https://www.youtube.com/live_chat?v=${encodeURIComponent(videoId)}&embed_domain=${domain}&dark_theme=1`;

  return (
    <div className="chat-frame-wrap" style={height ? { height } : undefined}>
      <iframe className="chat-frame" src={src} title="YouTube live chat" />
    </div>
  );
}

