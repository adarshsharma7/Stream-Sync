import { useState, useEffect, useRef } from 'react';
import { IoClose } from "react-icons/io5";
import { FcNext, FcPrevious } from "react-icons/fc";
import { RxDotsVertical } from "react-icons/rx";
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns'

function StoryComponent({ story, myStories, setMyStories, setStoryMsg, closePopup, myStory = false }) {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [deletePopup, setDeletePopup] = useState(false);

  const intervalIdRef = useRef(null);
  const storyRef = useRef(null);
  const videoRef = useRef(null);
  const delRef = useRef(null);



  useEffect(() => {
  // Clear any existing intervals
  clearInterval(intervalIdRef.current);

  if (
    story.stories[currentStoryIndex]?.file.endsWith('.mp4') ||
    story.stories[currentStoryIndex]?.file.endsWith('.webm') ||
    story.stories[currentStoryIndex]?.file.endsWith('.ogg')
  ) {
    if (videoRef.current) {
      videoRef.current.load(); // Reload the video element to ensure it starts from the beginning
    }
    // No interval needed for videos, so return early but without conditionally exiting the hook
    return;
  }

  // For image stories
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

    intervalIdRef.current = id;
  }

  // Cleanup function to clear the interval
  return () => clearInterval(intervalIdRef.current);
}, [currentStoryIndex, isPaused]);

  const handleStoryEnd = () => {
    if (currentStoryIndex < story.stories.length - 1) {
      setProgress(0);
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else {
      closePopup();
    }
  };

  const handleVideoEnd = () => {
    handleStoryEnd();
  };

  const handlePause = (e) => {
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
      if (currentStoryIndex > 0) {
        setProgress(0);
        setCurrentStoryIndex(currentStoryIndex - 1);
      }
    } else if (clickPosition > 0.7) {
      if (currentStoryIndex < story.stories.length - 1) {
        setProgress(0);
        setCurrentStoryIndex(currentStoryIndex + 1);
      }
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
      setIsPaused(false);
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside, true);
    return () => {
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, []);

  const deleteStory = async (storyId) => {
    try {
      setMyStories((prevState) => {
        const updatedStories = prevState.stories.filter((story) => story._id !== storyId);

        if (updatedStories.length === 0) {
          closePopup();
        }
        return {
          ...prevState,
          stories: updatedStories,
        };


      });

      setDeletePopup(false)

      let response = await axios.post("/api/videos/deletestories", { Id: storyId });
      setStoryMsg(response.data.message);

    } catch (error) {
      console.log("kuch galt", error);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50"
      onMouseDown={deletePopup ? null : handlePause}
      onMouseUp={deletePopup ? null : handleResume}
      onTouchStart={deletePopup ? null : handlePause}
      onTouchEnd={deletePopup ? null : handleResume}
      onClick={deletePopup ? null : handleClick}
      ref={storyRef}
    >
      <div className="h-[90%] w-[90%] bg-white flex flex-col gap-4 rounded-lg overflow-hidden shadow-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <div className='flex gap-2'>
            <h2 className="text-xl font-semibold text-gray-800">{story.username}</h2>
            <p>{formatDistanceToNow(new Date(story.stories[currentStoryIndex].createdAt), { addSuffix: true })}</p>
          </div>

          <IoClose className="cursor-pointer text-gray-600 hover:text-gray-800 transition duration-200" onClick={closePopup} />
        </div>
        <div className="flex gap-2 w-full px-4 mb-6">
          {story.stories.map((_, index) => (
            <div
              key={index}
              className="flex-1 h-1 rounded bg-gray-300 relative overflow-hidden"
            >
              {index === currentStoryIndex && (
                <div
                  className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-500 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex flex-col md:flex-row md:justify-between items-center relative h-full md:h-[80%] md:w-full ">
          <FcPrevious className="hidden md:block text-3xl cursor-pointer hover:text-gray-600 transition duration-200" />
          {story.stories[currentStoryIndex]?.file.endsWith('.mp4') ||
            story.stories[currentStoryIndex]?.file.endsWith('.webm') ||
            story.stories[currentStoryIndex]?.file.endsWith('.ogg') ? (
            <video
              ref={videoRef}
              className="max-w-full max-h-full object-contain object-center rounded-lg shadow-lg border border-gray-300"
              controls
              onEnded={handleVideoEnd}
              onTimeUpdate={handleTimeUpdate}
              autoPlay
              onLoad={() => setIsPaused(false)}
              poster="loading-spinner.gif"
            >
              <source src={story.stories[currentStoryIndex]?.file} type="video/mp4" />
              Your browser does not support the video tag.
            </video>

          ) : (
            <img
              src={story.stories[currentStoryIndex]?.file}
              alt="story content"
              className="max-w-full max-h-full object-contain object-center rounded-lg shadow-lg border border-gray-300"
              onLoad={() => setIsPaused(false)}
              loading="lazy"
            />

          )}
          <FcNext className="hidden md:block text-3xl cursor-pointer hover:text-gray-600 transition duration-200" />
          {myStory && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                clearInterval(intervalIdRef.current);
                setIsPaused(true);
                setDeletePopup(true);
              }}
              className="absolute right-4 top-4 text-gray-600 hover:text-gray-800 transition duration-200 cursor-pointer"
            >
              <RxDotsVertical />
            </div>
          )}
          {deletePopup && (
            <div
              ref={delRef}
              className="absolute right-8 top-8 bg-white border border-gray-300 rounded-md shadow-lg p-2"
            >
              <h1
                onClick={(e) => {
                  e.preventDefault();
                  deleteStory(story.stories[currentStoryIndex]?._id);
                }}
                className="cursor-pointer text-red-600 hover:text-red-800 transition duration-200"
              >
                Delete
              </h1>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StoryComponent;
