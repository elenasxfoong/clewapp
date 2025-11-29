import { useState } from "react";
import { Shelf, Book } from "@/lib/storage";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

interface ShelfCardProps {
  shelf: Shelf;
  books: Book[];
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const ShelfCard = ({ shelf, books, onClick, onEdit, onDelete }: ShelfCardProps) => {
  const previewBooks = books.slice(0, 4);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  return (
    <Card 
      className="group cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 overflow-hidden bg-card border-border"
      onClick={onClick}
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-muted">
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
      {onDelete && (
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent onClick={(event) => event.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this shelf?</AlertDialogTitle>
              <AlertDialogDescription>
                This action is irreversible. Are you sure you want to delete this shelf?
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
