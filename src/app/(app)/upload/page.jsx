"use client";

import React, { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { uploadVideoSchema } from "@/Schemas/uploadVideoSchema";
import { uploadToCloudinary } from "@/components/uploadtocloudinary";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
// import { Progress } from "@radix-ui/react-progress";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { useSession, signOut } from 'next-auth/react';
import LoginRequiredText from "@/components/loginRequiredText"


function Page() {
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [thumbnailProgress, setThumbnailProgress] = useState(0);
    const [videoProgress, setVideoProgress] = useState(0);
    const [videoFile, setVideoFile] = useState(null);
    const [thumbnailFile, setThumbnailFile] = useState(null);

    const { data: session } = useSession()
    const _user = session?.user

    const form = useForm({
        resolver: zodResolver(uploadVideoSchema),
        defaultValues: {
            title: "",
            description: "",
        },
    });

    // Drag & Drop Handlers
    const onDropVideo = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];

        if (!file.type.startsWith("video/")) {
            alert("Only video files are allowed!");
            return;
        }
        setVideoFile(file);
    }, []);

    const onDropThumbnail = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];

        if (!file.type.startsWith("image/")) {
            alert("Only image files are allowed!");
            return;
        }
        setThumbnailFile(file);
    }, []);

    const { getRootProps: getVideoProps, getInputProps: getVideoInputProps } = useDropzone({
        onDrop: onDropVideo,
        accept: "video/*",
    });

    const { getRootProps: getThumbnailProps, getInputProps: getThumbnailInputProps } = useDropzone({
        onDrop: onDropThumbnail,
        accept: "image/*",
    });


    const onSubmit = async (data) => {
        if (!videoFile || !thumbnailFile) {
            setMessage("Please upload both a video and a thumbnail.");
            setMessageType("error");
            return;
        }

        setIsLoading(true);
        setMessage("");

        try {
            // Upload Thumbnail
            const thumbnailResponse = await uploadToCloudinary(thumbnailFile, setThumbnailProgress, "image");
            const thumbnailUrl = thumbnailResponse.secure_url;

            // Upload Video
            const videoResponse = await uploadToCloudinary(videoFile, setVideoProgress, "video");
            const videoUrl = videoResponse.secure_url;

            const payload = {
                title: data.title,
                description: data.description,
                videoFile: videoUrl,
                thumbnail: thumbnailUrl,
            };

            let response = await axios.post("/api/videos/videoupload", payload, {
                headers: { "Content-Type": "application/json" },
            });

            setMessage(response.data.message);
            setMessageType(response.data.success ? "success" : "error");
        } catch (error) {
            setMessage("An error occurred while uploading.");
            setMessageType("error");
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="w-full min-h-screen flex flex-col bg-gradient-to-br from-gray-100 to-gray-300">
            {/* Header */}
            <div className="flex justify-between items-center flex-wrap gap-4">
                {/* Left Side */}
                <div>
                    <h1 className="text-3xl font-semibold text-gray-900">Upload Your Video</h1>
                    <p className="text-gray-600">Share your latest video with the world.</p>
                </div>

                {/* Right Side */}
                {!_user && <LoginRequiredText text="to upload videos." />}
            </div>


            {/* Upload Form */}
            <div className="flex-grow flex justify-center items-center p-6">
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="w-full max-w-3xl bg-white p-8 rounded-xl shadow-xl space-y-6"
                    >

                        {/* Drag & Drop Video Upload */}
                        <div>
                            <div {...getVideoProps()} className={`${videoProgress > 0 ? "cursor-not-allowed pointer-events-none" : "cursor-pointer"} relative border border-gray-300 p-6 text-center  rounded-xl shadow-md bg-white transition hover:shadow-lg`} >
                                <input {...getVideoInputProps()} accept="video/*" disabled={videoProgress > 0} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                <div className="relative z-10">
                                    {videoFile ? (


                                        <p className="text-lg font-semibold text-blue-600 w-full break-words ">

                                            {videoFile.name.length > 70
                                                ? `${videoFile.name.slice(0, 58)}.....${videoFile.name.slice(-14)}`
                                                : videoFile.name}

                                        </p>


                                    ) : (
                                        <p className="text-gray-600">Drag & Drop Video Here or Click to Upload</p>
                                    )}
                                </div>
                                {/* Glassmorphic Progress Overlay */}
                                {videoProgress > 0 && (
                                    <div className="absolute inset-0 bg-blue-500/20 backdrop-blur-lg rounded-xl"
                                        style={{ width: `${videoProgress}%` }}
                                    />
                                )}
                            </div>
                            {videoProgress > 0 && (
                                <p className="text-sm text-blue-700" >{videoProgress}%</p>
                            )}


                        </div>

                        {/* Drag & Drop Thumbnail Upload */}
                        <div>
                            <div {...getThumbnailProps()} className={`${videoProgress > 0 ? "cursor-not-allowed pointer-events-none" : "cursor-pointer"} relative border border-gray-300 p-6 text-center cursor-pointer rounded-xl shadow-md bg-white transition hover:shadow-lg`}>
                                <input {...getThumbnailInputProps()} accept="image/*" disabled={thumbnailProgress > 0} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                <div className="relative z-10">
                                    {thumbnailFile ? (

                                        <p className="text-lg font-semibold text-green-600 w-full break-words">
                                            {thumbnailFile?.name.length > 70
                                                ? `${thumbnailFile.name.slice(0, 58)}.....${thumbnailFile.name.slice(-14)}`
                                                : thumbnailFile?.name}
                                        </p>
                                    ) : (
                                        <p className="text-gray-600">Drag & Drop Thumbnail Here or Click to Upload</p>
                                    )}
                                </div>
                                {/* Glassmorphic Progress Overlay */}
                                {thumbnailProgress > 0 && (
                                    <div className="absolute inset-0 bg-green-500/20 backdrop-blur-lg rounded-xl"
                                        style={{ width: `${thumbnailProgress}%` }}
                                    />
                                )}

                            </div>
                            {thumbnailProgress > 0 && (
                                <p className="text-sm text-blue-700" >{thumbnailProgress}%</p>
                            )}

                        </div>

                        {/* Title Input */}
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-lg font-semibold">Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Title (required)" {...field} className="border border-gray-300 rounded-md shadow-sm p-2" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Description Input */}
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-lg font-semibold">Description</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Tell viewers about your video" className="resize-none border border-gray-300 rounded-md shadow-sm p-2" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Message Alert */}
                        {message && (
                            <div className={`p-4 text-center rounded-md ${messageType === "success" ? "bg-green-100 text-green-800 border-green-400" : "bg-red-100 text-red-800 border-red-400"} border`}>
                                {message}
                            </div>
                        )}

                        {/* Upload Button */}
                        <div className="flex justify-center">
                            {isLoading ? (
                                <Button disabled className="bg-gray-400 text-white flex items-center">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Please wait
                                </Button>
                            ) : (
                                <Button type="submit" disabled={isLoading || !_user} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">
                                    Upload
                                </Button>
                            )}
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    );

}

export default Page;
