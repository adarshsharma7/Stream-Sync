import { IoClose } from "react-icons/io5";


export function SharePopup({ videoId, onClose }) {
    const shareableLink = `${window.location.origin}/videoplay/${videoId}`;
    
    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareableLink);
        alert("Link copied to clipboard!");
    };

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
                    <button 
                        className="bg-blue-600 text-white py-2 px-4 rounded-lg"
                        onClick={copyToClipboard}
                    >
                        Copy Link
                    </button>
                    {/* Add more share options here, like buttons for Facebook, Twitter, etc. */}
                </div>
            </div>
        </div>
    );
}