"use client"

import { formatDistanceToNow } from 'date-fns'
import React from 'react'
import { useRouter } from 'next/navigation'
import {useUser} from '@/context/context'

function Page() {

    const {state}=useUser()

  const router = useRouter()


  return (
    <div className='w-full min-h-screen bg-gray-100'>
      {/* Header Section */}
      <div className='p-4 bg-white shadow-md'>
        <h1 className='text-2xl font-semibold text-gray-800'>Your Liked videos</h1>
      </div>

      {/* Videos List */}
      <div className='p-4'>
        {state.likedError ? (
          <div className="text-center text-red-700">
            <h1>{state.likedError}</h1>
          </div>
        ) : (
          <div className='flex flex-col gap-4'>
            {state.profile.liked?.map((video, index) => (
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
                      <span>Liked {formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}</span>
                    )}
                  </div>
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
