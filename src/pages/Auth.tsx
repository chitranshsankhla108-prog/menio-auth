import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp, isAuthenticated, isLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/staff');
    }
  }, [isAuthenticated, isLoading, navigate]);

  const validateForm = () => {
    try {
      authSchema.parse({ email, password });
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: { email?: string; password?: string } = {};
        err.errors.forEach((e) => {
          if (e.path[0] === 'email') fieldErrors.email = e.message;
          if (e.path[0] === 'password') fieldErrors.password = e.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      if (error.message.includes('Invalid login')) {
        toast.error('Invalid email or password');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('Welcome back!');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    const { error } = await signUp(email, password);
    setLoading(false);

    if (error) {
      if (error.message.includes('already registered')) {
        toast.error('This email is already registered');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('Check your email to confirm your account!');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDF8F7] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#6F4E37]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF8F7] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#FFD6C9]/40 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#6F4E37]/10 rounded-full blur-[100px] pointer-events-none" />

      <Card className="w-full max-w-md rounded-[2.5rem] border-none shadow-[0_20px_60px_rgba(58,44,44,0.08)] bg-white relative z-10 overflow-hidden">
        
        <CardHeader className="text-center bg-[#3A2C2C] text-white pt-10 pb-8 rounded-b-[2rem] shadow-inner">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-md mx-auto mb-4 border border-white/20">
            <Coffee className="w-8 h-8 text-[#FFD6C9]" />
          </div>
          <CardTitle className="font-serif text-3xl font-black italic tracking-tight text-[#F4EDE4]">Menio Staff</CardTitle>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FFD6C9]/70 mt-2">
            Secure Admin Portal
          </p>
        </CardHeader>

        <CardContent className="p-8">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="w-full h-14 p-1.5 bg-[#F7F1F2] rounded-2xl mb-8">
              <TabsTrigger 
                value="signin" 
                className="flex-1 rounded-xl data-[state=active]:bg-[#6F4E37] data-[state=active]:text-white text-[11px] font-black uppercase tracking-widest transition-all"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger 
                value="signup" 
                className="flex-1 rounded-xl data-[state=active]:bg-[#6F4E37] data-[state=active]:text-white text-[11px] font-black uppercase tracking-widest transition-all"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <form onSubmit={handleSignIn} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="text-[10px] font-black uppercase tracking-widest text-[#6F4E37] pl-1">
                    Email Address
                  </Label>
                  <Input
                    id="signin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@cafe.com"
                    className="h-14 rounded-2xl border-[#EBE1E3] bg-[#F7F1F2] focus-visible:ring-[#FFD6C9] font-medium text-[#3A2C2C] px-5"
                  />
                  {errors.email && <p className="text-xs font-bold text-[#9D4E5C] pl-1">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signin-password" className="text-[10px] font-black uppercase tracking-widest text-[#6F4E37] pl-1">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="signin-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-14 rounded-2xl border-[#EBE1E3] bg-[#F7F1F2] focus-visible:ring-[#FFD6C9] font-medium text-[#3A2C2C] px-5 pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 text-[#A89699] hover:text-[#6F4E37] hover:bg-[#EBE1E3] rounded-xl"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </Button>
                  </div>
                  {errors.password && <p className="text-xs font-bold text-[#9D4E5C] pl-1">{errors.password}</p>}
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-14 mt-4 rounded-2xl bg-[#3A2C2C] text-white hover:bg-[#6F4E37] font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all" 
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Access Dashboard'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <form onSubmit={handleSignUp} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-[10px] font-black uppercase tracking-widest text-[#6F4E37] pl-1">
                    Email Address
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@cafe.com"
                    className="h-14 rounded-2xl border-[#EBE1E3] bg-[#F7F1F2] focus-visible:ring-[#FFD6C9] font-medium text-[#3A2C2C] px-5"
                  />
                  {errors.email && <p className="text-xs font-bold text-[#9D4E5C] pl-1">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-[10px] font-black uppercase tracking-widest text-[#6F4E37] pl-1">
                    Create Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-14 rounded-2xl border-[#EBE1E3] bg-[#F7F1F2] focus-visible:ring-[#FFD6C9] font-medium text-[#3A2C2C] px-5 pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 text-[#A89699] hover:text-[#6F4E37] hover:bg-[#EBE1E3] rounded-xl"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </Button>
                  </div>
                  {errors.password && <p className="text-xs font-bold text-[#9D4E5C] pl-1">{errors.password}</p>}
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-14 mt-4 rounded-2xl bg-[#6F4E37] text-white hover:bg-[#3A2C2C] font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all" 
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
                </Button>
                
                <div className="bg-[#FDF8F7] p-3 rounded-xl border border-[#F9E0E3] flex items-start gap-3 mt-4">
                  <ShieldCheck className="w-5 h-5 text-[#8ED1B2] shrink-0 mt-0.5" />
                  <p className="text-[10px] font-bold text-[#6F4E37] leading-relaxed uppercase tracking-wider">
                    New accounts require admin approval before dashboard access is granted.
                  </p>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="mt-8 text-center z-10">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#A89699]">
          Powered by Menio
        </p>
      </div>
    </div>
  );
}