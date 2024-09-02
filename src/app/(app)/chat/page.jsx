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
    const [notifications, setNotifications] = useState([]);


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

                setNotifications(response.data.notifications)
                console.log(response.data.notifications);

                setNewNotificationDot(response.data.isNewNotification)



            } catch (error) {
                setSearchLoading(false);
                // Handle error
            }
        };
        findUsers();
        getMyRequests()

    }, []);

    const checkNewNotification = async (username, isDel = false, isEmpty = false) => {
        try {
            let response = await axios.post("/api/users/checknewnotification", { username, isDel, isEmpty })
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
            const { avatar, username } = data
            setNotifications((prevNotification) => [...prevNotification, { msg: "want frnd", owner: { avatar, username } }
            ]);

            setNewNotificationDot((prevDots) => [...prevDots, username]);


            checkNewNotification(username)

        });

        requestChannel.bind("declineRequest", function (data) {
            const { avatar, username } = data
            setRequestedUsername((prevRequest) =>
                prevRequest.filter((requests) => requests.username !== username)
            );
            setNotifications((prevNotification) => [...prevNotification, { msg: "declined", owner: { avatar, username } }
            ]);
            if (!notificationBox) {
                setNewNotificationDot((prevDots) => [...prevDots, username]);
            }


            checkNewNotification(username, true, false)


        });

        requestChannel.bind("msgDelRequest", function (data) {
            const { username } = data
            setNotifications((prevNotification) =>
                prevNotification.filter((notification) => notification.owner.username !== username)
            );
            if (newNotificationDot?.length > 0) {
                setNewNotificationDot((prevDots) => prevDots.filter((dot) => dot !== username));
            }
            checkNewNotification(username, true, false)


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
            setRequestedUsername((prevRequests) => [...prevRequests, {username}])

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
        <div className='w-full h-full flex flex-col relative'>
            <div className='flex w-full h-[20%] border-2 border-red-500 justify-between items-center px-2'>
                <h1>YouChat</h1>
                <div className='flex gap-2'>
                    <div className='flex items-center gap-3 h-full' ref={searchRef}>
                        <div className={`flex items-center bg-gray-100 rounded-full p-2 ${searchVisible ? 'hidden' : 'block'}`} onClick={() => setSearchVisible(true)}>
                            <CiSearch className='text-2xl text-gray-600 cursor-pointer' />
                        </div>
                        {searchVisible && (
                            <div className='absolute top-0 md:left-96 left-44 right-8 flex h-7 items-center bg-gray-100 px-4 py-2 rounded-full'>
                                <CiSearch className='text-2xl text-gray-600' />
                                <input
                                    type="text"
                                    placeholder="Search"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onFocus={() => setSuggestions(true)}
                                    className='bg-transparent outline-none ml-2 flex-grow h-full'
                                />
                            </div>
                        )}
                    </div>

                    <div onClick={() => {
                        setNewNotificationDot([]);
                        checkNewNotification(undefined, false, true)
                        setNotificationBox(true)
                    }} className='relative cursor-pointer flex justify-center items-center'>
                        {newNotificationDot?.length > 0 && (
                            <div className='absolute top-2 right-0 w-2 h-2 rounded-full bg-red-700 border-red-700 border-2'></div>
                        )}

                        <IoIosNotificationsOutline />
                    </div>

                </div>

            </div>
            <div className='w-full h-full border-2 border-green-500'>
                {/* all chats users */}
            </div>
            {suggestions && (
                <div ref={searchPopupef} className='top-8 absolute max-h-[300px] w-full gap-5 border-2 border-b-red-950 overflow-y-auto flex flex-col p-3 items-center bg-gray-100'>

                    {usernameFetchingMessage ?
                        (
                            <div>{usernameFetchingMessage}</div>
                        ) : (

                            filteredUsers.map((user, index) => (
                                <div key={index} className='w-full h-[10%] flex justify-between items-center p-2 cursor-pointer'>
                                    <div className='flex'>
                                        <div className='overflow-hidden h-10 w-10 rounded-full relative'>
                                            <Image
                                                src={user.avatar}
                                                alt="dp"
                                                fill
                                                sizes="40px" // Adjust according to your requirements
                                                style={{ objectFit: "cover" }}
                                            />
                                        </div>
                                        <h1 className='ml-2'>{user.username}</h1>
                                    </div>
                                    { requestedUsername?.some(req => req.username === user.username) ? (
                                        <div onClick={() => deleteMessageReq(user.username)}>
                                            <RiUserUnfollowFill />
                                        </div>
                                    ) : (
                                        <div onClick={() => sendMessageReq(user.username)}>
                                            <RiUserFollowLine />
                                        </div>
                                    )}

                                </div>
                            ))


                        )}



                </div>
            )
            }


            <div className={`${notificationBox ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"} bg-white transform text-gray-800 p-4 z-50 fixed  border-t border-2 w-full md:w-[67%] h-[66%] transition-all ease-[cubic-bezier(0.25, 0.8, 0.25, 1)] duration-300 flex flex-col realative`}>
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-xl font-semibold text-gray-900 truncate max-w-[80%]">
                        Notifications
                    </h1>
                    <div onClick={() => setNotificationBox(false)} className="cursor-pointer">
                        <IoClose className="text-2xl text-gray-500 hover:text-gray-700 transition" />
                    </div>
                </div>
                <div className='flex flex-col gap-1'>
                    {notifications?.length > 0 ? (
                        notifications.map((notifi, index) => (
                            <div key={index} className='flex justify-between'>
                                <div className='flex gap-2'>
                                    <div className='overflow-hidden h-10 w-10 rounded-full relative'>
                                        <Image
                                            src={notifi?.owner?.avatar}
                                            alt="dp"
                                            fill
                                            sizes="40px" // Adjust according to your requirements
                                            style={{ objectFit: "cover" }}
                                        />
                                    </div>
                                    <div>{notifi.owner?.username}</div>
                                    {notifi.msg == "declined" ? (
                                        <div><h1 className='text-red-700'>has decined your request</h1></div>
                                    ) : notifi.msg == "accept" ? (<div><h1 className='text-green-600'>has accepted your request</h1></div>) : (
                                        <div><h1 className='text-green-600'>wants your message friend</h1></div>
                                    )}
                                </div>
                                {notifi.msg == "declined" || notifi.msg == "accept" ? (
                                    <div>
                                        delete
                                    </div>
                                ) : (<div className='flex gap-2 items-center'>
                                    <div>✓</div>
                                    <div onClick={() => {
                                        setNotifications((prevNotification) =>
                                            prevNotification.filter((notification) => notification.owner.username !== notifi.owner.username)
                                        );
                                        declineRequest(notifi.owner.username)

                                    }} className='cursor-pointer '><IoCloseCircle /></div>
                                </div>)}

                            </div>
                        ))
                    ) : (
                        <div>
                            <h1>No Notification</h1>
                        </div>
                    )}
                </div>

            </div>



        </div >
    );
}

export default Page;
