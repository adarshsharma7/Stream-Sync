"use client";
import React, { useEffect, useState, useRef } from 'react';
import { FaYoutube } from "react-icons/fa";
import { CiSearch } from "react-icons/ci";
import { IoClose, IoMic } from "react-icons/io5";
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { useUser } from '@/context/context';
import Fuse from 'fuse.js';
import Image from 'next/image';
import { IoIosAddCircle } from "react-icons/io";
import { RiFolderHistoryFill } from "react-icons/ri";
import { uploadToCloudinary } from "@/components/uploadtocloudinary"
import Notification from '@/components/notificationpopup';
import StoryPopup from '@/components/storyPopup';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton"
import io from 'socket.io-client';


let socket;
function Page() {

  const { state, dispatch } = useUser();


  const [searchTerm, setSearchTerm] = useState("");
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [videosFetchingMessage, setVideosFetchingMessage] = useState("");
  const [searchVisible, setSearchVisible] = useState(false);
  const [micPopup, setMicPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [heading, setHeading] = useState("");
  const [stories, setStories] = useState([]);
  const [showMyStory, setShowMyStory] = useState(false);
  const [myStories, setMyStories] = useState([]);
  const [uniqueStoryPopup, setUniqueStoryPopup] = useState(undefined);
  const [videoProgress, setVideoProgress] = useState(0);
  const [storyMsg, setStoryMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProcessing, setUploadProcessing] = useState(false);
  const [uploadProcessCount, setUploadProcessCount] = useState(0);
  const [totalQueueFiles, setTotalQueueFiles] = useState(0);
  const [noStoryMsg, setNoStoryMsg] = useState('');

  const { data: session } = useSession();
  const user = session?.user;

  const searchRef = useRef(null);
  const router = useRouter();
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN,hi-IN';

      recognition.onresult = (event) => {
        setMicPopup(false);
        setSearchVisible(true);
        let transcript = event.results[0][0].transcript;
        // Remove trailing period, whitespace, and any hidden characters
        transcript = transcript.replace(/\.$/, "").trim();
        // Normalize the input (you can also remove special characters if needed)
        transcript = transcript.normalize('NFKD').replace(/[\u0300-\u036f]/g, "").toLowerCase();

        setSearchTerm(transcript);
        handleSearch(transcript);
      };

      recognition.onerror = (event) => {
        setErrorMessage(`Error occurred: ${event.error}`);
      };

      recognition.onspeechend = () => {
        recognition.stop();

      };

      recognitionRef.current = recognition;
    } else {
      alert('Your browser does not support the Web Speech API. Please try this in Google Chrome.');
    }
  }, []);

  const onClose = () => {
    setMicPopup(false);

  };

  useEffect(() => {
    const fetchAllVideos = async () => {
      const response = await axios.get("/api/videos/getallvideos");
      dispatch({ type: "CURRENT_USER_AVATAR", payload: response.data.currentUser });
      if (response.data.status === 400) {
        setVideosFetchingMessage(response.data.message);
      } else {
        dispatch({ type: "FETCHED_ALL_VIDEOS", payload: response.data.data });
        setFilteredVideos(response.data.data);
      }
    };
    fetchAllVideos();
  }, [dispatch]);

  useEffect(() => {
    // Initialize Socket.IO client
    socket = io()

    // Fetch initial stories
    const fetchAllStories = async () => {
      try {
        const response = await axios.get("/api/users/stories");
        setMyStories(response.data.data);
        console.log("ye hai respponsedatadata", response.data.data);

        if (response.data.data?.subscriptions.length > 0) {
          const filtered = response.data.data.subscriptions
            .filter(sub => sub.stories.length > 0)
            .map(sub => ({
              _id: sub._id,
              username: sub.username,
              avatar: sub.avatar,
              stories: sub.stories
            }));
          if (filtered.length === 0) {
            setNoStoryMsg("No stories");
          }
          setStories(filtered);
          console.log("ye hai filtered", filtered);
        }
      } catch (error) {
        console.log("Error fetching stories:", error);
      }
    };

    fetchAllStories();

    // Listen for new story updates
    socket.on('new_story', (data) => {
      const { story, userId } = data;
      console.log("story aai kkk");

      setMyStories((prevMyStories) => {
        // Find the matching subscription
        const matchingSub = prevMyStories.subscriptions.find(sub => sub._id === userId);

        if (matchingSub) {
          // Agar matching subscription milta hai, to `stories` state ko update karna
          setStories((prevStories) => {
            // Check if the user already exists in the `stories` array
            const existingSub = prevStories.find(sub => sub._id === userId);

            if (existingSub) {
              // If the user exists, only add the story if it doesn't already exist
              const storyExists = existingSub.stories.some(existingStory => existingStory._id === story._id);

              if (!storyExists) {
                return prevStories.map(sub => {
                  if (sub._id === userId) {
                    return {
                      ...sub,
                      stories: [...sub.stories, story] // New story add karna
                    };
                  }
                  return sub;
                });
              }
            } else {
              // If the user doesn't exist, add a new entry for the user with the new story
              return [
                ...prevStories,
                {
                  _id: matchingSub._id,
                  username: matchingSub.username,
                  avatar: matchingSub.avatar,
                  stories: [story] // New story add karna
                }
              ];
            }

            return prevStories; // Return the previous state if no updates
          });
        }

        return prevMyStories; // `myStories` ko unchanged return karna
      });
    });

    socket.on('delete-story', (storyId) => {
      console.log("ya hai delete",storyId);
      
      setStories((prevStories) => {
        return prevStories
          .map(sub => {
            // Filter out the story from the user's `stories` array
            const updatedStories = sub.stories.filter(story => story._id !== storyId);

            // Return the updated subscription object with filtered stories
            return {
              ...sub,
              stories: updatedStories
            };
          })
          .filter(sub => sub.stories.length > 0); // Remove users with empty stories arrays
      });
    });


    // Clean up socket on component unmount
    return () => {
      socket.disconnect();
    };
  }, []);




  // Initialize Fuse.js
  const fuse = new Fuse(state.fetchedAllVideos, {
    keys: ['title', 'owner.username', 'description'],
    includeScore: true,
    threshold: 0.3, // Adjust the threshold for sensitivity (0.0 to 1.0)
  });


  const handleSearch = (term) => {
    setSearchTerm(term);
    setVideosFetchingMessage("");
    setHeading(`Search for: ${term}`);

    if (term.trim() === "") {
      setFilteredVideos(state.fetchedAllVideos);
      setHeading("")
    } else {
      // Perform fuzzy search
      const results = fuse.search(term);


      // Extract results and handle empty case
      const filteredResults = results.map(result => result.item);


      if (filteredResults.length === 0) {
        setVideosFetchingMessage("No Videos Found");
      } else {
        setFilteredVideos(filteredResults);
      }

    }
  };

  const handleClickOutside = (event) => {
    if (searchRef.current && !searchRef.current.contains(event.target)) {
      setSearchVisible(false);
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside, true);
    return () => {
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, []);



  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (uploadQueue.length == 5) {
      setStoryMsg("Atleast 10 Stories Should be upload at a time");
    }
    if (file && uploadQueue.length < 5) {
      setTotalQueueFiles((prev) => prev + 1)
      setUploadQueue((prevQueue) => [...prevQueue, file]);
    }
  };

  useEffect(() => {
    const uploadNextFile = async () => {
      if (uploadQueue.length > 0 && !isUploading) {
        setUploadProcessCount((prevCount) => prevCount + 1);
        setUploadProcessing(true)
        setIsUploading(true);
        const file = uploadQueue[0];
        setLoading(true);

        try {
          const response = await uploadToCloudinary(file, setVideoProgress, setLoading);
          const Url = response.secure_url;
          const postResponse = await axios.post("/api/videos/uploadstories", { Url }, { headers: { 'Content-Type': 'multipart/application/json' } });
          setMyStories((prevState) => ({
            ...prevState,
            stories: [...prevState.stories, { file: Url, _id: postResponse.data.currStoryId, createdAt: new Date() }],
          }));
          setStoryMsg(postResponse.data.message);

        } catch (error) {
          console.log("Error occurred", error);
        } finally {
          setLoading(false);
          setIsUploading(false);
          setVideoProgress(0);
          setUploadQueue((prevQueue) => {
            const newQueue = prevQueue.slice(1);
            if (newQueue.length === 0) {
              setUploadProcessing(false);
              setUploadProcessCount(0);
              setTotalQueueFiles(0)
            }
            return newQueue;
          }); // Remove the processed file from the queue


        }
      }
    };

    uploadNextFile();
  }, [uploadQueue, isUploading]);


  const handlePopupClose = () => {
    setShowMyStory(false)
    setUniqueStoryPopup(undefined);
  };


  return (
    <div className='h-screen w-full flex flex-col bg-gray-50'>
      {/* Header */}
      <div className='h-14 bg-white shadow-md flex justify-between px-4 items-center'>
        <div className='flex items-center'>
          <FaYoutube className='text-red-600 text-4xl' />
          <h1 className='text-2xl font-semibold text-gray-800 ml-2'>YouTube</h1>
          {uploadProcessing && (
            <p className='ml-4 text-blue-600 font-medium bg-blue-100 rounded-full px-3 py-1 text-sm'>
              {`${uploadProcessCount}/${totalQueueFiles} Story Uploading...`}
            </p>
          )}
        </div>
        <div className='flex items-center gap-3 h-full' ref={searchRef}>
          <div className={`flex items-center bg-gray-100 rounded-full p-2 ${searchVisible ? 'hidden' : 'block'}`} onClick={() => setSearchVisible(true)}>
            <CiSearch className='text-2xl text-gray-600 cursor-pointer' />
          </div>
          {searchVisible && (
            <div className='absolute top-0 md:left-96 left-44 right-0 h-14 flex items-center bg-gray-100 px-4 py-2 rounded-full'>
              <CiSearch className='text-2xl text-gray-600' />
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className='bg-transparent outline-none ml-2 flex-grow h-full'
              />
            </div>
          )}
          {!searchVisible && (
            <div onClick={() => {
              setMicPopup(true);
              recognitionRef.current?.start();
            }} className='flex items-center bg-gray-100 rounded-full p-2'>
              <IoMic className='text-2xl text-gray-600' />
            </div>
          )}
        </div>
      </div>


      <div hidden={!micPopup} className='fixed inset-0 bg-black bg-opacity-50 justify-center items-center z-50'>
        <div className="bg-white p-4 rounded-lg w-1/3">
          <div className="flex justify-between mb-4">
            <IoClose onClick={onClose} className="cursor-pointer text-xl" />
            <div>
              <h1>Listening...</h1>
            </div>
          </div>
          {errorMessage && <p className="text-red-500">{errorMessage}</p>}
        </div>
      </div>

      {/* Search Heading */}
      {heading && (
        <div className='p-4'>
          <h2 className='text-xl font-semibold'>{heading}</h2>
        </div>
      )}

      {/* Video List */}
      <div className='flex-1 overflow-y-auto p-4 '>

        <div className='storiesBox w-full h-[80px] border-2 border-gray-300 rounded-lg flex gap-4 mb-4 items-center px-2 py-2 bg-white shadow-md'>

          <div className='flex items-center justify-center relative'>
            <div
              onClick={() => {
                if (myStories.stories?.length > 0) {
                  setShowMyStory(true);
                } else {
                  fileInputRef.current.click();
                }
              }}
              className='w-16 h-16 rounded-full border-2 border-blue-500 flex items-center justify-center cursor-pointer bg-gray-100 hover:bg-blue-50 transition-colors duration-300 ease-in-out'
            >
              {loading ? (
                <Loader2 className="animate-spin text-blue-500" />
              ) : videoProgress > 0 ? (
                <span className="text-blue-500 font-semibold">{`${videoProgress}%`}</span>
              ) : myStories.stories?.length > 0 ? (
                <RiFolderHistoryFill className="text-blue-500" size={28} />
              ) : (
                <IoIosAddCircle size={32} className="text-blue-500" />
              )}
            </div>

            {(videoProgress > 0 || myStories.stories?.length > 0) && (
              <div
                onClick={() => fileInputRef.current.click()}
                className='absolute bottom-2 right-2 transform translate-x-1/2 translate-y-1/2 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center cursor-pointer border-2 border-white hover:bg-blue-600 transition-colors duration-300 ease-in-out'
              >
                <IoIosAddCircle size={22} className="text-white" />
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            {showMyStory && (
              <StoryPopup
                story={myStories}
                myStories={myStories}
                setMyStories={setMyStories}
                setStoryMsg={setStoryMsg}
                closePopup={handlePopupClose}
                myStory={true}
              />
            )}
          </div>

          <div className='flex gap-4 w-full h-full overflow-x-auto scrollbar-hide'>
            {stories.length == 0 && !noStoryMsg && (

              <div className="flex flex-col space-y-3">
                <Skeleton className="w-12 h-12 rounded-full bg-slate-400" />

                <Skeleton className="h-2 w-[40px] bg-slate-300" />


              </div>

            )}
            {stories.length > 0 ? (
              stories.map((story, index) => (
                <div key={index} className='flex flex-col items-center cursor-pointer'>
                  <div onClick={() => setUniqueStoryPopup(index)} className='flex justify-center items-center w-12 h-12 rounded-full border-2 border-blue-500 overflow-hidden bg-gray-100 hover:scale-105 transition-transform duration-300 ease-in-out'>
                    <img src={story.avatar} alt="dp" className="w-full h-full object-cover" />
                  </div>
                  <div className='text-center text-xs mt-1'>
                    <p className='text-gray-800 font-medium text-ellipsis overflow-hidden whitespace-nowrap'>{story.username}</p>
                  </div>

                  {uniqueStoryPopup === index && (
                    <StoryPopup
                      story={story}
                      closePopup={handlePopupClose}
                    />
                  )}
                </div>
              ))
            ) : (
              <h1 className="text-gray-500 font-medium">{noStoryMsg}</h1>
            )}
          </div>

        </div>



        {videosFetchingMessage ? (
          <div className="flex justify-center items-center h-full text-red-700">
            <h1>{videosFetchingMessage}</h1>
          </div>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-10'>
            {filteredVideos.length === 0 && !videosFetchingMessage && (
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

            {filteredVideos.map((video, index) => (
              <div
                key={index}
                onClick={() => router.push(`/videoplay/${video._id}`)}
                className='cursor-pointer bg-white rounded-lg shadow-md overflow-hidden transform hover:scale-105 transition duration-300'
              >
                <div className='w-full h-[215px] bg-gray-200 relative'>
                  <Image
                    src={video.thumbnail}
                    alt="thumbnail"
                    fill
                    style={{ objectFit: "cover" }}
                  />
                </div>
                <div className='p-4'>
                  <div className='flex items-center gap-2 mb-2 overflow-hidden'>
                    <div className='overflow-hidden h-10 w-10 rounded-full relative'>
                      <Image
                        src={video.owner.avatar}
                        alt="dp"
                        fill
                        sizes="40px" // Adjust according to your requirements
                        style={{ objectFit: "cover" }}
                      />
                    </div>

                    <div>
                      <h2 className='text-lg font-semibold text-gray-900'>{video.title}</h2>
                      <p className='text-sm text-gray-600'>{video.owner.username}</p>
                    </div>
                  </div>
                  <div className='text-sm text-gray-600 flex justify-between'>
                    <p>{video.views} views</p>
                    <p>{formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {storyMsg && (
        <Notification message={storyMsg} onClose={() => setStoryMsg("")} />
      )

      }

    </div>
  );
}

export default Page;
