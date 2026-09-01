"use client"

import { useState } from "react"
import { ThumbsUp, ThumbsDown } from "lucide-react"
import { voteEpisode } from "@/app/actions/votes"
import { useRouter } from "next/navigation"

interface VoteButtonsProps {
  episodeId: string
  userId: string | null
  initialUpvotes: number
  initialDownvotes: number
  initialUserVote?: "UP" | "DOWN" | null
}

export function VoteButtons({
  episodeId,
  userId,
  initialUpvotes,
  initialDownvotes,
  initialUserVote,
}: VoteButtonsProps) {
  const router = useRouter()
  const [upvotes, setUpvotes] = useState(initialUpvotes)
  const [downvotes, setDownvotes] = useState(initialDownvotes)
  const [userVote, setUserVote] = useState(initialUserVote)
  const [isPending, setIsPending] = useState(false)

  const handleVote = async (type: "UP" | "DOWN") => {
    if (!userId) {
      // Could trigger login modal or redirect to login here
      router.push("/login")
      return
    }

    if (isPending) return
    setIsPending(true)

    // Optimistic UI update
    const previousVote = userVote
    const previousUpvotes = upvotes
    const previousDownvotes = downvotes

    if (userVote === type) {
      // Toggle off
      setUserVote(null)
      if (type === "UP") setUpvotes((prev) => prev - 1)
      else setDownvotes((prev) => prev - 1)
    } else {
      // Toggle on / change
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
      if (result.error) {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("Failed to vote:", error)
      // Revert optimistic update
      setUserVote(previousVote)
      setUpvotes(previousUpvotes)
      setDownvotes(previousDownvotes)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => handleVote("UP")}
        disabled={isPending}
        className={`transition-colors flex items-center gap-1.5 ${
          userVote === "UP" ? "text-blue-500" : "hover:text-blue-400"
        }`}
        title="Like"
      >
        <ThumbsUp size={20} className={userVote === "UP" ? "fill-current" : ""} />
        <span className="text-sm font-medium">{upvotes}</span>
      </button>
      
      <button
        onClick={() => handleVote("DOWN")}
        disabled={isPending}
        className={`transition-colors flex items-center gap-1.5 ${
          userVote === "DOWN" ? "text-red-500" : "hover:text-red-400"
        }`}
        title="Dislike"
      >
        <ThumbsDown size={20} className={userVote === "DOWN" ? "fill-current" : ""} />
        <span className="text-sm font-medium">{downvotes}</span>
      </button>
    </div>
  )
}
