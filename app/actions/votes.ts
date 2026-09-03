'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { calculateUserVoteWeight } from '@/lib/rating/trust'

export async function voteEpisode(
  episodeId: string,
  userId: string,
  type: 'UP' | 'DOWN'
) {
  try {
    const trustDetails = await calculateUserVoteWeight(userId)
    const weight = trustDetails.weight

    const existingVote = await prisma.episodeVote.findUnique({
      where: {
        userId_episodeId: {
          userId,
          episodeId,
        },
      },
    })

    if (existingVote) {
      if (existingVote.type === type) {
        // Remove vote if clicking the same button
        await prisma.$transaction([
          prisma.episodeVote.delete({
            where: { id: existingVote.id },
          }),
          prisma.episode.update({
            where: { id: episodeId },
            data: {
              ...(type === 'UP' ? { upvotes: { decrement: 1 } } : { downvotes: { decrement: 1 } })
            },
          })
        ])
      } else {
        // Change vote
        await prisma.$transaction([
          prisma.episodeVote.update({
            where: { id: existingVote.id },
            data: { type, weight },
          }),
          prisma.episode.update({
            where: { id: episodeId },
            data: {
              ...(type === 'UP' 
                ? { upvotes: { increment: 1 }, downvotes: { decrement: 1 } }
                : { upvotes: { decrement: 1 }, downvotes: { increment: 1 } })
            },
          })
        ])
      }
    } else {
      // New vote
      await prisma.$transaction([
        prisma.episodeVote.create({
          data: {
            userId,
            episodeId,
            type,
            weight,
          },
        }),
        prisma.episode.update({
          where: { id: episodeId },
          data: {
            ...(type === 'UP' ? { upvotes: { increment: 1 } } : { downvotes: { increment: 1 } })
          },
        })
      ])
    }

    revalidatePath('/[locale]/(home)/anime/[slug]', 'layout')
    return { success: true, weight }
  } catch (error) {
    console.error('Failed to vote on episode:', error)
    return { error: 'Failed to record vote' }
  }
}

