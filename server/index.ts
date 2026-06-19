import "dotenv/config";
import { createServer } from "node:http";
import type { IncomingMessage } from "node:http";
import type { ServerResponse } from "node:http";
import { prisma } from "../src/lib/prisma";
import { fetchGoogleBookById, searchGoogleBooks } from "../src/services/googleBooks";

const port = Number(process.env.API_PORT ?? 3001);

const sendJson = (response: ServerResponse, status: number, body: unknown) => {
  response.writeHead(status, {
    "Content-Type": "application/json",
  });
  response.end(JSON.stringify(body));
};

const isDevelopment = () => process.env.NODE_ENV !== "production";

const logDev = (message: string, data?: unknown) => {
  if (!isDevelopment()) {
    return;
  }

  if (typeof data === "undefined") {
    console.log(message);
    return;
  }

  console.log(message, data);
};

const logError = (message: string, error: unknown) => {
  if (error instanceof Error) {
    console.error(message, error.stack ?? error.message);
    return;
  }

  console.error(message, error);
};

const readJsonBody = async <T>(request: IncomingMessage): Promise<T> => {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as T;
};

const getReviewUser = async () => {
  const existingUser = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (existingUser) {
    return existingUser;
  }

  return prisma.user.create({
    data: {
      username: "test-user",
      email: "test-user@example.com",
    },
  });
};

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

  if (request.method === "GET" && url.pathname === "/api/books/search") {
    const query = url.searchParams.get("q")?.trim() ?? "";

    if (!query) {
      sendJson(response, 200, []);
      return;
    }

    try {
      const books = await searchGoogleBooks(query);
      sendJson(response, 200, books);
    } catch (error) {
      logError("Book search failed", error);
      sendJson(response, 500, { error: "Failed to search books" });
    }

    return;
  }

  if (request.method === "POST" && url.pathname === "/api/books/cache") {
    try {
      const body = await readJsonBody<{ googleBooksId?: unknown }>(request);
      logDev("[Books Cache] backend request body received:", body);

      const googleBooksId = typeof body.googleBooksId === "string" ? body.googleBooksId.trim() : "";
      logDev("[Books Cache] Google Books ID used:", googleBooksId);

      if (!googleBooksId) {
        sendJson(response, 400, { error: "googleBooksId is required" });
        return;
      }

      const existingBook = await prisma.book.findUnique({
        where: { googleBooksId },
      });
      logDev("[Books Cache] Prisma findUnique result:", existingBook);

      if (existingBook) {
        sendJson(response, 200, existingBook);
        return;
      }

      const googleBook = await fetchGoogleBookById(googleBooksId);
      logDev("[Books Cache] Google Books fetch result:", googleBook);

      if (!googleBook) {
        sendJson(response, 404, { error: "Book not found in Google Books" });
        return;
      }

      const savedBook = await prisma.book.create({
        data: {
          googleBooksId: googleBook.id,
          title: googleBook.title,
          author: googleBook.author,
          description: googleBook.description,
        },
      });
      logDev("[Books Cache] Prisma create result:", savedBook);

      sendJson(response, 200, savedBook);
    } catch (error) {
      logError("Book cache failed", error);
      sendJson(response, 500, { error: "Failed to cache book" });
    }

    return;
  }

  if (request.method === "POST" && url.pathname === "/api/reviews") {
    try {
      const body = await readJsonBody<{
        bookId?: unknown;
        body?: unknown;
        rating?: unknown;
        dateRead?: unknown;
        currentlyReading?: unknown;
        coverImage?: unknown;
        status?: unknown;
        coverPreference?: unknown;
        book?: unknown;
      }>(request);
      logDev("[Reviews] backend request body received:", body);

      const bookId = typeof body.bookId === "string" ? body.bookId.trim() : "";
      const reviewBody = typeof body.body === "string" ? body.body.trim() : "";
      const rating = typeof body.rating === "number" && Number.isFinite(body.rating)
        ? Math.min(Math.max(Math.round(body.rating), 1), 5)
        : undefined;
      const dateRead = typeof body.dateRead === "string" && body.dateRead.trim()
        ? body.dateRead.trim()
        : null;
      const currentlyReading = typeof body.currentlyReading === "boolean" ? body.currentlyReading : false;
      const coverImage = typeof body.coverImage === "string" && body.coverImage.trim()
        ? body.coverImage
        : null;
      const status = typeof body.status === "string" && body.status.trim()
        ? body.status.trim()
        : null;
      const coverPreference = typeof body.coverPreference === "string" && body.coverPreference.trim()
        ? body.coverPreference.trim()
        : null;

      if (!bookId) {
        sendJson(response, 400, { error: "bookId is required" });
        return;
      }

      if (!reviewBody) {
        sendJson(response, 400, { error: "body is required" });
        return;
      }

      let book = await prisma.book.findUnique({
        where: { id: bookId },
      });
      logDev("[Reviews] Prisma book result:", book);

      if (!book) {
        const bookSnapshot = typeof body.book === "object" && body.book !== null
          ? body.book as { title?: unknown; author?: unknown; description?: unknown; googleBooksId?: unknown }
          : null;
        const title = typeof bookSnapshot?.title === "string" ? bookSnapshot.title.trim() : "";
        const author = typeof bookSnapshot?.author === "string" ? bookSnapshot.author.trim() : "";
        const description = typeof bookSnapshot?.description === "string" ? bookSnapshot.description.trim() || null : null;
        const fallbackGoogleBooksId = typeof bookSnapshot?.googleBooksId === "string" && bookSnapshot.googleBooksId.trim()
          ? bookSnapshot.googleBooksId.trim()
          : bookId;

        if (!title || !author) {
          sendJson(response, 404, { error: "Cached book not found" });
          return;
        }

        book = await prisma.book.upsert({
          where: { googleBooksId: fallbackGoogleBooksId },
          create: {
            id: bookId,
            googleBooksId: fallbackGoogleBooksId,
            title,
            author,
            description,
          },
          update: {
            title,
            author,
            description,
          },
        });
        logDev("[Reviews] Prisma fallback book upsert result:", book);
      }

      const user = await getReviewUser();
      logDev("[Reviews] review user:", user);
      logDev("[Reviews] persisted UI fields:", { dateRead, currentlyReading, coverImage, status, coverPreference });

      const review = await prisma.review.upsert({
        where: {
          userId_bookId: {
            userId: user.id,
            bookId: book.id,
          },
        },
        create: {
          userId: user.id,
          bookId: book.id,
          rating: rating ?? null,
          body: reviewBody,
          dateRead,
          currentlyReading,
          coverImage,
          status,
          coverPreference,
        },
        update: {
          rating: rating ?? null,
          body: reviewBody,
          dateRead,
          currentlyReading,
          coverImage,
          status,
          coverPreference,
        },
      });
      logDev("[Reviews] Prisma review upsert result:", review);

      sendJson(response, 200, review);
    } catch (error) {
      logError("Review publish failed", error);
      sendJson(response, 500, { error: "Failed to publish review" });
    }

    return;
  }

  sendJson(response, 404, { error: "Not found" });
});

server.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});
