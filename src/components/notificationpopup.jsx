import React, { useState, useEffect } from 'react';

const Notification = ({ message, onClose }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false)
            onClose() // Automatically close the notification after 3 seconds
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-md z-50 transition-opacity duration-300 ease-in-out opacity-90">
            <div className="flex items-center space-x-2">
                <span className="font-semibold text-sm">{message}</span>
            </div>
        </div>
    );
};

export default Notification;
