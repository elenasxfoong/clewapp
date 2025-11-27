// LocalStorage utilities for clew
export interface Book {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  rating?: number;
  dateRead?: string;
  review?: string;
  status: 'reading' | 'read' | 'wishlist';
  userId: string;
}

export interface Draft {
  id: string;
  title: string;
  author: string;
  coverImage?: string;
  rating?: number;
  dateRead?: string;
  review?: string;
  status?: Book['status'];
  userId: string;
  isCurrentlyReading?: boolean;
  lastEdited: string;
}

export interface Shelf {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  bookIds: string[];
  userId: string;
}

export interface User {
  id: string;
  name: string;
  profilePic?: string;
  bio?: string;
  favQuote?: string;
  logsCount?: number;
  followingCount?: number;
  followersCount?: number;
}

export interface Comment {
  id: string;
  text: string;
  authorId: string;
  bookId: string;
  parentCommentId?: string;
  createdAt: string;
}

const STORAGE_KEYS = {
  USER: 'clew_user',
  BOOKS: 'clew_books',
  SHELVES: 'clew_shelves',
  COMMENTS: 'clew_comments',
  DRAFTS: 'clew_drafts',
};

export const storage = {
  getUser: (): User | null => {
    const data = localStorage.getItem(STORAGE_KEYS.USER);
    return data ? JSON.parse(data) : null;
  },
  
  setUser: (user: User) => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },
  
  getBooks: (): Book[] => {
    const data = localStorage.getItem(STORAGE_KEYS.BOOKS);
    return data ? JSON.parse(data) : [];
  },
  
  setBooks: (books: Book[]) => {
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
  },
  
  addBook: (book: Book) => {
    const books = storage.getBooks();
    books.push(book);
    storage.setBooks(books);
  },
  
  updateBook: (bookId: string, updates: Partial<Book>) => {
    const books = storage.getBooks();
    const index = books.findIndex(b => b.id === bookId);
    if (index !== -1) {
      books[index] = { ...books[index], ...updates };
      storage.setBooks(books);
    }
  },
  
  deleteBook: (bookId: string) => {
    const books = storage.getBooks().filter(b => b.id !== bookId);
    storage.setBooks(books);
  },
  
  getShelves: (): Shelf[] => {
    const data = localStorage.getItem(STORAGE_KEYS.SHELVES);
    return data ? JSON.parse(data) : [];
  },
  
  setShelves: (shelves: Shelf[]) => {
    localStorage.setItem(STORAGE_KEYS.SHELVES, JSON.stringify(shelves));
  },
  
  addShelf: (shelf: Shelf) => {
    const shelves = storage.getShelves();
    shelves.push(shelf);
    storage.setShelves(shelves);
  },
  
  updateShelf: (shelfId: string, updates: Partial<Shelf>) => {
    const shelves = storage.getShelves();
    const index = shelves.findIndex(s => s.id === shelfId);
    if (index !== -1) {
      shelves[index] = { ...shelves[index], ...updates };
      storage.setShelves(shelves);
    }
  },
  
  deleteShelf: (shelfId: string) => {
    const shelves = storage.getShelves().filter(s => s.id !== shelfId);
    storage.setShelves(shelves);
  },
  
  getComments: (): Comment[] => {
    const data = localStorage.getItem(STORAGE_KEYS.COMMENTS);
    return data ? JSON.parse(data) : [];
  },
  
  setComments: (comments: Comment[]) => {
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments));
  },
  
  addComment: (comment: Comment) => {
    const comments = storage.getComments();
    comments.push(comment);
    storage.setComments(comments);
  },

  getDrafts: (): Draft[] => {
    const data = localStorage.getItem(STORAGE_KEYS.DRAFTS);
    return data ? JSON.parse(data) : [];
  },

  setDrafts: (drafts: Draft[]) => {
    localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(drafts));
  },

  addDraft: (draft: Draft) => {
    const drafts = storage.getDrafts();
    drafts.push(draft);
    storage.setDrafts(drafts);
  },

  updateDraft: (draftId: string, updates: Partial<Draft>) => {
    const drafts = storage.getDrafts();
    const index = drafts.findIndex((d) => d.id === draftId);
    if (index !== -1) {
      drafts[index] = { ...drafts[index], ...updates };
      storage.setDrafts(drafts);
    }
  },

  deleteDraft: (draftId: string) => {
    const drafts = storage.getDrafts().filter((draft) => draft.id !== draftId);
    storage.setDrafts(drafts);
  },
};
