"use client"
import { checkSubscribed, subscribe } from '@/components/subscribefunc'
import { Button } from '@/components/ui/button'
import { useUser } from '@/context/context'
import axios from 'axios'
import { formatDistanceToNow } from 'date-fns'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'


function Page() {
  const [user, setUser] = useState({})
  const [videosFetchingMessage, setVideosFetchingMessage] = useState("")
  const params = useParams()
  const router = useRouter()
  const username = params.subscriptionusername

  const { state, dispatch } = useUser()



  useEffect(() => {
    const fetchedUser = async () => {
      try {
        let response = await axios.post("/api/users/userprofile", { username })


        setUser(response.data.data)
        dispatch({ type: "SET_SUBSCRIBER_COUNT", payload: response.data.data.subscribers })
        if (response.data.message) {
          setVideosFetchingMessage(response.data.message)
        }
      } catch (error) {
        console.log("something went wrong", error)
      }
    }
    fetchedUser()
  }, [])

  useEffect(() => {
    if (user && user._id) {
      checkSubscribed(user._id, dispatch)
    }
  }, [user])




  return (
    <div className='w-full min-h-screen bg-gray-100'>
      {/* User Profile Section */}
      <div className='flex items-center bg-white p-4 shadow-md'>
        <div className='w-20 h-20 rounded-full border-4 border-gray-200 overflow-hidden relative'>
          <Image
            src={user?.avatar}
            alt="User Avatar"
            className='object-cover'
            layout="fill"  // Image will fill the entire container
            objectFit="cover" // Image will cover the container while maintaining aspect ratio
          />
        </div>
        <div className='ml-4'>
          <h1 className='text-xl font-semibold text-gray-800'>{user?.fullName}</h1>
          <p className='text-gray-600'>{user?.username}</p>
          <div className='flex text-sm text-gray-500 mt-1'>
            <p>{state.subscriberCount} Subscribers</p>
            <span className='mx-2'>•</span>
            <p>{user?.uploadedVideos?.length || 0} videos</p>
          </div>
          <div className='flex '>
            {user?.createdAt && (
              <p className='text-sm text-gray-500 mt-2 mr-14'>
                Joined {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}

              </p>

            )}
            <div
              className="subscribeButtonBox transition duration-300 hover:scale-[1.02]"
              onClick={() => subscribe(user?._id, state, dispatch)}
            >
              <Button
                type="button"
                className={`w-full rounded-full px-6 py-2 text-sm font-semibold shadow-md transition-all duration-300 ${state.userSubscribe
                    ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    : "bg-black text-white "
                  }`}
                disabled={state.isSubscribe}
              >
                {state.isSubscribe ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Subscribing...
                  </>
                ) : state.userSubscribe ? (
                  "Subscribed"
                ) : (
                  "Subscribe"
                )}
              </Button>
            </div>


          </div>

        </div>
      </div>

      {/* Videos Section */}
      <div className='p-4'>
        <h2 className='text-lg font-semibold mb-4'>All Videos from this Channel</h2>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {videosFetchingMessage ? (
            <div className="col-span-full text-center text-red-700">
              <h1>{videosFetchingMessage}</h1>
            </div>
          ) : user?.uploadedVideos?.map((video, index) => (
            <div
              key={index}
              onClick={() => router.push(`/videoplay/${video._id}`)}
              className='cursor-pointer border border-gray-300 bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-200'
            >
              <div className='h-48 w-full overflow-hidden relative'>
                <Image
                  src={video.thumbnail}
                  alt="Thumbnail"
                  className='object-cover'
                  layout="fill"
                  objectFit="cover"
                />
              </div>
              <div className='p-3'>
                <h3 className='text-sm font-medium text-gray-800'>{video.title}</h3>
                <div className='flex items-center text-xs text-gray-500 mt-1'>
                  <div className='flex items-center h-5 w-5 relative'>
                    <Image src={user?.avatar} alt="User Avatar" layout="fill"
                      objectFit="cover" className='rounded-full mr-2 object-cover' />
                    <span className='ml-6'>{user?.username}</span>
                  </div>
                </div>
                <div className='flex justify-between text-xs text-gray-500 mt-2'>
                  <span>{video.views} views</span>
                  <span>{formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Page
