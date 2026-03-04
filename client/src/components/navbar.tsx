import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

import { BookOpen } from "lucide-react";

export default function Navbar() {
  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-gradient-primary flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-serif-roboto text-xl font-semibold text-foreground">
            JournalHub
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Home
          </Link>
          <Link
            to="/browse"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Browse Papers
          </Link>
          <Link
            to="/about"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            About
          </Link>
          <Link
            to="/faq"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            FAQ
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button
              variant="ghost"
              size="sm"
              className="btn-physics bg-muted/50 hover:bg-muted hover:text-white text-muted-foreground"
            >
              Sign In
            </Button>
          </Link>
          <Link to="/login?action=submit">
            <Button
              size="sm"
              className="btn-physics bg-gradient-primary hover:opacity-90"
            >
              Submit Paper
            </Button>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
