"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

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
    <div className="mt-2 flex flex-col items-start w-full bg-[#2C2B2B] p-2 rounded-xl">
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
          className="mt-2 text-sm font-semibold text-white hover:text-[#f1f1f1]  transition-colors uppercase"
        >
          {isExpanded ? t("showLess") : t("showMore")}
        </button>
      )}
    </div>
  );
}
