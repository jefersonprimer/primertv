import { Play } from "lucide-react";
import Link from "next/link";

interface StartWatchingButtonProps {
  href: string;
  className?: string;
  uppercase?: boolean;
  text?: string;
}

export function StartWatchingButton({
  href,
  className = "",
  uppercase = true,
  text = "Começar a assistir EP1",
}: StartWatchingButtonProps) {
  return (
    <Link
      href={href}
      className={`flex h-10 items-center justify-center gap-2 bg-blue-600 font-semibold text-white transition-colors hover:bg-blue-700 ${
        uppercase ? "uppercase" : ""
      } ${className}`}
    >
      <Play className="h-5 w-5 fill-current" />
      {text}
    </Link>
  );
}
