const GOOGLE_BOOKS_API_BASE = "https://www.googleapis.com/books/v1/volumes";

const isBrowser = () => typeof window !== "undefined";

const isDevelopment = () => {
  const viteEnv = (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env;
  if (typeof viteEnv?.DEV === "boolean") {
    return viteEnv.DEV;
  }

  const runtime = globalThis as typeof globalThis & {
    process?: {
      env?: {
        NODE_ENV?: string;
      };
    };
  };

  return runtime.process?.env?.NODE_ENV === "development";
};

const getGoogleBooksApiKey = () => {
  const runtime = globalThis as typeof globalThis & {
    process?: {
      env?: {
        GOOGLE_BOOKS_API_KEY?: string;
      };
    };
  };

  return runtime.process?.env?.GOOGLE_BOOKS_API_KEY?.trim() || undefined;
};

const appendGoogleBooksApiKey = (url: URL) => {
  const apiKey = getGoogleBooksApiKey();
  if (apiKey) {
    url.searchParams.set("key", apiKey);
  }
};

const buildTitleSearchQuery = (query: string) => {
  const escapedQuery = query.replace(/"/g, '\\"');
  return `intitle:"${escapedQuery}"`;
};

const logRequest = (url: string, response: Response) => {
  if (!isDevelopment()) {
    return;
  }

  const loggedUrl = new URL(url, "http://localhost");
  loggedUrl.searchParams.delete("key");

  console.log(`[Google Books] request: ${loggedUrl.pathname}${loggedUrl.search}`);
  console.log(`[Google Books] query: ${loggedUrl.searchParams.get("q") ?? ""}`);
  console.log(`[Google Books] response status: ${response.status}`);
};

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

export type GoogleBookResult = {
  id: string;
  title: string;
  author: string;
  description?: string;
  thumbnail?: string;
};

export type CachedBook = {
  id: string;
  googleBooksId: string;
  title: string;
  author: string;
  description?: string | null;
  createdAt: string;
};

export type PublishedReview = {
  id: string;
  userId: string;
  bookId: string;
  rating?: number | null;
  body: string;
  dateRead?: string | null;
  currentlyReading: boolean;
  coverImage?: string | null;
  status?: string | null;
  coverPreference?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PublishReviewInput = {
  bookId: string;
  body: string;
  rating?: number;
  dateRead?: string;
  currentlyReading?: boolean;
  coverImage?: string;
  status?: string;
  coverPreference?: string;
  book?: {
    title: string;
    author: string;
    description?: string;
    googleBooksId?: string;
  };
};

type GoogleBooksVolume = {
  id: string;
  volumeInfo?: {
    title?: string;
    authors?: string[];
    description?: string;
    imageLinks?: {
      smallThumbnail?: string;
      thumbnail?: string;
    };
  };
};

type GoogleBooksSearchResponse = {
  items?: GoogleBooksVolume[];
};

const normalizeImageUrl = (value?: string) => {
  if (!value) return undefined;
  return value.startsWith("https://") ? value : value.replace("http://", "https://");
};

const normalizeVolume = (volume: GoogleBooksVolume | undefined | null): GoogleBookResult | null => {
  if (!volume || !volume.volumeInfo || !volume.volumeInfo.title) {
    return null;
  }

  const author = Array.isArray(volume.volumeInfo.authors) && volume.volumeInfo.authors.length > 0
    ? volume.volumeInfo.authors.join(", ")
    : "Unknown author";

  return {
    id: volume.id,
    title: volume.volumeInfo.title,
    author,
    description: volume.volumeInfo.description?.trim(),
    thumbnail: normalizeImageUrl(volume.volumeInfo.imageLinks?.thumbnail || volume.volumeInfo.imageLinks?.smallThumbnail),
  };
};

const normalizeForRanking = (value: string) => value.trim().toLocaleLowerCase();

const getTitleMatchRank = (title: string, query: string) => {
  const normalizedTitle = normalizeForRanking(title);
  const normalizedQuery = normalizeForRanking(query);

  if (normalizedTitle === normalizedQuery) {
    return 0;
  }

  if (normalizedTitle.startsWith(normalizedQuery)) {
    return 1;
  }

  if (normalizedTitle.includes(normalizedQuery)) {
    return 2;
  }

  return 3;
};

const rankGoogleBookResults = (results: GoogleBookResult[], query: string) => {
  return results
    .map((book, index) => ({
      book,
      index,
      rank: getTitleMatchRank(book.title, query),
    }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map(({ book }) => book);
};

const runGoogleBooksRequest = async <T>(url: string, signal?: AbortSignal): Promise<T> => {
  const response = await fetch(url, { signal });
  logRequest(url, response);

  if (!response.ok) {
    throw new Error(`Google Books request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
};

export const searchGoogleBooks = async (
  query: string,
  options?: { maxResults?: number; signal?: AbortSignal }
): Promise<GoogleBookResult[]> => {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    return [];
  }

  if (isBrowser()) {
    const url = new URL("/api/books/search", window.location.origin);
    url.searchParams.set("q", normalizedQuery);

    return runGoogleBooksRequest<GoogleBookResult[]>(`${url.pathname}${url.search}`, options?.signal);
  }

  const maxResults = Math.min(Math.max(options?.maxResults ?? 5, 1), 40);
  const requestLimit = Math.min(Math.max(maxResults * 4, maxResults), 40);
  const url = new URL(GOOGLE_BOOKS_API_BASE);
  url.searchParams.set("q", buildTitleSearchQuery(normalizedQuery));
  url.searchParams.set("maxResults", String(requestLimit));
  appendGoogleBooksApiKey(url);

  const data = await runGoogleBooksRequest<GoogleBooksSearchResponse>(url.toString(), options?.signal);
  const items = data.items ?? [];
  const results = items
    .map(normalizeVolume)
    .filter((entry): entry is GoogleBookResult => Boolean(entry));

  return rankGoogleBookResults(results, normalizedQuery).slice(0, maxResults);
};

export const fetchGoogleBookById = async (id: string, signal?: AbortSignal): Promise<GoogleBookResult | null> => {
  const normalizedId = id.trim();
  if (!normalizedId) {
    return null;
  }

  const url = new URL(`${GOOGLE_BOOKS_API_BASE}/${encodeURIComponent(normalizedId)}`);
  appendGoogleBooksApiKey(url);

  const data = await runGoogleBooksRequest<GoogleBooksVolume>(url.toString(), signal);
  return normalizeVolume(data);
};

export const cacheGoogleBook = async (googleBooksId: string, signal?: AbortSignal): Promise<CachedBook> => {
  const requestBody = { googleBooksId };
  logDev("[Books Cache] request body sent to /api/books/cache:", requestBody);

  const response = await fetch("/api/books/cache", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
    signal,
  });

  logDev("[Books Cache] response status:", response.status);

  if (!response.ok) {
    throw new Error(`Book cache request failed with status ${response.status}`);
  }

  const cachedBook = await response.json() as CachedBook;
  logDev("[Books Cache] cached Book.id returned by /api/books/cache:", cachedBook.id);

  return cachedBook;
};

export const publishReview = async (input: PublishReviewInput, signal?: AbortSignal): Promise<PublishedReview> => {
  logDev("[Reviews] request body sent to POST /api/reviews:", input);

  const response = await fetch("/api/reviews", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Review publish request failed with status ${response.status}`);
  }

  const review = await response.json() as PublishedReview;
  logDev("[Reviews] created/updated Review row:", review);

  return review;
};
