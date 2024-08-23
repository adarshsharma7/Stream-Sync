"use client"

import { formatDistanceToNow } from 'date-fns'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/context/context'
import { MdOutlineDeleteOutline } from "react-icons/md";
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import axios from 'axios'
import { CiEdit } from "react-icons/ci";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { updateVideoSchema } from '@/Schemas/uploadVideoSchema'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'


function Page() {
  const { state, dispatch } = useUser()
  const [videos, setVideos] = useState([])
  const [showPopup, setShowPopup] = useState(false)
  const [videoToDelete, setVideoToDelete] = useState(null)
  const [editingVideoId, setEditingVideoId] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [editingContent, setEditingContent] = useState({title:"",description:""})
  const [uniqueIndex, setUniqueId] = useState()

  const router = useRouter()


  const form = useForm({
    resolver: zodResolver(updateVideoSchema),
    defaultValues: {
      description: "",
      title: "",

    }
  })


  useEffect(() => {
    setVideos(state.profile.uploadedVideos || []);
  }, [state.profile.uploadedVideos]);

  const deletevideo = async (videoId) => {
    try {
      await axios.post("/api/videos/deleteuploadedvideo", { videoId })
      let updatedVideos = videos.filter((video) => video._id !== videoId)
      setVideos(updatedVideos)
      dispatch({ type: "UPDATE_UPLOADED_VIDEOS", payload: updatedVideos })
      setShowPopup(false)
    } catch (error) {
      console.error("Error deleting video:", error)
    }
  }

  const handleDeleteClick = (videoId) => {
    setVideoToDelete(videoId)
    setShowPopup(true)
  }

  const handleConfirmDelete = () => {
    deletevideo(videoToDelete)
  }

  const handleCancelDelete = () => {
    setShowPopup(false)
    setVideoToDelete(null)
  }



  const handleSaveEdit = async (data) => {
    setIsLoading(true)
    try {
      let updatedVideos = videos.map((video) =>
        video._id == editingVideoId
          ? { ...video, title: data.title, description: data.description }
          : video
      )
      setVideos(updatedVideos)
      dispatch({ type: "UPDATE_UPLOADED_VIDEOS", payload: updatedVideos })
      setIsLoading(false)

      await axios.post('/api/videos/updatevideo', {
        videoId: editingVideoId,
        title: data.title,
        description: data.description
      })


      setEditingVideoId(null)
      setEditingContent({title:"",description:""})
    } catch (error) {
      console.error("Error updating video:", error)
    }
  }

  const handleCancelEdit = () => {
    setEditingVideoId(null)
  }

  return (
    <div className='w-full min-h-screen bg-gray-100'>
      <div className='p-4 bg-white shadow-md'>
        <h1 className='text-2xl font-semibold text-gray-800'>Your Uploaded Videos</h1>
      </div>

      <div className='p-4'>
        {state.uploadedVideosError || videos?.length === 0 || !videos ? (
          <div className="text-center text-red-700">
            <h1>No video Upload Yet</h1>
          </div>
        ) : (
          <div className='flex flex-col gap-4'>
            {Array.isArray(videos) && videos?.map((video, index) => (
              <div
                key={index}
                className='cursor-pointer flex flex-col border border-gray-300 bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-200'
              >
                <div className='flex items-start' onClick={() => {
                  // Only navigate if not editing
                  if (editingVideoId == null) {
                    router.push(`/videoplay/${video._id}`)
                  }

                }}>
                  <div className='w-40 h-24 overflow-hidden'>
                    <img src={video.thumbnail} alt="Thumbnail" className='w-full h-full object-cover' />
                  </div>
                  <div className='p-3 flex flex-col justify-between w-full'>
                    {editingVideoId && uniqueIndex==index ? (
                      <>
                        <Form {...form}>
                          <form onSubmit={form.handleSubmit(handleSaveEdit)} className="w-full max-w-3xl bg-white p-8 rounded-lg shadow-lg space-y-8">

                            <FormField
                              control={form.control}
                              name="title"
                              render={({ field }) => (
                                <FormItem>

                                  <FormControl>
                                    <Input
                                    
                                    placeholder={`${video.title}.... Title (required)`} {...field}
                                    value={editingContent.title}
                                    onChange={(e) => {
                                      field.onChange(e);
                                     setEditingContent((prevContent)=>({...prevContent,title:e.target.value}))
                                  }}
                                    className="border border-gray-300 rounded-md shadow-sm" />
                                  </FormControl>

                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="description"
                              render={({ field }) => (
                                <FormItem>

                                  <FormControl>
                                    <Textarea
                              
                                      placeholder={`${video.description} .......Tell viewers about your video`}
                                      className="resize-none border border-gray-300 rounded-md shadow-sm"
                                      
                                      {...field}
                                      value={editingContent.description}
                                      onChange={(e) => {
                                        field.onChange(e);
                                       setEditingContent((prevContent)=>({...prevContent,description:e.target.value}))
                                    }}
                                    />
                                  </FormControl>

                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className='flex justify-end space-x-2'>
                              <Button
                                onClick={handleCancelEdit}
                                className='px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-md'
                              >
                                Cancel
                              </Button>

                              <div className="flex items-center">
                                {isLoading ? (
                                  <Button disabled className="bg-gray-400 text-white hover:bg-gray-500">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    wait...
                                  </Button>
                                ) : (
                                  <Button type="submit" disabled={isLoading} className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-md">
                                    Save
                                  </Button>
                                )}
                              </div>
                            </div>
                          </form>
                        </Form>
                      </>

                    ) : (
                      <>
                        <h3 className='text-lg font-medium text-gray-800'>{video.title}</h3>
                        {/* <div className='text-sm text-gray-500 mt-1'>{video.description}</div> */}
                        <div className='flex justify-between text-xs text-gray-500 mt-2'>
                          <span>{video.views} views</span>
                          {video.createdAt && (
                            <span>Uploaded {formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className='flex justify-end mr-4 mt-4'>
                  <div onClick={(e) => {
                    e.stopPropagation()
                    setEditingVideoId(video._id)
                    setUniqueId(index)
                    setEditingContent({
                      title: video.title,
                      description: video.description
                    });

                  }} className='z-50 mr-4 cursor-pointer'>
                    <CiEdit />
                  </div>
                  <div onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteClick(video._id)
                  }} className='z-50 cursor-pointer'>
                    <MdOutlineDeleteOutline />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Popup */}
      {
        showPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-4 rounded-md shadow-lg">
              <h2 className="text-xl font-semibold">Are you sure?</h2>
              <p className="mt-2">Do you really want to delete this video? This process cannot be undone.</p>
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  onClick={handleCancelDelete}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  )
}

export default Page
