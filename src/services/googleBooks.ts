const GOOGLE_BOOKS_API_BASE = "https://www.googleapis.com/books/v1/volumes";

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

export type GoogleBookResult = {
  id: string;
  title: string;
  author: string;
  description?: string;
  thumbnail?: string;
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

const runGoogleBooksRequest = async <T>(url: string, signal?: AbortSignal): Promise<T> => {
  const response = await fetch(url, { signal });
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

  const maxResults = Math.min(Math.max(options?.maxResults ?? 5, 1), 40);
  const url = new URL(GOOGLE_BOOKS_API_BASE);
  url.searchParams.set("q", normalizedQuery);
  url.searchParams.set("maxResults", String(maxResults));
  appendGoogleBooksApiKey(url);

  const data = await runGoogleBooksRequest<GoogleBooksSearchResponse>(url.toString(), options?.signal);
  const items = data.items ?? [];
  return items
    .map(normalizeVolume)
    .filter((entry): entry is GoogleBookResult => Boolean(entry))
    .slice(0, maxResults);
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
