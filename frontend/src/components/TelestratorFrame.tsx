import React, { useState } from "react";

export function TelestratorFrame({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);

  if (!url) {
    return (
      <div className="empty-state">
        No vMix host set. Add it in Settings — the telestrator is served from the same
        address as the vMix API (default port 8088).
      </div>
    );
  }

  return (
    <div className="telestrator-wrap">
      <iframe
        className="telestrator-frame"
        src={url}
        title="Telestrator"
        onError={() => setFailed(true)}
      />
      {failed && (
        <div className="telestrator-fallback">
          <p>Couldn't load the telestrator here.</p>
          <a href={url} target="_blank" rel="noreferrer" className="btn primary">
            Open Telestrator in a new tab
          </a>
        </div>
      )}
    </div>
  );
}
