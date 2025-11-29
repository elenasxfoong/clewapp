import { useEffect, useMemo, useRef, useState, type ChangeEvent, type MouseEvent } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { generalBookDatabase } from "@/lib/generalBooks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";
import { storage, type Book, type Draft } from "@/lib/storage";

const STAR_COUNT = 5;
const REVIEW_MAX_LENGTH = 100_000;

const generateBookId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

type AddBookDetailsProps = {
  mode?: "create" | "edit" | "draft";
};

const AddBookDetails = ({ mode = "create" }: AddBookDetailsProps) => {
  const { bookId } = useParams<{ bookId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentUser = useMemo(() => storage.getUser(), []);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [dateRead, setDateRead] = useState("");
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [review, setReview] = useState("");
  const [isCurrentlyReading, setIsCurrentlyReading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<Book["status"]>("reading");
  const [coverPreference, setCoverPreference] = useState<"specific" | "none">("specific");

  const savedBook = useMemo(() => {
    if (!bookId) return null;
    const books = storage.getBooks();
    return books.find((entry) => entry.id === bookId) ?? null;
  }, [bookId]);

  const draftEntry = useMemo(() => {
    if (!bookId) return null;
    const drafts = storage.getDrafts();
    return drafts.find((entry) => entry.id === bookId) ?? null;
  }, [bookId]);

  const libraryBook = useMemo(
    () => generalBookDatabase.find((entry) => entry.id === bookId),
    [bookId]
  );
  const isEditing = mode === "edit";
  const isDraftMode = mode === "draft";
  const book = isEditing ? savedBook : isDraftMode ? draftEntry : libraryBook;
  const statusParam = (searchParams.get("status") as Book["status"] | null);

  const displayedRating = hoveredRating ?? rating;

  useEffect(() => {
    if (isEditing && savedBook) {
      setImagePreview(savedBook.coverImage ?? null);
      setImageData(savedBook.coverImage ?? null);
      setDateRead(savedBook.dateRead ?? "");
      setRating(savedBook.rating ?? 0);
      setReview(savedBook.review ?? "");
      setIsCurrentlyReading(savedBook.status === "reading");
      setCurrentStatus(savedBook.status);
      setCoverPreference(savedBook.coverImage ? "specific" : "none");
    } else if (isDraftMode && draftEntry) {
      setImagePreview(draftEntry.coverImage ?? null);
      setImageData(draftEntry.coverImage ?? null);
      setDateRead(draftEntry.dateRead ?? "");
      setRating(draftEntry.rating ?? 0);
      setReview(draftEntry.review ?? "");
      const derivedStatus = draftEntry.status || (draftEntry.isCurrentlyReading ? "reading" : "read");
      setCurrentStatus(derivedStatus || "wishlist");
      setIsCurrentlyReading(draftEntry.isCurrentlyReading ?? derivedStatus === "reading");
      setCoverPreference(draftEntry.coverImage ? "specific" : "none");
    } else if (!isEditing && !isDraftMode) {
      const normalized = statusParam === "wishlist" || statusParam === "read" ? statusParam : "reading";
      setCurrentStatus(normalized);
      setIsCurrentlyReading(normalized === "reading");
      setImagePreview(null);
      setImageData(null);
      setDateRead("");
      setRating(0);
      setReview("");
      setCoverPreference(normalized === "wishlist" ? "none" : "specific");
    }
  }, [isEditing, isDraftMode, savedBook, draftEntry, statusParam, bookId]);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setImagePreview(result);
      setImageData(result);
      setCoverPreference("specific");
    };
    reader.readAsDataURL(file);
  };

  const handleCoverPreferenceChange = (preference: "specific" | "none") => {
    if (preference === "none") {
      setImagePreview(null);
      setImageData(null);
    }
    setCoverPreference(preference);
  };

  const getExistingCoverImage = () => {
    if (isEditing && savedBook) return savedBook.coverImage || "";
    if (isDraftMode && draftEntry) return draftEntry.coverImage || "";
    return "";
  };

  const getCoverImageValue = () => {
    if (currentStatus === "wishlist") {
      return coverPreference === "specific"
        ? imageData || getExistingCoverImage()
        : "";
    }
    return imageData || getExistingCoverImage();
  };

  const getPointerRating = (starIndex: number, event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width;
    const addition = percent <= 0.5 ? 0.5 : 1;
    return starIndex - 1 + addition;
  };

  const handleStarMouseMove = (starIndex: number, event: MouseEvent<HTMLDivElement>) => {
    setHoveredRating(getPointerRating(starIndex, event));
  };

  const handleStarClick = (starIndex: number, event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    const value = getPointerRating(starIndex, event);
    setRating(value);
  };

  const getStarFillPercentage = (starIndex: number) => {
    const value = displayedRating - (starIndex - 1);
    if (value >= 1) return 100;
    if (value >= 0.5) return 50;
    return 0;
  };
  
  const handlePublish = () => {
    if (!book || isPublishing) return;
    setIsPublishing(true);
    
    try {
      const trimmedDate = dateRead.trim();
      const status: Book["status"] = currentStatus === "wishlist"
        ? "wishlist"
        : isCurrentlyReading
        ? "reading"
        : trimmedDate
        ? "read"
        : currentStatus === "read"
        ? "read"
        : "reading";
      const resolvedCoverImage = getCoverImageValue();
      const resolvedRating = currentStatus === "wishlist" ? undefined : rating > 0 ? rating : undefined;
      const resolvedReview = currentStatus === "wishlist" ? undefined : review || undefined;
      const resolvedDate = status === "read" ? trimmedDate : undefined;

      if (isEditing && savedBook) {
        storage.updateBook(savedBook.id, {
          coverImage: resolvedCoverImage || savedBook.coverImage || "",
          rating: resolvedRating,
          dateRead: resolvedDate,
          review: resolvedReview,
          status,
          userId: savedBook.userId,
          coverPreference: currentStatus === "wishlist" ? coverPreference : undefined,
        });
      } else if (isDraftMode && draftEntry) {
        const newBook: Book = {
          id: generateBookId(),
          title: draftEntry.title,
          author: draftEntry.author,
          coverImage: resolvedCoverImage || draftEntry.coverImage || "",
          rating: resolvedRating,
          dateRead: resolvedDate,
          review: resolvedReview,
          status,
          userId: draftEntry.userId,
          coverPreference: currentStatus === "wishlist" ? coverPreference : undefined,
        };
        storage.addBook(newBook);
        storage.deleteDraft(draftEntry.id);
      } else {
        const newBook: Book = {
          id: generateBookId(),
          title: book.title,
          author: book.author,
          coverImage: resolvedCoverImage,
          rating: resolvedRating,
          dateRead: resolvedDate,
          review: resolvedReview,
          status,
          userId: currentUser?.id ?? "1",
          coverPreference: currentStatus === "wishlist" ? coverPreference : undefined,
        };

        storage.addBook(newBook);
      }
      navigate("/profile");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSaveDraft = () => {
    if (!book || isSavingDraft || isEditing || currentStatus === "wishlist") return;
    setIsSavingDraft(true);

    try {
      const trimmedDate = dateRead.trim();
      const status: Book["status"] = isCurrentlyReading
        ? "reading"
        : trimmedDate
        ? "read"
        : currentStatus === "read"
        ? "read"
        : "reading";

      const draftPayload: Draft = {
        id: isDraftMode && draftEntry ? draftEntry.id : generateBookId(),
        title: book.title,
        author: book.author,
        coverImage: imageData || (isDraftMode && draftEntry?.coverImage) || "",
        rating: rating > 0 ? rating : undefined,
        dateRead: trimmedDate || undefined,
        review: review || undefined,
        status,
        userId: isDraftMode && draftEntry ? draftEntry.userId : currentUser?.id ?? "1",
        lastEdited: new Date().toISOString(),
        isCurrentlyReading,
      };

      if (isDraftMode && draftEntry) {
        storage.updateDraft(draftEntry.id, draftPayload);
      } else {
        storage.addDraft(draftPayload);
      }
      navigate("/drafts");
    } finally {
      setIsSavingDraft(false);
    }
  };

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-md w-full p-6 text-center space-y-4">
          <p className="font-serif text-2xl">Entry not found</p>
          <p className="text-muted-foreground">
            The selection you chose is no longer available.
          </p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          Back
        </Button>
        <div className="grid gap-8 lg:grid-cols-[300px,1fr]">
          <div>
            <div
              className="aspect-[2/3] w-full rounded-xl border-2 border-dashed border-muted-foreground/50 bg-muted flex items-center justify-center text-muted-foreground cursor-pointer"
              onClick={handleImageClick}
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt={book.title}
                  className="h-full w-full object-cover rounded-lg"
                />
              ) : (
                <span className="font-medium">Add Cover Image</span>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          <div className="space-y-6">
            <div>
              <h1 className="font-serif text-4xl font-bold">{book.title}</h1>
              <p className="text-lg text-muted-foreground">{book.author}</p>
            </div>
            {currentStatus === "wishlist" && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Cover Preference</p>
                  <div className="mt-3 space-y-2">
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={coverPreference === "specific"}
                        onChange={() => handleCoverPreferenceChange("specific")}
                        className="h-4 w-4 accent-primary"
                      />
                      This specific cover
                    </label>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={coverPreference === "none"}
                        onChange={() => handleCoverPreferenceChange("none")}
                        className="h-4 w-4 accent-primary"
                      />
                      No cover preference
                    </label>
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <Button onClick={handlePublish} disabled={isPublishing}>
                    {isPublishing ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            )}
            {currentStatus !== "wishlist" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Date Read
                  </p>
                  <Input
                    value={dateRead}
                    onChange={(e) => setDateRead(e.target.value)}
                    placeholder="DD/MM/YYYY"
                    className="mt-2"
                    disabled={isCurrentlyReading}
                  />
                  <label className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={isCurrentlyReading}
                      onChange={(e) => {
                        setIsCurrentlyReading(e.target.checked);
                        if (e.target.checked) {
                          setDateRead("");
                        }
                      }}
                      className="h-4 w-4 accent-primary"
                    />
                    Currently Reading
                  </label>
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Rating
                  </p>
                  <div
                    className="mt-2 flex items-center gap-2"
                    onMouseLeave={() => setHoveredRating(null)}
                  >
                    {Array.from({ length: STAR_COUNT }, (_, index) => index + 1).map((starNumber) => (
                      <div
                        key={starNumber}
                        className="relative h-10 w-10 cursor-pointer"
                        onMouseMove={(event) => handleStarMouseMove(starNumber, event)}
                        onClick={(event) => handleStarClick(starNumber, event)}
                      >
                        <Star className="h-10 w-10 text-muted-foreground" />
                        <div
                          className="absolute inset-0 overflow-hidden"
                          style={{ width: `${getStarFillPercentage(starNumber)}%` }}
                        >
                          <Star className="h-10 w-10 text-yellow-400 fill-yellow-400" />
                        </div>
                      </div>
                    ))}
                    <span className="text-sm text-muted-foreground">
                      {displayedRating ? `${displayedRating.toFixed(1)} / 5` : "No rating"}
                    </span>
                  </div>
                </div>
              </div>
            )}
            {currentStatus !== "wishlist" && (
              <>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value.slice(0, REVIEW_MAX_LENGTH))}
                  placeholder="Add a review..."
                  maxLength={REVIEW_MAX_LENGTH}
                  className="mt-6 min-h-[200px] w-full rounded-xl border border-border bg-transparent px-4 py-3 text-base"
                />
                <div className="flex flex-wrap justify-end gap-3">
                  {!isEditing && (
                    <Button variant="outline" onClick={handleSaveDraft} disabled={isSavingDraft}>
                      {isSavingDraft ? "Saving..." : "Save Draft"}
                    </Button>
                  )}
                  <Button onClick={handlePublish} disabled={isPublishing}>
                    {isPublishing ? "Publishing..." : "Publish"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddBookDetails;
