"use client"

import { formatDistanceToNow } from 'date-fns'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/context/context'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MdOutlineDeleteOutline } from "react-icons/md";
import axios from 'axios'
import { useDebounceCallback } from '@react-hook/debounce'


function Page() {
  const [videos, setVideos] = useState(null)
  const { state } = useUser()

  const [isHistoryOn, setIsHistoryOn] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()

  const debounceHistory = useDebounceCallback(async () => {

    let response = await axios.post("/api/users/triggerhhistory", { history: isHistoryOn })
    setIsHistoryOn(response.data.data)
  }, 2000)


  useEffect(() => {
    const getWatchHistoryAcceptence = async () => {
      setIsLoading(true)
      let response = await axios.get("/api/users/triggerhhistory")
      setIsHistoryOn(response.data.data)
      setVideos(state.profile.watchHistory)
      setIsLoading(false)
    }
    getWatchHistoryAcceptence()
  }, [])


  const watchHistory = async () => {
    try {
      setIsLoading(true)
      setIsHistoryOn(!isHistoryOn)
      debounceHistory()
      setIsLoading(false)
    } catch (error) {
      console.log("error to trigger watch-history", error)
    }

  }

  const deletevideo = async (videoId) => {
    try {
      let response = await axios.post("/api/videos/deletewatchhistoryvideo", { videoId })
      // dispatch({ type: "UPDATE_WATCH_HISTORY", payload: response.data.data })
      setVideos((prevVideos) => prevVideos.filter((video) => video._id !== videoId));

    } catch (error) {
      console.error("Error deleting video from watch history:", error);
    }
  }


  return (
    <div className='w-full min-h-screen bg-gray-100'>
      {/* Header Section */}
      <div className='p-4 bg-white shadow-md flex justify-between'>
        <h1 className='text-2xl font-semibold text-gray-800'>Your Watch History</h1>
        <div onClick={() => watchHistory()} className="flex items-center">
          {isLoading ? (
            <Button disabled className="bg-gray-400 text-white hover:bg-gray-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              wait...
            </Button>
          ) : (
            <Button type="submit" disabled={isLoading} className="bg-blue-600 text-white hover:bg-blue-700">
              {isHistoryOn ? "Turn off " : "Turn on"}
            </Button>
          )}
        </div>
      </div>
      {!isHistoryOn && <span className='flex justify-center text-center border-2 border-red-700 bg-red-400'>Your Watch History Is Turned Off</span>

      }


      {/* Videos List */}
      <div className='p-4 pb-16'>
        {state.watchHistoryError || videos?.length == 0 || !videos ? (
          <div className="text-center text-red-700 flex justify-center items-center">
            <h1>No Watched Video</h1>
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
                    <span>{video.views.length} views</span>
                    {video.createdAt && (
                      <span>watched {formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}</span>
                    )}
                  </div>
                </div>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    deletevideo(video._id);
                  }}
                  className="z-50 mr-4 mt-4 hover:scale-110 "
                >
                  <MdOutlineDeleteOutline className="text-xl " />
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
