"use client"
import axios from 'axios'
import React, { useEffect,useRef, useState } from 'react'
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/context'
import { RxDotsVertical } from "react-icons/rx";
function Page() {

    const { state, dispatch } = useUser()
    const [isPopupVisible, setIsPopupVisible] = useState(false);

    const popupRef = useRef(null);
    const { data: session } = useSession()
    const _user = session?.user

    let router = useRouter()



    const handleClickOutside = (event) => {
        if (popupRef.current && !popupRef.current.contains(event.target)) {
          setIsPopupVisible(false);
        }
      };
      useEffect(() => {
        document.addEventListener('click', handleClickOutside,true);
        return () => {
          document.removeEventListener('click', handleClickOutside,true);
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

    

    return (
        <div className="h-screen w-full flex flex-col p-4 bg-gray-100">
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
                <div onClick={()=> setIsPopupVisible(!isPopupVisible)} className='absolute top-0 right-1 text-lg cursor-pointer'>
                    <RxDotsVertical />
                </div>
                {isPopupVisible && (
                    <div ref={popupRef} style={{
                        position: 'absolute',
                        top: '120%',
                        right: '0',
                        backgroundColor: 'white',
                        border: '1px solid #ccc',
                        borderRadius: '5px',
                        boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)',
                        zIndex: 1000,
                    }}>
                        <button onClick={()=>signOut()} style={{
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
        </div >

    )
}

export default Page