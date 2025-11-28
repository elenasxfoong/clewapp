import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BookCard } from "@/components/BookCard";
import { storage, type Book, type Shelf } from "@/lib/storage";
import { Plus } from "lucide-react";

const generateShelfId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

type AddShelfProps = {
  mode?: "create" | "edit";
};

const AddShelf = ({ mode = "create" }: AddShelfProps) => {
  const navigate = useNavigate();
  const { shelfId } = useParams<{ shelfId: string }>();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [shelfBooks, setShelfBooks] = useState<Book[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const currentUser = useMemo(() => storage.getUser(), []);
  const isEditing = mode === "edit";
  const existingShelf = useMemo(() => {
    if (!isEditing || !shelfId) return null;
    const shelves = storage.getShelves();
    return shelves.find((shelf) => shelf.id === shelfId) ?? null;
  }, [isEditing, shelfId]);

  useEffect(() => {
    if (isEditing && existingShelf) {
      setName(existingShelf.name);
      setDescription(existingShelf.description ?? "");
      setImagePreview(existingShelf.coverImage ?? null);
      setImageData(existingShelf.coverImage ?? null);
      const books = storage.getBooks().filter((book) => existingShelf.bookIds.includes(book.id));
      setShelfBooks(books);
    } else if (!isEditing) {
      setName("");
      setDescription("");
      setImagePreview(null);
      setImageData(null);
      setShelfBooks([]);
    }
  }, [isEditing, existingShelf, shelfId]);

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
    };
    reader.readAsDataURL(file);
  };

  const handleSaveShelf = () => {
    if (!name.trim() || isSaving) return;
    setIsSaving(true);

    try {
      const payload: Shelf = {
        id: isEditing && existingShelf ? existingShelf.id : generateShelfId(),
        name: name.trim(),
        description: description.trim() || undefined,
        coverImage: imageData || undefined,
        bookIds: shelfBooks.map((book) => book.id),
        userId: currentUser?.id ?? "1",
      };

      if (isEditing && existingShelf) {
        storage.updateShelf(existingShelf.id, payload);
      } else {
        storage.addShelf(payload);
      }
      navigate("/profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing && !existingShelf) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full space-y-4 rounded-xl border bg-card p-6 text-center">
          <p className="font-serif text-2xl">Shelf not found</p>
          <p className="text-muted-foreground">The shelf you are trying to edit no longer exists.</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          Back
        </Button>
        <div className="grid gap-10 lg:grid-cols-[320px,1fr]">
          <div className="space-y-8">
            <div
              className="aspect-[2/3] w-full rounded-xl border-2 border-dashed border-muted-foreground/50 bg-muted flex items-center justify-center text-muted-foreground cursor-pointer"
              onClick={handleImageClick}
            >
              {imagePreview ? (
                <img src={imagePreview} alt={name || "Shelf cover"} className="h-full w-full object-cover rounded-lg" />
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
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="font-serif text-2xl font-semibold">Books</h2>
                <button
                  type="button"
                  className="h-9 w-9 rounded-lg border flex items-center justify-center text-primary hover:bg-accent"
                  onClick={() => {}}
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
              {shelfBooks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No books added yet.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {shelfBooks.map((book) => (
                    <BookCard key={book.id} book={book} />
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Name</p>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Shelf Name"
                className="mt-2"
              />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Shelf Description</p>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this shelf..."
                className="mt-2 min-h-[160px]"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
              <Button onClick={handleSaveShelf} disabled={!name.trim() || isSaving}>
                {isSaving ? "Saving..." : "Save Shelf"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddShelf;
