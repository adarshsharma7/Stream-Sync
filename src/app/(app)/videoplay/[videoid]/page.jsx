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
import { useSession } from 'next-auth/react';
import { AiOutlineLike, AiFillLike } from "react-icons/ai";
import { FaRegShareSquare } from "react-icons/fa";
import { GoReport } from "react-icons/go";
import { CiSearch } from "react-icons/ci";
import { SharePopup } from '@/components/sharepopup'
import { ReportPopup } from '@/components/reportpopup'
import { useUser } from '@/context/context'
import { checkSubscribed, subscribe } from "@/components/subscribefunc"
import { useDebounceCallback } from "@react-hook/debounce";
import { RxDotsVertical, RxCross2 } from "react-icons/rx";
import { MdOutlineWatchLater, MdWatchLater, MdOutlineInsertComment } from "react-icons/md";
import CommentsDiv from "@/components/commentsdiv"
import CommentReplyDiv from "@/components/commentReplyDiv"
import Notification from "@/components/notificationpopup"
import Fuse from 'fuse.js';
import { Skeleton } from "@/components/ui/skeleton"



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
    const [isWatchLater, setIsWatchLater] = useState(false);
    const [replyDiv, setReplyDiv] = useState(false);
    const [replyArray, setReplyArray] = useState([]);

    const [currentReplyCommentContent, setCurrentReplyCommentContent] = useState()
    const [editingReplyCommentId, setEditingReplyCommentId] = useState('')
    const [editedReplyContent, setEditedReplyContent] = useState('')
    const [commentReplytoReply, setCommentReplytoReply] = useState({ Id: "", username: "" })
    const [showNotification, setShowNotification] = useState({ addComment: false, editComment: false, savePlaylist: { isDel: false, isAdd: false } });
    const [commentSearchTerm, setCommentSearchTerm] = useState("");
    const [filteredComments, setFilteredComments] = useState([])
    const [commentSerachHeading, setCommentSerachHeading] = useState("")
    const [commentFetchingMessage, setCommentFetchingMessage] = useState("")




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

    const debouncedWatchLater = useDebounceCallback(async () => {
        const response = await axios.post("/api/videos/addordeletevideotowatchlater", { videoId })
        if (response.data.message == "Video deleted from your Watch Later") {
            setShowNotification({ ...showNotification, savePlaylist: { ...showNotification.savePlaylist, isDel: true } })
        } else {
            setShowNotification({ ...showNotification, savePlaylist: { ...showNotification.savePlaylist, isAdd: true } })
        }

    }, 1000);




    useEffect(() => {
        const findVideo = async () => {
            try {
                let videoResponse = await axios.post("/api/videos/getvideobyid", { videoId });

                setVideoData(videoResponse.data.data);
                setComments(videoResponse.data.data.comments);
                setFilteredComments(videoResponse.data.data.comments)
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

        const getWatchLaterVideos = async () => {
            let response = await axios.post("/api/videos/getwatchlatervideo", { videoId })
            if (response.data.message == "Already added to watch later") {
                setIsWatchLater(true)
            }
            //not need else because initially setIsWatchLater is false
        }

        findVideo()
        like()
        fetchAllVideos()
        getWatchLaterVideos()

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



    // if (!videoData) {
    //     return <div>Loading...</div>;
    // }


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
            replies: [],
            commentOnVideo: videoId,
            createdAt: new Date(),
            owner: {
                _id: user._id,
                username: user.username,
                avatar: user.avatar
            }

        }
        setFilteredComments(prevComments => [...prevComments, newComment])

        // setComments(prevComments => prevComments.map(comment =>
        //     comment.content==data.comment && comment.owner._id==user._id
        //         ? { ...comment, _id: response.data.data._id } // update the content
        //         : comment // keep other comments unchanged
        // )
        // );


        setShowNotification({ ...showNotification, addComment: true })

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
            setFilteredComments(prevComments => prevComments.filter(comment => !(comment.content == contentToDelete && comment.owner._id == user._id)));
            let response = await axios.post("/api/videos/deletecomment", { commentId, videoId })
            setReplyDiv(false)

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
        setFilteredComments(prevComments => prevComments.map(comment =>
            comment._id === editingCommentId
                ? { ...comment, content: editedContent, edited: true, updatedAt: new Date() } // update the content
                : comment // keep other comments unchanged
        )
        );
        if (replyArray.length > 0) {
            setReplyArray((prevArray) => [
                { ...prevArray[0], content: editedContent, edited: true, updatedAt: new Date() }
            ]);



        }


        setEditCommentLoading(false)
        let response = await axios.post("/api/videos/updatecomment", { content: editedContent, commentId: editingCommentId })
        setEditingCommentId(null);
        setEditedContent("")


    }

    // Initialize Fuse.js
    const fuse = new Fuse(comments, {
        keys: ['content', 'owner.username'],
        includeScore: true,
        threshold: 0.3, // Adjust the threshold for sensitivity (0.0 to 1.0)
    });


    const handleCommentSearch = (term) => {
        setCommentSearchTerm(term);
        setCommentFetchingMessage("");
        setCommentSerachHeading(`Search for: ${term}`);

        if (term.trim() === "") {
            setFilteredComments(comments);
            setCommentSerachHeading("")
        } else {
            // Perform fuzzy search
            const results = fuse.search(term);


            // Extract results and handle empty case
            const filteredResults = results.map(result => result.item);


            if (filteredResults.length === 0) {
                setCommentFetchingMessage("No Comments Found");
            } else {
                setFilteredComments(filteredResults);
            }

        }
    };






    return (
        <div className='w-full h-screen grid grid-cols-1 md:grid-cols-[70%_30%] md:px-8 md:pt-10'>

            <div className='w-full h-full border-2 relative flex flex-col '>
                {!videoData ? (
                    <div className="flex flex-col space-y-3">
                        <Skeleton className=" w-full rounded-lg  h-[300px] md:h-[550px] bg-slate-400" />

                        <Skeleton className="h-2 w-[40px] bg-slate-300" />


                    </div>
                ) : (
                    <div className={`videPlayBox h-[300px] ${commentBox || descriptionBox ? "md:h-[300px]" : "md:h-[550px]"}  w-full rounded-lg transition-all duration-300 ease-in-out`}>
                        <video
                            src={videoData.videoFile}
                            controls
                            className='w-full h-full rounded-lg'
                        >
                            Your browser does not support the video tag.
                        </video>
                    </div>
                )
                }



                <div className='videPlayDetailBox flex flex-col h-[28%] w-full border-2 p-2 rounded-t-[10px] gap-1'>
                    {!videoData ? (
                        <div className="flex flex-col gap-3">
                            {/* Title Skeleton */}
                            <Skeleton className="h-6 w-[60%] bg-slate-300" />

                            {/* Description Skeleton */}
                            <Skeleton className="h-4 w-[40%] bg-slate-300" />

                            <div className='md:flex md:justify-between'>
                                <div className='no-select flex justify-between items-center md:gap-4 mb-2 md:mb-9'>
                                    {/* Profile Picture Skeleton */}
                                    <div className='cursor-pointer flex gap-2 items-center'>
                                        <div className='w-12 h-12 rounded-full bg-slate-400' />

                                        {/* Username and Subscriber Count Skeleton */}
                                        <div className='flex flex-col gap-1'>
                                            <Skeleton className="h-4 w-[80px] bg-slate-300" />
                                            <Skeleton className="h-3 w-[50px] bg-slate-300" />
                                        </div>
                                    </div>

                                    {/* Subscribe Button Skeleton */}
                                    <div className='subscribeButtonBox'>
                                        <Skeleton className="w-24 h-8 rounded-full bg-slate-300" />
                                    </div>
                                </div>

                                {/* Buttons Skeleton */}
                                <div className='buttonsBox flex gap-4 mb-2'>
                                    <Skeleton className='rounded-full border-2 px-3 md:h-12 w-[60px] bg-slate-300' />
                                    <Skeleton className='rounded-full border-2 px-3 md:h-12 w-[60px] bg-slate-300' />
                                    <Skeleton className='rounded-full border-2 px-3 md:h-12 w-[60px] bg-slate-300' />
                                    <Skeleton className='rounded-full border-2 px-3 md:h-12 w-[60px] bg-slate-300' />
                                </div>
                            </div>

                            {/* Comments Box Skeleton */}
                            <div className='commentBox border-2 border-black h-[60%] rounded-2xl flex flex-col p-2 gap-2'>
                                <Skeleton className="h-4 w-[50px] bg-slate-300" />
                                <Skeleton className="h-5 w-[100%] bg-slate-300" />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div><h1 className='text-2xl font-bold'>{videoData.title}</h1></div>
                            <div className='discriptionBox flex text-sm '>
                                <p className='mr-2'>{videoData.views} views</p>
                                <p className='cursor-pointer' onClick={() => setDescriptionBox(true)}>more...</p>
                            </div>
                            <div className='md:flex md:justify-between'>
                                <div className='no-select flex justify-between items-center md:gap-4 mb-2 md:mb-9'>
                                    <div onClick={() => router.push(`/subscriptionprofile/${videoData.owner.username}`)} className='cursor-pointer flex gap-2 items-center'>
                                        <div className='w-12 h-12 overflow-hidden flex justify-center items-center rounded full border-2 border-yellow-700 '>
                                            <img src={videoData.owner.avatar} alt="dp" />
                                        </div>
                                        <div className='flex flex-col'>
                                            <h3>{videoData.owner.username}</h3>
                                            <div className='subscribersBox text-sm'>{state.subscriberCount} subscriber</div>
                                        </div>
                                    </div>
                                    <div className='subscribeButtonBox' onClick={() => subscribe(videoData.owner._id, state, dispatch)}>
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
                                    <div className='flex gap-1 rounded-full border-2 px-3 md:h-12 text-2xl cursor-pointer items-center border-slate-400 justify-between'>
                                        <div className='mr-2 ' onClick={() => like()} >{liked ? <AiFillLike /> : <AiOutlineLike />}</div>
                                        <div className='h-full outline-1 outline-double outline-slate-400 '></div>
                                        <p className='text-[18px] ml-1'>{likeCount}</p>
                                    </div>
                                    <div onClick={() => setShowSharePopup(true)} className=' md:h-12 flex justify-center items-center rounded-full border-2 px-3 py-1 text-2xl cursor-pointer border-slate-400'><FaRegShareSquare /></div>
                                    <div onClick={() => {
                                        setIsWatchLater(!isWatchLater)
                                        debouncedWatchLater()
                                    }} className='md:h-12 flex justify-center items-center rounded-full border-2 px-3 py-1 text-2xl cursor-pointer border-slate-400'>{isWatchLater ? <MdWatchLater /> : <MdOutlineWatchLater />}</div>
                                    <div onClick={() => setIsReportOpen(true)} className='md:h-12 flex justify-center items-center rounded-full border-2 px-3 py-1 text-2xl cursor-pointer border-slate-400'><GoReport /></div>
                                </div>

                                {showSharePopup && <SharePopup videoId={videoId} onClose={closeSharePopup} />}
                                {isReportOpen && <ReportPopup isOpen={isReportOpen} videoId={videoId} onClose={closeReportPopup} />}
                            </div>
                            <div onClick={() => setCommentBox(true)} className='commentBox border-2 border-black h-[60%] rounded-2xl flex flex-col p-2 gap-2 cursor-pointer'>
                                <div className='flex gap-2'>
                                    <h3>Comments</h3>
                                    <h4>{comments.length}</h4>
                                </div>
                                {comments.length > 0 ? (
                                    <div className='flex gap-1 items-center '>
                                        <div className='h-5 w-5 rounded-full border-2 overflow-hidden border-black'>
                                            <img src={comments[0].owner.avatar} alt="" />
                                        </div>
                                        <div>@{comments[0].owner.username}</div>
                                        <div className='text-ellipsis overflow-hidden whitespace-nowrap'>{comments[0].content}</div>
                                    </div>
                                ) : (
                                    <div className='flex justify-center items-center'>
                                        <p>No Comments</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>




                <div className={`${commentBox ? "translate-y-[302px] opacity-100" : "translate-y-full opacity-0 pointer-events-none"} bg-white transform text-gray-800 p-4 z-50 fixed  border-t border-2 w-full md:w-[67%] h-[66%] transition-all ease-[cubic-bezier(0.25, 0.8, 0.25, 1)] duration-200 flex flex-col realative`}>


                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-xl font-semibold text-gray-900 truncate max-w-[80%]">
                            {commentSerachHeading ? commentSerachHeading : "All comments"}
                        </h1>
                        <div onClick={() => setCommentBox(false)} className="cursor-pointer">
                            <IoClose className="text-2xl text-gray-500 hover:text-gray-700 transition" />
                        </div>
                    </div>

                    <div className={`mb-1 w-full h-[40px] border border-gray-300 flex items-center rounded-lg shadow-sm focus-within:shadow-md transition-shadow duration-300 ease-in-out`}>
                        <CiSearch className="text-xl text-gray-500 ml-3" />
                        <input
                            type="text"
                            placeholder="Search comments..."
                            maxLength={30}
                            value={commentSearchTerm}
                            onChange={(e) => handleCommentSearch(e.target.value)}
                            className="bg-transparent outline-none ml-2 flex-grow h-full text-gray-700 placeholder-gray-400"
                        />
                    </div>



                    {commentFetchingMessage ? (
                        <div className="flex justify-center items-center h-full text-red-700">
                            <h1>{commentFetchingMessage}</h1>
                        </div>
                    ) : (
                        <div className='flex-grow h-full pb-12 md:pb-[90px] overflow-y-auto w-full border-2'>

                            {filteredComments.length > 0 ? filteredComments.map((videoComment, index) => (
                                <div key={index} className='relative flex flex-col bg-gray-50 p-3 rounded-lg mb-3 shadow-sm'>
                                    {/* Comment Content */}
                                    <div className='flex gap-3 items-center w-full'>

                                        <div className='flex justify-between w-full'>
                                            <div className='flex gap-1 items-center'>
                                                <div onClick={() => router.push(`/subscriptionprofile/${videoComment.owner.username}`)} className='flex items-center cursor-pointer'>
                                                    <div className='mr-3 h-10 w-10 rounded-full overflow-hidden border-2 border-gray-200'>
                                                        <img src={videoComment.owner.avatar} alt="" className="object-cover w-full h-full" />
                                                    </div>
                                                    <p className="font-medium text-gray-800">@{videoComment.owner.username}</p>
                                                </div>

                                                <p className='text-sm font-light '>{videoComment.edited ? "edited" : ""}</p>
                                            </div>
                                            {videoComment.owner._id == user?._id && (
                                                <p className='cursor-pointer' onClick={() => {
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
                                        <h2 className="text-base text-gray-700 break-words">{videoComment.content}</h2>
                                    </div>
                                    <div className="flex mt-2 space-x-4 justify-between">
                                        <div className='flex gap-1'>
                                            <button onClick={() => likeComment(videoComment._id, videoComment.likes?.length)} className="text-blue-500 hover:underline">
                                                {commentLikes.includes(videoComment._id) ? <AiFillLike /> : <AiOutlineLike />}
                                            </button>
                                            <p>{commentLikesCount[videoComment._id] ?? videoComment.likes?.length}</p>
                                            <button onClick={() => {
                                                replyArray.push(videoComment)
                                                setReplyDiv(true)
                                            }} className="ml-2 text-blue-500 hover:underline"><MdOutlineInsertComment /></button>
                                            <p>{videoComment.replies?.length}</p>
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
                    )}
                    <div className='fixed bottom-0 md:mb-[90px] left-0 right-0 z-50 bg-white border-t border-2 border-gray-300'>
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
                                                            }} className="cursor-pointer absolute right-2 top-1/2 transform -translate-y-1/2 bg-red-500 text-white px-2 py-1 rounded">
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




                    <div className={`${replyDiv ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"} bg-white transform text-gray-800 p-4 z-50 bottom-0 left-0 right-0 border-t border-2 w-full h-full transition-all ease-[cubic-bezier(0.25, 0.8, 0.25, 1)] duration-200 flex flex-col absolute`}>

                        <div className='flex justify-between items-center mb-4'>
                            <h1 className='text-xl font-semibold text-gray-900'>Replies</h1>
                            <div onClick={() => {

                                setReplyDiv(false)
                                setReplyArray([])
                            }} className="cursor-pointer">
                                <IoClose className='text-2xl text-gray-500 hover:text-gray-700 transition' />
                            </div>
                        </div>
                        <div>

                            <CommentsDiv allComments={{ comments, setComments }} comments={replyArray} UniqueComment={{ setUniqueComment, uniqueComment }} CommentDeletePopup={{ setCommentDeletePopup, commentDeletePopup }} commentDelete={commentDelete} commentContent={{ editingCommentId, setEditingCommentId, editedContent, setEditedContent, currentCommentContent, setCurrentCommentContent }} likeComment={{ likeComment, commentLikes, commentLikesCount }} form={form} saveEditedComment={saveEditedComment} loading={{ editCommentLoading, setEditCommentLoading }} replyContent={{ currentReplyCommentContent, setCurrentReplyCommentContent, editingReplyCommentId, editedReplyContent, setEditingReplyCommentId, setEditedReplyContent, setEditedReplyContent, setCommentReplytoReply }} replyToReplyConntent={{ commentReplytoReply, setCommentReplytoReply }} router={router} />

                        </div>


                        <div className='ml-8 mt-4 max-h-[281px] overflow-y-auto'>
                            < CommentReplyDiv allComments={{ comments, setComments }} comments={replyArray[0]} form={form} user={user} replyContent={{ setCurrentReplyCommentContent, setEditingReplyCommentId, setEditedReplyContent }} replyToReplyConntent={{ setCommentReplytoReply }} commentContent={{ setEditedContent, setEditingCommentId, editingCommentId, setCurrentCommentContent }} />
                        </div>





                    </div>
                </div>
                {videoData && (
                    <div className={`${descriptionBox ? "translate-y-[302px] opacity-100" : "translate-y-full opacity-0 pointer-events-none"} transform bg-white p-2 z-50 fixed border-2 w-full md:w-[67%] h-[66%]  transition-all ease-[cubic-bezier(0.25, 0.8, 0.25, 1)] duration-200 flex flex-col`}>
                        <div className='flex justify-between mb-4 border-b-2 border-black p-4 sticky'>

                            <h1 className='text-2xl'>Description</h1>

                            <div className=' cursor-pointer' onClick={() => setDescriptionBox(false)}>
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
                )

                }


                {showNotification.addComment && (
                    <Notification message={"Comment added"} onClose={() => setShowNotification({
                        ...showNotification, addComment
                            : false
                    })} />

                )}
                {showNotification.savePlaylist.isAdd && (
                    <Notification message={"Video added to watch later"} onClose={() => setShowNotification({
                        ...showNotification, savePlaylist: { ...showNotification.savePlaylist, isAdd: false }

                    })} />

                )}
                {showNotification.savePlaylist.isDel && (
                    <Notification message={"Video removed from watch later"} onClose={() => setShowNotification({
                        ...showNotification, savePlaylist: { ...showNotification.savePlaylist, isDel: false }

                    })} />

                )}

            </div>

            <div className='bottomBox h-full w-full grid grid-cols-1  p-2 overflow-y-auto'>
                <div className='mb-12 w-full hidden md:block'>
                    <h1 className='text-2xl font-bold text-gray-800 mb-2 border-b-2 border-gray-300 pb-1 fixed bg-slate-500'>
                        Other Videos
                    </h1>
                </div>
                {state.fetchedAllVideos.filter(video => video._id !== videoId).length == 0 && !videosFetchingMessage && (
                    Array.from({ length: 8 }).map((_, index) => ( // Adjust the length as per expected video slots
                        <div key={index} className="flex flex-col space-y-3">
                            <Skeleton className="h-[215px] w-[100%] rounded-xl bg-slate-400" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-[250px] bg-slate-300" />
                                <Skeleton className="h-4 w-[200px] bg-slate-300" />
                            </div>
                        </div>
                    ))
                )}
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
        </div>

    )
}

export default Page
