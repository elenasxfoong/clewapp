import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { storage, type Draft, type User } from "@/lib/storage";
import { BookCard } from "@/components/BookCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Settings, User as UserIcon } from "lucide-react";

const formatDate = (value: string) => {
  try {
    const date = new Date(value);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).replace(",", "");
  } catch {
    return value;
  }
};

const Drafts = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const currentUser = storage.getUser();
    if (!currentUser) {
      const newUser: User = {
        id: "1",
        name: "Reader",
        bio: "Add your bio...",
        favQuote: "Add your favorite quote...",
      };
      storage.setUser(newUser);
      setUser(newUser);
    } else {
      setUser(currentUser);
    }

    setDrafts(storage.getDrafts());
  }, []);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="flex items-center gap-4 lg:w-1/3">
              <button
                className="text-3xl font-serif font-bold tracking-wide"
                onClick={() => navigate("/")}
              >
                Clew
              </button>
              <div className="relative flex-1 hidden sm:block">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="rounded-full pl-10 pr-4"
                />
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 lg:w-1/3">
              <Button variant="ghost" className="text-base font-medium" onClick={() => navigate("/home")}>
                Home
              </Button>
              <Button variant="ghost" className="text-base font-medium" onClick={() => navigate("/trending")}>
                Trending
              </Button>
              <Button variant="ghost" className="text-base font-medium" onClick={() => navigate("/drafts")}>
                Drafts
              </Button>
              <Button
                variant="secondary"
                className="h-12 w-24 rounded-xl text-sm font-semibold flex items-center justify-center gap-1"
                onClick={() => navigate("/log")}
              >
                Log +
              </Button>
            </div>
            <div className="flex items-center justify-end gap-4 lg:w-1/3">
              <button
                className="flex items-center gap-3 rounded-full border px-3 py-1.5 transition hover:bg-accent"
                onClick={() => navigate("/profile")}
              >
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {user.profilePic ? (
                    <img src={user.profilePic} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <span className="font-medium">{user.name}</span>
              </button>
              <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <div className="mt-3 sm:hidden">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="rounded-full pl-10 pr-4"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-baseline gap-2">
            <h1 className="font-serif text-4xl font-bold">Drafts</h1>
            <span className="text-xs font-semibold text-primary">({drafts.length})</span>
          </div>
          <Button onClick={() => navigate("/profile")}>Back to Profile</Button>
        </div>

        {drafts.length === 0 ? (
          <p className="text-muted-foreground">You haven&apos;t saved any drafts yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {drafts.map((draft) => (
              <BookCard
                key={draft.id}
                book={{
                  id: draft.id,
                  title: draft.title,
                  author: draft.author,
                  coverImage: draft.coverImage || "",
                  rating: draft.rating,
                  dateRead: draft.dateRead,
                  review: draft.review,
                  status: draft.status || "wishlist",
                  userId: draft.userId,
                }}
                footerNote={draft.lastEdited ? `Last edited ${formatDate(draft.lastEdited)}` : undefined}
                footerNoteClassName="text-[11px] text-primary"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Drafts;
