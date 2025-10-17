import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { storage, Shelf, Book } from "@/lib/storage";
import { BookCard } from "@/components/BookCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function ShelfDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shelf, setShelf] = useState<Shelf | null>(null);
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    const allShelves = storage.getShelves();
    const foundShelf = allShelves.find(s => s.id === id);
    
    if (foundShelf) {
      setShelf(foundShelf);
      const allBooks = storage.getBooks();
      setBooks(allBooks.filter(b => foundShelf.bookIds.includes(b.id)));
    }
  }, [id]);

  const handleDeleteShelf = () => {
    if (!shelf) return;
    if (confirm("Are you sure you want to delete this shelf?")) {
      storage.deleteShelf(shelf.id);
      toast.success("Shelf deleted");
      navigate('/');
    }
  };

  if (!shelf) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Shelf not found</p>
      </div>
    );
  }

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

        {/* Shelf Header */}
        {shelf.coverImage && (
          <div className="w-full h-64 rounded-lg overflow-hidden mb-6">
            <img
              src={shelf.coverImage}
              alt={shelf.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-serif text-4xl font-bold mb-2">{shelf.name}</h1>
            {shelf.description && (
              <p className="text-muted-foreground">{shelf.description}</p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              {books.length} {books.length === 1 ? 'book' : 'books'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteShelf}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Books Grid */}
        {books.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No books in this shelf yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {books.map(book => (
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
