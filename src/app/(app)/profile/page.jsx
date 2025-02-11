"use client"
import axios from 'axios'
import React, { useEffect, useRef, useState } from 'react'
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/context'
import { RxDotsVertical } from "react-icons/rx";
import { useDebounceCallback } from 'usehooks-ts';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { IoClose } from "react-icons/io5";
import { upload } from '@vercel/blob/client';

function Page() {

    const { state, dispatch } = useUser()
    const [isPopupVisible, setIsPopupVisible] = useState(false);
    const [usernameMessage, setUsernameMessage] = useState('');
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);
    const [fullName, setFullName] = useState("");
    const [username, setUsername] = useState("");
    const [avatar, setAvatar] = useState(null);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editProfileDialogOpen, setEditProfileDialogOpen] = useState(false);
    const [changePasswordDialogOpen, setChangePasswordDialogOpen] = useState(false);
    const [forgetPassLoading, setForgetPassLoading] = useState(false);


    const popupRef = useRef(null);
    const dialogContentRef = useRef(null);
    const { data: session } = useSession()
    const _user = session?.user

    let router = useRouter()
    const debounced = useDebounceCallback(setUsername, 300);



    const handleClickOutside = (event) => {
        if (popupRef.current && !popupRef.current.contains(event.target) && (!dialogContentRef.current || !dialogContentRef.current.contains(event.target))) {
            setIsPopupVisible(false);
        }
    };
    useEffect(() => {
        document.addEventListener('click', handleClickOutside, true);
        return () => {
            document.removeEventListener('click', handleClickOutside, true);
        };
    }, []);

    useEffect(() => {
        const fetchProfileDetails = async () => {
            try {
                let response = await axios.get("/api/users/profile")

                if (response.data.message == "No Liked Videos") {
                    dispatch({ type: "SET_LIKED_ERROR", payload: response.data.message })
                } else if (response.data.message == "No Watched Videos") {
                    dispatch({ type: "SET_WATCHHISTORY_ERROR", payload: response.data.message })
                } else {
                    dispatch({ type: "SET_UPLOADEDVIDEOS_ERROR", payload: response.data.message })
                }



                dispatch({ type: "FETCHED_PROFILE", payload: response.data.data })
            } catch (error) {

            }
        }
        fetchProfileDetails()
    }, [])


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



    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username && !avatar && !fullName && !newPassword && !currentPassword) {
            toast({
                title: 'Error',
                description: "Feild required",
            });
        } else {
            try {
                setIsSubmitting(true);
                let formData = new FormData();

                // Check if profile or password update
                if ((username || avatar || fullName) && !currentPassword && !newPassword) {
                    formData.append('username', username);
                    formData.append('fullName', fullName);
                    if (avatar) formData.append('avatar', avatar);
                    formData.append('isProf', true);
                } else if (currentPassword || newPassword) {

                    formData.append('currentPassword', currentPassword);
                    formData.append('newPassword', newPassword);
                    formData.append('isPass', true);
                }



                let response = await axios.post("/api/users/editprofile", formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });

                if (response.data.success) {
                    if (response.data.updatedUser) {
                        dispatch({
                            type: "UPDATED_PROFILE",
                            payload: {
                                username: response.data.updatedUser.username,
                                fullName: response.data.updatedUser.fullName,
                                avatar: response.data.updatedUser.avatar,
                            },
                        });
                    }
                    toast({
                        title: 'Success',
                        description: response.data.message,
                    });
                    setIsPopupVisible(false);
                } else {
                    toast({
                        title: 'Error',
                        description: response.data.message,
                    });
                }

            } catch (error) {
                console.error('Error during updating profile', error);
            } finally {
                setIsSubmitting(false);
                // Clear form fields
                setUsername("");
                setAvatar(null);  // Reset to null instead of empty string
                setFullName("");
                setCurrentPassword("");
                setNewPassword("");
            }
        }

    };

    const forgetPassword=async()=>{
        try {
          setForgetPassLoading(true)
          const response=await axios.post('api/users/forgetPassword',{credential:_user.email})
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
        <div className="h-full w-full flex flex-col p-4 bg-gray-100 md:pb-16">
            {/* Profile Header */}
            <div className="flex items-center gap-4 my-4 relative">
                <div className="w-24 h-24 rounded-full overflow-hidden flex justify-center items-center bg-gray-300">
                    <img src={state.profile.avatar} alt="avatar" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col">
                    <h1 className="text-2xl font-bold">{state.profile.fullName}</h1>
                    <div className="flex gap-2 text-gray-600">
                        <p>@{state.profile.username}</p>
                        <span className="mx-1">•</span>
                        <p>{state.profile.subscribers} Subscribers</p>
                    </div>
                </div>
                <div onClick={() => setIsPopupVisible(!isPopupVisible)} className='absolute top-0 right-1 text-lg cursor-pointer'>
                    <RxDotsVertical />
                </div>
                {isPopupVisible && (
                    <div className='flex flex-col justify-center items-center' ref={popupRef} style={{
                        position: 'absolute',
                        top: '35%',
                        right: '0',
                        backgroundColor: 'white',
                        border: '1px solid #ccc',
                        borderRadius: '5px',
                        boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)',
                        zIndex: 1000,
                    }}>
                        <Button variant="outline" onClick={() => { setIsPopupVisible(false); setEditProfileDialogOpen(true); }}>
                            Edit Profile
                        </Button>
                        <Button variant="outline" onClick={() => { setIsPopupVisible(false); setChangePasswordDialogOpen(true); }}>
                            Change Password
                        </Button>


                        <button className='flex justify-center' onClick={() => signOut()} style={{
                            padding: '10px 20px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            width: '100%',
                            textAlign: 'left',
                        }}>
                            Sign Out
                        </button>



                    </div>
                )}
                {editProfileDialogOpen && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">

                        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                            <div className="flex justify-between mb-4">
                                <h1 className="text-lg font-semibold mb-2">Edit Profile</h1>
                                <IoClose onClick={() => setEditProfileDialogOpen(false)} className="cursor-pointer text-xl" />
                            </div>
                            <p className="text-sm text-gray-600 mb-4">
                                Make changes to your profile here. Click save when you&apos;re done.
                            </p>
                            <form onSubmit={handleSubmit}>
                                <div className="mb-4">
                                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                                        Full Name
                                    </label>
                                    <input
                                        id="fullName"
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                                        Username
                                    </label>
                                    <input
                                        id="username"
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                                </div>
                                <div className="mb-4">
                                    <label htmlFor="avatar" className="block text-sm font-medium text-gray-700">
                                        Avatar
                                    </label>
                                    <input
                                        id="avatar"
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setAvatar(e.target.files[0])}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    />
                                </div>
                                <Button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700" disabled={isSubmitting || usernameMessage !== 'Username is available'}>
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Please wait
                                        </>
                                    ) : (
                                        'Update'
                                    )}
                                </Button>
                            </form>
                        </div>
                    </div>
                )}


                {/* Change Password */}
                {changePasswordDialogOpen && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                            <div className="flex justify-between mb-4">
                                <h1 className="text-lg font-semibold mb-2">Change Your Password</h1>
                                <IoClose onClick={() => setChangePasswordDialogOpen(false)} className="cursor-pointer text-xl" />
                            </div>
                            <p className="text-sm text-gray-600 mb-4">
                                Make changes to your password here. Click save when you&apos;re done.
                            </p>
                            <form onSubmit={handleSubmit}>
                                <div className="mb-4">
                                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                                        Current Password
                                    </label>
                                    <input
                                        id="currentPassword"
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                                        New Password
                                    </label>
                                    <input
                                        id="newPassword"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    />
                                </div>
                                {forgetPassLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <button className='text-blue-700' type='button' onClick={forgetPassword}>Forget Password ?</button>
                                )}


                                <Button type="submit" className="mt-2 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Please wait
                                        </>
                                    ) : (
                                        'Change'
                                    )}
                                </Button>
                            </form>
                        </div>
                    </div>
                )}




            </div>

            {/* Uploaded Videos Section */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold">Your Uploaded Videos</h2>
                        <p className="text-gray-600">{state.profile.uploadedVideos?.length}</p>
                    </div>
                    <button onClick={() => router.push('/uploaded-videos')} className="text-blue-600 hover:underline">View All</button>
                </div>
                <div className="flex gap-4 overflow-x-auto">
                    {state.profile.uploadedVideos?.slice(0, 2).map((video, index) => (
                        <div key={index} className="w-48 h-28 rounded-lg overflow-hidden bg-gray-300">
                            <img src={video.thumbnail} alt="thumbnail" className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Liked Videos Section */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold">Liked Videos</h2>
                        <p className="text-gray-600">{state.profile.liked?.length}</p>
                    </div>
                    <button onClick={() => router.push('/liked-videos')} className="text-blue-600 hover:underline">View All</button>
                </div>
                <div className="flex gap-4 overflow-x-auto">
                    {state.profile.liked?.slice(0, 2).map((video, index) => (
                        <div key={index} className="w-48 h-28 rounded-lg overflow-hidden bg-gray-300">
                            <img src={video.thumbnail} alt="thumbnail" className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Watched Videos Section */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold">Watch History</h2>
                        <p className="text-gray-600">{state.profile.watchHistory?.length}</p>
                    </div>
                    <button onClick={() => router.push('/watch-history')} className="text-blue-600 hover:underline">View All</button>
                </div>
                <div className="flex gap-4 overflow-x-auto">
                    {state.profile.watchHistory?.slice(0, 2).map((video, index) => (
                        <div key={index} className="w-48 h-28 rounded-lg overflow-hidden bg-gray-300">
                            <img src={video.thumbnail} alt="thumbnail" className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>
            </div>


            {/* Watch Later Videos Section */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold">Watch Later</h2>
                        <p className="text-gray-600">{state.profile.watchLater?.length}</p>
                    </div>
                    <button onClick={() => router.push('/watch-later')} className="text-blue-600 hover:underline">View All</button>
                </div>
                <div className="flex gap-4 overflow-x-auto">
                    {state.profile.watchLater?.slice(0, 2).map((video, index) => (
                        <div key={index} className="w-48 h-28 rounded-lg overflow-hidden bg-gray-300">
                            <img src={video.thumbnail} alt="thumbnail" className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>
            </div>
        </div >

    )
}

export default Page
