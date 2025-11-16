//profile/Me page

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { storage, User, Book, Shelf } from "@/lib/storage";
import { BookCard } from "@/components/BookCard";
import { ShelfCard } from "@/components/ShelfCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit2, User as UserIcon, Search, Settings } from "lucide-react";
import { toast } from "sonner";

type ActivityTab = 'logs' | 'reviews' | 'comments';


export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editedQuote, setEditedQuote] = useState("");
  const [editedBio, setEditedBio] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeActivityTab, setActiveActivityTab] = useState<ActivityTab>('logs');

  useEffect(() => {
    const currentUser = storage.getUser();
    if (!currentUser) {
      const newUser: User = {
        id: '1',
        name: 'Reader',
        bio: 'Add your bio...',
        favQuote: 'Add your favorite quote...',
      };
      storage.setUser(newUser);
      setUser(newUser);
    } else {
      setUser(currentUser);
    }
    
    setBooks(storage.getBooks());
    setShelves(storage.getShelves());
  }, []);

  const handleQuoteEdit = () => {
    if (user) {
      const updated = { ...user, favQuote: editedQuote };
      storage.setUser(updated);
      setUser(updated);
      setIsEditingProfile(false);
      toast.success("Quote updated");
    }
  };

  const handleBioEdit = () => {
    if (user) {
      const updated = { ...user, bio: editedBio };
      storage.setUser(updated);
      setUser(updated);
      setIsEditingBio(false);
      toast.success("Bio updated");
    }
  };

  const currentlyReading = books.filter(b => b.status === 'reading');
  const alreadyRead = books.filter(b => b.status === 'read');
  const wishlist = books.filter(b => b.status === 'wishlist');

  const activityTabs: { label: string; value: ActivityTab }[] = [
    { label: 'Logs', value: 'logs' },
    { label: 'Reviews', value: 'reviews' },
    { label: 'Comments', value: 'comments' },
  ];

  const activityMessages: Record<ActivityTab, string> = {
    logs: "You haven't logged any activity yet.",
    reviews: "Reviews you write will appear here.",
    comments: "Comments you've made will show up here.",
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="flex items-center gap-4 lg:w-1/3"> 
              <button
                className="text-3xl font-serif font-bold tracking-wide" 
                onClick={() => navigate('/')} 
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
              <Button variant="ghost" className="text-base font-medium" onClick={() => navigate('/home')}>
                Home
              </Button>
              <Button variant="ghost" className="text-base font-medium" onClick={() => navigate('/trending')}>
                Trending
              </Button>
              <Button
                variant="secondary"
                className="h-12 w-24 rounded-xl text-sm font-semibold flex items-center justify-center gap-1"
                onClick={() => navigate('/log')}
              >
                Log +
              </Button>
            </div>
            <div className="flex items-center justify-end gap-4 lg:w-1/3">
              <button
                className="flex items-center gap-3 rounded-full border px-3 py-1.5 transition hover:bg-accent"
                onClick={() => navigate('/profile')}
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
              <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
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
        {/* Profile Header */}
        <div className="mb-12">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden">
              {user.profilePic ? (
                <img src={user.profilePic} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-12 h-12 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <h1 className="font-serif text-4xl font-bold mb-3">{user.name}</h1>
              <div className="flex items-center gap-2 mb-4">
                <p className="text-foreground">{user.bio}</p>
                <Dialog open={isEditingBio} onOpenChange={setIsEditingBio}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setEditedBio(user.bio || '')}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="font-serif">Edit Bio</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Textarea
                        value={editedBio}
                        onChange={(e) => setEditedBio(e.target.value)}
                        placeholder="Tell us about yourself..."
                        className="min-h-24"
                      />
                      <Button onClick={handleBioEdit} className="w-full">
                        Save Bio
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-muted-foreground italic">{user.favQuote}</p>
                <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setEditedQuote(user.favQuote || '')}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="font-serif">Edit Favorite Quote</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Textarea
                        value={editedQuote}
                        onChange={(e) => setEditedQuote(e.target.value)}
                        placeholder="Your favorite book quote..."
                        className="min-h-24"
                      />
                      <Button onClick={handleQuoteEdit} className="w-full">
                        Save Quote
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>

        {/* Currently Reading */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-baseline gap-2">
              <h2 className="font-serif text-3xl font-semibold">Currently Reading</h2>
              <span className="text-xs font-semibold text-primary">({currentlyReading.length})</span>
            </div>
            <Button onClick={() => navigate('/add-book?status=reading')}>
              <Plus className="w-4 h-4 mr-2" />
              Add Book
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {currentlyReading.map(book => (
              <BookCard 
                key={book.id} 
                book={book} 
                onClick={() => navigate(`/book/${book.id}`)}
              />
            ))}
          </div>
        </section>

        {/* Already Read */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-baseline gap-2">
              <h2 className="font-serif text-3xl font-semibold">Already Read</h2>
              <span className="text-xs font-semibold text-primary">({alreadyRead.length})</span>
            </div>
            <Button onClick={() => navigate('/add-book?status=read')}>
              <Plus className="w-4 h-4 mr-2" />
              Add Book
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {alreadyRead.map(book => (
              <BookCard 
                key={book.id} 
                book={book} 
                onClick={() => navigate(`/book/${book.id}`)}
              />
            ))}
          </div>
        </section>

        {/* Shelves */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-baseline gap-2">
              <h2 className="font-serif text-3xl font-semibold">Shelves</h2>
              <span className="text-xs font-semibold text-primary">({shelves.length})</span>
            </div>
            <Button onClick={() => navigate('/create-shelf')}>
              <Plus className="w-4 h-4 mr-2" />
              Create Shelf
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shelves.map(shelf => {
              const shelfBooks = books.filter(b => shelf.bookIds.includes(b.id));
              return (
                <ShelfCard 
                  key={shelf.id} 
                  shelf={shelf} 
                  books={shelfBooks}
                  onClick={() => navigate(`/shelf/${shelf.id}`)}
                />
              );
            })}
          </div>
        </section>

        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-baseline gap-2">
              <h2 className="font-serif text-3xl font-semibold">Wishlist</h2>
              <span className="text-xs font-semibold text-primary">({wishlist.length})</span>
            </div>
            <Button onClick={() => navigate('/add-book?status=wishlist')}>
              <Plus className="w-4 h-4 mr-2" />
              Add Book
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {wishlist.map(book => (
              <BookCard 
                key={book.id} 
                book={book} 
                onClick={() => navigate(`/book/${book.id}`)}
              />
            ))}
          </div>
          {wishlist.length === 0 && (
            <p className="text-sm text-muted-foreground mt-4">No books in your wishlist yet.</p>
          )}
        </section>

        <section>
          <div className="mb-6">
            <h2 className="font-serif text-3xl font-semibold">Activity</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {activityTabs.map(tab => (
                <Button
                  key={tab.value}
                  variant={activeActivityTab === tab.value ? "default" : "ghost"}
                  size="sm"
                  className={activeActivityTab === tab.value ? "shadow" : "text-muted-foreground"}
                  onClick={() => setActiveActivityTab(tab.value)}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>
          <Card className="p-6">
            <p className="text-muted-foreground">
              {activityMessages[activeActivityTab]}
            </p>
          </Card>
        </section>
      </div>
    </div>
  );
}
