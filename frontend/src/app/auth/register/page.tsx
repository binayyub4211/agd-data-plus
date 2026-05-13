"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', formData);
      toast.success('Registration successful! Please login.');
      router.push('/auth/login');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Registration failed';
      toast.error(typeof message === 'string' ? message : 'Invalid input data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 relative overflow-hidden bg-brand-midnight">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-brand-royal/20 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-white">
            Create Account
          </h1>
          <p className="text-brand-silver mt-2">Join AGD Data Plus today</p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input 
              id="name" 
              label="Full Name" 
              placeholder="John Doe" 
              required 
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input 
              id="email" 
              type="email" 
              label="Email Address" 
              placeholder="name@example.com" 
              required 
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input 
              id="phone" 
              label="Phone Number" 
              placeholder="08012345678" 
              required 
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input 
              id="password" 
              type="password" 
              label="Password" 
              placeholder="••••••••" 
              required 
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />

            <Button type="submit" className="mt-4" disabled={loading}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-brand-silver">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-brand-cyan hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </Card>
      </div>
    </main>
  );
}
