import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ObjectId } from "mongodb";

export interface CommentDocument {
  _id?: ObjectId;
  targetId: string; // publicId or episode/movie/anime id
  parentId?: string; // parent comment ID if this is a reply
  content: string;
  userId?: string;
  visitorId?: string;
  userName: string;
  userEmail?: string;
  userImage?: string;
  createdAt: Date;
  isEdited?: boolean;
  updatedAt?: Date;
  likes?: number;
  dislikes?: number;
  likedBy?: string[];
  dislikedBy?: string[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetId = searchParams.get("targetId");

    if (!targetId) {
      return NextResponse.json(
        { error: "targetId é obrigatório" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const commentsCollection = db.collection<CommentDocument>("comments");

    const comments = await commentsCollection
      .find({ targetId })
      .sort({ createdAt: -1 })
      .limit(300)
      .toArray();

    // Fetch user images/names from Prisma for logged in users
    const userIds = Array.from(
      new Set(comments.map((c) => c.userId).filter((id): id is string => Boolean(id)))
    );

    const userMap: Record<string, { image: string | null; name: string | null; username: string | null }> = {};
    if (userIds.length > 0) {
      try {
        const users = await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, image: true, name: true, username: true },
        });
        for (const u of users) {
          userMap[u.id] = { image: u.image, name: u.name, username: u.username };
        }
      } catch (e) {
        console.error("Error fetching comment user profiles from Prisma:", e);
      }
    }

    const formattedComments = comments.map((comment: CommentDocument) => {
      const dbUser = comment.userId ? userMap[comment.userId] : undefined;
      return {
        id: comment._id?.toString(),
        targetId: comment.targetId,
        parentId: comment.parentId || null,
        content: comment.content,
        userId: comment.userId || null,
        userUsername: dbUser?.username || null,
        visitorId: comment.visitorId || null,
        userName: dbUser?.name || comment.userName,
        userImage: dbUser?.image || comment.userImage || null,
        createdAt: comment.createdAt,
        isEdited: comment.isEdited || false,
        likes: comment.likes || 0,
        dislikes: comment.dislikes || 0,
        likedBy: comment.likedBy || [],
        dislikedBy: comment.dislikedBy || [],
      };
    });

    return NextResponse.json({ comments: formattedComments });
  } catch (error: any) {
    console.error("Erro ao buscar comentários do MongoDB:", error?.message || error);
    return NextResponse.json(
      { comments: [], error: "Serviço de comentários indisponível no momento." },
      { status: 200 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json();
    const { targetId, content, authorName, parentId, visitorId } = body;

    if (!targetId || !content || !content.trim()) {
      return NextResponse.json(
        { error: "targetId e conteúdo do comentário são obrigatórios" },
        { status: 400 }
      );
    }

    // Determine author information
    let userId: string | undefined = undefined;
    let userName: string = "Anônimo";
    let userEmail: string | undefined = undefined;
    let userImage: string | undefined = undefined;

    if (session?.user) {
      userId = session.user.id;
      userName = session.user.name || session.user.email.split("@")[0];
      userEmail = session.user.email;
      userImage = session.user.image || undefined;
    } else if (authorName && authorName.trim()) {
      userName = authorName.trim();
    }

    const client = await clientPromise;
    const db = client.db();
    const commentsCollection = db.collection<CommentDocument>("comments");

    const newComment: CommentDocument = {
      targetId,
      parentId: parentId || undefined,
      content: content.trim(),
      userId,
      visitorId: !userId && visitorId ? visitorId : undefined,
      userName,
      userEmail,
      userImage,
      createdAt: new Date(),
      isEdited: false,
      likes: 0,
      dislikes: 0,
      likedBy: [],
      dislikedBy: [],
    };

    const result = await commentsCollection.insertOne(newComment);

    return NextResponse.json(
      {
        comment: {
          id: result.insertedId.toString(),
          targetId: newComment.targetId,
          parentId: newComment.parentId || null,
          content: newComment.content,
          userId: newComment.userId || null,
          visitorId: newComment.visitorId || null,
          userName: newComment.userName,
          userImage: newComment.userImage || null,
          createdAt: newComment.createdAt,
          isEdited: false,
          likes: 0,
          dislikes: 0,
          likedBy: [],
          dislikedBy: [],
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Erro ao publicar comentário no MongoDB:", error?.message || error);
    return NextResponse.json(
      { error: "Serviço de comentários indisponível no momento. Tente novamente mais tarde." },
      { status: 503 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json();
    const { id, content, visitorId } = body;

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "ID do comentário inválido" },
        { status: 400 }
      );
    }

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "O conteúdo do comentário não pode estar vazio" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const commentsCollection = db.collection<CommentDocument>("comments");

    const comment = await commentsCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!comment) {
      return NextResponse.json(
        { error: "Comentário não encontrado" },
        { status: 404 }
      );
    }

    const currentUserId = session?.user?.id;
    const isOwner = Boolean(
      (currentUserId && comment.userId === currentUserId) ||
      (!comment.userId && visitorId && comment.visitorId === visitorId)
    );

    if (!isOwner) {
      return NextResponse.json(
        { error: "Você não tem permissão para editar este comentário" },
        { status: 403 }
      );
    }

    const updatedContent = content.trim();
    const updatedAt = new Date();

    await commentsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          content: updatedContent,
          isEdited: true,
          updatedAt,
        },
      }
    );

    return NextResponse.json({
      success: true,
      comment: {
        id: comment._id?.toString(),
        targetId: comment.targetId,
        parentId: comment.parentId || null,
        content: updatedContent,
        userId: comment.userId || null,
        visitorId: comment.visitorId || null,
        userName: comment.userName,
        userImage: comment.userImage || null,
        createdAt: comment.createdAt,
        isEdited: true,
        updatedAt,
        likes: comment.likes || 0,
        dislikes: comment.dislikes || 0,
        likedBy: comment.likedBy || [],
        dislikedBy: comment.dislikedBy || [],
      },
    });
  } catch (error: any) {
    console.error("Erro ao editar comentário:", error);
    return NextResponse.json(
      { error: "Erro interno ao editar comentário" },
      { status: 500 }
    );
  }
}

