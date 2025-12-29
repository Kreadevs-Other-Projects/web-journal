import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { app_url } from "@/url";

export default function SignupPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        "Password must include uppercase, lowercase, and numbers";
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch(`http://localhost:5000/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error("User already exists with this email!");
        } else if (response.status === 400) {
          throw new Error("Email, password, and username are required");
        } else {
          throw new Error(
            result.message || `Signup failed with status ${response.status}`
          );
        }
      }

      if (!result.success) {
        throw new Error(result.message || "Signup failed");
      }

      if (result.token) {
        localStorage.setItem("accessToken", result.token);
      }

      if (result.user) {
        localStorage.setItem("user", JSON.stringify(result.user));
      }
      alert("Signup successful! Redirecting to login...");

      navigate("/login", {
        state: {
          message: "Signup successful! Please login with your credentials.",
        },
      });
    } catch (error: any) {
      console.error("Signup error:", error);

      if (error.message.includes("User already exists")) {
        setErrors({
          email:
            "This email is already registered. Please use a different email or try logging in.",
        });
      } else if (error.message.includes("network")) {
        setErrors({
          general:
            "Network error. Please check your internet connection and try again.",
        });
      } else {
        setErrors({
          general: error.message || "Signup failed. Please try again.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = () => {
    if (!formData.password) return 0;

    let strength = 0;
    if (formData.password.length >= 8) strength += 25;
    if (/[a-z]/.test(formData.password)) strength += 25;
    if (/[A-Z]/.test(formData.password)) strength += 25;
    if (/\d/.test(formData.password)) strength += 25;

    return strength;
  };

  const getStrengthColor = (strength: number) => {
    if (strength < 50) return "bg-destructive";
    if (strength < 75) return "bg-warning";
    return "bg-success";
  };

  const passwordRequirements = [
    { text: "At least 8 characters", met: formData.password.length >= 8 },
    { text: "Contains lowercase letter", met: /[a-z]/.test(formData.password) },
    { text: "Contains uppercase letter", met: /[A-Z]/.test(formData.password) },
    { text: "Contains number", met: /\d/.test(formData.password) },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="inline-flex items-center justify-center gap-3 mb-4"
          >
            <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <BookOpen className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="text-left">
              <h1 className="font-serif text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                JournalHub
              </h1>
              <p className="text-xs text-muted-foreground">
                Academic Publishing Platform
              </p>
            </div>
          </motion.div>
        </div>

        <Card className="glass-card border-border/50 shadow-2xl overflow-hidden">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-foreground">
              Create Account
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Join our academic community of researchers and reviewers
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="username"
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  <User className="h-4 w-4 text-primary" />
                  Username
                </Label>
                <div className="relative">
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="john_doe"
                    value={formData.username}
                    onChange={handleChange}
                    className={cn(
                      "pl-10 bg-background/50 border-border focus:border-primary focus:ring-2 focus:ring-primary/20",
                      errors.username &&
                        "border-destructive focus:border-destructive focus:ring-destructive/20"
                    )}
                    disabled={isLoading}
                  />
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
                {errors.username && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    {errors.username}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  <Mail className="h-4 w-4 text-primary" />
                  Email Address
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className={cn(
                      "pl-10 bg-background/50 border-border focus:border-primary focus:ring-2 focus:ring-primary/20",
                      errors.email &&
                        "border-destructive focus:border-destructive focus:ring-destructive/20"
                    )}
                    disabled={isLoading}
                  />
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  <Lock className="h-4 w-4 text-primary" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className={cn(
                      "pl-10 pr-10 bg-background/50 border-border focus:border-primary focus:ring-2 focus:ring-primary/20",
                      errors.password &&
                        "border-destructive focus:border-destructive focus:ring-destructive/20"
                    )}
                    disabled={isLoading}
                  />
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {formData.password && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Password strength
                      </span>
                      <span className="font-medium">{passwordStrength()}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${passwordStrength()}%` }}
                        transition={{ duration: 0.3 }}
                        className={cn(
                          "h-full",
                          getStrengthColor(passwordStrength())
                        )}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5 pt-2">
                  {passwordRequirements.map((req, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-xs"
                    >
                      <CheckCircle2
                        className={cn(
                          "h-3 w-3 flex-shrink-0",
                          req.met ? "text-success" : "text-muted-foreground/30"
                        )}
                      />
                      <span
                        className={
                          req.met ? "text-success" : "text-muted-foreground"
                        }
                      >
                        {req.text}
                      </span>
                    </div>
                  ))}
                </div>

                {errors.password && (
                  <p className="text-xs text-destructive flex items-center gap-1 pt-2">
                    <Shield className="h-3 w-3" />
                    {errors.password}
                  </p>
                )}
              </div>

              {errors.general && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive text-center">
                    {errors.general}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full btn-physics bg-gradient-primary hover:opacity-90 py-6 text-base font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>

              <div className="text-center pt-4">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="text-primary font-medium hover:underline transition-colors"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center space-y-3"
        >
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              <span>Secure & Encrypted</span>
            </div>
            <div className="w-px h-3 bg-border" />
            <div className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              <span>Academic Integrity</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground/70">
            Join 10,000+ researchers and reviewers worldwide
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
