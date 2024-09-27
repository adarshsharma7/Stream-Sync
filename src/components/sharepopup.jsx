import axios from "axios";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";


export function SharePopup({ videoId, onClose ,videoData}) {
    console.log("frontend pr videoData",videoData);
    
    const [chats, setChats] = useState([])
    const [isFindingFrnds, setIsFindingFrnds] = useState(true)
    const [isSendingLoading, setIsSendingLoading] = useState(false)
    const [toggleShareId, setToggleShareId] = useState([])
    const shareableLink = `${window.location.origin}/videoplay/${videoId}`;


    useEffect(() => {
        const getAllChats = async () => {
            try {

                let response = await axios.get("/api/users/getallchats")
                const mergedChats = [...response.data.chatData, ...response.data.groupData];

                setChats(mergedChats);

            } catch (error) {
                console.log(error);

            } finally {
                setIsFindingFrnds(false)
            }

        }
        getAllChats()
    }, [])

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareableLink);
        alert("Link copied to clipboard!");
    };

    const sendVideoLink = async () => {
        try {
            setIsSendingLoading(true)
            let response = await axios.post("/api/users/sendmessages", { message: shareableLink, chatId: toggleShareId, msgStatus: 'sent',videoData });
        } catch (error) {
            console.log(error);
        } finally {
            setIsSendingLoading(false)
            onClose(true)

        }


    }

    return (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-4 rounded-lg max-w-sm w-full">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold">Share Video</h2>
                    <IoClose className="cursor-pointer" onClick={onClose} />
                </div>
                <div className="flex flex-col gap-2">
                    <input
                        type="text"
                        readOnly
                        value={shareableLink}
                        className="p-2 border border-gray-300 rounded-lg"
                    />
                    <div className="flex flex-col gap-2 overflow-y-auto max-h-[400px]" >
                        {
                            isFindingFrnds ? (
                                <div className="w-full flex justify-center items-center h-10">
                                    <Loader2 className="animate-spin text-blue-500" />
                                </div>

                            ) : (
                                chats.map((chat, index) => (
                                    <div key={index} className="flex justify-between p-4" onClick={() => {
                                        if (toggleShareId.includes(chat._id)) {
                                            setToggleShareId((prev) => prev.filter((id) => id !== chat._id))
                                        } else {
                                            setToggleShareId((prev) => [...prev, chat._id])
                                        }
                                    }}>
                                        <div className="leftBox flex gap-2">
                                            <div className='h-12 w-12 rounded-full overflow-hidden relative'>
                                                <Image
                                                    src={chat.avatar}
                                                    alt="dp"
                                                    fill
                                                    sizes="48px"
                                                    style={{ objectFit: "cover" }}
                                                />
                                            </div>
                                            <div className='text-gray-800 font-medium'>
                                                <h1>{chat.username}</h1>
                                            </div>
                                        </div>
                                        <div className="rightToggleBox">
                                            <div className={`${toggleShareId.includes(chat._id) ? "bg-green-600" : ""} w-4 h-4 rounded-full border-2 border-slate-500 flex items-center justify-center`}>

                                            </div>
                                        </div>

                                    </div>
                                ))
                            )
                        }
                    </div>

                    <button
                        className="bg-blue-600 text-white py-2 px-4 rounded-lg"
                        onClick={() => {
                            if (toggleShareId.length > 0) {
                                sendVideoLink()
                            } else {
                                copyToClipboard()
                            }

                        }
                        }
                        disabled={isSendingLoading}
                    >
                        {toggleShareId.length > 0
                            ? isSendingLoading ? "Sending..." : "Send"
                            : " Copy Link "
                        }

                    </button>
                    {/* Add more share options here, like buttons for Facebook, Twitter, etc. */}
                </div>
            </div>
        </div>
    );
}