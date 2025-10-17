import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { storage, Book, Comment } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Star, Edit2, Trash2, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [newComment, setNewComment] = useState("");
  const [editingReview, setEditingReview] = useState(false);

  useEffect(() => {
    const allBooks = storage.getBooks();
    const foundBook = allBooks.find(b => b.id === id);
    if (foundBook) {
      setBook(foundBook);
      setRating(foundBook.rating || 0);
      setReview(foundBook.review || "");
    }
    
    const allComments = storage.getComments();
    setComments(allComments.filter(c => c.bookId === id));
  }, [id]);

  const handleSaveReview = () => {
    if (!book) return;
    
    storage.updateBook(book.id, { rating, review });
    setBook({ ...book, rating, review });
    setEditingReview(false);
    toast.success("Review updated");
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !book) return;

    const comment: Comment = {
      id: Date.now().toString(),
      text: newComment,
      authorId: '1',
      bookId: book.id,
      createdAt: new Date().toISOString(),
    };

    storage.addComment(comment);
    setComments([...comments, comment]);
    setNewComment("");
    toast.success("Comment added");
  };

  const handleDeleteBook = () => {
    if (!book) return;
    if (confirm("Are you sure you want to delete this book?")) {
      storage.deleteBook(book.id);
      toast.success("Book deleted");
      navigate('/');
    }
  };

  if (!book) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Book not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Profile
        </Button>

        <div className="grid md:grid-cols-[300px,1fr] gap-8 mb-8">
          {/* Book Cover */}
          <div>
            <img
              src={book.coverImage}
              alt={book.title}
              className="w-full rounded-lg shadow-lg"
            />
          </div>

          {/* Book Info */}
          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="font-serif text-4xl font-bold mb-2">{book.title}</h1>
                <p className="text-xl text-muted-foreground">{book.author}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteBook}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Rating */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium">Your Rating:</span>
                {editingReview && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingReview(false)}
                  >
                    Cancel
                  </Button>
                )}
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => editingReview && setRating(star)}
                    className={`${!editingReview && 'cursor-default'}`}
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating
                          ? 'fill-primary text-primary'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Review */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-serif text-2xl font-semibold">Your Review</h2>
                {!editingReview && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingReview(true)}
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
              {editingReview ? (
                <div className="space-y-4">
                  <Textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    placeholder="Write your review..."
                    className="min-h-32"
                  />
                  <Button onClick={handleSaveReview}>Save Review</Button>
                </div>
              ) : (
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {review || "No review yet. Click Edit to add one."}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <Card className="p-6">
          <h2 className="font-serif text-2xl font-semibold mb-6 flex items-center gap-2">
            <MessageSquare className="w-6 h-6" />
            Comments ({comments.length})
          </h2>

          {/* Add Comment */}
          <div className="mb-6 space-y-3">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="min-h-24"
            />
            <Button onClick={handleAddComment}>Post Comment</Button>
          </div>

          {/* Comments List */}
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="border-l-2 border-muted pl-4 py-2">
                <p className="text-sm text-muted-foreground mb-1">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </p>
                <p>{comment.text}</p>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-muted-foreground text-center py-8">
                No comments yet. Be the first to comment!
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
