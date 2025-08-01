'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Github } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthFormProps {
  defaultMode?: 'login' | 'signup';
}

export default function AuthForm({ defaultMode = 'login' }: AuthFormProps) {
  const { signInWithEmail, signUpWithEmail, signInWithProvider, loading, error } = useAuth();
  const [isLogin, setIsLogin] = useState(defaultMode === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      await signInWithEmail(email, password);
    } else {
      await signUpWithEmail(email, password, name);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
    setName('');
  };

  return (
    <Card className="w-full max-w-sm bg-card border shadow-lg">
      <CardHeader className="pb-3">
        <motion.div
          key={isLogin ? 'login' : 'signup'}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <CardTitle className="text-lg sm:text-xl font-semibold">{isLogin ? 'Welcome back' : 'Create Account'}</CardTitle>
          <CardDescription className="text-sm">
            {isLogin 
              ? 'Enter your credentials to access your account.'
              : 'Enter your details to create a new account.'
            }
          </CardDescription>
        </motion.div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {error && (
          <Alert variant="destructive" className="mb-3">
            <AlertDescription className="text-sm">{error.message}</AlertDescription>
          </Alert>
        )}
        
        <motion.form 
          key={isLogin ? 'login-form' : 'signup-form'}
          initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          onSubmit={handleEmailAuth} 
          className="space-y-3"
        >
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div 
                key="name-field"
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: '0.75rem' }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="space-y-1 overflow-hidden"
              >
                <Label htmlFor="name" className="text-sm">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-9"
                />
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="space-y-1">
            <Label htmlFor="email" className="text-sm">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-9"
            />
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="password" className="text-sm">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder={isLogin ? "Enter your password" : "Create a password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-9"
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full h-9 mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0" 
            disabled={!!loading}
          >
            {loading === 'email' && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
            {isLogin ? 'Sign In' : 'Create Account'}
          </Button>
        </motion.form>

        <div className="my-3 flex items-center">
          <div className="flex-grow border-t border-border" />
          <span className="mx-3 text-xs text-muted-foreground">OR</span>
          <div className="flex-grow border-t border-border" />
        </div>

        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full h-9 justify-center"
            onClick={() => signInWithProvider('google')}
            disabled={!!loading}
          >
            {loading === 'google' && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
            {!loading && (
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            <span className="text-sm">{isLogin ? 'Sign in' : 'Sign up'} with Google</span>
          </Button>
          
          <Button
            variant="outline"
            className="w-full h-9 justify-center"
            onClick={() => signInWithProvider('github')}
            disabled={!!loading}
          >
            {loading === 'github' && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
            {!loading && <Github className="mr-2 h-4 w-4" />}
            <span className="text-sm">{isLogin ? 'Sign in' : 'Sign up'} with GitHub</span>
          </Button>
        </div>

        <div className="mt-3 text-center text-sm">
          <span className="text-muted-foreground">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
          </span>{' '}
          <Button
            variant="link"
            className="p-0 h-auto text-sm font-medium text-primary hover:underline"
            onClick={toggleMode}
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
