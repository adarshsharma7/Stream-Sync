import React, { useEffect, useRef, useState } from 'react';
import { AiOutlineLike, AiFillLike } from "react-icons/ai";
import { RxDotsVertical, RxCross2 } from "react-icons/rx";
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';
import { useDebounceCallback } from '@react-hook/debounce';
import { useUser } from '@/context/context';

function CommentReplyDiv({ comments, user, replyContent }) {

  const { state, dispatch } = useUser()

  const [isLoading, setIsLoading] = useState(false)
  const [uniqueComment, setUniqueComment] = useState()
  const [commentReplyLikes, setCommentReplyLikes] = useState([])
  const [commentLikesCount, setCommentLikesCount] = useState({});
  const [commentReplyDeletePopup, setCommentReplyDeletePopup] = useState(false);





  const delComPopup = useRef(null);
  const debouncedCommentReplyLike = useDebounceCallback(async (commentId) => {
    const response = await axios.post("/api/videos/sendreplycommentlike", { commentId })
  }, 2000);

  const handleClickOutside = (event) => {
    if (delComPopup.current && !delComPopup.current.contains(event.target)) {
      setCommentReplyDeletePopup(false);
    }
  };

  useEffect(() => {
    if (comments) {

      dispatch({ type: "UPDATE_COMMENT_REPLY", payload: comments.replies || [] })
    }
  }, [comments]);



  useEffect(() => {
    if (state.commentArray) {
      const replyLikedComments = state.commentArray.reduce((acc, comm) => {
        if (comm.likes?.includes(user._id)) {
          acc.push(comm._id);
        }
        return acc;
      }, []);
      setCommentReplyLikes(replyLikedComments);


    }



    document.addEventListener('click', handleClickOutside, true);
    return () => {
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, [comments, state.commentArray])



  const commentReplyDelete = async (commentReplyId, contentToDelete) => {
    try {
      const updatedReplies = state.commentArray.filter(
        comment => !(comment.content === contentToDelete && comment.owner._id === user._id)
      );
      dispatch({ type: "UPDATE_COMMENT_REPLY", payload: updatedReplies });
      let response = await axios.post("/api/videos/deletecommentreply", { commentReplyId, commentId: comments._id })


    } catch (error) {
      console.log("comment reply delete karne me dikkat", error);

    }
  }




  const replyLikeComment = async (commentId, initialLikeCount) => {
    try {
      const currentCount = commentLikesCount[commentId] || initialLikeCount;
      if (commentReplyLikes.includes(commentId)) {
        const updatedCount = currentCount - 1;
        setCommentLikesCount(prevCounts => ({ ...prevCounts, [commentId]: updatedCount }));
        // If commentId is already in the array, remove it
        setCommentReplyLikes(prevLikes => prevLikes.filter(id => id !== commentId));
      } else {
        // If commentId is not in the array, add it
        const updatedCount = currentCount + 1;
        setCommentLikesCount(prevCounts => ({ ...prevCounts, [commentId]: updatedCount }));
        setCommentReplyLikes(prevLikes => [...prevLikes, commentId]);
      }
      debouncedCommentReplyLike(commentId);


    } catch (error) {
      console.log('kuch galt', error);

    }

  };




  const sendReplyComment = async (data) => {
    try {
      setIsLoading(true);

      let response = await axios.post("/api/videos/sendcommentreply", {
        content: data.comment,  // Adjusted to match the schema
        commentId: comments._id
      });

      let newCommentReply = {
        _id: response.data.data._id,
        content: data.comment,  // Adjusted to match the schema
        edited: false,
        likes: [],
        replies: [],
        replyOnComment: comments._id,
        createdAt: new Date(),
        owner: {
          _id: user._id,
          username: user.username,
          avatar: user.avatar
        }
      };

      setCommentReply((prevCommentsReply) => [...prevCommentsReply, newCommentReply]);

    } catch (error) {
      console.log("something wrong", error);

    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className={`flex-grow h-full overflow-y-auto w-full border-2 border-black p-2`}>
        {Array.isArray(state.commentArray) && state.commentArray.length > 0 ? state.commentArray.map((videoComment, index) => (
          <div key={index} className={`${comments ? "bg-slate-400" : "bg-gray-50"} relative flex flex-col p-3 rounded-lg mb-3 shadow-sm`}>
            <div className='flex gap-3 items-center w-full'>
              <div className='flex justify-between w-full'>
                <div className='flex gap-1 items-center'>
                  <div onClick={() => router.push(`/subscriptionprofile/${videoComment.owner.username}`)} className='flex items-center'>
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
                    setCommentReplyDeletePopup(true);
                  }}>{<RxDotsVertical />}</p>
                )}
              </div>
              {commentReplyDeletePopup && uniqueComment == index && (
                <div
                  ref={delComPopup}
                  className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 shadow-lg rounded-md z-10"
                >
                  <button
                    onClick={() => commentReplyDelete(videoComment._id, videoComment.content)}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-t-md"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => {
                      replyContent.setEditingReplyCommentId(videoComment._id);
                      replyContent.setEditedReplyContent(videoComment.content);
                      replyContent.setCurrentReplyCommentContent(videoComment.content);
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
                <button onClick={() => replyLikeComment(videoComment._id, videoComment.likes?.length)} className="text-blue-500 hover:underline">
                  {commentReplyLikes.includes(videoComment._id) ? <AiFillLike /> : <AiOutlineLike />}
                </button>
                <p>{commentLikesCount[videoComment._id] ?? videoComment.likes?.length}</p>
                <button onClick={() => {
                  // Handle reply button click
                }} className="ml-2 text-blue-500 hover:underline">Reply</button>
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
            <h1 className="text-lg text-gray-500">No Replies</h1>
          </div>
        )}
      </div>

    </>
  );
}

export default CommentReplyDiv;
