'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <Card className="w-full max-w-sm">
      <CardHeader className="pb-3">
        <motion.div
          key={isLogin ? 'login' : 'signup'}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <CardTitle className="text-lg sm:text-xl">{isLogin ? 'Welcome Back' : 'Create Account'}</CardTitle>
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
          {!isLogin && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-1"
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
          
          <Button type="submit" className="w-full h-9 mt-4" disabled={!!loading}>
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
            className="w-full h-9"
            onClick={() => signInWithProvider('google')}
            disabled={!!loading}
          >
            {loading === 'google' && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
            <span className="text-sm">{isLogin ? 'Sign in' : 'Sign up'} with Google</span>
          </Button>
          <Button
            variant="outline"
            className="w-full h-9"
            onClick={() => signInWithProvider('github')}
            disabled={!!loading}
          >
            {loading === 'github' && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
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
