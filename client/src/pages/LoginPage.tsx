import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  BookOpen,
  User,
  Users,
  UserCheck,
  Shield,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageTransition } from "@/components/AnimationWrappers";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { jwtDecode } from "jwt-decode";
import { useToast } from "@/hooks/use-toast";

// type UserRole = "author" | "reviewer" | "editor" | "admin";
type UserRole = "author" | "reviewer" | "editor" | "publisher";

interface JwtPayload {
  id: string;
  role: UserRole;
}

const roleConfig: Record<
  UserRole,
  {
    icon: React.ElementType;
    label: string;
    description: string;
    color: string;
    route: string;
  }
> = {
  author: {
    icon: User,
    label: "Author",
    description: "Submit and track your research papers",
    color: "text-success",
    route: "/author",
  },
  reviewer: {
    icon: UserCheck,
    label: "Reviewer",
    description: "Evaluate submissions assigned to you",
    color: "text-info",
    route: "/reviewer",
  },
  editor: {
    icon: Users,
    label: "Editor",
    description: "Manage paper assignments and reviews",
    color: "text-accent",
    route: "/chief-editor",
  },
  publisher: {
    icon: Shield,
    label: "Publisher",
    description: "Journal publisher",
    color: "text-destructive",
    route: "/publisher",
  },
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedRole, setSelectedRole] = useState<UserRole>("author");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    if (!selectedRole) {
      toast({
        title: "Role Not Selected",
        description: "Please select your role to continue",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const result = await response.json();

      if (!result.token) {
        throw new Error("Invalid email or password");
      }

      let decoded: { role: UserRole };
      try {
        decoded = jwtDecode<{ role: UserRole }>(result.token);
      } catch (decodeError) {
        throw new Error("Invalid authentication token received.");
      }

      const actualRole = decoded.role;

      if (!actualRole) {
        throw new Error("Your account role could not be determined.");
      }

      if (selectedRole !== actualRole) {
        const roleLabels: Record<UserRole, string> = {
          author: "Author",
          reviewer: "Reviewer",
          editor: "Editor",
          publisher: "Publisher",
        };

        toast({
          title: "Role Mismatch",
          description: `Your account is registered as "${roleLabels[actualRole]}". Please select "${roleLabels[actualRole]}" to continue.`,
          variant: "destructive",
        });
        return;
      }

      login(result.token);

      if (result.user) {
        localStorage.setItem("user", JSON.stringify(result.user));
      }

      const config = roleConfig[actualRole];
      if (!config) {
        throw new Error(
          `Access configuration for "${actualRole}" role not found.`
        );
      }

      toast({
        title: "Login Successful!",
        description: `Welcome back! Redirecting to ${config.label} dashboard...`,
        variant: "default",
        duration: 3000,
      });

      setTimeout(() => {
        navigate(config.route, { replace: true });
      }, 1500);
    } catch (err: any) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");

      let errorTitle = "Login Failed";
      let errorMessage =
        err.message || "An unexpected error occurred. Please try again.";

      if (
        err.message.includes("Failed to fetch") ||
        err.message.includes("Network")
      ) {
        errorTitle = "Connection Error";
        errorMessage =
          "Unable to connect to the server. Please check your internet connection.";
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageTransition className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 animated-gradient" />
      <div className="absolute inset-0 bg-mesh-pattern opacity-50" />
      <div className="noise-overlay" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 rounded-full border border-primary/10"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-1/4 -left-1/4 w-3/4 h-3/4 rounded-full border border-accent/10"
        />
      </div>

      <div className="relative z-10 min-h-screen flex">
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-md text-center"
          >
            <div className="inline-flex items-center gap-3 mb-8">
              <div className="h-14 w-14 rounded-2xl bg-gradient-primary flex items-center justify-center glow-primary">
                <BookOpen className="h-8 w-8 text-primary-foreground" />
              </div>
              <span className="font-serif-roboto text-3xl font-bold text-muted-foreground">
                JournalHub
              </span>
            </div>

            <h1 className="font-serif-outfit text-4xl font-bold text-foreground mb-4">
              Welcome Back
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Sign in to continue managing your academic research and
              publications.
            </p>

            {/* Role-specific welcome message */}
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedRole}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass-card p-6 text-left"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className={cn(
                      "h-12 w-12 rounded-xl flex items-center justify-center",
                      "bg-gradient-to-br from-primary/20 to-primary/5"
                    )}
                  >
                    {(() => {
                      const Icon = roleConfig[selectedRole].icon;
                      return (
                        <Icon
                          className={cn(
                            "h-6 w-6",
                            roleConfig[selectedRole].color
                          )}
                        />
                      );
                    })()}
                  </div>
                  <div>
                    <h3
                      className={cn(
                        "font-semibold",
                        roleConfig[selectedRole].color
                      )}
                    >
                      {roleConfig[selectedRole].label} Portal
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {roleConfig[selectedRole].description}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  {selectedRole === "author" && (
                    <>
                      <p>✓ Submit new research papers</p>
                      <p>✓ Track submission status</p>
                      <p>✓ View reviewer feedback</p>
                    </>
                  )}
                  {selectedRole === "reviewer" && (
                    <>
                      <p>✓ View assigned papers</p>
                      <p>✓ Submit reviews and decisions</p>
                      <p>✓ Track review deadlines</p>
                    </>
                  )}
                  {selectedRole === "editor" && (
                    <>
                      <p>✓ Manage paper assignments</p>
                      <p>✓ Coordinate review process</p>
                      <p>✓ Access analytics dashboard</p>
                    </>
                  )}
                  {selectedRole === "publisher" && (
                    <>
                      <p>✓ System-wide oversight</p>
                      <p>✓ User management</p>
                      <p>✓ Platform configuration</p>
                    </>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Right panel - Login form */}
        <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-md"
          >
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
              <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="font-serif-roboto text-2xl font-bold">
                JournalHub
              </span>
            </div>

            <div className="glass-card p-8">
              <h2 className="font-serif-outfit text-2xl font-bold text-foreground mb-2">
                Sign In
              </h2>
              <p className="text-muted-foreground mb-6">
                Choose your role and enter your credentials
              </p>

              {/* Role selector */}
              <div className="grid grid-cols-4 gap-2 mb-6">
                {(Object.keys(roleConfig) as UserRole[]).map((role) => {
                  const config = roleConfig[role];
                  const Icon = config.icon;
                  const isSelected = selectedRole === role;

                  return (
                    <motion.button
                      key={role}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedRole(role)}
                      className={cn(
                        "relative p-3 rounded-xl flex flex-col items-center gap-1 transition-all duration-200",
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-glow"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-[10px] font-medium uppercase tracking-wider">
                        {config.label}
                      </span>
                      {isSelected && (
                        <motion.div
                          layoutId="roleIndicator"
                          className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-6 rounded-full bg-primary"
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Login form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-muted-foreground"
                  >
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-10 pr-10 input-glow text-muted-foreground"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-muted-foreground"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10 pr-10 input-glow text-muted-foreground"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-border" />
                    <span className="text-muted-foreground">Remember me</span>
                  </label>
                  <a href="#" className="text-primary hover:underline">
                    Forgot password?
                  </a>
                </div>

                <Button
                  type="submit"
                  className="w-full btn-physics bg-gradient-primary hover:opacity-90"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                    />
                  ) : (
                    <>
                      Sign In as {roleConfig[selectedRole].label}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-border/50 text-center">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <a
                    href="/signup"
                    className="text-primary font-medium hover:underline"
                  >
                    Register here
                  </a>
                </p>
              </div>
            </div>

            {/* Demo credentials hint */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6 text-center"
            >
              <p className="text-xs text-muted-foreground">
                Demo: Use any email and password to explore
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
