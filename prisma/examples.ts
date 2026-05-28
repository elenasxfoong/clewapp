import { prisma } from "../src/lib/prisma";

type GoogleBookVolume = {
  id: string;
  volumeInfo: {
    title?: string;
    authors?: string[];
    description?: string;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
  };
};

export async function createUser() {
  return prisma.user.create({
    data: {
      username: "elena",
      email: "elena@example.com",
    },
  });
}

export async function cacheBookFromGoogleBooks(volume: GoogleBookVolume) {
  return prisma.book.upsert({
    where: {
      googleBooksId: volume.id,
    },
    create: {
      googleBooksId: volume.id,
      title: volume.volumeInfo.title ?? "Untitled",
      author: volume.volumeInfo.authors?.join(", ") ?? "Unknown author",
      description: volume.volumeInfo.description,
    },
    update: {
      title: volume.volumeInfo.title ?? "Untitled",
      author: volume.volumeInfo.authors?.join(", ") ?? "Unknown author",
      description: volume.volumeInfo.description,
    },
  });
}

export async function upsertReview(params: {
  userId: string;
  bookId: string;
  rating?: number;
  body: string;
}) {
  return prisma.review.upsert({
    where: {
      userId_bookId: {
        userId: params.userId,
        bookId: params.bookId,
      },
    },
    create: {
      userId: params.userId,
      bookId: params.bookId,
      rating: params.rating,
      body: params.body,
    },
    update: {
      rating: params.rating,
      body: params.body,
    },
  });
}

export async function addBookToShelfWithCustomCover(params: {
  shelfId: string;
  bookId: string;
  customCoverUrl: string;
}) {
  return prisma.shelfBook.upsert({
    where: {
      shelfId_bookId: {
        shelfId: params.shelfId,
        bookId: params.bookId,
      },
    },
    create: {
      shelfId: params.shelfId,
      bookId: params.bookId,
      customCoverUrl: params.customCoverUrl,
    },
    update: {
      customCoverUrl: params.customCoverUrl,
    },
    include: {
      book: true,
      shelf: true,
    },
  });
}

export async function disconnectPrisma() {
  await prisma.$disconnect();
}
