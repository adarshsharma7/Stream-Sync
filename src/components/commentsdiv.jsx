import React, { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { AiOutlineLike, AiFillLike } from "react-icons/ai";
import { RxDotsVertical, RxCross2 } from "react-icons/rx";
import { MdOutlineInsertComment } from "react-icons/md";
import { formatDistanceToNow } from 'date-fns';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import axios from 'axios';
import { useUser } from '@/context/context';


function CommentsDiv({
  allComments,
  comments,
  setFilteredComments,
  UniqueComment,
  commentDelete,
  likeComment,
  form,
  saveEditedComment,
  loading,
  replyContent,
  replyToReplyConntent,
  router = { router }
}) {

  const { state, dispatch } = useUser()
  const [isLoading, setIsLoading] = useState(false);
  const [focusComment, setFocusComment] = useState(false);
  const [commentDeletePopup, setCommentDeletePopup] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedContent, setEditedContent] = useState('');
  const [currentCommentContent, setCurrentCommentContent] = useState();

  const { data: session } = useSession();
  const user = session?.user;



  const inputRef = useRef(null);
  const delComPopup = useRef(null);

  const handleClickOutside = (event) => {
    if (delComPopup.current && !delComPopup.current.contains(event.target)) {
      setCommentDeletePopup(false)
    }
    if (inputRef.current && !inputRef.current.contains(event.target)) {
      replyContent.setEditingReplyCommentId(null);
      replyContent.setEditedReplyContent("");
      replyContent.setCurrentReplyCommentContent();
      setEditingCommentId(null);
      setEditedContent("");
      setCurrentCommentContent();
      replyToReplyConntent.setCommentReplytoReply({ Id: "", username: "" })

    }
  };
  useEffect(() => {


    document.addEventListener('click', handleClickOutside, true);
    return () => {
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, [focusComment]);

  useEffect(() => {
    // Automatically update filteredComments whenever allComments change
    setFilteredComments(allComments.comments);
  }, [allComments]);


  //   const replyForm = useForm({
  //     resolver: zodResolver(commentReplySchema),
  //     defaultValues: {
  //       commentReply: ""
  //     }
  //   });



  const saveEditedReplyComment = async () => {
    try {
      loading.setEditCommentLoading(true);

      // Update the comment in state using setComments
      allComments.setComments((prevComments) =>
        prevComments.map((comment) =>
          comment._id === comments[0]._id
            ? {
              ...comment,
              replies: comment.replies.map((reply) =>
                reply._id === replyContent.editingReplyCommentId
                  ? {
                    ...reply,
                    content: replyContent.editedReplyContent,
                    edited: true,
                    updatedAt: new Date(),
                  }
                  : reply
              ),
            }
            : comment // Return the original comment if the ID doesn't match
        )
      );
      setFilteredComments((prevComments) =>
        prevComments.map((comment) =>
          comment._id === comments[0]._id
            ? {
              ...comment,
              replies: comment.replies.map((reply) =>
                reply._id === replyContent.editingReplyCommentId
                  ? {
                    ...reply,
                    content: replyContent.editedReplyContent,
                    edited: true,
                    updatedAt: new Date(),
                  }
                  : reply
              ),
            }
            : comment // Return the original comment if the ID doesn't match
        )
      );

      dispatch({
        type: "UPDATE_COMMENT_REPLY",
        payload: state.commentArray.map((comment) =>
          comment._id === replyContent.editingReplyCommentId
            ? {
              ...comment,
              content: replyContent.editedReplyContent,
              edited: true,
              updatedAt: new Date(),
            }
            : comment
        ),
      });

      // Make the API call to update the comment on the server
      await axios.post("/api/videos/updatereplycomment", {
        content: replyContent.editedReplyContent,
        commentreplyId: replyContent.editingReplyCommentId,
      });

      // Clear the editing state
      replyContent.setEditingReplyCommentId(null);
      replyContent.setEditedReplyContent("");
    } catch (error) {
      console.error("Error updating the reply comment:", error);
    } finally {
      loading.setEditCommentLoading(false);
    }
  };



  const sendReplyComment = async (data, repliedId) => {
    try {
      setIsLoading(true);

      let response = await axios.post("/api/videos/sendcommentreply", {
        content: data,
        commentId: comments[0]._id,
        repliedId: repliedId ? repliedId : undefined
      });

      let newCommentReply = {
        _id: response.data.data._id,
        content: data,  // Adjusted to match the schema
        edited: false,
        likes: [],
        replies: repliedId ? [repliedId] : [],
        replyOnComment: comments[0]._id,
        createdAt: new Date(),
        owner: {
          _id: user._id,
          username: user.username,
          avatar: user.avatar
        }
      };

      //this is for updating instantly the length of comments reply in main comment section
      allComments.setComments((prevComments) =>
        prevComments.map(comment => {
          if (comment._id === comments[0]._id) {
            // Update the replies array
            return {
              ...comment,
              replies: [...comment.replies, newCommentReply]
            };
          }
          return comment;
        })
      );

      //this for adding new reply and showing instantly on a reply comment
      dispatch({ type: "UPDATE_COMMENT_REPLY", payload: [...state.commentArray, newCommentReply] });
      replyToReplyConntent?.setCommentReplytoReply({ Id: "", username: "" })
    } catch (error) {
      console.log("something wrong", error);

    } finally {
      setIsLoading(false);
    }
  };
  const requireLogin = (action) => {
    if (!user) {
      // ✅ Replace below with your popup logic or redirect
      alert("Please login to continue."); // or setShowLoginPopup(true)
      router.push('/sign-in');
      return;
    }
    return action();
  };


  return (
    <>
      <div className={`flex-grow h-full md:h-[100px] overflow-y-auto w-full border-2`}>
        {comments.map((videoComment, index) => (
          <div key={index} className={`bg-slate-400 relative flex flex-col p-3 rounded-lg mb-3 shadow-sm`}>
            <div className='flex gap-3 items-center w-full'>
              <div className='flex justify-between w-full'>
                <div className='flex gap-1 items-center'>
                  <div onClick={() => router.push(`/subscriptionprofile/${videoComment.owner?.username}`)} className='flex items-center'>
                    <div className='mr-3 h-10 w-10 rounded-full overflow-hidden border-2 border-gray-200'>
                      <img src={videoComment.owner?.avatar} alt="" className="object-cover w-full h-full" />
                    </div>
                    <p className="font-medium text-gray-800">@{videoComment.owner?.username}</p>
                  </div>
                  <p className='text-sm font-light '>{videoComment.edited ? "edited" : ""}</p>
                </div>
                {videoComment.owner?._id == user?._id && (
                  <p onClick={() => {
                    UniqueComment.setUniqueComment(index);
                    setCommentDeletePopup(true)

                  }}>{<RxDotsVertical />}</p>
                )}
              </div>
              {commentDeletePopup && UniqueComment.uniqueComment == index && (
                <div
                  ref={delComPopup}
                  className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 shadow-lg rounded-md z-10"
                >
                  <button
                    onClick={() => requireLogin(() => {  commentDelete(videoComment._id, videoComment.content) })}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-t-md"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => {
                      requireLogin(() => {
                        if (replyContent.setEditingReplyCommentId) {
                          replyContent.setEditingReplyCommentId(null);
                          replyContent.setEditedReplyContent("");
                          replyContent.setCurrentReplyCommentContent();
                        }


                        setEditingCommentId(videoComment._id);
                        setEditedContent(videoComment.content);
                        setCurrentCommentContent(videoComment.content);
                      });
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
                <button onClick={() => requireLogin(() => { likeComment.likeComment(videoComment._id, videoComment.likes?.length) })} className="text-blue-500 hover:underline">
                  {likeComment.commentLikes.includes(videoComment._id) ? <AiFillLike /> : <AiOutlineLike />}
                </button>
                <p>{likeComment.commentLikesCount[videoComment._id] ?? videoComment.likes?.length}</p>
                <button onClick={() => setFocusComment(true)} className="ml-2 text-blue-500 hover:underline"><MdOutlineInsertComment /></button>
                <p>{videoComment.replies?.length}</p>
              </div>
              <div>
                <p className='text-sm text-gray-600 font-extralight'>
                  {videoComment.updatedAt ? "updated" : "added"} {formatDistanceToNow(new Date(videoComment.updatedAt ? videoComment.updatedAt : videoComment.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>

          </div>
        ))}
      </div >

      <div ref={inputRef} className='fixed bottom-0 md:bottom-[85px] left-0 right-0 z-50 bg-white border-t border-2 border-gray-300'>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(async (data) => {
              requireLogin(async () => {
                let finalContent;

                // Concatenate the username if it's a reply to a reply
                if (replyToReplyConntent.commentReplytoReply.username) {
                  finalContent = `@${replyToReplyConntent.commentReplytoReply.username} ${data.comment}`;
                } else {
                  finalContent = data.comment;
                }


                if (editingCommentId) {
                  await saveEditedComment();
                } else if (replyContent.editingReplyCommentId) {
                  await saveEditedReplyComment()
                } else if (replyToReplyConntent.commentReplytoReply.Id) {
                  await sendReplyComment(finalContent, replyToReplyConntent.commentReplytoReply.Id);
                } else {
                  await sendReplyComment(finalContent);
                }


                form.reset();
              });
            })
            }
            className="flex items-center rounded-lg border border-gray-300 p-2 bg-gray-100"
          >
            <div className="flex-grow ">
              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <Input

                          type='text'

                          placeholder={replyContent.editingReplyCommentId ? 'Edit your reply...' : replyToReplyConntent.commentReplytoReply.username ? 'Reply to this... ' : 'Add your reply...'}

                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-500"
                          {...field}
                          value={editingCommentId ? editedContent : replyContent.editingReplyCommentId ? replyContent.editedReplyContent : replyToReplyConntent.commentReplytoReply.username ? `@${replyToReplyConntent.commentReplytoReply.username} ${field.value}` : field.value}
                          onChange={async (e) => {
                            field.onChange(e);
                            if (editingCommentId) {
                              setEditedContent(e.target.value);
                            }
                            if (replyContent.editingReplyCommentId) {
                              replyContent.setEditedReplyContent(e.target.value)
                            }
                            // Prevent user from deleting the `@username` part
                            if (replyToReplyConntent.commentReplytoReply.username) {
                              const cursorPosition = e.target.selectionStart;
                              const usernamePart = `@${replyToReplyConntent.commentReplytoReply.username} `;
                              if (cursorPosition <= usernamePart.length) {
                                e.target.value = usernamePart + e.target.value.slice(usernamePart.length);
                                e.target.setSelectionRange(usernamePart.length, usernamePart.length);
                              }
                              field.onChange(e.target.value.slice(usernamePart.length));
                            } else {
                              field.onChange(e);
                            }

                          }}
                        />

                        {/* {commentContent.editingCommentId || replyContent.editingReplyCommentId && (
                          <p
                            onClick={() => {
                              if (replyContent.editingReplyCommentId) {
                                replyContent.setEditingReplyCommentId(null)
                                replyContent.setEditedReplyContent('')
                              }else {
                                commentContent.setEditedContent("");
                                commentContent.setEditingCommentId(null);
                              }

                              field.onChange('');
                            }}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-red-500 text-white px-2 py-1 rounded cursor-pointer"
                          >
                            <RxCross2 />
                          </p>
                        )} */}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="ml-2">
              {isLoading || loading.editCommentLoading ? (
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
                  disabled={isLoading || loading.editCommentLoading || currentCommentContent === editedContent || replyContent.editedReplyContent === replyContent.currentReplyCommentContent}
                  className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg"
                >
                  {editingCommentId || replyContent.editingReplyCommentId ? 'Update' : 'Reply'}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>

    </>
  );
}

export default CommentsDiv;
