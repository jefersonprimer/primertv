import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import { ObjectId } from "mongodb";
import { CommentDocument } from "../route";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json();
    const { commentId, action, visitorId } = body;

    if (!commentId || !ObjectId.isValid(commentId)) {
      return NextResponse.json(
        { error: "ID do comentário inválido" },
        { status: 400 }
      );
    }

    if (action !== "like" && action !== "dislike") {
      return NextResponse.json(
        { error: "Ação inválida. Use 'like' ou 'dislike'" },
        { status: 400 }
      );
    }

    const reactorId = session?.user?.id || visitorId || "anonymous_guest";

    const client = await clientPromise;
    const db = client.db();
    const commentsCollection = db.collection<CommentDocument>("comments");

    const comment = await commentsCollection.findOne({
      _id: new ObjectId(commentId),
    });

    if (!comment) {
      return NextResponse.json(
        { error: "Comentário não encontrado" },
        { status: 404 }
      );
    }

    let likedBy = Array.isArray(comment.likedBy) ? [...comment.likedBy] : [];
    let dislikedBy = Array.isArray(comment.dislikedBy) ? [...comment.dislikedBy] : [];

    const isLiked = likedBy.includes(reactorId);
    const isDisliked = dislikedBy.includes(reactorId);

    if (action === "like") {
      if (isLiked) {
        // Toggle off like
        likedBy = likedBy.filter((id) => id !== reactorId);
      } else {
        // Add like, remove dislike if exists
        likedBy.push(reactorId);
        dislikedBy = dislikedBy.filter((id) => id !== reactorId);
      }
    } else if (action === "dislike") {
      if (isDisliked) {
        // Toggle off dislike
        dislikedBy = dislikedBy.filter((id) => id !== reactorId);
      } else {
        // Add dislike, remove like if exists
        dislikedBy.push(reactorId);
        likedBy = likedBy.filter((id) => id !== reactorId);
      }
    }

    const likesCount = likedBy.length;
    const dislikesCount = dislikedBy.length;

    await commentsCollection.updateOne(
      { _id: new ObjectId(commentId) },
      {
        $set: {
          likedBy,
          dislikedBy,
          likes: likesCount,
          dislikes: dislikesCount,
        },
      }
    );

    return NextResponse.json({
      commentId,
      likes: likesCount,
      dislikes: dislikesCount,
      likedBy,
      dislikedBy,
    });
  } catch (error: any) {
    console.error("Erro ao reagir ao comentário:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar reação" },
      { status: 500 }
    );
  }
}
