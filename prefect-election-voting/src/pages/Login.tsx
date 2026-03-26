import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useElection } from "@/lib/electionContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Eye, EyeOff } from "lucide-react";
import Header from "@/components/Header";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { login } = useElection();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    const success = login(email, password);
    if (success) {
      if (email === "admin@school.com") navigate("/admin");
      else if (email === "it@school.com") navigate("/it-admin");
      else navigate("/candidates");
    } else {
      setError("Invalid credentials. Try teacher@school.com / teacher123");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-xl shadow-elevated p-8 animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-full bg-gradient-gold flex items-center justify-center mx-auto mb-4 shadow-gold">
                <Shield className="w-7 h-7 text-secondary-foreground" />
              </div>
              <h2 className="font-display text-2xl font-bold text-card-foreground">Teacher Login</h2>
              <p className="text-muted-foreground text-sm mt-1">Sign in to cast your vote</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="email" className="text-card-foreground font-body font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="teacher@school.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-card-foreground font-body font-medium">Password</Label>
                <div className="relative mt-1.5">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-card-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-destructive text-sm text-center bg-destructive/10 rounded-md py-2">{error}</p>
              )}

              <Button type="submit" className="w-full bg-gradient-navy text-primary-foreground font-semibold hover:opacity-90">
                Sign In
              </Button>
            </form>

            <div className="mt-6 p-3 rounded-md bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground text-center">
                <strong>Demo:</strong> teacher@school.com / teacher123<br />
                <strong>Admin:</strong> admin@school.com / admin123<br />
                <strong>IT Admin:</strong> it@school.com / it123
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
