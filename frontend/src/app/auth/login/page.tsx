"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', formData);
      
      // Store tokens
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      toast.success(`Welcome back, ${response.data.user.name}!`);
      
      if (response.data.user.twoFactorEnabled) {
        router.push('/auth/verify-2fa');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      const message = error.response?.data?.error || 'Login failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 relative overflow-hidden bg-brand-midnight">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-royal/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-cyan/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-white">
            Welcome Back
          </h1>
          <p className="text-brand-silver mt-2">Sign in to AGD Data Plus</p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input 
              id="email" 
              type="email" 
              label="Email Address" 
              placeholder="name@example.com" 
              required 
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            
            <div className="space-y-1">
              <Input 
                id="password" 
                type="password" 
                label="Password" 
                placeholder="••••••••" 
                required 
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <div className="flex justify-end">
                <Link href="/auth/forgot-password" className="text-sm text-brand-cyan hover:underline">
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button type="submit" className="mt-4" disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-brand-silver">
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-brand-cyan hover:underline font-medium">
              Create one
            </Link>
          </div>
        </Card>
      </div>
    </main>
  );
}
