"use client";

import { useState } from "react";

interface MediaDescricaoProps {
  description: string;
  className?: string;
  rating?: string;
  genres?: string[];
}

export default function MediaDescricao({
  description,
  className = "text-zinc-600 dark:text-zinc-400",
  rating,
  genres,
}: MediaDescricaoProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLength = 300;

  if (!description) return null;

  const shouldShowButton = description.length > maxLength;
  const displayedText = isExpanded
    ? description
    : description.slice(0, maxLength);

  const hasExtraInfo = rating || (genres && genres.length > 0);

  return (
    <div className="flex flex-col md:flex-row gap-8 w-full border-b-2 border-zinc-700 pb-4">
      {/* Description Column */}
      <div
        className={`flex flex-col gap-2 ${hasExtraInfo ? "flex-2 md:w-2/3" : "w-full"}`}
      >
        <p className={`${className} text-base font-normal leading-relaxed`}>
          {displayedText}
          {!isExpanded && shouldShowButton && "..."}
        </p>
        {shouldShowButton && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-500 hover:text-blue-600 text-sm font-bold self-start uppercase mt-1"
          >
            {isExpanded ? "mostrar menor" : "mais detalhes"}
          </button>
        )}
      </div>

      {/* Info Column */}
      {hasExtraInfo && (
        <div className="flex flex-col gap-4 flex-1 md:w-1/3 text-sm font-normal">
          {rating && (
            <div className="flex">
              Classificação:
              <span className="text-zinc-700 dark:text-zinc-300">{rating}</span>
            </div>
          )}
          {genres && genres.length > 0 && (
            <div>
              Gêneros:{" "}
              {genres.map((genre, index) => (
                <span key={genre} className="text-zinc-700 dark:text-zinc-300">
                  <span className="underline">{genre}</span>
                  {index < genres.length - 1 && ", "}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
