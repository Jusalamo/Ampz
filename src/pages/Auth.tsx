import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Zap, Mail, Lock, User, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApp } from "@/contexts/AppContext";
import { useToast } from "@/hooks/use-toast";

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, signup, loginWithGoogle, loginDemo, isAuthenticated } = useApp();
  const { toast } = useToast();

  const [mode, setMode] = useState<"login" | "signup">(
    searchParams.get("mode") === "login" ? "login" : "signup"
  );
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [localError, setLocalError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = (() => {
    const path = searchParams.get("redirect") || "/home";
    if (!path.startsWith("/") || path.startsWith("//") || path.includes("://")) return "/home";
    const allowed = [
      /^\/home$/, /^\/events$/, /^\/connect$/, /^\/profile$/, /^\/matches$/,
      /^\/settings$/, /^\/activity$/, /^\/chats$/, /^\/event\/[a-f0-9-]+$/,
      /^\/event\/[a-f0-9-]+\/checkin/,
    ];
    return allowed.some((r) => r.test(path.split("?")[0])) ? path : "/home";
  })();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectTo]);

  const validateForm = (): boolean => {
    if (!formData.email || !formData.password) {
      setLocalError("Please fill in all required fields");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setLocalError("Please enter a valid email address");
      return false;
    }

    if (formData.password.length < 6) {
      setLocalError("Password must be at least 6 characters");
      return false;
    }

    if (mode === "signup" && !formData.name) {
      setLocalError("Please enter your name");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setLocalError("");
    if (!validateForm()) return;

    setSubmitting(true);

    try {
      let success = false;

      if (mode === "login") {
        success = await login(formData.email, formData.password);
      } else {
        success = await signup(formData.email, formData.password, formData.name, 25);
      }

      if (success) {
        toast({
          title: mode === "login" ? "Welcome back!" : "Account created!",
          description: "Let's find some amazing events",
        });
        // Redirect handled by useEffect
      } else {
        setLocalError("Authentication failed. Please check your credentials.");
      }
    } catch (err: any) {
      setLocalError(err?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLocalError("");
      await loginWithGoogle();
      // redirect handled by AppContext effect
    } catch (err: any) {
      setLocalError(err?.message || "Google login failed");
    }
  };

  const handleDemo = async () => {
    setLocalError("");
    setSubmitting(true);
    try {
      const success = await loginDemo();
      if (success) {
        toast({
          title: "Demo Mode Active",
          description: "Explore all features with sample data",
        });
      } else {
        setLocalError("Demo login failed");
      }
    } catch (err: any) {
      setLocalError(err?.message || "Demo login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-container min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex flex-col min-h-screen px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/")}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-card/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl gradient-amps flex items-center justify-center">
              <Zap className="w-5 h-5 text-foreground" />
            </div>
            <span className="text-xl font-bold">Amps</span>
          </div>
          <div className="w-10" />
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{mode === "login" ? "Welcome Back" : "Create Account"}</h1>
          <p className="text-muted-foreground">{mode === "login" ? "Sign in to continue your journey" : "Join the community of event lovers"}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-card rounded-xl mb-6">
          <button
            onClick={() => { setMode("signup"); setLocalError(""); }}
            className={`flex-1 py-3 rounded-lg font-semibold text-sm transition-all ${mode === "signup" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Sign Up
          </button>
          <button
            onClick={() => { setMode("login"); setLocalError(""); }}
            className={`flex-1 py-3 rounded-lg font-semibold text-sm transition-all ${mode === "login" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Log In
          </button>
        </div>

        {localError && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{localError}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-14 pl-12 bg-card border-border text-foreground placeholder:text-muted-foreground"
                required
              />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="h-14 pl-12 bg-card border-border text-foreground placeholder:text-muted-foreground"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="h-14 pl-12 bg-card border-border text-foreground placeholder:text-muted-foreground"
              required
              minLength={6}
            />
          </div>

          <Button type="submit" disabled={submitting} className="w-full h-14 text-lg font-semibold gradient-amps hover:opacity-90 transition-all">
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : mode === "login" ? "Sign In" : "Create Account"}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
          <span className="relative px-4 bg-background text-sm text-muted-foreground">or continue with</span>
        </div>

        <Button type="button" variant="outline" onClick={handleGoogleLogin} disabled={submitting} className="w-full h-14 text-lg font-semibold mb-4">
          <Zap className="w-5 h-5 mr-2" /> Continue with Google
        </Button>

        <div className="mt-4">
          <div className="relative flex items-center justify-center mb-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <span className="relative px-4 bg-background text-sm text-muted-foreground">or try without account</span>
          </div>
          <Button onClick={handleDemo} variant="outline" disabled={submitting} className="w-full h-14 text-lg font-semibold border-primary/50 hover:bg-primary/10 transition-all">
            <Zap className="w-5 h-5 mr-2" /> Try Demo Mode
          </Button>
        </div>
      </div>
    </div>
  );
}
