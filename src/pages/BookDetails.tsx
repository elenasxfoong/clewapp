import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fetchBookReview, fetchBookReviewSummary, type BookReviewSummary, type ExistingReview } from "@/services/googleBooks";
import { storage } from "@/lib/storage";

const STAR_COUNT = 5;

const BookDetails = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const [savedReview, setSavedReview] = useState<ExistingReview>(null);
  const [reviewSummary, setReviewSummary] = useState<BookReviewSummary>({ averageRating: null, reviewCount: 0, reviews: [] });
  const [isLoadingReview, setIsLoadingReview] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const book = useMemo(() => {
    if (!bookId) return null;
    return storage.getBooks().find((entry) => entry.id === bookId) ?? null;
  }, [bookId]);

  useEffect(() => {
    if (!bookId) {
      setReviewSummary({ averageRating: null, reviewCount: 0, reviews: [] });
      return;
    }

    let isActive = true;
    const controller = new AbortController();
    setIsLoadingSummary(true);

    fetchBookReviewSummary(bookId, controller.signal)
      .then((summary) => {
        if (!isActive) return;
        setReviewSummary(summary);
      })
      .catch((error) => {
        const errorName = error instanceof Error ? error.name : undefined;
        if (errorName === "AbortError") return;

        console.error("Failed to load review summary", error instanceof Error ? error.stack ?? error.message : error);
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingSummary(false);
        }
      });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [bookId]);

  useEffect(() => {
    if (!bookId) {
      setSavedReview(null);
      return;
    }

    let isActive = true;
    const controller = new AbortController();
    setIsLoadingReview(true);
    setReviewError(null);

    fetchBookReview(bookId, controller.signal)
      .then((review) => {
        if (!isActive) return;
        setSavedReview(review);
      })
      .catch((error) => {
        const errorName = error instanceof Error ? error.name : undefined;
        if (errorName === "AbortError") return;

        console.error("Failed to load saved review", error instanceof Error ? error.stack ?? error.message : error);
        if (isActive) {
          setReviewError("Unable to load this review.");
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingReview(false);
        }
      });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [bookId]);

  if (!book) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md p-6 text-center">
          <h1 className="font-serif text-3xl font-bold">Book not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">This book is not in your library.</p>
          <Button className="mt-6" onClick={() => navigate("/profile")}>
            Back to Profile
          </Button>
        </Card>
      </div>
    );
  }

  const yourRating = savedReview?.rating ?? 0;
  const reviewBody = savedReview?.body;
  const dateRead = savedReview?.dateRead ?? book.dateRead;
  const isCurrentlyReading = savedReview?.currentlyReading ?? book.status === "reading";
  const status = savedReview?.status ?? book.status;
  const coverImage = savedReview?.coverImage ?? book.coverImage;
  const averageRating = reviewSummary.averageRating;
  const roundedAverageRating = averageRating === null ? 0 : Math.round(averageRating);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          Back
        </Button>

        <div className="grid gap-8 lg:grid-cols-[300px,1fr]">
          <div className="aspect-[2/3] w-full overflow-hidden rounded-xl border bg-muted">
            {coverImage ? (
              <img src={coverImage} alt={book.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center px-6 text-center text-muted-foreground">
                <span className="font-serif text-lg">{book.title}</span>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="font-serif text-4xl font-bold">{book.title}</h1>
              <p className="text-lg text-muted-foreground">{book.author}</p>
            </div>

            <Card className="p-6">
              <div className="mb-6 border-b pb-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Community Rating
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: STAR_COUNT }, (_, index) => (
                      <Star
                        key={index}
                        className={`h-5 w-5 ${index < roundedAverageRating ? "fill-primary text-primary" : "text-border"}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {isLoadingSummary
                      ? "Loading ratings..."
                      : averageRating === null
                      ? "No ratings yet"
                      : `${averageRating.toFixed(1)} average from ${reviewSummary.reviewCount} ${reviewSummary.reviewCount === 1 ? "review" : "reviews"}`}
                  </span>
                </div>
              </div>

              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {isCurrentlyReading ? "Currently Reading" : status}
                </span>
                {dateRead && (
                  <span className="text-sm text-muted-foreground">
                    Date read: {dateRead}
                  </span>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Your Review
                </p>

                {isLoadingReview && (
                  <p className="mt-3 text-sm text-muted-foreground">Loading saved review...</p>
                )}
                {reviewError && (
                  <p className="mt-3 text-sm text-destructive">{reviewError}</p>
                )}
                {!isLoadingReview && !reviewError && savedReview && (
                  <>
                    <div className="mt-3 mb-5 flex items-center gap-1">
                      {Array.from({ length: STAR_COUNT }, (_, index) => (
                        <Star
                          key={index}
                          className={`h-5 w-5 ${index < yourRating ? "fill-primary text-primary" : "text-border"}`}
                        />
                      ))}
                      <span className="ml-2 text-sm text-muted-foreground">
                        {yourRating ? `${yourRating} / 5` : "No rating"}
                      </span>
                    </div>

                    <p className="whitespace-pre-wrap text-base leading-7 text-foreground">
                      {reviewBody || "No review body yet."}
                    </p>
                  </>
                )}
                {!isLoadingReview && !reviewError && !savedReview && (
                  <div className="mt-4 flex flex-col items-start gap-4">
                    <p className="text-sm text-muted-foreground">
                      You have not reviewed this book yet.
                    </p>
                    <Button onClick={() => navigate(`/edit-book/${book.id}`)}>
                      Write a review
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {savedReview && (
              <div className="flex justify-end">
                <Button onClick={() => navigate(`/edit-book/${book.id}`)}>
                  Edit Review
                </Button>
              </div>
            )}

            <section className="space-y-4">
              <div>
                <h2 className="font-serif text-2xl font-semibold">Reviews</h2>
                <p className="text-sm text-muted-foreground">
                  {reviewSummary.reviewCount} {reviewSummary.reviewCount === 1 ? "review" : "reviews"}
                </p>
              </div>

              {isLoadingSummary && (
                <p className="text-sm text-muted-foreground">Loading reviews...</p>
              )}
              {!isLoadingSummary && reviewSummary.reviews.length === 0 && (
                <Card className="p-5">
                  <p className="text-sm text-muted-foreground">No reviews yet.</p>
                </Card>
              )}
              {!isLoadingSummary && reviewSummary.reviews.map((review) => (
                <Card key={review.id} className="p-5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{review.reviewerUsername}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: STAR_COUNT }, (_, index) => (
                        <Star
                          key={index}
                          className={`h-4 w-4 ${index < (review.rating ?? 0) ? "fill-primary text-primary" : "text-border"}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">{review.body}</p>
                </Card>
              ))}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetails;
