import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Zap, Mail, Lock, User, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, signup, loginDemo } = useApp();
  const { toast } = useToast();

  const [mode, setMode] = useState<'login' | 'signup'>(
    searchParams.get('mode') === 'login' ? 'login' : 'signup'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let success = false;
      if (mode === 'login') {
        success = await login(formData.email, formData.password);
      } else {
        success = await signup(formData.email, formData.password, formData.name);
      }

      if (success) {
        toast({
          title: mode === 'login' ? 'Welcome back!' : 'Account created!',
          description: "Let's find some amazing events",
        });
        navigate('/home');
      } else {
        toast({
          title: 'Error',
          description: 'Please check your credentials',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemo = () => {
    loginDemo();
    toast({
      title: 'Demo Mode Active',
      description: 'Explore all features with sample data',
    });
    navigate('/home');
  };

  return (
    <div className="app-container min-h-screen bg-background relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex flex-col min-h-screen px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-card/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl gradient-pro flex items-center justify-center">
              <Zap className="w-5 h-5 text-foreground" />
            </div>
            <span className="text-xl font-bold">Amps</span>
          </div>
          <div className="w-10" />
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-muted-foreground">
            {mode === 'login'
              ? 'Sign in to continue your journey'
              : 'Join the community of event lovers'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-card rounded-xl mb-8">
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-3 rounded-lg font-semibold text-sm transition-all ${
              mode === 'signup'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Sign Up
          </button>
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-3 rounded-lg font-semibold text-sm transition-all ${
              mode === 'login'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Log In
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 flex-1">
          {mode === 'signup' && (
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

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 text-lg font-semibold gradient-pro glow-purple hover:opacity-90 transition-all mt-6"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : mode === 'login' ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </Button>
        </form>

        {/* Demo Mode */}
        <div className="mt-8">
          <div className="relative flex items-center justify-center mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <span className="relative px-4 bg-background text-sm text-muted-foreground">
              or try without account
            </span>
          </div>
          <Button
            onClick={handleDemo}
            variant="outline"
            className="w-full h-14 text-lg font-semibold gradient-demo border-0 hover:opacity-90 transition-all"
          >
            <Zap className="w-5 h-5 mr-2" />
            Try Demo Mode
          </Button>
        </div>
      </div>
    </div>
  );
}
