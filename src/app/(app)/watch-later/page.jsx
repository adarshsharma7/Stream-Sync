"use client"

import { formatDistanceToNow } from 'date-fns'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/context/context'
import { Button } from '@/components/ui/button'
import { MdOutlineDeleteOutline } from "react-icons/md";
import axios from 'axios'



function Page() {
const [videos, setVideos] = useState(null)
  const { state } = useUser()

  const router = useRouter()

useEffect(() => {
 setVideos(state.profile.watchLater)
}, [])



  const deletevideo = async (videoId) => {
    try {
      let response = await axios.post("/api/videos/addordeletevideotowatchlater", { videoId })
      // dispatch({ type: "UPDATE_WATCH_HISTORY", payload: response.data.data })
    let updatedWatchLater= videos.filter((video) => video._id !== videoId)
    setVideos(updatedWatchLater)
      dispatch({ type: "UPDATE_WATCHLATER_VIDEOS", payload: updatedWatchLater })

    } catch (error) {
      console.error("Error deleting video from watch Later:", error);
    }
  }


  return (
    <div className='w-full min-h-screen bg-gray-100'>
      {/* Header Section */}
      <div className='p-4 bg-white shadow-md flex '>
        <h1 className='text-2xl font-semibold text-gray-800'>Your Watch Later Videos</h1>
       
      </div>


      {/* Videos List */}
      <div className='p-4'>
        {state.watchLaterError || videos?.length==0 || !videos? (
          <div className="text-center text-red-700 flex justify-center items-center">
            <h1>No Watch Later Video</h1>
          </div>
        ) : (
          <div className='flex flex-col gap-4'>
           
            {Array.isArray(videos) && videos?.map((video, index) => (
              <div
                key={index}
                onClick={() => router.push(`/videoplay/${video._id}`)}
                className='cursor-pointer flex items-start border border-gray-300 bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-200'
              >
                <div className='w-40 h-24 overflow-hidden'>
                  <img src={video.thumbnail} alt="Thumbnail" className='w-full h-full object-cover' />
                </div>
                <div className='p-3 flex flex-col justify-between w-full'>
                  <h3 className='text-lg font-medium text-gray-800'>{video.title}</h3>
                  <div className='flex items-center text-sm text-gray-500 mt-1'>
                    <div className='flex items-center'>
                      <img src={video.owner[0].avatar} alt="User Avatar" className='w-6 h-6 rounded-full mr-2' />
                      <span>{video.owner[0].username}</span>
                    </div>
                  </div>
                  <div className='flex justify-between text-xs text-gray-500 mt-2'>
                    <span>{video.views} views</span>
                    {video.createdAt && (
                      <span>watched {formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}</span>
                    )}
                  </div>
                </div>
                <div onClick={(e) => {
                    e.stopPropagation();
                  deletevideo(video._id)
                }
                } className='z-50 mr-4 mt-4'>
                  <MdOutlineDeleteOutline />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Page
