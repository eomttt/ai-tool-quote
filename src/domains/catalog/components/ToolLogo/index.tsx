import { useState } from 'react';
import type { Tool } from '../../models/model-tool';

export function ToolLogo({
  tool,
  size = 'default',
}: {
  tool: Tool;
  size?: 'default' | 'large' | 'mini';
}) {
  const [failedSource, setFailedSource] = useState<string>();
  const source = tool.icon;
  return (
    <span className={`tool-logo ${size}`} aria-hidden="true">
      {source && source !== failedSource ? (
        <img
          src={source}
          alt=""
          width={40}
          height={40}
          loading="lazy"
          decoding="async"
          onError={() => setFailedSource(source)}
        />
      ) : (
        tool.monogram
      )}
    </span>
  );
}
