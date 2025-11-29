import { Book } from "@/lib/storage";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Star } from "lucide-react";

interface BookCardProps {
  book: Book;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  footerNote?: string;
  footerNoteClassName?: string;
}

export const BookCard = ({ book, onClick, onEdit, onDelete, footerNote, footerNoteClassName }: BookCardProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <Card 
      className="group overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 bg-card border-border"
      onClick={onClick}
    >
      <div className="aspect-[2/3] relative overflow-hidden bg-muted">
        {(onEdit || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="absolute right-2 top-2 z-10 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
                onClick={(event) => event.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-28">
              {onEdit && (
                <DropdownMenuItem
                  onClick={(event) => {
                    event.stopPropagation();
                    onEdit();
                  }}
                >
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={(event) => {
                    event.stopPropagation();
                    setShowDeleteConfirm(true);
                  }}
                >
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
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
      {onDelete && (
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent onClick={(event) => event.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
              <AlertDialogDescription>
                This action is irreversible. Are you sure you want to delete this book?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(event) => {
                  event.stopPropagation();
                  setShowDeleteConfirm(false);
                  onDelete();
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Card>
  );
};
