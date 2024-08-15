"use client"
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { formatDistanceToNow } from 'date-fns'
import { useParams, useRouter } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { IoClose } from "react-icons/io5";
import { commentSchema } from '@/Schemas/commentSchema'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react';
import { MdDownloadForOffline } from "react-icons/md";
import { AiOutlineLike, AiFillLike } from "react-icons/ai";
import { FaRegShareSquare } from "react-icons/fa";
import { GoReport } from "react-icons/go";

import { SharePopup } from '@/components/sharepopup'
import { ReportPopup } from '@/components/reportpopup'
import { useUser } from '@/context/context'
import { checkSubscribed, subscribe } from "@/components/subscribefunc"
import { useDebounceCallback } from "@react-hook/debounce";
import { RxDotsVertical, RxCross2 } from "react-icons/rx";



function Page() {
    const [videoData, setVideoData] = useState()
    // { title: "ddd", comments: [{ content: "good video", owner: { avatar: "dbb", username: "sagarsh" } }], owner: { username: "adarsh sharma", avatar: "aaa", subscribers: 4 } }
    const [comments, setComments] = useState([])
    const [commentBox, setCommentBox] = useState(false)
    const [descriptionBox, setDescriptionBox] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [likeCount, setLikeCount] = useState()
    const [liked, setLiked] = useState(false)
    const [errorMessage, seterrorMessage] = useState("")
    const [showSharePopup, setShowSharePopup] = useState(false);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [videosFetchingMessage, setVideosFetchingMessage] = useState("")
    const [commentLikes, setCommentLikes] = useState([])
    const [commentLikesCount, setCommentLikesCount] = useState({});
    const [commentDeletePopup, setCommentDeletePopup] = useState(false);
    const [uniqueComment, setUniqueComment] = useState();
    const [editingCommentId, setEditingCommentId] = useState(null); // To track which comment is being edited
    const [editedContent, setEditedContent] = useState(''); // To store the edited content
    const [editCommentLoading, setEditCommentLoading] = useState(false);
    const [currentCommentContent, setCurrentCommentContent] = useState();



    const delComPopup = useRef(null);

    const { state, dispatch } = useUser()

    const router = useRouter()

    const params = useParams()
    const videoId = params.videoid

    const { data: session } = useSession();
    const user = session?.user;

    const form = useForm({
        resolver: zodResolver(commentSchema),
        defaultValues: {
            comment: ""
        }
    })

    const debouncedLike = useDebounceCallback(async () => {
        await axios.post("/api/videos/sendlike", { videoId: videoId });
    }, 2000);
    const debouncedCommentLike = useDebounceCallback(async (commentId) => {
        const response = await axios.post("/api/videos/sendcommentlike", { commentId })
    }, 2000);




    useEffect(() => {
        const findVideo = async () => {
            try {
                let videoResponse = await axios.post("/api/videos/getvideobyid", { videoId });
                setVideoData(videoResponse.data.data);
                setComments(videoResponse.data.data.comments);
                dispatch({ type: "SET_SUBSCRIBER_COUNT", payload: videoResponse.data.data.owner.subscribers })
                setLikeCount(videoResponse.data.data.likes);
            } catch (error) {
                console.error("Error fetching video:", error);
            }
        };

        const like = async () => {
            try {
                let response = await axios.post("/api/videos/getlike", { videoId: videoId })
                if (response.data.message == "Liked") {
                    setLiked(true)
                } else if (response.data.message == "Unliked") {
                    setLiked(false)
                } else {
                    seterrorMessage(response.data.message);
                }
            } catch (error) {
                console.error("Error fetching like:", error);
            }
        };

        const fetchAllVideos = async () => {
            if (state && state.fetchedAllVideos && state.fetchedAllVideos.length > 0) {

                return null;

            }
            const response = await axios.get("/api/videos/getallvideos")
            if (response.data.status == 400) {
                setVideosFetchingMessage(response.data.message)
            } else {
                dispatch({ type: "FETCHED_ALL_VIDEOS", payload: response.data.data })
                // setVideos(response.data.data)
            }

        }

        findVideo()
        like()
        fetchAllVideos()

    }, [videoId]);

    const handleClickOutside = (event) => {
        if (delComPopup.current && !delComPopup.current.contains(event.target)) {
            setCommentDeletePopup(false);
        }
    };


    useEffect(() => {
        if (comments) {
            const likedComments = comments.reduce((acc, comm) => {
                if (comm.likes?.includes(user._id)) {
                    acc.push(comm._id);
                }
                return acc;
            }, []);
            setCommentLikes(likedComments);
        }

        if (videoData && videoData.owner && videoData.owner._id) {
            checkSubscribed(videoData.owner._id, dispatch)
        }
        document.addEventListener('click', handleClickOutside, true);
        return () => {
            document.removeEventListener('click', handleClickOutside, true);
        };
    }, [videoData])



    if (!videoData) {
        return <div>Loading...</div>;
    }


    const sendComment = async (data) => {
        setIsLoading(true)


        let response = await axios.post("/api/videos/sendcomment",
            {
                content: data.comment,
                videoId: videoId
            }

        )
        //frontend me comment instant dikhane k liye
        let newComment = {
            _id: response.data.data._id,
            content: data.comment,
            edited: false,
            likes: [],
            commentOnVideo: videoId,
            createdAt: new Date(),
            owner: {
                _id: user._id,
                username: user.username,
                avatar: user.avatar
            }

        }
        setComments(prevComments => [...prevComments, newComment])

        // setComments(prevComments => prevComments.map(comment =>
        //     comment.content==data.comment && comment.owner._id==user._id
        //         ? { ...comment, _id: response.data.data._id } // update the content
        //         : comment // keep other comments unchanged
        // )
        // );




        setIsLoading(false)

    }

    const like = async () => {
        if (liked) {
            setLikeCount(likeCount - 1);
            setLiked(false);
        } else {
            setLikeCount(likeCount + 1);
            setLiked(true);
        }
        debouncedLike(); // Call the debounced function
    };

    const likeComment = async (commentId, initialLikeCount) => {
        try {
            const currentCount = commentLikesCount[commentId] || initialLikeCount;
            if (commentLikes.includes(commentId)) {
                const updatedCount = currentCount - 1;
                setCommentLikesCount(prevCounts => ({ ...prevCounts, [commentId]: updatedCount }));
                // If commentId is already in the array, remove it
                setCommentLikes(prevLikes => prevLikes.filter(id => id !== commentId));
            } else {
                // If commentId is not in the array, add it
                const updatedCount = currentCount + 1;
                setCommentLikesCount(prevCounts => ({ ...prevCounts, [commentId]: updatedCount }));
                setCommentLikes(prevLikes => [...prevLikes, commentId]);
            }
            debouncedCommentLike(commentId);


        } catch (error) {

        }

    };

    const commentDelete = async (commentId, contentToDelete) => {
        try {
            setComments(prevComments => prevComments.filter(comment => !(comment.content == contentToDelete && comment.owner._id == user._id)));
            let response = await axios.post("/api/videos/deletecomment", { commentId, videoId })

        } catch (error) {

        }
    }

    const closeSharePopup = () => {
        setShowSharePopup(false);
    };

    const closeReportPopup = () => {
        setIsReportOpen(false);
    };
    // Function to handle editing
    // const startEditingComment = (commentId, currentContent) => {
    //     setEditingCommentId(commentId);
    //     setEditedContent(currentContent);
    // };

    const saveEditedComment = async () => {
        setEditCommentLoading(true)
        setComments(prevComments => prevComments.map(comment =>
            comment._id === editingCommentId
                ? { ...comment, content: editedContent, edited: true, updatedAt: new Date() } // update the content
                : comment // keep other comments unchanged
        )
        );
        setEditCommentLoading(false)
        let response = await axios.post("/api/videos/updatecomment", { content: editedContent, commentId: editingCommentId })
        setEditingCommentId(null);
        setEditedContent("")


    }

    return (
        <div className='w-full h-screen border-2 relative flex flex-col '>
            <div className='videPlayBox h-[300px] w-full rounded-lg border-'>
                <video
                    src={videoData.videoFile}
                    controls
                    className='w-full h-full rounded-lg'
                >
                    Your browser does not support the video tag.
                </video>
            </div>


            <div className='videPlayDetailBox flex flex-col h-[28%] w-full border-2 p-2 rounded-t-[10px] gap-1'>
                <div><h1 className='text-2xl font-bold'>{videoData.title}</h1></div>
                <div className='discriptionBox flex text-sm '>
                    <p className='mr-2'>{videoData.views} views</p>
                    {/* <p>{formatDistanceToNow(new Date(videoData.createdAt), { addSuffix: true })}</p> */}
                    <p onClick={() => setDescriptionBox(true)}>more...</p>
                </div>
                <div className='flex justify-between items-center'>
                    <div onClick={() => router.push(`/subscriptionprofile/${videoData.owner.username}`)} className='cursor-pointer flex gap-2 items-center'>
                        <div className='w-12 h-12 overflow-hidden flex justify-center items-center rounded full border-2 border-yellow-700 '>
                            <img src={videoData.owner.avatar} alt="dp" />
                        </div>
                        <div className='flex flex-col'>
                            <h3>{videoData.owner.username}</h3>
                            <div className='subscribersBox text-sm'>{state.subscriberCount} subscriber</div>

                        </div>

                    </div>
                    <div className='subscribeButtonBox  ' onClick={() => subscribe(videoData.owner._id, state, dispatch)}>
                        <Button type="button" className={`${state.userSubscribe ? "bg-slate-300 " : ""} w-full rounded-full`} disabled={state.isSubscribe}>
                            {state.isSubscribe ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Subscribing...
                                </>
                            ) : (
                                state.userSubscribe ? 'Subscribed' : 'Subscribe'
                            )}
                        </Button>
                    </div>


                </div>
                <div className='buttonsBox flex gap-4 mb-2'>
                    <div onClick={() => like()} className='rounded-full border-2 px-3 py-1 text-2xl cursor-pointer border-slate-400'>{liked ? <AiFillLike /> : <AiOutlineLike />}</div>
                    <div onClick={() => setShowSharePopup(true)} className='rounded-full border-2 px-3 py-1 text-2xl cursor-pointer border-slate-400'><FaRegShareSquare /></div>
                    <div className='rounded-full border-2 px-3 py-1 text-2xl cursor-pointer border-slate-400'><MdDownloadForOffline /></div>
                    <div onClick={() => setIsReportOpen(true)} className='rounded-full border-2 px-3 py-1 text-2xl cursor-pointer border-slate-400'><GoReport /></div>

                </div>

                {showSharePopup && <SharePopup videoId={videoId} onClose={closeSharePopup} />}
                {isReportOpen && <ReportPopup isOpen={isReportOpen} videoId={videoId} onClose={closeReportPopup} />}

                <div onClick={() => setCommentBox(true)} className='commentBox border-2 border-black h-[35%] rounded-2xl flex flex-col p-2 gap-2'>
                    <div className='flex gap-2'>
                        <h3>Comments</h3>
                        <h4>{comments.length}</h4>
                    </div>
                    {comments.length > 0 ? (<div className='flex gap-1 items-center '>
                        <div className='h-5 w-5 rounded-full border-2 overflow-hidden border-black'>
                            <img src={comments[0].owner.avatar} alt="" />

                        </div>
                        <div>@{comments[0].owner.username}</div>
                        <div className='text-ellipsis overflow-hidden whitespace-nowrap'>{comments[0].content}</div>
                    </div>) : (
                        <div className='flex justify-center items-center'>
                            <p>No Comments</p>
                        </div>
                    )}

                </div>

            </div>


            <div className='bottomBox h-full w-full grid grid-cols-1 overflow-y-auto p-2'>

                {videosFetchingMessage ? (
                    <div className="w-full h-ful flex justify-center items-center">
                        <h1>{videosFetchingMessage}</h1>
                    </div>
                ) : (
                    state.fetchedAllVideos.filter(video => video._id !== videoId).length > 0 ? (

                        state.fetchedAllVideos.filter(video => video._id !== videoId).map((video, index) => (

                            <div key={index} onClick={() => router.push(`/videoplay/${video._id}`)} className='cursor-pointer h-[260px] border-2  rounded-lg flex flex-col gap-1'>
                                <div className='thumbnailBox rounded-2xl w-full overflow-hidden h-[75%] border-2 '>
                                    <img src={video.thumbnail} alt="thumbnail" className='w-full h-full object-cover' />
                                </div>
                                <div className='userDetailsBox flex gap-2 p-1'>
                                    <div className='w-8 h-8 rounded-full overflow-hidden border-2 '> <img src={`${video.owner.avatar}`} alt="dp" /></div>
                                    <div className='border-2  w-full'>{video.title}</div>
                                </div>
                                <div className='w-full'>
                                    <p>{video.owner.username}</p>
                                </div>
                                <div className='flex gap-2'>
                                    <div>{video.views} views</div>
                                    <div>{formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}</div>
                                </div>

                            </div>



                        )))
                        : (
                            <div className="w-full h-full text-gray-600 flex justify-center items-center">
                                <h1>No more videos to display.</h1>
                            </div>
                        ))
                }



            </div>

            <div className={`${commentBox ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"} bg-white transform text-gray-800 p-4 z-50 fixed bottom-0 left-0 right-0 border-t border-2 w-full h-[66%] transition-all ease-[cubic-bezier(0.25, 0.8, 0.25, 1)] duration-200 flex flex-col`}>
                <div className='flex justify-between items-center mb-4'>
                    <h1 className='text-xl font-semibold text-gray-900'>All comments</h1>
                    <div onClick={() => setCommentBox(false)} className="cursor-pointer">
                        <IoClose className='text-2xl text-gray-500 hover:text-gray-700 transition' />
                    </div>
                </div>

                <div className='flex-grow h-full pb-12 overflow-y-auto w-full border-2'>

                    {comments.length > 0 ? comments.map((videoComment, index) => (
                        <div key={index} className='relative flex flex-col bg-gray-50 p-3 rounded-lg mb-3 shadow-sm'>
                            {/* Comment Content */}
                            <div className='flex gap-3 items-center w-full'>

                                <div className='flex justify-between w-full'>
                                    <div className='flex gap-1 items-center'>
                                        <div onClick={()=>router.push(`/subscriptionprofile/${videoComment.owner.username}`) } className='flex items-center'>
                                            <div className='mr-3 h-10 w-10 rounded-full overflow-hidden border-2 border-gray-200'>
                                                <img src={videoComment.owner.avatar} alt="" className="object-cover w-full h-full" />
                                            </div>
                                            <p className="font-medium text-gray-800">@{videoComment.owner.username}</p>
                                        </div>

                                        <p className='text-sm font-light '>{videoComment.edited ? "edited" : ""}</p>
                                    </div>
                                    {videoComment.owner._id == user._id && (
                                        <p onClick={() => {
                                            setUniqueComment(index);
                                            setCommentDeletePopup(true);
                                        }}>{<RxDotsVertical />}</p>
                                    )}
                                </div>
                                {commentDeletePopup && uniqueComment == index && (
                                    <div
                                        ref={delComPopup}
                                        className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 shadow-lg rounded-md z-10"
                                    >
                                        <button
                                            onClick={() => commentDelete(videoComment._id, videoComment.content)}
                                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-t-md"
                                        >
                                            Delete
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditingCommentId(videoComment._id);
                                                setEditedContent(videoComment.content);
                                                setCurrentCommentContent(videoComment.content);
                                            }}
                                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-b-md"
                                        >
                                            Edit
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="mt-2">
                                <h2 className="text-base text-gray-700">{videoComment.content}</h2>
                            </div>
                            <div className="flex mt-2 space-x-4 justify-between">
                                <div className='flex gap-1'>
                                    <button onClick={() => likeComment(videoComment._id, videoComment.likes?.length)} className="text-blue-500 hover:underline">
                                        {commentLikes.includes(videoComment._id) ? <AiFillLike /> : <AiOutlineLike />}
                                    </button>
                                    <p>{commentLikesCount[videoComment._id] ?? videoComment.likes?.length}</p>
                                    <button className="ml-2 text-blue-500 hover:underline">Reply</button>
                                </div>
                                <div>
                                    <p className='text-sm text-gray-600 font-extralight'>
                                        {videoComment.updatedAt ? "updated" : "added"} {formatDistanceToNow(new Date(videoComment.updatedAt ? videoComment.updatedAt : videoComment.createdAt), { addSuffix: true })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className='flex justify-center items-center'>
                            <h1 className="text-lg text-gray-500">No Comments</h1>
                        </div>
                    )}

                </div>

                <div className='fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-2 border-gray-300'>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(async (data) => {

                            if (editingCommentId) {
                                await saveEditedComment();
                            } else {
                                await sendComment(data);
                            }
                            form.reset();//Reset the full Form input field after submitting
                            // form.setValue("comment", ""); // Reset the indivisual input field after submitting
                        })} className="flex items-center rounded-lg border border-gray-300 p-2 bg-gray-100">
                            <div className="flex-grow">
                                <FormField
                                    control={form.control}
                                    name="comment"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        type='text'
                                                        placeholder='Add your comment...'
                                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-500"
                                                        {...field}
                                                        value={editingCommentId ? editedContent : field.value}
                                                        onChange={(e) => {
                                                            field.onChange(e);
                                                            if (editingCommentId) {
                                                                setEditedContent(e.target.value);
                                                            }
                                                        }}
                                                    />
                                                    {editingCommentId && (
                                                        <p onClick={() => {
                                                            setEditedContent("");
                                                            setEditingCommentId(null);
                                                            field.onChange('');
                                                        }} className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-red-500 text-white px-2 py-1 rounded">
                                                            <RxCross2 />
                                                        </p>
                                                    )}
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                
                            </div>
                            <div className="ml-2">
                                {isLoading || editCommentLoading ? (
                                    <Button
                                        disabled
                                        className="bg-gray-400 text-white hover:bg-gray-500 px-4 py-2 rounded-lg"
                                    >
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Wait...
                                    </Button>
                                ) : (
                                    <Button
                                        type="submit"
                                        disabled={isLoading || editCommentLoading || currentCommentContent == editedContent}
                                        className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg"
                                    >
                                        {editingCommentId ? 'Update' : 'Send'}
                                    </Button>
                                )}
                            </div>
                        </form>
                    </Form>
                </div>
            </div>









            <div className={`${descriptionBox ? "translate-y-[302px] opacity-100" : "translate-y-full opacity-0 pointer-events-none"} transform bg-white p-2 z-50 fixed border-2 w-full h-[66%] transition-all ease-[cubic-bezier(0.25, 0.8, 0.25, 1)] duration-200 flex flex-col`}>
                <div className='flex justify-between mb-4 border-b-2 border-black p-4 sticky'>

                    <h1 className='text-2xl'>Description</h1>

                    <div onClick={() => setDescriptionBox(false)}>
                        <IoClose className='text-2xl' />
                    </div>


                </div>

                <div className='flex flex-col gap-2 p-3 h-full overflow-y-auto'>
                    <div className='h-full w-full flex flex-col gap-2 overflow-y-auto text-black'>
                        <div className='p-3 border-2 border-slate-700'>
                            <h1 className='font-bold '>{videoData.title}</h1>
                        </div>



                        <div className='videoVeiwsLikesDetailBox flex justify-around'>
                            <div className='flex flex-col items-center'>
                                <h1 className='font-semibold'>Likes</h1>
                                <h1>{likeCount}</h1>
                            </div>
                            <div className='flex flex-col items-center'>
                                <h1 className='font-semibold'>Views</h1>
                                <h1>{videoData.views}</h1>
                            </div>
                            <div className='flex flex-col items-center'>
                                <h1 className='font-semibold'>Date</h1>
                                <h1>{formatDistanceToNow(new Date(videoData.createdAt), { addSuffix: true })}</h1>

                            </div>

                        </div>

                        <div className='bg-slate-200 h-full w-full'>
                            <h1>{videoData.description}</h1>
                        </div>
                    </div>




                </div>

            </div>



        </div>
    )
}

export default Page