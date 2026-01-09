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
  Settings,
  Edit,
  UserCheck,
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
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { url } from "../url";

type UserRole = "author" | "reviewer" | "editor" | "admin" | "owner";

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
    icon: User,
    label: "Editor",
    description: "Manage paper assignments and reviews",
    color: "text-accent",
    route: "/chief-editor",
  },
  admin: {
    icon: Shield,
    label: "admin",
    description: "System administration and oversight",
    color: "text-destructive",
    route: "/admin",
  },
  owner: {
    icon: Shield,
    label: "owner",
    description: "System administration and oversight",
    color: "text-destructive",
    route: "/owner",
  },
};

export default function SignupPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [selectedRole, setSelectedRole] = useState<UserRole>("author");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<"FORM" | "OTP">("FORM");
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
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
      const response = await fetch(`${url}/auth/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          purpose: "signup",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to send OTP");
      }

      toast({
        title: "OTP Sent",
        description: "Please check your email for OTP",
      });

      setStep("OTP");
    } catch (error: any) {
      setErrors({
        general: error.message || "Failed to send OTP",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setErrors({ general: "OTP must be 6 digits" });
      console.warn("OTP length invalid:", otp.length);
      return;
    }

    setOtpLoading(true);
    setErrors({});

    try {
      const verifyRes = await fetch(`${url}/auth/verifysignup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          otp,
        }),
      });

      const verifyResult = await verifyRes.json();

      if (!verifyRes.ok) {
        throw new Error(verifyResult.message || "Invalid OTP");
      }

      const signupRes = await fetch(`${url}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: selectedRole,
        }),
      });

      const signupResult = await signupRes.json();

      if (!signupRes.ok) {
        throw new Error(signupResult.message || "Signup failed");
      }

      toast({
        title: "Account Created",
        description: "Signup successful! Redirecting to login...",
      });

      navigate("/login");
    } catch (error: any) {
      setErrors({
        general: error.message || "OTP verification failed",
      });
    } finally {
      setOtpLoading(false);
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
            {step === "OTP" && (
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Enter OTP
                </Label>

                <Input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  className="text-center tracking-widest"
                />

                <Button
                  type="button"
                  className="w-full bg-gradient-primary mt-2"
                  onClick={handleVerifyOTP}
                  disabled={otpLoading}
                >
                  {otpLoading ? "Verifying..." : "Verify OTP"}
                </Button>
              </div>
            )}

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

              <div className="space-y-3 pt-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Settings className="h-4 w-4 text-primary" />
                  Select Your Role
                </Label>

                <div className="grid grid-cols-5 gap-2">
                  {(Object.keys(roleConfig) as UserRole[]).map((role) => {
                    const config = roleConfig[role];
                    const Icon = config.icon;
                    const isSelected = selectedRole === role;

                    return (
                      <motion.button
                        key={role}
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleRoleSelect(role)}
                        className={cn(
                          "relative p-3 rounded-xl flex flex-col items-center gap-1 transition-all duration-200 border",
                          isSelected
                            ? "bg-primary text-primary-foreground shadow-glow border-primary"
                            : "bg-muted/50 text-muted-foreground hover:bg-muted border-border"
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

                <div className="p-3 bg-muted/30 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground text-center">
                    <span className="font-medium text-foreground">
                      {roleConfig[selectedRole].label}
                    </span>{" "}
                    - {roleConfig[selectedRole].description}
                  </p>
                </div>
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
                disabled={isLoading || step === "OTP"}
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

              <div className="text-center pt-2">
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

        {/* Footer */}
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
