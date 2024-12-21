'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import  {z} from 'zod';
import { signIn } from 'next-auth/react';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { signInValidation } from '@/Schemas/sign-inSchemas';
import axios from 'axios';

export default function SignInForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [credential, setCredential] = useState('');
  const [forgetPassLoading, setForgetPassLoading] = useState(false);

  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(signInValidation),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  const { toast } = useToast();


  const onSubmit = async (data) => {
    setIsSubmitting(true)
    const result = await signIn('credentials', {
      redirect: false,
      identifier: credential,
      password: data.password,
    });
    setIsSubmitting(false)
    if (result?.error) {
      if (result.error === 'CredentialsSignin') {
        toast({
          title: 'Login Failed',
          description: 'Incorrect username or password',
          variant: 'destructive',
        });
      } else if(result.error=='Error: Please verify your account before login') {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
        
        router.replace(`/verify/${credential}`);
      }else{
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      }
    }

    if (result?.url) {
      router.replace('/dashboard');
    }
  };

const forgetPassword=async()=>{
  try {
    setForgetPassLoading(true)
    const response=await axios.post('api/users/forgetPassword',{credential})
    if(response.data.success){
      toast({
        title: 'Success',
        description: response.data.message,
   });
    }
    
    if(response.data.message == 'Email is already sent for change password'){
      toast({
        title: 'Success',
        description: response.data.message,
   });
    }
  } catch (error) {
    console.log("something wrong",error);
  }finally{
    setForgetPassLoading(false)
  }
}


  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
    <div className="w-full max-w-sm p-8 space-y-6 bg-white border border-gray-200 rounded-xl shadow-xl">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-3">Welcome Back!</h1>
        <p className="text-gray-500">Sign in to continue watching amazing videos</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            name="identifier"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Email or Username</FormLabel>
                <Input
                  value={credential}
                  onChange={(e) => { setCredential(e.target.value); }}
                  placeholder="Enter your email or username"
                  className="border border-gray-300 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="password"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Password</FormLabel>
                <Input
                  type="password"
                  {...field}
                  placeholder="Enter your password"
                  className="border border-gray-300 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <FormMessage />
              </FormItem>
            )}
          />
          {forgetPassLoading ? (
            <div className="flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            </div>
          ) : (
            <button className="text-sm text-blue-600 hover:underline" type="button" onClick={forgetPassword}>Forgot Password?</button>
          )}

          <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg font-medium hover:shadow-lg" disabled={isSubmitting}>
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Signing in...
              </div>
            ) : (
              'Sign in'
            )}
          </Button>
        </form>
      </Form>
      <div className="text-center mt-5">
        <p className="text-gray-600">
          New here?{' '}
          <Link href="/sign-up" className="text-blue-600 font-medium hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  </div>

  
  );
}
