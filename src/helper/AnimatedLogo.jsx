import { motion } from "framer-motion";
import { FaYoutube } from "react-icons/fa";
import { useEffect, useState } from "react";

const AnimatedLogo = ({ showChatText = false, uploadProcessing, uploadProcessCount, totalQueueFiles }) => {
  const [shouldAnimate, setShouldAnimate] = useState(true);

  useEffect(() => {
    setTimeout(() => setShouldAnimate(false), 5000);
    const interval = setInterval(() => {
      setShouldAnimate(true);
      setTimeout(() => setShouldAnimate(false), 2000);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className="flex items-center"
      initial={{ y: -20, opacity: 0 }} 
      animate={{ y: 0, opacity: 1 }}   
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* YouTube Logo */}
      <motion.div
        animate={shouldAnimate ? { rotate: [0, -10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 1, ease: "easeInOut" }}
      >
        <FaYoutube className="text-red-600 text-4xl" />
      </motion.div>

      {/* StreamSync Text */}
      <motion.h1
        className="text-3xl font-bold text-black ml-2"
        animate={shouldAnimate ? { y: [0, -3, 3, -3, 0] } : {}}
        transition={{ duration: 1, ease: "easeInOut" }}
      >
        StreamSync
        {showChatText && <span className='text-xl font-semibold text-gray-600'> Chat</span>}
      </motion.h1>

      {/* Uploading Indicator (Only in Dashboard) */}
      {uploadProcessing && (
        <p className="ml-4 text-blue-600 font-medium bg-blue-100 rounded-full px-3 py-1 text-sm">
          {`${uploadProcessCount}/${totalQueueFiles} Story Uploading...`}
        </p>
      )}
    </motion.div>
  );
};

export default AnimatedLogo;