async function getDescendantIds(db: any, parentIds: string[]): Promise<string[]> {
  if (!parentIds.length) return [];
  const children = await db
    .collection("comments")
    .find({ parentId: { $in: parentIds } }, { projection: { _id: 1 } })
    .toArray();
  if (children.length === 0) return [];
  const childIds = children.map((c: any) => c._id.toString());
  const grandChildren = await getDescendantIds(db, childIds);
  return [...childIds, ...grandChildren];
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const visitorId = searchParams.get("visitorId");

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "ID do comentário inválido" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const commentsCollection = db.collection<CommentDocument>("comments");

    const comment = await commentsCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!comment) {
      return NextResponse.json(
        { error: "Comentário não encontrado" },
        { status: 404 }
      );
    }

    const currentUserId = session?.user?.id;
    const isOwner = Boolean(
      (currentUserId && comment.userId === currentUserId) ||
      (!comment.userId && visitorId && comment.visitorId === visitorId)
    );

    if (!isOwner) {
      return NextResponse.json(
        { error: "Você não tem permissão para excluir este comentário" },
        { status: 403 }
      );
    }

    // Delete the comment and all nested replies recursively
    const descendantIds = await getDescendantIds(db, [id]);
    const allIdsToDelete = [id, ...descendantIds].map((i) => new ObjectId(i));

    await commentsCollection.deleteMany({
      _id: { $in: allIdsToDelete },
    });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    console.error("Erro ao excluir comentário:", error);
    return NextResponse.json(
      { error: "Erro interno ao excluir comentário" },
      { status: 500 }
    );
  }
}
