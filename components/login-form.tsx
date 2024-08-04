"use client"
import React from 'react';
import { FieldValues, useForm } from 'react-hook-form';
import { signIn } from 'next-auth/react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [error, setError] = React.useState<string|null>(null);

  const onSubmit = async (data:FieldValues) => {
    const result = await signIn('credentials', {
      redirect: false,
      email: data.email,
      password: data.password,
    });

    if (result && result.error) {
      setError(result.error);
    }
  };

  const handleGoogleLogin = () => {
    signIn('google', {callbackUrl:'/'});
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-8 space-y-8 rounded-xl shadow-md">
        <h1 className="text-2xl font-bold text-center">Login</h1>
        
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register('email', { required: 'Email is required' })}
            />
            {/* {errors.email && <p className="text-sm text-red-500">{errors.message}</p>} */}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              {...register('password', { required: 'Password is required' })}
            />
            {/* {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>} */}
          </div>
          
          <Button type="submit" className="w-full">
            Sign In
          </Button>
        </form>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 text-gray-500 bg-white">Or continue with</span>
          </div>
        </div>
        
        <Button onClick={handleGoogleLogin} variant="outline" className="w-full">
          Sign in with Google
        </Button>
      </div>
    </div>
  );
}