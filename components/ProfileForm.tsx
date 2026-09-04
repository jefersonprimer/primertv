"use client";

import { useState } from "react";
import { updateProfile } from "@/app/actions/profile";
import { PRESET_AVATARS } from "@/lib/constants";
import { SessionUser } from "@/lib/auth";
import { Check, Camera, Link as LinkIcon, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "@/i18n/routing";

interface ProfileFormProps {
  user: SessionUser;
  t: {
    title: string;
    subtitle: string;
    nameLabel: string;
    namePlaceholder: string;
    avatarLabel: string;
    urlPlaceholder: string;
    presetTitle: string;
    saveButton: string;
    saving: string;
    successMessage: string;
    nameRequired: string;
    invalidUrl: string;
    updateFailed: string;
  };
}

export function ProfileForm({ user, t }: ProfileFormProps) {
  const router = useRouter();
  const [name, setName] = useState(user.name || "");
  const [imageUrl, setImageUrl] = useState(user.image || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("image", imageUrl);

    const result = await updateProfile(formData);

    setLoading(false);

    if (result.error) {
      if (result.error === "nameRequired") {
        setMessage({ type: "error", text: t.nameRequired });
      } else if (result.error === "invalidUrl") {
        setMessage({ type: "error", text: t.invalidUrl });
      } else {
        setMessage({ type: "error", text: t.updateFailed });
      }
    } else if (result.success) {
      setMessage({ type: "success", text: t.successMessage });
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-[#151515] p-6 sm:p-8 rounded-2xl border border-zinc-800/80 shadow-2xl max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{t.title}</h1>
        <p className="text-sm text-zinc-400">{t.subtitle}</p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-sm font-medium border ${
            message.type === "success"
              ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300"
              : "bg-red-950/40 border-red-800/60 text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Avatar Preview & Selection */}
      <div className="space-y-4">
        <label className="block text-sm font-semibold text-zinc-200">
          {t.avatarLabel}
        </label>
        
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-2">
          <div className="relative group">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 p-0.5 shadow-xl ring-4 ring-zinc-800">
              <div className="w-full h-full rounded-full bg-[#1c1c1c] flex items-center justify-center overflow-hidden">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  <span className="text-3xl font-bold text-white">
                    {name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 w-full space-y-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <LinkIcon size={18} />
              </div>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder={t.urlPlaceholder}
                className="w-full pl-10 pr-4 py-2.5 bg-[#0E0E0E] border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            {imageUrl && (
              <button
                type="button"
                onClick={() => setImageUrl("")}
                className="text-xs text-zinc-400 hover:text-red-400 transition-colors"
              >
                Remover foto (usar inicial)
              </button>
            )}
          </div>
        </div>

        {/* Preset Avatars */}
        <div className="pt-2">
          <div className="flex items-center gap-1.5 mb-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            <Sparkles size={14} className="text-blue-400" />
            <span>{t.presetTitle}</span>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {PRESET_AVATARS.map((avatar, idx) => {
              const isSelected = imageUrl === avatar;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setImageUrl(avatar)}
                  className={`relative group rounded-full overflow-hidden aspect-square border-2 transition-all cursor-pointer ${
                    isSelected
                      ? "border-blue-500 scale-105 ring-2 ring-blue-500/30"
                      : "border-transparent opacity-70 hover:opacity-100 hover:scale-105"
                  }`}
                >
                  <img src={avatar} alt={`Avatar preset ${idx + 1}`} className="w-full h-full object-cover" />
                  {isSelected && (
                    <div className="absolute inset-0 bg-blue-600/40 flex items-center justify-center">
                      <Check size={16} className="text-white stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Name Input */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-zinc-200">
          {t.nameLabel}
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.namePlaceholder}
          required
          className="w-full px-4 py-3 bg-[#0E0E0E] border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Save Button */}
      <div className="pt-4 border-t border-zinc-800/80 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-blue-500/20"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>{t.saving}</span>
            </>
          ) : (
            <span>{t.saveButton}</span>
          )}
        </button>
      </div>
    </form>
  );
}
