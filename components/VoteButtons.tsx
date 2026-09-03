"use client"

import { useState } from "react"
import { ThumbsUp, ThumbsDown } from "lucide-react"
import { voteEpisode } from "@/app/actions/votes"
import { useRouter } from "next/navigation"

interface VoteButtonsProps {
  episodeId?: string
  userId?: string | null
  initialUpvotes?: number
  initialDownvotes?: number
  initialUserVote?: "UP" | "DOWN" | null
}

export function VoteButtons({
  episodeId,
  userId,
  initialUpvotes = 0,
  initialDownvotes = 0,
  initialUserVote = null,
}: VoteButtonsProps) {
  const router = useRouter()
  const [upvotes, setUpvotes] = useState(initialUpvotes)
  const [downvotes, setDownvotes] = useState(initialDownvotes)
  const [userVote, setUserVote] = useState(initialUserVote)
  const [isPending, setIsPending] = useState(false)

  const handleVote = async (type: "UP" | "DOWN") => {
    if (!episodeId) {
      setUserVote((prev) => (prev === type ? null : type))
      if (type === "UP") {
        setUpvotes((prev) => (userVote === "UP" ? prev - 1 : prev + 1))
        if (userVote === "DOWN") setDownvotes((prev) => prev - 1)
      } else {
        setDownvotes((prev) => (userVote === "DOWN" ? prev - 1 : prev + 1))
        if (userVote === "UP") setUpvotes((prev) => prev - 1)
      }
      return
    }

    if (!userId) {
      router.push("/login")
      return
    }

    if (isPending) return
    setIsPending(true)

    const previousVote = userVote
    const previousUpvotes = upvotes
    const previousDownvotes = downvotes

    if (userVote === type) {
      setUserVote(null)
      if (type === "UP") setUpvotes((prev) => prev - 1)
      else setDownvotes((prev) => prev - 1)
    } else {
      setUserVote(type)
      if (type === "UP") {
        setUpvotes((prev) => prev + 1)
        if (userVote === "DOWN") setDownvotes((prev) => prev - 1)
      } else {
        setDownvotes((prev) => prev + 1)
        if (userVote === "UP") setUpvotes((prev) => prev - 1)
      }
    }

    try {
      const result = await voteEpisode(episodeId, userId, type)
      if (result?.error) {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("Failed to vote:", error)
      setUserVote(previousVote)
      setUpvotes(previousUpvotes)
      setDownvotes(previousDownvotes)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="inline-flex h-[42px] items-center gap-3 rounded-full bg-zinc-900 border border-zinc-800 px-4 shadow-lg backdrop-blur-md">
      {/* Upvote Button */}
      <button
        onClick={() => handleVote("UP")}
        disabled={isPending}
        className={`group relative flex items-center gap-1.5 text-sm font-semibold transition-all duration-200 focus:outline-none ${
          userVote === "UP"
            ? "text-white"
            : "text-zinc-400 hover:text-white"
        }`}
        title="Gostei"
      >
        <ThumbsUp
          size={16}
          className={`transition-all duration-300 ${
            userVote === "UP"
              ? "fill-white text-white scale-110"
              : "group-hover:scale-110 group-hover:-translate-y-0.5"
          }`}
        />
        <span>{upvotes}</span>
      </button>

      {/* Divider Bar */}
      <div className="h-4 w-[1px] bg-zinc-800" />

      {/* Downvote Button */}
      <button
        onClick={() => handleVote("DOWN")}
        disabled={isPending}
        className={`group relative flex items-center gap-1.5 text-sm font-semibold transition-all duration-200 focus:outline-none ${
          userVote === "DOWN"
            ? "text-white"
            : "text-zinc-400 hover:text-white"
        }`}
        title="Não gostei"
      >
        <ThumbsDown
          size={16}
          className={`transition-all duration-300 ${
            userVote === "DOWN"
              ? "fill-white text-white scale-110"
              : "group-hover:scale-110 group-hover:translate-y-0.5"
          }`}
        />
        {downvotes > 0 && <span>{downvotes}</span>}
      </button>
    </div>
  )
}
