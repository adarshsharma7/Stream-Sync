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
import { Loader2 } from 'lucide-react';
import { IoClose } from "react-icons/io5";
import { TiTick, TiTickOutline } from 'react-icons/ti';
import { useDebounceCallback } from 'usehooks-ts';



function ChatOpen({ avatar, username, chatId, status, setIsChatOpen }) {



    const [messages, setMessages] = useState([]);
    const [error, setError] = useState(null);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [onlineUsers, setOnlineUsers] = useState({});
    const [userStatus, setUserStatus] = useState('');
    const [isChatVisible, setIsChatVisible] = useState(true);
    const [userTyping, setUserTyping] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isTypingSent, setIsTypingSent] = useState(null);



    // let debounceTyping=useDebounceCallback(setUserTyping,2000)

    const { data: session } = useSession();
    const user = session?.user;

    const form = useForm({
        resolver: zodResolver(chatMessageSchema),
        defaultValues: {
            chatMessage: ""
        }
    });

    useEffect(() => {

        const updateMsgStatus = async () => {
            try {
                await axios.post("/api/users/updatemsgstatus", { chatId });
            } catch (error) {
                console.error('Error updating message status', error);
            }
        };
        updateMsgStatus();

    }, []);


    useEffect(() => {
        setUserStatus(status)
    }, [])

    useEffect(() => {

        const sendTypingStatus = async (isTyping) => {
            try {
                await axios.post('/api/users/isusertyping', { isTyping });
            } catch (error) {
                console.error('Error sending typing status', error);
            }
        };
        if (userTyping === '' && isTypingSent !== false) {
            sendTypingStatus(false);
            setIsTypingSent(false);

        } else if (userTyping !== '' && isTypingSent !== true) {

            sendTypingStatus(true);

            setIsTypingSent(true)
        }

    }, [userTyping]);



    useEffect(() => {
        const fetchChatHistory = async () => {

            try {
                setHistoryLoading(true)
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
            } finally {

                setHistoryLoading(false)
            }
        };

        fetchChatHistory();
    }, [chatId]);



    useEffect(() => {
        if (!user) return;

        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
            authEndpoint: '/api/pusher/auth',
        });

        // Subscribe to the global presence channel for overall online status
        const globalPresenceChannel = pusher.subscribe('presence-online-users');
        globalPresenceChannel.bind('pusher:subscription_succeeded', (members) => {
            const onlineUsers = members.members;
            console.log("members", members);

            setOnlineUsers(onlineUsers);
        });

        globalPresenceChannel.bind('pusher:member_added', (member) => {
            setOnlineUsers((prevUsers) => ({ ...prevUsers, [member.id]: member.info }));
        });

        globalPresenceChannel.bind('pusher:member_removed', (member) => {
            setOnlineUsers((prevUsers) => {
                const updatedUsers = { ...prevUsers };
                delete updatedUsers[member.id];
                return updatedUsers;
            });
        });

        // Subscribe to the private channel to receive messages
        const msgChannel = pusher.subscribe(`private-${user._id}`);
        msgChannel.bind('newmsg', function (data) {

            const { message } = data;
            setMessages((prevMessages) => [...prevMessages, { sender: { _id: chatId }, content: message, timestamp: new Date() }]);
        });
        const statusChannel = pusher.subscribe(`private-${chatId}`);
        statusChannel.bind('userStatusUpdate', function (data) {
            setUserStatus(data.status)
            if (data.status == 'online') {
                setIsChatVisible(true)
            } else {
                setIsChatVisible(false)
            }
        })
        statusChannel.bind('isUserTyping', function (data) {

            setIsTyping(data.isTyping)
        })
        statusChannel.bind('msgstatusUpdate', function (data) {
            setMessages(data.updatedMessages)
        })

        // Cleanup function to unsubscribe from Pusher channels
        return () => {
            globalPresenceChannel.unbind_all();
            globalPresenceChannel.unsubscribe();
            statusChannel.unsubscribe();
            statusChannel.unbind_all();
            msgChannel.unbind_all();
            msgChannel.unsubscribe();
        };

    }, [chatId, user]);


    const isInChat = onlineUsers[chatId] !== undefined;
    const sendMessage = async () => {
        try {
            let response = await axios.post("/api/users/sendmessages", { message: userTyping, chatId, msgStatus: isChatVisible && isInChat ? 'read' : isChatVisible ? 'delivered' : 'sent' });
            if (response.status === 200) {
                // Add the sent message to the messages array
                setMessages((prevMessages) => [...prevMessages, { sender: { _id: user._id }, msgStatus: isChatVisible && isInChat ? 'read' : isChatVisible ? 'delivered' : 'sent', content: userTyping, timestamp: new Date() }]);

            }
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };


    return (
        <div className="flex flex-col h-full w-full bg-gray-900 text-gray-100 shadow-lg rounded-lg">
            {/* Header */}
            <div className="h-[60px] bg-gray-800 flex justify-between items-center px-4">
                <div className="flex items-center space-x-3">
                    <Image
                        src={avatar}
                        alt="dp"
                        width={40}
                        height={40}
                        className="rounded-full"
                        style={{ objectFit: 'cover' }}
                    />
                    <div className="text-lg font-semibold">{username}</div>
                    <div className={`ml-2 text-sm ${isChatVisible && onlineUsers[chatId] ? 'text-green-400' : userStatus === 'online' ? 'text-blue-400' : 'text-gray-500'}`}>
                        {isTyping && isChatVisible && onlineUsers[chatId] ? 'Typing...' : isChatVisible && onlineUsers[chatId] ? 'In chat' : userStatus}
                    </div>
                </div>
                <IoClose onClick={() => setIsChatOpen(false)} className="md:hidden cursor-pointer text-2xl text-gray-400 hover:text-white transition" />
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-800">
                {historyLoading ? (
                    <div className="flex justify-center items-center">
                        <Loader2 className="animate-spin text-blue-400" />
                    </div>
                ) : error ? (
                    <div className="text-center text-red-400">{error}</div>
                ) : (
                    messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`mb-2 flex ${msg.sender._id === user._id ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`p-3 rounded-lg shadow-lg ${msg.sender._id === user._id ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-100'}`}
                                style={{ maxWidth: '75%' }}
                            >
                                <p>{msg.content}</p>
                                <div className="flex items-center justify-end mt-1">
                                    <span className="text-xs text-gray-400 mr-2">
                                        {new Date(msg.timestamp).toLocaleTimeString()}
                                    </span>
                                    {msg.sender._id === user._id && (
                                        <span className="flex items-center">
                                         
                                            {msg.msgStatus === 'sent' && (
                                                <span className="text-slate-400">
                                                    <TiTickOutline size={16} />
                                                </span>
                                            )}
                                            {msg.msgStatus === 'delivered' && (
                                                <span className="text-slate-400">
                                                    <TiTickOutline size={16} />
                                                    <TiTickOutline size={16} />
                                                </span>
                                            )}
                                            {msg.msgStatus === 'read' && (
                                                <span className="text-green-500">
                                                    <TiTick size={16} />
                                                    <TiTick size={16} />
                                                </span>
                                            )}
                                        </span>
                                    )}


                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>


            {/* Input */}
            <div className="p-3 md:mb-24 bg-gray-800 border-t border-gray-700">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(sendMessage)} className="flex space-x-2">
                        <FormField
                            control={form.control}
                            name="chatMessage"
                            render={({ field }) => (
                                <FormItem className="flex-grow">
                                    <FormControl>
                                        <Input
                                            type="text"
                                            placeholder="Type a message..."
                                            className="w-full px-4 py-2 rounded-full bg-gray-700 border border-gray-600 focus:ring focus:ring-blue-400 text-gray-100"
                                            {...field}
                                            onChange={(e) => setUserTyping(e.target.value)}
                                            value={userTyping}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button
                            type="submit"
                            className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-2 rounded-full shadow-lg"
                        >
                            Send
                        </Button>
                    </form>
                </Form>
            </div>
        </div>
    );
}

export default ChatOpen;
