import React, { useEffect, useRef, useState } from 'react';
import { AiOutlineLike, AiFillLike } from "react-icons/ai";
import { RxDotsVertical, RxCross2 } from "react-icons/rx";
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';
import { useDebounceCallback } from '@react-hook/debounce';
import { useUser } from '@/context/context';
import { useRouter } from 'next/navigation';

function CommentReplyDiv({allComments, comments, user, replyContent, replyToReplyConntent, commentContent }) {

  const { state, dispatch } = useUser()

  const [isLoading, setIsLoading] = useState(false)
  const [uniqueComment, setUniqueComment] = useState()
  const [commentReplyLikes, setCommentReplyLikes] = useState([])
  const [commentLikesCount, setCommentLikesCount] = useState({});
  const [commentReplyDeletePopup, setCommentReplyDeletePopup] = useState(false);
  const [highlightedCommentId, setHighlightedCommentId] = useState(null);



  let router = useRouter()

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
  document.addEventListener('click', handleClickOutside, true);
  return () => {
    document.removeEventListener('click', handleClickOutside, true);
  };

}, [commentReplyDeletePopup,delComPopup])



  useEffect(() => {
    if (comments) {

      dispatch({ type: "UPDATE_COMMENT_REPLY", payload: comments.replies || [] })
    }
  }, [comments]);

  // useEffect(() => {
  //   // Find the specific comment by its ID in allComments.comments
  //   if(comments){
  //     const matchedComment = allComments.comments.find(comment => comment._id === comments._id);
  
  //     if (matchedComment) {
  //       // Calculate liked replies for the matched comment's replies
  //       const replyLikedComments = matchedComment.replies.reduce((acc, reply) => {
  //         if (reply.likes?.includes(user._id)) {
  //           acc.push(reply._id);
  //         }
  //         return acc;
  //       }, []);
  //       setCommentReplyLikes(replyLikedComments);
    
  //       // Perform any additional updates or operations on matchedComment
  //       // If necessary, update allComments state here (if you need to trigger a re-render)
  //     }
  //   }
    
  // }, [comments, allComments]);
  





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
  

  }, [comments, state.commentArray])



  const commentReplyDelete = async (commentReplyId, contentToDelete) => {
    try {
      const updatedReplies = state.commentArray.filter(
        comment => !(comment.content === contentToDelete && comment.owner._id === user._id)
      );

      dispatch({ type: "UPDATE_COMMENT_REPLY", payload: updatedReplies });
    
      allComments.setComments((prevComments) =>
        prevComments.map(comment => {
          if (comment._id === comments._id) {  // Replace comments[0]._id with the actual comment ID you're targeting
            return {
              ...comment,
              replies: comment.replies.filter(reply => reply._id !== commentReplyId)
            };
          }
          return comment;
        })
      );
      
       
   
      let response = await axios.post("/api/videos/deletecommentreply", { commentReplyId, commentId: comments._id })


    } catch (error) {
      console.log("comment reply delete karne me dikkat", error);

    }
  }




  const replyLikeComment = async (commentId, initialLikeCount) => {
    try {
      const currentCount = commentLikesCount[commentId] || initialLikeCount;
      if (commentReplyLikes.includes(commentId)) {

allComments.setComments((prevComments) =>
  prevComments.map((comment) => {
    if (comment._id === comments._id) {
      // Iterate through the replies of the matched comment
      const updatedReplies = comment.replies.map((reply) => {
        if (reply._id === commentId) { // Assuming you're targeting a specific reply
          // Create a new likes array by filtering out the user._id
          const newLikes = reply.likes.filter(like => like !== user._id);
          
          // Return the updated reply with the new likes array
          return {
            ...reply,
            likes: newLikes,
          };
        }
        return reply; // Return other replies unchanged
      });

      // Return the updated comment with the new replies array
      return {
        ...comment,
        replies: updatedReplies,
      };
    }
    return comment; // Return other comments unchanged
  })
);


        const updatedCount = currentCount - 1;
        setCommentLikesCount(prevCounts => ({ ...prevCounts, [commentId]: updatedCount }));

        // If commentId is already in the array, remove it
        setCommentReplyLikes(prevLikes => prevLikes.filter(id => id !== commentId));
      } else {
        // If commentId is not in the array, add it
        const updatedCount = currentCount + 1;
        setCommentLikesCount(prevCounts => ({ ...prevCounts, [commentId]: updatedCount }));


        allComments.setComments((prevComments) =>
          prevComments.map((comment) => {
            if (comment._id === comments._id) {
              // Iterate through the replies of the matched comment
              const updatedReplies = comment.replies.map((reply) => {
                if (reply._id === commentId) { // Assuming you're targeting a specific reply
                  // Create a new likes array and add the new like
                  const newLikes = [...reply.likes, user._id];
                  
                  // Return the updated reply with the new likes array
                  return {
                    ...reply,
                    likes: newLikes,
                  };
                }
                return reply; // Return other replies unchanged
              });
        
              // Return the updated comment with the new replies array
              return {
                ...comment,
                replies: updatedReplies,
              };
            }
            return comment; // Return other comments unchanged
          })
        );
        

        setCommentReplyLikes(prevLikes => [...prevLikes, commentId]);
      }
      debouncedCommentReplyLike(commentId);


    } catch (error) {
      console.log('kuch galt', error);

    }

  };

  const handleCommentClick = (commentId) => {
    const clickedComment = state.commentArray.find(comment => comment._id === commentId);
  
    if (clickedComment && clickedComment.replies && clickedComment.replies.length > 0) {
      const firstReplyIndex = state.commentArray.findIndex(comment => comment._id === clickedComment.replies[0]);
  
      setHighlightedCommentId(`comment-${firstReplyIndex}`);
  
      // Scroll to the comment
      document.getElementById(`comment-${firstReplyIndex}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
  
      // Remove the highlight after 3 seconds
      setTimeout(() => setHighlightedCommentId(null), 2000);
    }
  };


  return (
    <>
      <div className={`${state.commentArray.length > 0 ? "border-black border-2" : ""} flex-grow h-full overflow-y-auto w-full p-2 md:pb-[90px]`}>
        {Array.isArray(state.commentArray) && state.commentArray.length > 0 ? state.commentArray.map((videoComment, index) => (

          <div key={index} id={`comment-${index}`} className={`bg-slate-400 relative flex flex-col p-3 rounded-lg mb-3 shadow-sm ${highlightedCommentId === `comment-${index}` ? 'bg-yellow-200' : ''}`}>
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
                      if (commentContent.editingCommentId) {
                        commentContent.setEditingCommentId(null);
                        commentContent.setEditedContent("");
                        commentContent.setCurrentCommentContent();
                      }

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
              <h2  onClick={() => handleCommentClick(videoComment._id)} className="text-base text-gray-700 break-words">{videoComment.content}</h2>
            </div>
            <div className="flex mt-2 space-x-4 justify-between">
              <div className='flex gap-1'>
                <button onClick={() => replyLikeComment(videoComment._id, videoComment.likes?.length)} className="text-blue-500 hover:underline">
                  {commentReplyLikes.includes(videoComment._id) ? <AiFillLike /> : <AiOutlineLike />}
                </button>
                <p>{commentLikesCount[videoComment._id] ?? videoComment.likes?.length}</p>
                <button onClick={() => {
                  replyToReplyConntent.setCommentReplytoReply({ Id: videoComment._id, username: videoComment.owner.username })
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
