import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import Home from "./pages/Home";
import Trending from "./pages/Trending";
import Log from "./pages/Log";
import Settings from "./pages/Settings";
import Drafts from "./pages/Drafts";
import AddShelf from "./pages/AddShelf";
import AddBookDetails from "./pages/AddBookDetails";
import BookDetails from "./pages/BookDetails";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/home" element={<Home />} />
          <Route path="/trending" element={<Trending />} />
          <Route path="/log" element={<Log />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/drafts" element={<Drafts />} />
          <Route path="/drafts/:bookId/edit" element={<AddBookDetails mode="draft" />} />
          <Route path="/create-shelf" element={<AddShelf />} />
          <Route path="/edit-shelf/:shelfId" element={<AddShelf mode="edit" />} />
          <Route path="/book/:bookId" element={<BookDetails />} />
          <Route path="/add-book/:bookId" element={<AddBookDetails />} />
          <Route path="/edit-book/:bookId" element={<AddBookDetails mode="edit" />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
