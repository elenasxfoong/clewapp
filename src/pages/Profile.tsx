//profile/Me page

import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { storage, User, Book, Shelf } from "@/lib/storage";
import { cacheGoogleBook, searchGoogleBooks, type GoogleBookResult } from "@/services/googleBooks";
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
type LogView = 'monthly' | 'daily';


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
  const [globalSearchResults, setGlobalSearchResults] = useState<GoogleBookResult[]>([]);
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);
  const [globalSearchError, setGlobalSearchError] = useState<string | null>(null);
  const globalSearchAbortController = useRef<AbortController | null>(null);
  const [activeActivityTab, setActiveActivityTab] = useState<ActivityTab>('logs');
  const [isAddBookDialogOpen, setIsAddBookDialogOpen] = useState(false);
  const [bookSearchQuery, setBookSearchQuery] = useState("");
  const [bookSearchResults, setBookSearchResults] = useState<GoogleBookResult[]>([]);
  const [isSearchingBooks, setIsSearchingBooks] = useState(false);
  const [bookSearchError, setBookSearchError] = useState<string | null>(null);
  const bookSearchAbortController = useRef<AbortController | null>(null);
  const [addBookStatus, setAddBookStatus] = useState<Book["status"]>("reading");
  const [logView, setLogView] = useState<LogView>("monthly");
  const profileImageInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const currentUser = storage.getUser();
    if (!currentUser) {
      const newUser: User = {
        id: '1',
        name: 'Reader',
        bio: 'Add your bio...',
        favQuote: 'Add your favorite quote...',
        logsCount: 0,
        followingCount: 0,
        followersCount: 0,
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
  const logsCount = user?.logsCount ?? books.length;
  const followingCount = user?.followingCount ?? 0;
  const followersCount = user?.followersCount ?? 0;
  const profileStats = [
    { label: 'Logs', value: logsCount },
    { label: 'Following', value: followingCount },
    { label: 'Followers', value: followersCount },
  ];

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

  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setGlobalSearchError(null);
      setGlobalSearchResults([]);
      setIsSearchingGlobal(false);
      globalSearchAbortController.current?.abort();
      globalSearchAbortController.current = null;
      return;
    }

    const controller = new AbortController();
    globalSearchAbortController.current?.abort();
    globalSearchAbortController.current = controller;
    setIsSearchingGlobal(true);
    setGlobalSearchError(null);

    searchGoogleBooks(query, { maxResults: 5, signal: controller.signal })
      .then((results) => {
        setGlobalSearchResults(results);
      })
      .catch((error) => {
        const errorName = error instanceof Error ? error.name : undefined;
        if (errorName === "AbortError") {
          return;
        }
        console.error("Failed to search Google Books from header", error);
        setGlobalSearchError("We couldn't reach Google Books. Please try again.");
        setGlobalSearchResults([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsSearchingGlobal(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [searchQuery]);

  useEffect(() => {
    if (!isAddBookDialogOpen) {
      setBookSearchError(null);
      setBookSearchResults([]);
      setIsSearchingBooks(false);
      bookSearchAbortController.current?.abort();
      bookSearchAbortController.current = null;
      return;
    }

    const query = bookSearchQuery.trim();
    if (!query) {
      setBookSearchError(null);
      setBookSearchResults([]);
      setIsSearchingBooks(false);
      bookSearchAbortController.current?.abort();
      bookSearchAbortController.current = null;
      return;
    }

    const controller = new AbortController();
    bookSearchAbortController.current?.abort();
    bookSearchAbortController.current = controller;
    setIsSearchingBooks(true);
    setBookSearchError(null);

    searchGoogleBooks(query, { maxResults: 5, signal: controller.signal })
      .then((results) => {
        setBookSearchResults(results);
      })
      .catch((error) => {
        const errorName = error instanceof Error ? error.name : undefined;
        if (errorName === "AbortError") {
          return;
        }
        console.error("Failed to search Google Books", error);
        setBookSearchError("We couldn't reach Google Books. Please try again.");
        setBookSearchResults([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsSearchingBooks(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [bookSearchQuery, isAddBookDialogOpen]);

  const handleOpenAddBookDialog = (status: Book["status"]) => {
    setAddBookStatus(status);
    setBookSearchQuery("");
    setIsAddBookDialogOpen(true);
  };

  const handleProfileImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const profilePic = reader.result as string;
      const updatedUser = { ...user, profilePic };
      storage.setUser(updatedUser);
      setUser(updatedUser);
    };
    reader.readAsDataURL(file);
  };

  const triggerProfileImageUpload = () => {
    profileImageInputRef.current?.click();
  };

  const handleSelectBook = async (googleBooksId: string) => {
    try {
      if (import.meta.env.DEV) {
        console.log("[Add Book] selected search result ID:", googleBooksId);
      }

      const savedBook = await cacheGoogleBook(googleBooksId);
      const navigationUrl = `/add-book/${savedBook.googleBooksId}?status=${addBookStatus}`;

      if (import.meta.env.DEV) {
        console.log("[Add Book] cached Book.id returned by /api/books/cache:", savedBook.id);
        console.log("[Add Book] navigation URL:", navigationUrl);
      }

      setIsAddBookDialogOpen(false);
      setBookSearchQuery("");
      navigate(navigationUrl);
    } catch (error) {
      console.error("Failed to cache selected book", error instanceof Error ? error.stack ?? error.message : error);
      toast.error("Unable to save this book. Please try again.");
    }
  };

  const handleGlobalSearchSelect = async (googleBooksId: string) => {
    try {
      if (import.meta.env.DEV) {
        console.log("[Global Search] selected search result ID:", googleBooksId);
      }

      const savedBook = await cacheGoogleBook(googleBooksId);
      const navigationUrl = `/add-book/${savedBook.googleBooksId}`;

      if (import.meta.env.DEV) {
        console.log("[Global Search] cached Book.id returned by /api/books/cache:", savedBook.id);
        console.log("[Global Search] navigation URL:", navigationUrl);
      }

      setSearchQuery("");
      setGlobalSearchResults([]);
      setGlobalSearchError(null);
      setIsSearchingGlobal(false);
      globalSearchAbortController.current?.abort();
      globalSearchAbortController.current = null;
      navigate(navigationUrl);
    } catch (error) {
      console.error("Failed to cache selected book from header", error instanceof Error ? error.stack ?? error.message : error);
      toast.error("Unable to save this book. Please try again.");
    }
  };

  const renderGlobalSearchDropdown = () => {
    if (!searchQuery.trim()) {
      return null;
    }

    return (
      <div className="absolute left-0 right-0 top-full z-40 mt-2 rounded-xl border bg-card shadow-xl">
        <div className="max-h-64 overflow-y-auto p-3 space-y-2">
          {globalSearchError && (
            <p className="text-sm text-destructive text-center">{globalSearchError}</p>
          )}
          {!globalSearchError && isSearchingGlobal && (
            <p className="text-sm text-muted-foreground text-center">Searching Google Books...</p>
          )}
          {!globalSearchError && !isSearchingGlobal && globalSearchResults.length === 0 && (
            <p className="text-sm text-muted-foreground text-center">No books match your search yet.</p>
          )}
          {!globalSearchError && !isSearchingGlobal && globalSearchResults.map((book) => (
            <button
              key={book.id}
              type="button"
              className="w-full text-left rounded-lg border px-3 py-2 transition hover:bg-muted"
              onClick={() => handleGlobalSearchSelect(book.id)}
            >
              <p className="font-semibold">{book.title}</p>
              <p className="text-sm text-muted-foreground">{book.author}</p>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const handleDeleteBook = (bookId: string) => {
    storage.deleteBook(bookId);
    const updatedBooks = storage.getBooks();
    setBooks(updatedBooks);

    const updatedShelves = storage.getShelves().map((shelf) => ({
      ...shelf,
      bookIds: shelf.bookIds.filter((id) => id !== bookId),
    }));
    storage.setShelves(updatedShelves);
    setShelves(updatedShelves);
    toast.success("Book deleted");
  };

  const handleDeleteShelf = (shelfId: string) => {
    storage.deleteShelf(shelfId);
    const updatedShelves = storage.getShelves();
    setShelves(updatedShelves);
    toast.success("Shelf deleted");
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
                  placeholder="Search Google Books..."
                  className="rounded-full pl-10 pr-4"
                />
                {renderGlobalSearchDropdown()}
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 lg:w-1/3">
              <Button variant="ghost" className="text-base font-medium" onClick={() => navigate('/home')}>
                Home
              </Button>
              <Button variant="ghost" className="text-base font-medium" onClick={() => navigate('/trending')}>
                Trending
              </Button>
              <Button variant="ghost" className="text-base font-medium" onClick={() => navigate('/drafts')}>
                Drafts
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
                placeholder="Search Google Books..."
                className="rounded-full pl-10 pr-4"
              />
              {renderGlobalSearchDropdown()}
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Profile Header */}
        <div className="mb-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-6 flex-1">
              <div className="relative">
                <button
                  type="button"
                  className="group w-24 h-24 rounded-full overflow-hidden bg-muted flex items-center justify-center"
                  onClick={triggerProfileImageUpload}
                >
                  {user.profilePic ? (
                    <img src={user.profilePic} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-12 h-12 text-muted-foreground" />
                  )}
                  <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/60 text-white text-xs font-semibold tracking-wide opacity-0 transition group-hover:opacity-100">
                    <span>Change</span>
                    <span>Photo</span>
                  </div>
                </button>
                <input
                  ref={profileImageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfileImageChange}
                />
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
            <div className="flex items-center gap-8 lg:justify-end">
              {profileStats.map(stat => (
                <div key={stat.label} className="text-center">
                  <p className="text-3xl font-serif font-semibold">{stat.value}</p>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                </div>
              ))}
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
            <Button onClick={() => handleOpenAddBookDialog("reading")}>
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
                onEdit={() => navigate(`/edit-book/${book.id}`)}
                onDelete={() => handleDeleteBook(book.id)}
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
            <Button onClick={() => handleOpenAddBookDialog("read")}>
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
                onEdit={() => navigate(`/edit-book/${book.id}`)}
                onDelete={() => handleDeleteBook(book.id)}
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
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {shelves.map(shelf => {
              const shelfBooks = books.filter(b => shelf.bookIds.includes(b.id));
              return (
                <ShelfCard 
                  key={shelf.id} 
                  shelf={shelf} 
                  books={shelfBooks}
                  onClick={() => navigate(`/shelf/${shelf.id}`)}
                  onEdit={() => navigate(`/edit-shelf/${shelf.id}`)}
                  onDelete={() => handleDeleteShelf(shelf.id)}
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
            <Button onClick={() => handleOpenAddBookDialog("wishlist")}>
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
                onEdit={() => navigate(`/edit-book/${book.id}`)}
                onDelete={() => handleDeleteBook(book.id)}
                footerNote={book.coverPreference === 'specific'
                  ? 'This specific cover'
                  : book.coverPreference === 'none'
                  ? 'No cover preference'
                  : undefined}
                footerNoteClassName="text-[11px] text-primary"
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
                  onClick={() => {
                    setActiveActivityTab(tab.value);
                    if (tab.value !== 'logs') {
                      setLogView('monthly');
                    }
                  }}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>
          <Card className="p-6 space-y-2 relative">
            {activeActivityTab === 'logs' ? (
              <>
                <div className="absolute right-4 top-4">
                  <select
                    value={logView}
                    onChange={(e) => setLogView(e.target.value as LogView)}
                    className="rounded-md border bg-background px-3 py-1 text-sm"
                  >
                    <option value="monthly">Monthly Log</option>
                    <option value="daily">Daily Log</option>
                  </select>
                </div>
                <p className="text-muted-foreground pt-8">
                  {logView === 'monthly'
                    ? "No monthly logs yet. Start tracking your reading progress!"
                    : "No daily logs yet. Capture your day-to-day reading moments!"}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">
                {activityMessages[activeActivityTab]}
              </p>
            )}
          </Card>
        </section>
      </div>

      <Dialog
        open={isAddBookDialogOpen}
        onOpenChange={(open) => {
          setIsAddBookDialogOpen(open);
          if (!open) {
            setBookSearchQuery("");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Add a Book</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={bookSearchQuery}
                onChange={(e) => setBookSearchQuery(e.target.value)}
                placeholder="Search Google Books..."
                className="pl-10"
                autoFocus
              />
            </div>
            <div className="space-y-3">
              {bookSearchError && (
                <p className="text-sm text-destructive text-center py-6">
                  {bookSearchError}
                </p>
              )}
              {!bookSearchError && !bookSearchQuery.trim() && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Search Google Books to add a new title.
                </p>
              )}
              {!bookSearchError && bookSearchQuery.trim() && isSearchingBooks && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Searching Google Books...
                </p>
              )}
              {!bookSearchError && bookSearchQuery.trim() && !isSearchingBooks && bookSearchResults.map((book) => (
                <div
                  key={book.id}
                  className="cursor-pointer rounded-lg border p-3 transition hover:bg-muted"
                  onClick={() => handleSelectBook(book.id)}
                >
                  <p className="font-semibold">{book.title}</p>
                  <p className="text-sm text-muted-foreground">{book.author}</p>
                </div>
              ))}
              {!bookSearchError && bookSearchQuery.trim() && !isSearchingBooks && bookSearchResults.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No books match your search yet.
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
