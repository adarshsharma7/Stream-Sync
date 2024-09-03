import React, { useState, useEffect } from 'react';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { chatMessageSchema } from "@/Schemas/sendChatmessagesSchema";
import { Button } from './ui/button';
import { Input } from './ui/input';
import Image from 'next/image';
import Pusher from 'pusher-js';
import { useSession } from 'next-auth/react';
import axios from 'axios';


function ChatOpen({ avatar, username, chatId }) {
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [error, setError] = useState(null);

    const { data: session } = useSession();
    const user = session?.user;

    const form = useForm({
        resolver: zodResolver(chatMessageSchema),
        defaultValues: {
            chatMessage: ""
        }
    });

    useEffect(() => {
        const fetchChatHistory = async () => {
            try {
                const response = await axios.get('/api/users/getchathistory', {
                    params: { chatId }
                });

                if (response.data.success) {
                    setMessages(response.data.chatHistory);
                    console.log(response.data.chatHistory);
                    
                } else {
                    setError(response.data.message);
                }
            } catch (error) {
                setError('Error fetching chat history');
            }
        };

        fetchChatHistory();
    }, [chatId]);



    useEffect(() => {
        if (!user) return
        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
            authEndpoint: '/api/pusher/auth',
        });

        const msgChannel = pusher.subscribe(`private-${user._id}`);

        msgChannel.bind('newmsg', function (data) {
            const { message } = data;
            // Only add the message if it's not from the current user

            setMessages((prevMessages) => [...prevMessages, { sender:{_id:chatId},content: message,timestamp: new Date()}]);

        });

        // Cleanup function to unsubscribe from Pusher
        return () => {
            msgChannel.unbind_all();
            msgChannel.unsubscribe();
        };
    }, [chatId, user]);

    if (error) {
        return <div>Error: {error}</div>;
    }


    const sendMessage = async (data) => {
        try {
            let response = await axios.post("/api/users/sendmessages", { message: data.chatMessage, chatId });
            if (response.status === 200) {
                // Add the sent message to the messages array
                setMessages((prevMessages) => [...prevMessages, {sender:{_id:user._id}, content: data.chatMessage,timestamp: new Date() }]);
                setMessage(""); // Reset the message input
            }
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    return (
        <div className='flex flex-col border-2 border-red-600 h-full w-full'>
            <div className='h-[6%] border-2 border-green-500 flex gap-1'>
                <div className='overflow-hidden h-7 w-7 rounded-full relative'>
                    <Image
                        src={avatar}
                        alt="dp"
                        fill
                        sizes="28px"
                        style={{ objectFit: "cover" }}
                    />
                </div>
                <div>{username}</div>
            </div>

            <div className='h-[77%] border-2 border-green-500 overflow-y-auto'>
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`mb-2 flex ${msg.sender._id === user._id ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`p-2 rounded-lg ${msg.sender._id === user._id ? 'bg-blue-500 text-white' : 'bg-gray-300 text-black'}`}
                            style={{ maxWidth: '80%' }}
                        >
                            <p>{msg.content}</p>
                        </div>
                    </div>
                ))}
            </div>


            <div className='h-[11%] w-full'>
                <div className='w-full'>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(sendMessage)}>
                            <div className="flex">
                                <FormField
                                    control={form.control}
                                    name="chatMessage"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        type='text'
                                                        placeholder='Add your message...'
                                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-500"
                                                        {...field}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className='ml-2'>
                                    <Button
                                        type="submit"
                                        className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg"
                                    >
                                        Send
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </Form>
                </div>
            </div>
        </div>
    );
}

export default ChatOpen;
