import { Shelf, Book } from "@/lib/storage";
import { Card } from "@/components/ui/card";
import { MoreHorizontal } from "lucide-react";

interface ShelfCardProps {
  shelf: Shelf;
  books: Book[];
  onClick?: () => void;
  onEdit?: () => void;
}

export const ShelfCard = ({ shelf, books, onClick, onEdit }: ShelfCardProps) => {
  const previewBooks = books.slice(0, 4);
  
  return (
    <Card 
      className="group cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 overflow-hidden bg-card border-border"
      onClick={onClick}
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-muted">
        {onEdit && (
          <button
            type="button"
            className="absolute right-2 top-2 z-10 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
            onClick={(event) => {
              event.stopPropagation();
              onEdit();
            }}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        )}
        {shelf.coverImage ? (
          <img 
            src={shelf.coverImage} 
            alt={shelf.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="grid grid-cols-2 gap-1 p-2 h-full">
            {previewBooks.map((book) => (
              <div key={book.id} className="aspect-[2/3] overflow-hidden rounded bg-background">
                {book.coverImage ? (
                  <img src={book.coverImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                    <span className="text-center px-1 font-serif line-clamp-2">{book.title}</span>
                  </div>
                )}
              </div>
            ))}
            {previewBooks.length < 4 && Array.from({ length: 4 - previewBooks.length }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-[2/3] rounded bg-background/50" />
            ))}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-serif font-semibold text-lg">{shelf.name}</h3>
        {shelf.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{shelf.description}</p>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          {books.length} {books.length === 1 ? 'book' : 'books'}
        </p>
      </div>
    </Card>
  );
};
