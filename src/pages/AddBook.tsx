import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { storage } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Upload } from "lucide-react";
import { toast } from "sonner";

export default function AddBook() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultStatus = searchParams.get('status') || 'reading';
  
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [imagePreview, setImagePreview] = useState<string>("");

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !author) {
      toast.error("Please fill in all required fields");
      return;
    }

    const newBook = {
      id: Date.now().toString(),
      title,
      author,
      coverImage: coverImage || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400',
      status: defaultStatus as 'reading' | 'read' | 'wishlist',
      userId: '1',
    };

    storage.addBook(newBook);
    toast.success("Book added successfully");
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
          <h1 className="font-serif text-3xl font-bold mb-6">Add New Book</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter book title"
                required
              />
            </div>

            <div>
              <Label htmlFor="author">Author *</Label>
              <Input
                id="author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Enter author name"
                required
              />
            </div>

            <div>
              <Label htmlFor="cover">Book Cover</Label>
              <div className="mt-2 space-y-4">
                {imagePreview && (
                  <div className="w-32 h-48 rounded-lg overflow-hidden border">
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

            <Button type="submit" className="w-full">
              Add Book
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
