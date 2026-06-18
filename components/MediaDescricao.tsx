"use client";

import { useState } from "react";

interface MediaDescricaoProps {
  description: string;
}

export default function MediaDescricao({ description }: MediaDescricaoProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLength = 150;

  if (!description) return null;

  const shouldShowButton = description.length > maxLength;
  const displayedText = isExpanded ? description : description.slice(0, maxLength);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
        {displayedText}
        {!isExpanded && shouldShowButton && "..."}
      </p>
      {shouldShowButton && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-500 hover:text-blue-600 text-sm font-semibold self-start"
        >
          {isExpanded ? "Mostrar menor" : "Mais detalhes"}
        </button>
      )}
    </div>
  );
}
