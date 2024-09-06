import React, { useState, useEffect, useRef } from 'react';
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
import { RxDotsVertical } from "react-icons/rx";
import { useDebounceCallback } from 'usehooks-ts';


function ChatOpen({ avatar, username, chatId, status, setIsChatOpen, setChats }) {



    const [messages, setMessages] = useState([]);
    const [error, setError] = useState(null);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [onlineUsers, setOnlineUsers] = useState({});
    const [userStatus, setUserStatus] = useState('');
    const [isChatVisible, setIsChatVisible] = useState(true);
    const [userTyping, setUserTyping] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isTypingSent, setIsTypingSent] = useState(null);
    const [removeFrndPopup, setRemoveFrndPopup] = useState(false);
    const [updateMsgPopup, setUpdateMsgPopup] = useState(false);
    const [uniqueIndexforUpdateMsgPopup, setUniqueIndexforUpdateMsgPopup] = useState('');
    const [isMsgEditableId, setIsMsgEditableId] = useState(null);



    // let debounceTyping=useDebounceCallback(setUserTyping,2000)

    const { data: session } = useSession();
    const user = session?.user;

    const form = useForm({
        resolver: zodResolver(chatMessageSchema),
        defaultValues: {
            chatMessage: ""
        }
    });

    const removeFrndPopupRef = useRef(null)
    const chatContainerRef = useRef(null);
    const updateMsgref = useRef(null);

    // Scroll to the bottom when the chat opens or when new messages are added
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);


    const handleClickOutside = (event) => {
        if (
            (removeFrndPopupRef.current && !removeFrndPopupRef.current.contains(event.target)) || (updateMsgref.current && !updateMsgref.current.contains(event.target))
        ) {
            setUpdateMsgPopup(false)
            setRemoveFrndPopup(false);
        }
    };
    useEffect(() => {
        document.addEventListener('click', handleClickOutside, true);
        return () => {
            document.removeEventListener('click', handleClickOutside, true);
        };
    }, []);


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
        statusChannel.bind('messagesUpdate', function (data) {
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
    const sendMessage = async (data) => {
        try {

            // Add the sent message to the messages array

            let response = await axios.post("/api/users/sendmessages", { message: data.chatMessage, chatId, msgStatus: isChatVisible && isInChat ? 'read' : isChatVisible ? 'delivered' : 'sent' });
            setMessages((prevMessages) => [...prevMessages, { sender: { _id: user._id }, _id: response.data.msgId, msgStatus: isChatVisible && isInChat ? 'read' : isChatVisible ? 'delivered' : 'sent', content: userTyping, timestamp: new Date() }]);
            setUserTyping('')





        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const removeFrnd = async () => {
        try {
            let response = await axios.post("/api/users/deletefrnd", { chatId })
            setChats(response.data.data)
            setIsChatOpen(false)

        } catch (error) {
            console.log("kuch galt hua remove friend karte time", error);

        }
    }

    const deleteMsgForBoth = async (msgId) => {
        let response = await axios.post("/api/users/deletemsg", { chatId, msgId })
        setUpdateMsgPopup(false)
        setMessages(response.data.updatedMessages)
    }
    const editMsg = async () => {
        let response = await axios.post("/api/users/editmsg", { chatId, msgId: isMsgEditableId, msgContent: userTyping })
        setMessages(response.data.updatedMessages)
        setIsMsgEditableId(null)
        setUserTyping('')
    }

    return (
        <div className="flex flex-col h-full w-full bg-gray-900 text-gray-100 shadow-lg rounded-lg">
            {/* Header */}
            <div className="h-[60px] bg-gray-800 flex justify-between items-center px-4 relative">
                <div className="flex items-center space-x-3">
                    <Image
                        src={avatar}
                        alt="dp"
                        width={30}
                        height={30}
                        className="rounded-full"
                        style={{ objectFit: 'cover' }}
                    />
                    <div className="text-lg font-semibold">{username}</div>
                    <div className={`ml-2 text-sm ${isChatVisible && onlineUsers[chatId] ? 'text-green-400' : userStatus === 'online' ? 'text-blue-400' : 'text-gray-500'}`}>
                        {isTyping && isChatVisible && onlineUsers[chatId] ? 'Typing...' : isChatVisible && onlineUsers[chatId] ? 'In chat' : userStatus}
                    </div>
                </div>
                <div>
                    <IoClose onClick={() => setIsChatOpen(false)} className="md:hidden cursor-pointer text-2xl text-gray-400 hover:text-white transition" />
                    <div className='cursor-pointer' onClick={() => setRemoveFrndPopup(!removeFrndPopup)}><RxDotsVertical /></div>
                </div>
                {removeFrndPopup && (
                    <div className='flex flex-col justify-center items-center text-black' ref={removeFrndPopupRef} style={{
                        position: 'absolute',
                        top: '70%',
                        right: '2%',
                        backgroundColor: 'white',
                        border: '1px solid #ccc',
                        borderRadius: '5px',
                        boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)',
                        zIndex: 1000,
                    }}>
                        <Button variant="outline" onClick={() => removeFrnd()}>
                            Remove Friend
                        </Button>

                    </div>
                )}

            </div>

            {/* Messages */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 bg-gray-800">
                {historyLoading ? (
                    <div className="flex justify-center items-center">
                        <Loader2 className="animate-spin text-blue-400" />
                    </div>
                ) : error ? (
                    <div className="text-center text-red-400">{error}</div>
                ) : (
                    messages.map((msg, index) => (
                        <div className={`flex flex-col mb-2`}>
                            <div
                                key={index}
                                className={` flex ${msg.sender._id === user._id ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`relative p-3 rounded-lg shadow-lg ${msg.sender._id === user._id ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-100'}`}
                                    style={{ maxWidth: '75%' }}
                                >
                                    {msg.sender._id === user._id && (
                                        <div className='cursor-pointer absolute right-0' onClick={() => {
                                            setUniqueIndexforUpdateMsgPopup(index)
                                            setUpdateMsgPopup(!updateMsgPopup)
                                        }
                                        }><RxDotsVertical /></div>
                                    )
                                    }
                                    {updateMsgPopup && index == uniqueIndexforUpdateMsgPopup && (
                                        <div className='flex flex-col justify-center items-center text-black' ref={updateMsgref} style={{
                                            position: 'absolute',
                                            top: '25%',
                                            right: '2%',
                                            backgroundColor: 'white',
                                            border: '1px solid #ccc',
                                            borderRadius: '5px',
                                            boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)',
                                            zIndex: 1000,
                                        }}>
                                            {/* <Button variant="outline" onClick={() => deleteMsgForMe()}>
                                                Delete for you
                                            </Button> */}
                                            <Button variant="outline" onClick={() => {
                                                setUpdateMsgPopup(false)
                                                setUserTyping(msg.content)
                                                setIsMsgEditableId(msg._id)
                                            }}>
                                                Edit Message
                                            </Button>

                                            <Button variant="outline" onClick={() => deleteMsgForBoth(msg._id)}>
                                                Delete for both
                                            </Button>

                                        </div>
                                    )}



                                    <p className='break-words text-base mr-3'>{msg.content}</p>



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
                            <div hidden={!msg.edited}>
                                <p className={`text-slate-500 text-sm ${msg.sender._id === user._id ? 'float-right' : ''}`}>edited</p>
                            </div>
                        </div>


                    ))
                )}

            </div>


            {/* Input */}
            <div className="p-3 md:mb-24 bg-gray-800 border-t border-gray-700">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(async (data) => {

                        if (isMsgEditableId) {
                            await editMsg();
                        } else {
                            await sendMessage(data);
                        }
                        form.reset();//Reset the full Form input field after submitting
                        // form.setValue("comment", ""); // Reset the indivisual input field after submitting
                    })} className="flex space-x-2">
                        <FormField
                            control={form.control}
                            name="chatMessage"
                            render={({ field }) => (
                                <FormItem className="flex-grow">
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                type="text"
                                                placeholder="Type a message..."
                                                className="w-full px-4 py-2 rounded-full bg-gray-700 border border-gray-600 focus:ring focus:ring-blue-400 text-gray-100"
                                                {...field}
                                                onChange={(e) => {
                                                    field.onChange(e);
                                                    setUserTyping(e.target.value)
                                                }}
                                                value={userTyping}
                                            />
                                            {isMsgEditableId && (
                                                <p onClick={() => {
                                                    setIsMsgEditableId(null)
                                                    setUserTyping('')
                                                    field.onChange('');
                                                }} className="cursor-pointer absolute right-2 top-1/2 transform -translate-y-1/2 bg-red-500 text-white px-2 py-1 rounded">
                                                    <IoClose />
                                                </p>
                                            )}
                                        </div>
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
