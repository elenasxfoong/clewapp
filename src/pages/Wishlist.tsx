import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { storage, Book } from "@/lib/storage";
import { BookCard } from "@/components/BookCard";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";

export default function Wishlist() {
  const navigate = useNavigate();
  const [wishlistBooks, setWishlistBooks] = useState<Book[]>([]);

  useEffect(() => {
    const books = storage.getBooks();
    setWishlistBooks(books.filter(b => b.status === 'wishlist'));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Profile
        </Button>

        <div className="flex items-center justify-between mb-8">
          <h1 className="font-serif text-4xl font-bold">Wishlist</h1>
          <Button onClick={() => navigate('/add-book?status=wishlist')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Book
          </Button>
        </div>

        {wishlistBooks.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">Your wishlist is empty</p>
            <Button onClick={() => navigate('/add-book?status=wishlist')}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Book
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {wishlistBooks.map(book => (
              <BookCard
                key={book.id}
                book={book}
                onClick={() => navigate(`/book/${book.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
