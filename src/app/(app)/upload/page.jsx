"use client";

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { zodResolver } from '@hookform/resolvers/zod'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { uploadVideoSchema } from '@/Schemas/uploadVideoSchema'
import { Textarea } from '@/components/ui/textarea'
import { Button } from "@/components/ui/button"
import axios from 'axios'
import { Loader2 } from 'lucide-react'


function Page() {
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState("")
    const [messageType, setMessageType] = useState("")



    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result);
          reader.onerror = error => reject(error);
        });
      };
      


    const form = useForm({
        resolver: zodResolver(uploadVideoSchema),
        defaultValues: {
            description: "",
            title: "",
            videoFile: null,
            thumbnail: null,
        }
    })



    const onSubmit = async (data) => {

        setIsLoading(true)
        setMessage("") // Clear previous messages

// console.log("data hai",data);


        const formData = new FormData();
        formData.set('title', data.title);
        formData.set('description', data.description);
        formData.set('videoFile', data.videoFile[0]);
        formData.set('thumbnail', data.thumbnail[0]);
       
        // const videoBase64 = await fileToBase64(data.videoFile[0]);
        // const thumbnailBase64 = await fileToBase64(data.thumbnail[0]);
      
        // const payload = {
        //   title: data.title,
        //   description: data.description,
        //   videoFile: videoBase64,
        //   thumbnail: thumbnailBase64,
        // };

        try {
            let response = await axios.post("/api/videos/videoupload", formData , { headers: {  'Content-Type': 'multipart/form-data' } })
            setMessage(response.data.message)
            if(response.data.success){
                setMessageType("success") // Set message type for styling
            }
          
        } catch (error) {
            setMessage("An error occurred while uploading.")
            setMessageType("error") // Set message type for styling
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full h-screen flex flex-col bg-gray-100">
            <div className="bg-white shadow-md py-4 px-6 border-b border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900">Upload Your Video</h1>
                <p className="text-gray-600">Share your latest video with the world.</p>
            </div>
            <div className="flex-grow flex justify-center items-center p-4">
               
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-3xl bg-white p-8 rounded-lg shadow-lg space-y-8">

                        <FormField
                            control={form.control}
                            name="videoFile"
                            render={() => (
                                <FormItem>
                                    <FormLabel className="text-lg font-semibold">Upload Video</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="file"
                                            placeholder="Upload Video"
                                            {...form.register("videoFile")}
                                            className="border border-gray-300 rounded-md shadow-sm"
                                        />
                                    </FormControl>
                                    <FormDescription className="text-sm text-gray-600">This is your public video.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="thumbnail"
                            render={() => (
                                <FormItem>
                                    <FormLabel className="text-lg font-semibold">Upload Thumbnail</FormLabel>
                                    <FormControl>
                                        <Input type='file'  placeholder="Upload thumbnail" {...form.register('thumbnail')} className="border border-gray-300 rounded-md shadow-sm" />
                                    </FormControl>
                                    <FormDescription className="text-sm text-gray-600">Upload the thumbnail image (Max 5 MB).</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-lg font-semibold">Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Title (required)" {...field} className="border border-gray-300 rounded-md shadow-sm" />
                                    </FormControl>
                                    <FormDescription className="text-sm text-gray-600">This is your public title.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-lg font-semibold">Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Tell viewers about your video"
                                            className="resize-none border border-gray-300 rounded-md shadow-sm"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription className="text-sm text-gray-600">This is your public description.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-center flex-col items-center">
                            {message && (
                                <div className={`w-full max-w-xl p-4 mb-4 text-center ${messageType === 'success' ? 'bg-green-100 text-green-800 border-green-400' : 'bg-red-100 text-red-800 border-red-400'} border rounded-md`}>
                                    {message}
                                </div>
                            )}
                            {isLoading ? (
                                <Button disabled className="bg-gray-400 text-white hover:bg-gray-500">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Please wait
                                </Button>
                            ) : (
                                <Button type="submit" disabled={isLoading} className="bg-blue-600 text-white hover:bg-blue-700">
                                    Upload
                                </Button>
                            )}
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    )
}

export default Page
