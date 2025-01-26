'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDebounceCallback } from 'usehooks-ts';
import z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import axios, { AxiosError } from 'axios';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signUpValidation } from '@/Schemas/signUpSchemas';

export default function SignUpForm() {
  const [username, setUsername] = useState('');
  const [usernameMessage, setUsernameMessage] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState();

  const debounced = useDebounceCallback(setUsername, 300);

  const router = useRouter();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(signUpValidation),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      fullName: '',
      avatar: null
    },
  });



  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };




  useEffect(() => {
    const checkUsernameUnique = async () => {
      if (username) {
        setIsCheckingUsername(true);
        setUsernameMessage(''); // Reset message
        try {
          const response = await axios.get(
            `/api/users/check-username?username=${username}`
          );
          setUsernameMessage(response.data.message);
        } catch (error) {
          const axiosError = error;
          setUsernameMessage(
            axiosError.response?.data.message ?? 'Error checking username'
          );
        } finally {
          setIsCheckingUsername(false);
        }
      }
    };
    checkUsernameUnique();
  }, [username]);

  const onSubmit = async (data) => {
    try {


      setIsSubmitting(true);
      // console.log(data.avatar);

      //  const avatarBase64 = await fileToBase64(data.avatar[0]);

      const formData = new FormData();
      formData.append('username', data.username);
      formData.append('email', data.email);
      formData.append('password', data.password);
      formData.append('fullName', data.fullName);
     if(data.avatar) formData.append('avatar', data.avatar[0]);

      const response = await axios.post('/api/users/signup', formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Set the content type to 'multipart/form-data'
        },
      });
      // const response = await axios.post('/api/users/signup', payload,{headers: { 'Content-Type': 'application/json' } });




      if (response.data.success) {
        toast({
          title: 'Success',
          description: response.data.message,
        });
        router.replace(`/verify/${username}`);

      } else {
        toast({
          title: 'error',
          description: response.data.message,
        });
      }


    } catch (error) {
      console.error('Error during sign-up:', error);

      const axiosError = error;

      // Default error message
      let errorMessage = axiosError.response?.data.message || 'There was a problem with your sign-up. Please try again.';

      toast({
        title: 'Sign Up Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-green-400 via-blue-500 to-purple-600">
    <div className="w-full max-w-md p-6 space-y-4 bg-white border border-gray-200 rounded-xl shadow-xl">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-3">Create Account</h1>
        <p className="text-gray-500">Sign up to start your journey</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            name="fullName"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Full Name</FormLabel>
                <Input
                  {...field}
                  placeholder="Enter your full name"
                  className="border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <FormMessage />
              </FormItem>
            )}
          />
  
          <FormField
            name="username"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Username</FormLabel>
                <Input
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    debounced(e.target.value);
                  }}
                  placeholder="Choose a username"
                  className="border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {isCheckingUsername && <Loader2 className="animate-spin text-blue-500" />}
                {!isCheckingUsername && usernameMessage && (
                  <p
                    className={`text-sm ${usernameMessage === 'Username is available'
                      ? 'text-green-600'
                      : 'text-red-600'
                      }`}
                  >
                    {usernameMessage}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
  
          <FormField
            name="email"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Email</FormLabel>
                <Input
                  {...field}
                  placeholder="Enter your email"
                  className="border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">We will send you a verification code</p>
                <FormMessage />
              </FormItem>
            )}
          />
  
          <FormField
            control={form.control}
            name="avatar"
            render={() => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Profile Image</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    {...form.register("avatar")}
                    className="border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </FormControl>
                <FormDescription className="text-xs text-gray-500 mt-1">Upload a profile image.</FormDescription>
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
                  placeholder="Create a password"
                  className="border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <FormMessage />
              </FormItem>
            )}
          />
  
          <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-2 rounded-lg font-medium hover:shadow-lg" disabled={isSubmitting || usernameMessage !== 'Username is available'}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Signing up...
              </>
            ) : (
              'Sign Up'
            )}
          </Button>
        </form>
      </Form>
      <div className="text-center mt-3">
        <p className="text-gray-600">
          Already a member?{' '}
          <Link href="/sign-in" className="text-blue-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  </div>
  
  

  );
}
