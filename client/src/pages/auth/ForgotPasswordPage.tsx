import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageTransition } from "@/components/AnimationWrappers";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/navbar";
import { url } from "@/url";

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setIsLoading(true);
      const res = await fetch(`${url}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        toast({
          title: "Error",
          description: data.message || "Something went wrong",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageTransition className="min-h-screen bg-background relative overflow-hidden">
      <Navbar />
      <div className="absolute inset-0 animated-gradient" />
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-serif-roboto text-2xl font-bold">
              GIKI Journal
            </span>
          </div>

          <div className="glass-card p-8">
            <h2 className="font-serif-outfit text-2xl font-bold text-foreground mb-2">
              Forgot Password
            </h2>
            <p className="text-muted-foreground mb-6 text-sm">
              Enter your email address and we'll send you a link to reset your
              password.
            </p>

            {submitted ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-primary/10 border border-primary/20 p-4 text-sm text-foreground">
                  If an account with <strong>{email}</strong> exists, a password
                  reset link has been sent. Check your inbox.
                </div>
                <Link
                  to="/login"
                  className="block text-center text-sm text-primary hover:underline"
                >
                  Back to Sign In
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pl-5 input-glow text-muted-foreground"
                  required
                />
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  <Link to="/login" className="text-primary hover:underline">
                    Back to Sign In
                  </Link>
                </p>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
