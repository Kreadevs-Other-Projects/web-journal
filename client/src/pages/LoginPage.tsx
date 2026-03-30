import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Eye,
  EyeOff,
  Shield,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageTransition } from "@/components/AnimationWrappers";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { UserRole, roleConfig } from "@/lib/roles";
import type { RoleEntry } from "@/context/AuthContext";
import { url } from "../url";
import Navbar from "@/components/navbar";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Role picker — shown after successful credential verification if multi-role
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<RoleEntry[]>([]);
  const [pickingRole, setPickingRole] = useState(false);

  const { login, switchRole } = useAuth();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast({ title: "Missing credentials", description: "Enter email and password", variant: "destructive" });
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(`${url}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Login failed");
      }

      // Always store the initial token and refresh token
      login(result.token);
      localStorage.setItem("user", JSON.stringify(result.user));
      localStorage.setItem("refreshToken", result.refreshToken);

      if (result.needs_role_selection && result.user?.roles?.length > 1) {
        // Multi-role: show picker modal
        setAvailableRoles(result.user.roles as RoleEntry[]);
        setShowRolePicker(true);
      } else {
        // Single role: redirect immediately
        const activeRole = (result.active_role ?? result.user?.role) as UserRole;
        const route = roleConfig[activeRole]?.route ?? "/";
        navigate(route, { replace: true });
        toast({ title: "Login Successful", description: `Welcome, ${result.user?.username}!` });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRolePick = async (roleEntry: RoleEntry) => {
    try {
      setPickingRole(true);
      await switchRole(roleEntry.role, roleEntry.journal_id);
      const route = roleConfig[roleEntry.role]?.route ?? "/";
      navigate(route, { replace: true });
      const label = roleEntry.journal_name
        ? `${roleConfig[roleEntry.role]?.label} — ${roleEntry.journal_name}`
        : roleConfig[roleEntry.role]?.label;
      toast({ title: "Login Successful", description: `Signed in as ${label}` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to switch role", variant: "destructive" });
    } finally {
      setPickingRole(false);
    }
  };

  return (
    <PageTransition className="min-h-screen bg-background relative overflow-hidden">
      <Navbar />
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
        {/* Left panel — static platform info */}
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
                Journal<span className="text-primary">Hub</span>
              </span>
            </div>

            <h1 className="font-serif-outfit text-4xl font-bold text-foreground mb-4">
              Welcome Back
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Sign in to continue managing your academic research and publications.
            </p>

            <div className="glass-card p-6 text-left space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Multi-Role Support</p>
                  <p className="text-xs text-muted-foreground">Switch between roles after signing in</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground pt-2">
                <p>✓ Submit and track research papers</p>
                <p>✓ Manage peer review workflows</p>
                <p>✓ Oversee editorial decisions</p>
                <p>✓ Publish accepted manuscripts</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right panel — login form */}
        <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-md"
          >
            <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
              <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="font-serif-roboto text-2xl font-bold">JournalHub</span>
            </div>

            <div className="glass-card p-8">
              <h2 className="font-serif-outfit text-2xl font-bold text-foreground mb-2">Sign In</h2>
              <p className="text-muted-foreground mb-6">Enter your credentials to continue</p>

              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pl-5 pr-10 input-glow text-muted-foreground"
                  required
                />
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="pl-5 pr-10 input-glow text-muted-foreground"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-border/50 text-center">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <a href="/signup" className="text-primary font-medium hover:underline">
                    Register here
                  </a>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Role picker modal — shown after credentials verified if multiple roles */}
      {showRolePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6"
          >
            <div className="text-center mb-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-3">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Select Your Role</h2>
              <p className="text-sm text-muted-foreground mt-1">
                You have multiple roles. Choose how you'd like to sign in:
              </p>
            </div>

            <div className="space-y-2">
              {availableRoles.map((r, idx) => {
                const rc = roleConfig[r.role];
                if (!rc) return null;
                const label = r.journal_name ? `${rc.label} — ${r.journal_name}` : rc.label;
                const Icon = rc.icon;
                return (
                  <motion.button
                    key={`${r.role}-${r.journal_id ?? idx}`}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleRolePick(r)}
                    disabled={pickingRole}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-xl border border-border p-4",
                      "bg-muted/50 hover:bg-muted hover:border-primary/40 transition-all duration-200",
                      "disabled:opacity-50 disabled:cursor-not-allowed text-left",
                    )}
                  >
                    <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center bg-primary/10 flex-shrink-0")}>
                      <Icon className={cn("h-4 w-4", rc.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{label}</p>
                      <p className="text-xs text-muted-foreground">{rc.description}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </motion.button>
                );
              })}
            </div>

            {pickingRole && (
              <div className="mt-4 flex justify-center">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            )}
          </motion.div>
        </div>
      )}
    </PageTransition>
  );
}
