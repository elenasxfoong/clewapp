import { Book } from "@/lib/storage";
import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";

interface BookCardProps {
  book: Book;
  onClick?: () => void;
  footerNote?: string;
  footerNoteClassName?: string;
}

export const BookCard = ({ book, onClick, footerNote, footerNoteClassName }: BookCardProps) => {
  return (
    <Card 
      className="group overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 bg-card border-border"
      onClick={onClick}
    >
      <div className="aspect-[2/3] relative overflow-hidden bg-muted">
        {book.coverImage ? (
          <img 
            src={book.coverImage} 
            alt={book.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <span className="text-sm text-center px-4 font-serif">{book.title}</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-serif font-semibold text-sm line-clamp-1">{book.title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-1">{book.author}</p>
        {book.rating && (
          <div className="flex items-center gap-1 mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${
                  i < book.rating! ? 'fill-primary text-primary' : 'text-border'
                }`}
              />
            ))}
          </div>
        )}
        {footerNote && (
          <p className={`text-[10px] mt-2 ${footerNoteClassName ?? 'text-muted-foreground'}`}>
            {footerNote}
          </p>
        )}
      </div>
    </Card>
  );
};
