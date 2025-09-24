import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Sparkles, Users, MessageCircle } from 'lucide-react';

const LoginScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isLogin) {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Google auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full -translate-x-36 -translate-y-36 animate-pulse"></div>
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-gradient-to-br from-pink-400/20 to-orange-400/20 rounded-full translate-x-48 -translate-y-48 animate-pulse delay-1000"></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-gradient-to-br from-green-400/20 to-teal-400/20 rounded-full translate-y-40 animate-pulse delay-2000"></div>
      </div>

      <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm border border-white/30 shadow-2xl rounded-3xl overflow-hidden relative z-10">
        <CardHeader className="text-center bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 pb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl mx-auto mb-4 flex items-center justify-center shadow-xl">
            <div className="flex items-center space-x-1">
              <Users size={24} className="text-white" />
              <Sparkles size={16} className="text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-extrabold">VitS</span>
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-extrabold">Media</span>
          </CardTitle>
          <CardDescription className="text-gray-600 font-medium">
            {isLogin ? 'Welcome back to your campus community' : 'Join your campus community'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 p-8">
          <form onSubmit={handleEmailAuth} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-semibold">Email</Label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your campus email"
                  className="pl-10 bg-white/80 border-gray-200/50 focus:ring-2 ring-blue-400/50 rounded-xl h-12"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-semibold">Password</Label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pl-10 bg-white/80 border-gray-200/50 focus:ring-2 ring-blue-400/50 rounded-xl h-12"
                  required
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105" 
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Loading...</span>
                </div>
              ) : (
                isLogin ? 'Login' : 'Sign Up'
              )}
            </Button>
          </form>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-4 text-gray-500 font-medium">Or continue with</span>
            </div>
          </div>
          
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 border-gray-200 hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 hover:border-red-200 rounded-xl font-semibold transition-all duration-200"
            onClick={handleGoogleAuth}
            disabled={loading}
          >
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">G</span>
              </div>
              <span>Continue with Google</span>
            </div>
          </Button>
          
          <div className="text-center">
            <button
              type="button"
              className="text-sm text-blue-600 hover:text-blue-800 font-semibold hover:underline transition-colors"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Login'}
            </button>
          </div>

          {/* Features Preview */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center mx-auto">
                  <MessageCircle size={16} className="text-blue-600" />
                </div>
                <p className="text-xs text-gray-600 font-medium">Connect</p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center mx-auto">
                  <Users size={16} className="text-purple-600" />
                </div>
                <p className="text-xs text-gray-600 font-medium">Community</p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 bg-gradient-to-br from-pink-100 to-pink-200 rounded-lg flex items-center justify-center mx-auto">
                  <Sparkles size={16} className="text-pink-600" />
                </div>
                <p className="text-xs text-gray-600 font-medium">Events</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginScreen;