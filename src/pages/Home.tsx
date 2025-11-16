import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <h1 className="font-serif text-4xl font-bold">Home</h1>
        <p className="text-muted-foreground">This page is coming soon.</p>
        <Button onClick={() => navigate('/profile')}>Back to Profile</Button>
      </div>
    </div>
  );
};

export default Home;
