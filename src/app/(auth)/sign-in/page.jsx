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
      } else {
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
    <div className="flex justify-center items-center min-h-screen bg-white">
    <div className="w-full max-w-sm p-8 space-y-6 bg-gray-50 border border-gray-200 rounded-lg shadow-lg">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">Sign in to your account</h1>
        <p className="text-gray-600 mb-6">Continue To Watch Videos</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            name="identifier"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm text-gray-700">Email/Username</FormLabel>
                <Input
                  value={credential}
                  onChange={(e)=>{setCredential(e.target.value)}}
                  placeholder="Enter your email or username"
                  className="border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-blue-500"
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
                <FormLabel className="text-sm text-gray-700">Password</FormLabel>
                <Input
                  type="password"
                  {...field}
                  placeholder="Enter your password"
                  className="border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-blue-500"
                />
                <FormMessage />
              </FormItem>
            )}
          />
          {forgetPassLoading ? ( 
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : ( 
            <button className='text-blue-700' type='button' onClick={forgetPassword}>Forget Password ?</button>
            )}
         
          <Button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait
              </>
            ) : (
              'Sign in'
            )}
          </Button>
        </form>
      </Form>
      <div className="text-center mt-4">
        <p className="text-gray-600">
          Not a member yet?{' '}
          <Link href="/sign-up" className="text-blue-600 hover:text-blue-800">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  </div>
  
  );
}
