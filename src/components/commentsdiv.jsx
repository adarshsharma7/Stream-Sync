import React, { useEffect, useState } from 'react';
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
  comments,
  UniqueComment,
  CommentDeletePopup,
  commentDelete,
  commentContent,
  likeComment,
  form,
  saveEditedComment,
  loading,
  delComPopup,
  replyContent
}) {

const {state,dispatch}=useUser()
const [commentReply, setCommentsReply] = useState()
  const [isLoading, setIsLoading] = useState(false);

  const { data: session } = useSession();
  const user = session?.user;

  //   const replyForm = useForm({
  //     resolver: zodResolver(commentReplySchema),
  //     defaultValues: {
  //       commentReply: ""
  //     }
  //   });

  useEffect(() => {
    setCommentsReply(state.commentArray)
  }, [state.commentArray])
  

  const saveEditedReplyComment = async () => {
    try {
        loading.setEditCommentLoading(true);

        // Update the comment in state using dispatch
        dispatch({
            type: 'UPDATE_COMMENT_REPLY',
            payload: state.commentArray.map(comment =>
                comment._id === replyContent.editingReplyCommentId
                    ? { 
                        ...comment, 
                        content: replyContent.editedReplyContent, 
                        edited: true, 
                        updatedAt: new Date() 
                    } // Update the content
                    : comment // Keep other comments unchanged
            )
        });

        // Make the API call to update the comment on the server
        await axios.post("/api/videos/updatereplycomment", {
            content: replyContent.editedReplyContent,
            commentreplyId: replyContent.editingReplyCommentId
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


  const sendReplyComment = async (data) => {
    try {
      setIsLoading(true);

      let response = await axios.post("/api/videos/sendcommentreply", {
        content: data.comment,  // Adjusted to match the schema
        commentId: comments[0]._id
      });

      let newCommentReply = {
        _id: response.data.data._id,
        content: data.comment,  // Adjusted to match the schema
        edited: false,
        likes: [],
        replies: [],
        replyOnComment: comments[0]._id,
        createdAt: new Date(),
        owner: {
          _id: user._id,
          username: user.username,
          avatar: user.avatar
        }
      };

      setCommentsReply((prevCommentsReply) => [...prevCommentsReply, newCommentReply]);
      dispatch({ type: "UPDATE_COMMENT_REPLY", payload: [...commentReply, newCommentReply] });
    } catch (error) {
      console.log("something wrong", error);

    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className={`flex-grow h-full  overflow-y-auto w-full border-2`}>
        { comments.map((videoComment, index) => (
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
                    UniqueComment.setUniqueComment(index);
                    CommentDeletePopup.setCommentDeletePopup(true);
                  }}>{<RxDotsVertical />}</p>
                )}
              </div>
              {CommentDeletePopup.commentDeletePopup && UniqueComment.uniqueComment == index && (
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
                      commentContent.setEditingCommentId(videoComment._id);
                      commentContent.setEditedContent(videoComment.content);
                      commentContent.setCurrentCommentContent(videoComment.content);
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
                <button onClick={() => likeComment.likeComment(videoComment._id, videoComment.likes?.length)} className="text-blue-500 hover:underline">
                  {likeComment.commentLikes.includes(videoComment._id) ? <AiFillLike /> : <AiOutlineLike />}
                </button>
                <p>{likeComment.commentLikesCount[videoComment._id] ?? videoComment.likes?.length}</p>
                <button onClick={() => {
                  // Handle reply button click
                }} className="ml-2 text-blue-500 hover:underline"><MdOutlineInsertComment /></button>
              </div>
              <div>
                <p className='text-sm text-gray-600 font-extralight'>
                  {videoComment.updatedAt ? "updated" : "added"} {formatDistanceToNow(new Date(videoComment.updatedAt ? videoComment.updatedAt : videoComment.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>

          </div>
        )) }
      </div>

      <div className='fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-2 border-gray-300'>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(async (data) => {

              if (commentContent.editingCommentId) {
                await saveEditedComment();
              }else if(replyContent.editingReplyCommentId){
              await saveEditedReplyComment()
              } else {
                await sendReplyComment(data);
              }
              form.reset();
            })
            }
            className="flex items-center rounded-lg border border-gray-300 p-2 bg-gray-100"
          >
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
                          placeholder='Add your reply...'
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-500"
                          {...field}
                          value={commentContent.editingCommentId ? commentContent.editedContent : replyContent.editingReplyCommentId ? replyContent.editedReplyContent : field.value}
                          onChange={async (e) => {
                            field.onChange(e);
                            if (commentContent.editingCommentId) {
                              commentContent.setEditedContent(e.target.value);
                            } 
                            if(replyContent.editingReplyCommentId){
                              replyContent.setEditedReplyContent(e.target.value)
                            }

                          }}
                        />
                        {commentContent.editingCommentId || replyContent.editingReplyCommentId && (
                          <p
                            onClick={() => {
                              if(replyContent.editingReplyCommentId){
                                replyContent.setEditingReplyCommentId(null)
                                replyContent.setEditedReplyContent('')
                              }else{
                                commentContent.setEditedContent("");
                                commentContent.setEditingCommentId(null);
                              }
                             
                              field.onChange('');
                            }}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-red-500 text-white px-2 py-1 rounded cursor-pointer"
                          >
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
                  disabled={isLoading || loading.editCommentLoading || commentContent.currentCommentContent === commentContent.editedContent ||  replyContent.editedReplyContent === replyContent.currentReplyCommentContent }
                  className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg"
                >
                  {commentContent.editingCommentId || replyContent.editingReplyCommentId ? 'Update' : 'Reply'}
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
