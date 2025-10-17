import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { storage, Book } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Upload } from "lucide-react";
import { toast } from "sonner";

export default function CreateShelf() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [imagePreview, setImagePreview] = useState<string>("");
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    setBooks(storage.getBooks());
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setCoverImage(result);
        setImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleBook = (bookId: string) => {
    setSelectedBooks(prev =>
      prev.includes(bookId)
        ? prev.filter(id => id !== bookId)
        : [...prev, bookId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name) {
      toast.error("Please enter a shelf name");
      return;
    }

    const newShelf = {
      id: Date.now().toString(),
      name,
      description,
      coverImage,
      bookIds: selectedBooks,
      userId: '1',
    };

    storage.addShelf(newShelf);
    toast.success("Shelf created successfully");
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Profile
        </Button>

        <Card className="p-8">
          <h1 className="font-serif text-3xl font-bold mb-6">Create New Shelf</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">Shelf Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Summer Reads, Favorites"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this shelf..."
                className="min-h-24"
              />
            </div>

            <div>
              <Label htmlFor="cover">Shelf Cover Image</Label>
              <div className="mt-2 space-y-4">
                {imagePreview && (
                  <div className="w-full h-48 rounded-lg overflow-hidden border">
                    <img
                      src={imagePreview}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    id="cover"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Label
                    htmlFor="cover"
                    className="cursor-pointer flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Cover Image
                  </Label>
                </div>
              </div>
            </div>

            <div>
              <Label>Select Books</Label>
              <div className="mt-3 space-y-3 max-h-64 overflow-y-auto">
                {books.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No books yet. Add some books first!
                  </p>
                ) : (
                  books.map(book => (
                    <div key={book.id} className="flex items-center gap-3">
                      <Checkbox
                        id={book.id}
                        checked={selectedBooks.includes(book.id)}
                        onCheckedChange={() => toggleBook(book.id)}
                      />
                      <label
                        htmlFor={book.id}
                        className="flex items-center gap-3 cursor-pointer flex-1"
                      >
                        <img
                          src={book.coverImage}
                          alt={book.title}
                          className="w-12 h-16 object-cover rounded"
                        />
                        <div>
                          <p className="font-medium">{book.title}</p>
                          <p className="text-sm text-muted-foreground">{book.author}</p>
                        </div>
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>

            <Button type="submit" className="w-full">
              Create Shelf
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
