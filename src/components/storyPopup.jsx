import { useState, useEffect, useRef } from 'react';
import { IoClose } from "react-icons/io5";
import { FcNext, FcPrevious } from "react-icons/fc";
import { RxDotsVertical } from "react-icons/rx";
import axios from 'axios';

function StoryComponent({ story,setMyStories,setStoryMsg, closePopup, myStory = false }) {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [deletePopup, setDeletePopup] = useState(false);

  const intervalIdRef = useRef(null);
  const storyRef = useRef(null);
  const videoRef = useRef(null); // Ref for the video element
  const delRef = useRef(null); // Ref for the video element

  useEffect(() => {

    // Check if the current story is a video, if yes, return to avoid setting an interval
    if (
      story.stories[currentStoryIndex].file.endsWith('.mp4') ||
      story.stories[currentStoryIndex].file.endsWith('.webm') ||
      story.stories[currentStoryIndex].file.endsWith('.ogg')
    ) {
      return;
    }

    const duration = 5000; // 5 seconds for images
    const interval = 100;

    if (!isPaused) {
      const id = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(id);
            handleStoryEnd();
            return 100;
          }
          return prev + (100 / (duration / interval));
        });
      }, interval);

      intervalIdRef.current = id; // Store interval ID in ref
    }

    return () => clearInterval(intervalIdRef.current);
  }, [currentStoryIndex, isPaused]);

  const handleStoryEnd = () => {
    if (currentStoryIndex < story.stories.length - 1) {
      setProgress(0)
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else {
      closePopup();
    }
  };

  const handleVideoEnd = () => {
    handleStoryEnd();
  };


  const handlePause = (e) => {
    e.preventDefault();
    clearInterval(intervalIdRef.current);
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
  };



  const handleClick = (e) => {
    const { clientX } = e;
    const { offsetWidth } = storyRef.current;
    const clickPosition = clientX / offsetWidth;

    if (clickPosition < 0.3) {
      setCurrentStoryIndex((prev) => (prev > 0 ? prev - 1 : prev));
      setProgress(0);
    } else if (clickPosition > 0.7) {
      setCurrentStoryIndex((prev) => (prev < story.stories.length - 1 ? prev + 1 : prev));
      setProgress(0);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      const duration = videoRef.current.duration;
      const progress = (currentTime / duration) * 100;
      setProgress(progress);
    }
  };


  const handleClickOutside = (event) => {
    if (delRef.current && !delRef.current.contains(event.target)) {
      setDeletePopup(false);
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside, true);
    return () => {
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, []);


const deleteStory=async(storyId)=>{
  try {
  setMyStories((prevState) => ({
    ...prevState,
    stories: prevState.stories.filter((story) => story._id !== storyId),
  }));

    let response=await axios.post("/api/videos/deletestories",{Id:storyId})
    setStoryMsg(response.data.message) 
} catch (error) {
  console.log("kuch galt",error);
  
}

}


  return (
    <div
      className='fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-50'
      onMouseDown={deletePopup ? null : handlePause}
      onMouseUp={deletePopup ? null : handleResume}
      onTouchStart={deletePopup ? null : handlePause}
      onTouchEnd={deletePopup ? null : handleResume}
      onClick={deletePopup ? null : handleClick}
      ref={storyRef}
    >
      <div className='h-[90%] w-[90%] bg-white flex flex-col gap-2 rounded-lg overflow-hidden p-2'>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">{story.username}</h2>
          <IoClose className="cursor-pointer" onClick={closePopup} />
        </div>
        <div className='flex gap-1 w-full px-2 mb-4 md:mb-0'>

          {story.stories.map((_, index) => (
            <div
              key={index}
              className='flex-1 h-1 rounded bg-gray-300 relative overflow-hidden'
            >
              {index === currentStoryIndex && (
                <div
                  className='absolute top-0 left-0 h-full bg-blue-500'
                  style={{ width: `${progress}%` }}
                />
              )}
            </div>
          ))}
        </div>
        <div className='md:flex md:h-full md:w-full md:justify-evenly md:items-center relative'>
          <div className='hidden md:block'><FcPrevious /></div>
          {/* Story Content */}
          {story.stories[currentStoryIndex].file.endsWith('.mp4') ||
            story.stories[currentStoryIndex].file.endsWith('.webm') ||
            story.stories[currentStoryIndex].file.endsWith('.ogg') ? (
            <video
              ref={videoRef}
              className='max-w-full max-h-full'
              controls
              onEnded={handleVideoEnd}
              onTimeUpdate={handleTimeUpdate} // Update progress as video plays
              autoPlay
              onLoad={() => setIsPaused(false)}
            >
              <source src={story.stories[currentStoryIndex].file} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <img
              src={story.stories[currentStoryIndex].file}
              alt="story content"
              className='max-w-full max-h-full object-fill'
              onLoad={() => setIsPaused(false)} // Start progress after image loads
            />
          )}

          <div className='hidden md:block'><FcNext /></div>
          {myStory && (
            <div onClick={(e) => {
              e.stopPropagation();
              clearInterval(intervalIdRef.current);
              setIsPaused(true);
              setDeletePopup(true)
            }} className='absolute right-2 top-2'> <RxDotsVertical /></div>
          )

          }
          {deletePopup && (
            <div ref={delRef} className='absolute right-6 top-7 h-3 w-5 border-2 border-black'>
              <h1 onClick={(e)=>{
                e.preventDefault()
                deleteStory(story.stories[currentStoryIndex]._id)}} className='cursor-pointer'>Delete</h1>
            </div>
          )

          }

        </div>

      </div>
    </div>
  );
}

export default StoryComponent;
