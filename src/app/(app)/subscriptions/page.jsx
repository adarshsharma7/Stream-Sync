"use client"
import axios from 'axios'
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'

function Page() {
    const [subscriptionsUser, setSubscriptionsUser] = useState([]);
    const [subscriptionsVideos, setSubscriptionsVideos] = useState([]);
    const [videosFetchingMessage, setVideosFetchingMessage] = useState("");


    let router = useRouter()


    // Function to shuffle the array
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    useEffect(() => {
        const fetchSubscriptions = async () => {
            try {
                let response = await axios.get("/api/videos/subscriptionsallvideos");
                if (response.data && response.data.data) {
                    setSubscriptionsUser(response.data.data);
                    console.log(response.data.data);


                    let videos = [];
                    response.data.data.map((user) => user.subscriptions.map((user) => user.uploadedVideos.map((user) => videos.push(user))))

                    setSubscriptionsVideos(shuffleArray(videos));
                } else {
                    setVideosFetchingMessage("No data found");
                }
            } catch (error) {
                console.error("Error fetching subscriptions videos:", error);
                setVideosFetchingMessage("Failed to load videos");
            }
        }

        fetchSubscriptions();

    }, []);

    return (
        <div className='h-screen w-full flex flex-col p-4 bg-gray-100'>
            {/* Top Section: Subscribed Users */}
            <div  className='flex gap-6 w-full h-[120px] overflow-x-auto border-b-2 border-gray-300 pb-4'>
                {subscriptionsUser.map((user) => user.subscriptions.map((user, index) => (
                    <div onClick={()=>router.push(`/subscriptionprofile/${user.username}`)} key={index} className='flex flex-col items-center'>
                        <div className='w-12 h-12 rounded-full border-2 border-red-600 overflow-hidden flex justify-center items-center'>
                            <img src={user.avatar} alt="" className="w-full h-full object-cover"/>
                        </div>
                        <div className='text-center text-sm mt-1'>
                            <p className='text-gray-700 text-ellipsis overflow-hidden whitespace-nowrap'>{user.username}</p>
                        </div>
                    </div>
                )))}
            </div>
    
            {/* Bottom Section: Videos from Subscriptions */}
            <div className='flex flex-col gap-4 mt-4 h-full overflow-y-scroll'>
                <h1 className='text-xl font-semibold text-gray-800 mb-4'>All Videos from your Subscriptions</h1>
    
                {videosFetchingMessage ? (
                    <div className="w-full h-full text-red-700 flex justify-center items-center">
                        <h1>{videosFetchingMessage}</h1>
                    </div>
                ) : subscriptionsVideos.map((video, index) => (
                    <div 
                        key={index} 
                        onClick={() => router.push(`/videoplay/${video._id}`)} 
                        className='cursor-pointer h-[260px] bg-white shadow-lg border border-gray-300 rounded-lg flex flex-col gap-2 p-2 hover:shadow-xl transition-shadow duration-200'
                    >
                        <div className='thumbnailBox rounded-2xl w-full overflow-hidden h-[75%]'>
                            <img src={video.thumbnail} alt="thumbnail" className='w-full h-full object-cover' />
                        </div>
                        <div className='userDetailsBox flex gap-2 items-center'>
                            <div className='w-8 h-8 rounded-full overflow-hidden'>
                                <img src={video.owner[0].avatar} alt="dp" className='w-full h-full object-cover'/>
                            </div>
                            <div className='text-gray-900 font-semibold'>{video.title}</div>
                        </div>
                        <div className='text-gray-500 text-sm'>
                            <p>{video.owner[0].username}</p>
                        </div>
                        <div className='flex gap-4 text-gray-500 text-xs'>
                            <div>{video.views} views</div>
                            <div>{formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
    
}

export default Page;
