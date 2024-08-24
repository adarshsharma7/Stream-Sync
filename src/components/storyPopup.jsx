import { useState, useEffect, useRef } from 'react';
import { IoClose } from "react-icons/io5";

function StoryComponent({ story, closePopup }) {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false); // To manage pause state
  const storyRef = useRef(null);

  useEffect(() => {
    // Skip progress handling for video files
    if (story.stories[currentStoryIndex].file.endsWith('.mp4') ||
        story.stories[currentStoryIndex].file.endsWith('.webm') ||
        story.stories[currentStoryIndex].file.endsWith('.ogg')) {
      setProgress(0); // Reset progress for video
      return; // Skip progress for video files
    }

    const duration = 5000; // 5 seconds for images
    const interval = 100; // Progress update interval

    if (isPaused) return; // Skip progress update if paused

    setProgress(0); // Reset progress when a new story starts
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          handleStoryEnd(); // Move to the next story when progress completes
          return 100;
        }
        return prev + (100 / (duration / interval));
      });
    }, interval);

    return () => clearInterval(timer);
  }, [currentStoryIndex, isPaused]);

  const handleStoryEnd = () => {
    if (currentStoryIndex < story.stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else {
      // Optionally, handle when all stories have been viewed
      closePopup();
    }
  };

  const handleVideoEnd = () => {
    handleStoryEnd();
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsPaused(true); // Pause the story
  };

  const handleMouseUp = () => {
    setIsPaused(false); // Resume the story
  };

  const handleClick = (e) => {
    const { clientX } = e;
    const { offsetWidth } = storyRef.current;
    const clickPosition = clientX / offsetWidth;

    if (clickPosition < 0.3) {
      // Click on the left side of the screen
      setCurrentStoryIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (clickPosition > 0.7) {
      // Click on the right side of the screen
      setCurrentStoryIndex((prev) => (prev < story.stories.length - 1 ? prev + 1 : prev));
    }
  };

  return (
    <div
      className='fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-50'
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      ref={storyRef}
    >
      <div className='h-[90%] w-[90%] bg-white flex flex-col gap-2 rounded-lg overflow-hidden p-2'>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">{story.username}</h2>
          <IoClose className="cursor-pointer" onClick={closePopup} />
        </div>
        <div className='flex gap-1 w-full px-2'>
          {story.stories.map((_, index) => (
            <div
              key={index}
              className='flex-1 h-1 rounded bg-gray-300 relative overflow-hidden'
            >
              {index === currentStoryIndex && !story.stories[currentStoryIndex].file.endsWith('.mp4') && (
                <div
                  className='absolute top-0 left-0 h-full bg-blue-500'
                  style={{ width: `${progress}%` }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Story Content */}
        {story.stories[currentStoryIndex].file.endsWith('.mp4') ||
          story.stories[currentStoryIndex].file.endsWith('.webm') ||
          story.stories[currentStoryIndex].file.endsWith('.ogg') ? (
          <video
            className='max-w-full max-h-full'
            controls
            onEnded={handleVideoEnd}
            autoPlay
          >
            <source src={story.stories[currentStoryIndex].file} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <img
            src={story.stories[currentStoryIndex].file}
            alt="story content"
            className='max-w-full max-h-full object-contain'
          />
        )}
      </div>
    </div>
  );
}

export default StoryComponent;
