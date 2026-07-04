"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface ExpandableDescriptionProps {
  description: string;
}

export default function ExpandableDescription({
  description,
}: ExpandableDescriptionProps) {
  const t = useTranslations("ExpandableDescription");
  const [isExpanded, setIsExpanded] = useState(false);

  if (!description) return null;

  // Show toggle button only if description is long enough to potentially clamp
  const isLongDescription = description.length > 200;

  return (
    <div className="mt-2 flex flex-col items-start w-full">
      <p
        className={`text-[#f2f2f2] leading-relaxed text-base font-normal ${
          isExpanded ? "line-clamp-none" : "line-clamp-3"
        }`}
      >
        {description}
      </p>
      {isLongDescription && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 text-sm font-semibold text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors uppercase"
        >
          {isExpanded ? t("showLess") : t("showMore")}
        </button>
      )}
    </div>
  );
}
