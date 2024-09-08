"use client";
import axios from 'axios';
import Fuse from 'fuse.js';
import { Loader2 } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { CiSearch } from "react-icons/ci";
import Image from 'next/image'; // Ensure you have 'next/image' imported
import { RiUserFollowLine, RiUserUnfollowFill } from "react-icons/ri";
import { IoIosNotificationsOutline } from "react-icons/io";
import Pusher from 'pusher-js';
import { useSession } from 'next-auth/react';
import { IoClose, IoCloseCircle } from "react-icons/io5";
import { FaUserShield } from "react-icons/fa";
import { MdOutlineDeleteSweep } from "react-icons/md";
import ChatOpen from '@/components/chatOpen'
import { GoIssueClosed } from "react-icons/go";


function Page() {
    const [searchVisible, setSearchVisible] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [heading, setHeading] = useState("");
    const [usernameFetchingMessage, setUsernameFetchingMessage] = useState("");
    const [suggestions, setSuggestions] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [requestedUsername, setRequestedUsername] = useState([]);
    const [notificationBox, setNotificationBox] = useState(false);
    const [newNotificationDot, setNewNotificationDot] = useState([]);
    const [newMsgNotificationDot, setNewMsgNotificationDot] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [chats, setChats] = useState([]);
    const [chatFrndIds, setChatFrndIds] = useState([]);
    const [chatOpen, setChatOpen] = useState({});
    const [isChatOpen, setIsChatOpen] = useState(false);


    const searchRef = useRef(null);
    const searchPopupef = useRef(null);

    const { data: session } = useSession();
    const user = session?.user;



    const handleClickOutside = (event) => {
        if (searchRef.current && !searchRef.current.contains(event.target) && searchPopupef.current && !searchPopupef.current.contains(event.target)) {
            setSuggestions(false);
            setSearchVisible(false);
        }
    };

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {


                axios.post('/api/users/set-status', { status: 'online' });
            } else {
                setIsChatOpen(false)

                axios.post('/api/users/set-status', { status: 'offline' });
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Mark the user as online when the component mounts

        axios.post('/api/users/set-status', { status: 'online' });

        // Clean up the event listener and mark the user as offline when the component unmounts
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            setIsChatOpen(false)
            axios.post('/api/users/set-status', { status: 'offline' });
        };
    }, []);



    useEffect(() => {
        const findUsers = async () => {
            try {
                setSearchLoading(true);
                let response = await axios.get("/api/users/getusers");
                setUsers(response.data.data); // Ensure the API returns data in the expected format
                setFilteredUsers(response.data.data);
                setSearchLoading(false);
            } catch (error) {
                setSearchLoading(false);
                // Handle error
            }
        };
        const getMyRequests = async () => {
            try {
                setSearchLoading(true);
                let response = await axios.get("/api/users/getmyrequest");
                setRequestedUsername(response.data.data)
                setChatFrndIds(response.data.frndId)
                setNewMsgNotificationDot(response.data.isNewMsgNotification)
                setNotifications(response.data.notifications)


                setNewNotificationDot(response.data.isNewNotification)



            } catch (error) {
                setSearchLoading(false);
                // Handle error
            }
        };
        const getAllChats = async () => {
            try {
                let response = await axios.get("/api/users/getallchats")
                setChats(response.data.data)
            } catch (error) {
                console.log(error);

            }

        }
        findUsers();
        getMyRequests()
        getAllChats()

    }, []);

    const checkNewNotification = async (username, isDel = false, isEmpty = false, isNotificationBoxClose = false) => {
        try {
            let response = await axios.post("/api/users/checknewnotification", { username, isDel, isEmpty, isNotificationBoxClose })
        } catch (error) {
            console.log("kuch galt hua ", error);

        }
    }



    useEffect(() => {
        if (!user) return;  // Don't proceed until the user is defined


        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
            authEndpoint: '/api/pusher/auth',
        });
        const requestChannel = pusher.subscribe(`private-${user._id}`);

        requestChannel.bind("msgRequest", function (data) {
            const { Id, ownerId, avatar, username, isDot } = data
            setNotifications((prevNotification) => [...prevNotification, { _id: Id, msg: "want frnd", owner: { _id: ownerId, avatar, username } }
            ]);



            if (isDot) {
                setNewNotificationDot((prevDots) => [...prevDots, username]);
                checkNewNotification(username)
            } else {
                checkNewNotification(undefined, false, true)
            }

        });

        requestChannel.bind("declineRequest", function (data) {
            const { Id, avatar, username, isDot } = data
            setRequestedUsername((prevRequest) =>
                prevRequest.filter((requests) => requests.username !== username)
            );
            setNotifications((prevNotification) => [...prevNotification, { _id: Id, msg: "declined", owner: { avatar, username } }
            ]);
            if (isDot) {
                setNewNotificationDot((prevDots) => [...prevDots, username]);
                checkNewNotification(username, true, false)
            } else {
                checkNewNotification(undefined, false, true)
            }







        });

        requestChannel.bind("msgDelRequest", function (data) {
            const { Id, username, isDot } = data
            setNotifications((prevNotification) =>
                prevNotification.filter((notification) => notification._id !== Id)
            );
            // if (newNotificationDot?.length > 0) {}

            if (isDot) {
                setNewNotificationDot((prevDots) => prevDots.filter((dot) => dot !== username));
                checkNewNotification(username, true, false)
            } else {
                checkNewNotification(undefined, false, true)
            }


        });

        requestChannel.bind("acceptRequest", function (data) {
            const { notificationId, Id, username, avatar, status, isDot } = data
            setNotifications((prevNotification) => [...prevNotification, { _id: notificationId, msg: "accept", owner: { _id: Id, avatar, username } }
            ]);
            setChats((prev) => [...prev, { _id: Id, status, avatar, username }])
            let updatedRequestedUsername = requestedUsername.filter((obj) => obj.username !== username)
            setRequestedUsername(updatedRequestedUsername)

            if (isDot) {
                setNewNotificationDot((prevDots) => [...prevDots, username]);
                checkNewNotification(username, undefined, false)
            } else {
                checkNewNotification(undefined, false, true)
            }


        });


        requestChannel.bind("newMsgNotificationDot", function (data) {


            setNewMsgNotificationDot((prev) => {
                const existingNotification = prev.find(noti => noti.Id === data.Id);

                if (existingNotification) {
                    // If notification for this sender already exists, update the count
                    return prev.map(noti =>
                        noti.Id === data.Id ? { ...noti, count: noti.count + 1 } : noti
                    );
                } else {
                    // Otherwise, add a new notification object
                    return [...prev, { Id: data.Id, count: 1 }];
                }
            });


        });

        requestChannel.bind("removeFrnd", function (data) {
            const { notificationId, username, avatar, Id, isDot } = data
            setNotifications((prevNotification) => [...prevNotification, { _id: notificationId, msg: "remove", owner: { avatar, username } }
            ]);
            let updatedChats = chats.filter((obj) => obj._id !== Id)
            setChats(updatedChats)
            let updatedFrndIds = chatFrndIds.filter((val) => val !== Id)
            setChatFrndIds(updatedFrndIds)
            setIsChatOpen(false)


            if (isDot) {
                setNewNotificationDot((prevDots) => [...prevDots, username]);
                checkNewNotification(username, undefined, false)
            } else {
                checkNewNotification(undefined, false, true)
            }

        });

        return () => {
            requestChannel.unbind_all();
            requestChannel.unsubscribe();
        };
    }, [user]);

    useEffect(() => {
        document.addEventListener('click', handleClickOutside, true);
        return () => {
            document.removeEventListener('click', handleClickOutside, true);
        };
    }, []);


    const sendMessageReq = async (username) => {
        try {
            setSearchLoading(true)
            setRequestedUsername((prevRequests) => [...prevRequests, { username }])

            let response = await axios.post("/api/users/sendmsgreq", { username })

        } catch (error) {

        }
    }
    const deleteMessageReq = async (username) => {
        try {
            setSearchLoading(true)
            setRequestedUsername((prevRequests) => prevRequests.filter((user) => user.username !== username));


            let response = await axios.post("/api/users/deletemsgreq", { username })

        } catch (error) {

        }
    }
    const declineRequest = async (username) => {
        try {
            let response = await axios.post("/api/users/declinerequest", { username })
        } catch (error) {

        }
    }
    const acceptRequest = async (username, notificationId) => {
        try {
            let response = await axios.post("/api/users/acceptrequest", { username, currNotificationId: notificationId })

            setNotifications((prevNotification) => [...prevNotification, response.data.notificationForMe
            ]);
            setNewNotificationDot((prevDots) => [...prevDots, response.data.notificationForMe.owner.username]);
            checkNewNotification(response.data.notificationForMe.owner.username, undefined, false)

            setChatFrndIds((prev) => [...prev, response.data.chatfrndid])

            setChats((prev) => [...prev, response.data.data])
        } catch (error) {

        }
    }
    const deleteNotification = async (Id) => {
        try {
            setNotifications((prevNotification) =>
                prevNotification.filter((notification) => notification._id !== Id)
            );
            let response = await axios.post("/api/users/deletenotification", { Id })

        } catch (error) {

        }
    }
    const isMyChatOpen = async (Id) => {
        try {
            let response = await axios.post("/api/users/mychatopen", { chatId: Id })
            setNewMsgNotificationDot(response.data.isNewMsgNotification)
        } catch (error) {

        }
    }

    useEffect(() => {
        // Initialize Fuse after users have been set
        const fuse = new Fuse(users, {
            keys: ['username'], // Adjust according to the actual structure of your user data
            includeScore: true,
            threshold: 0.3, // Adjust the threshold for sensitivity (0.0 to 1.0)
        });

        const handleSearch = (term) => {
            setSearchTerm(term);
            setUsernameFetchingMessage("")
            setHeading(`Search for: ${term}`);

            if (term.trim() === "") {
                setFilteredUsers(users);

                setHeading("");
            } else {
                // Perform fuzzy search
                const results = fuse.search(term);
                const filteredResults = results.map(result => result.item);

                if (filteredResults.length === 0) {
                    setUsernameFetchingMessage("No user found");
                } else {
                    setFilteredUsers(filteredResults);
                }
            }
        };

        // Use handleSearch here if needed
        handleSearch(searchTerm);
    }, [users, searchTerm]);

    return (
        <div className='w-full h-screen flex flex-col relative border-2 border-b-rose-900 overflow-y-hidden'>
            <div className='flex w-full h-[8%] border-2 border-red-500 justify-between items-center px-2'>
                <h1 className='text-xl font-semibold'>YouChat</h1>
                <div className='flex gap-2 items-center'>
                    <div className='flex items-center gap-3 h-full' ref={searchRef}>
                        <div
                            className={`flex items-center bg-gray-100 rounded-full p-2 ${searchVisible ? 'hidden' : 'block'}`}
                            onClick={() => setSearchVisible(true)}
                        >
                            <CiSearch className='text-2xl text-gray-600 cursor-pointer' />
                        </div>
                        {searchVisible && (
                            <div className='absolute top-0 md:left-96 left-44 right-8 flex h-10 items-center bg-gray-100 px-4 py-2 rounded-full shadow-md'>
                                <CiSearch className='text-2xl text-gray-600' />
                                <input
                                    type="text"
                                    placeholder="Search"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onFocus={() => setSuggestions(true)}
                                    className='bg-transparent outline-none ml-2 flex-grow h-full'
                                />
                                <IoClose
                                    className='text-2xl text-gray-600 cursor-pointer ml-2'
                                    onClick={() => setSearchVisible(false)}
                                />
                            </div>
                        )}
                    </div>
                    <div
                        onClick={() => {
                            setNewNotificationDot([]);
                            checkNewNotification(undefined, false, true);
                            setNotificationBox(true);
                        }}
                        className='relative cursor-pointer flex justify-center items-center'
                    >
                        {newNotificationDot.length > 0 && (
                            <div className='absolute top-0 right-0 w-2 h-2 rounded-full bg-red-700 border-2 border-red-700'></div>
                        )}
                        <IoIosNotificationsOutline className='text-2xl text-gray-600' />
                    </div>
                </div>
            </div>

            <div className='w-full h-full md:flex border border-gray-300'>
                {/* Chat List */}
                <div className='md:w-1/3 h-full border-r border-gray-300 bg-gray-50 flex flex-col gap-2 overflow-y-auto p-4'>
                    {chats?.length > 0 ? chats.map((chat, index) => (
                        <div
                            onClick={() => {
                                setIsChatOpen(true);
                                isMyChatOpen(chat._id);
                                setChatOpen({ avatar: chat.avatar, username: chat.username, _id: chat._id, status: chat.status });
                            }}
                            key={index}
                            className={`flex items-center p-3 mb-2 rounded-lg cursor-pointer transition-colors duration-200
                    ${chatOpen._id === chat._id ? "bg-blue-200 border-blue-400" : "bg-white border-gray-200 hover:bg-gray-100"} 
                    border`}
                        >
                            <div className='flex items-center gap-3'>
                                <div className='h-12 w-12 rounded-full overflow-hidden relative'>
                                    <Image
                                        src={chat.avatar}
                                        alt="dp"
                                        fill
                                        sizes="48px"
                                        style={{ objectFit: "cover" }}
                                    />
                                </div>
                                <div className='text-gray-800 font-medium'>
                                    <h1>{chat.username}</h1>
                                </div>
                            </div>
                            {newMsgNotificationDot.length > 0 &&
                                newMsgNotificationDot.map((noti, index) => (
                                    noti.Id === chat._id && (
                                        <div key={index} className=' w-6 h-6 rounded-full bg-green-600 flex items-center justify-center ml-auto'>
                                            <p className='text-xs text-white'>{noti.count}</p>
                                        </div>
                                    )
                                ))
                            }
                        </div>
                    )) : (
                        <div className='flex justify-center items-center h-full text-gray-600'>
                            No Chats
                        </div>
                    )}
                </div>

                {/* Chat Open View */}
                {isChatOpen && (
                    <div className='md:w-2/3 h-full fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 md:hidden'>
                        <ChatOpen
                            avatar={chatOpen.avatar}
                            username={chatOpen.username}
                            chatId={chatOpen._id}
                            status={chatOpen.status}
                            setIsChatOpen={setIsChatOpen}
                            setChats={setChats}
                            setChatFrndIds={setChatFrndIds}
                        />
                    </div>
                )}

                <div className='w-2/3 h-full hidden md:block border-l border-gray-300'>
                    {isChatOpen && (
                        <ChatOpen
                            avatar={chatOpen.avatar}
                            username={chatOpen.username}
                            chatId={chatOpen._id}
                            status={chatOpen.status}
                            setChats={setChats}
                            setIsChatOpen={setIsChatOpen}
                            setChatFrndIds={setChatFrndIds}
                        />
                    )}
                </div>
            </div>


            {suggestions && (
                <div ref={searchPopupef} className='absolute top-14 w-full max-h-[300px] border border-gray-300 rounded-lg bg-white shadow-lg overflow-y-auto p-3'>
                    {usernameFetchingMessage ? (
                        <div className='text-center text-gray-600'>{usernameFetchingMessage}</div>
                    ) : (
                        filteredUsers.length > 0 ? (
                            filteredUsers.map((user, index) => (
                                <div key={index} className='flex items-center justify-between p-3 hover:bg-gray-100 rounded-lg cursor-pointer transition-all duration-200'>
                                    <div className='flex items-center'>
                                        <div className='h-12 w-12 rounded-full overflow-hidden relative'>
                                            <Image
                                                src={user.avatar}
                                                alt="dp"
                                                fill
                                                sizes="48px"
                                                style={{ objectFit: "cover" }}
                                            />
                                        </div>
                                        <h1 className='ml-3 text-gray-800 font-medium'>{user.username}</h1>
                                    </div>
                                    {chatFrndIds.includes(user._id) ? (
                                        <div className='text-green-600'>
                                            <FaUserShield />
                                        </div>
                                    ) : requestedUsername?.some(req => req.username === user.username) ? (
                                        <div onClick={() => deleteMessageReq(user.username)} className='text-red-600'>
                                            <RiUserUnfollowFill />
                                        </div>
                                    ) : (
                                        <div onClick={() => sendMessageReq(user.username)} className='text-blue-600'>
                                            <RiUserFollowLine />
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className='text-center text-gray-600'>No users found</div>
                        )
                    )}
                </div>
            )}



            <div className={`${notificationBox ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"} bg-white transform shadow-lg text-gray-800 p-4 z-50 fixed border-t border-gray-200 w-full md:w-[67%] h-full transition-all ease-in-out duration-300 flex flex-col  rounded-t-2xl`}>
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-xl font-semibold text-gray-900 truncate max-w-[80%]">
                        Notifications
                    </h1>
                    <div onClick={() => {
                        checkNewNotification(undefined, false, false, true);
                        setNotificationBox(false)
                    }} className="cursor-pointer">
                        <IoClose className="text-2xl text-gray-500 hover:text-gray-700 transition" />
                    </div>
                </div>

                <div className="flex flex-col gap-4 overflow-y-auto">
                    {notifications?.length > 0 ? (
                        notifications.map((notifi, index) => (
                            <div key={index} className="flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition rounded-lg p-3 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="overflow-hidden h-10 w-10 rounded-full relative">
                                        <Image
                                            src={notifi?.owner?.avatar}
                                            alt="dp"
                                            fill
                                            sizes="40px"
                                            style={{ objectFit: "cover" }}
                                        />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{notifi.owner?.username}</p>
                                        {notifi.msg === "declined" ? (
                                            <p className="text-sm text-red-500">has declined your request</p>
                                        ) : notifi.msg === "accept" ? (
                                            <p className="text-sm text-green-500">has accepted your request</p>
                                        ) : notifi.msg === "remove" ? (
                                            <p className="text-sm text-red-500">has removed you from Friend List</p>
                                        ) : notifi.msg === "urnowfrnd" ? (
                                            <p className="text-sm text-gray-700">You Are Now Chat Friends</p>
                                        ) : (
                                            <p className="text-sm text-gray-700">wants to be your message friend</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {notifi.msg !== "declined" && notifi.msg !== "accept" && notifi.msg !== "remove" && notifi.msg !== "urnowfrnd" && !chatFrndIds.includes(notifi.owner._id) ? (
                                        <div className="flex gap-2 items-center">
                                            <button className="text-green-500" onClick={() => {
                                                setNotifications((prevNotification) =>
                                                    prevNotification.filter((notification) => notification._id !== notifi._id)
                                                );
                                                acceptRequest(notifi.owner.username, notifi._id)
                                            }}>
                                                ✓
                                            </button>
                                            <button className="text-red-500" onClick={(e) => {
                                                e.preventDefault();
                                                setNotifications((prevNotification) =>
                                                    prevNotification.filter((notification) => notification._id !== notifi._id)
                                                );
                                                declineRequest(notifi.owner.username);
                                            }}>
                                                <IoCloseCircle />
                                            </button>
                                        </div>
                                    ) : chatFrndIds.includes(notifi.owner._id) && notifi.msg == "urnowfrnd" && (
                                        <FaUserShield className="text-gray-500" />
                                    )}
                                    <MdOutlineDeleteSweep className="cursor-pointer text-gray-400 hover:text-gray-600 transition" onClick={() => deleteNotification(notifi._id)} />
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex justify-center items-center h-full">
                            <h1 className="text-gray-500">No Notifications</h1>
                        </div>
                    )}
                </div>
            </div>



        </div >
    );
}

export default Page;
