// components/ReportPopup.js
import axios from 'axios';
import React, { useState } from 'react';
import { IoClose } from "react-icons/io5";


export const ReportPopup = ({ isOpen, onClose, videoId }) => {
    const [reportReason, setReportReason] = useState("");

    const handleReport = async () => {
        try {
            // Send report to the server
            await axios.post('/api/report', {
                videoId,
                reason: reportReason,
            });
            onClose();
            alert("Report submitted successfully.");
        } catch (error) {
            console.error("Error submitting report:", error);
            alert("Failed to submit report.");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-4 rounded-lg w-1/3">
                <div className="flex justify-between mb-4">
                    <h1 className="text-xl">Report Video</h1>
                    <IoClose onClick={onClose} className="cursor-pointer text-xl" />
                </div>
                <textarea
                    className="w-full h-24 p-2 border border-gray-300 rounded"
                    placeholder="Why are you reporting this video?"
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                ></textarea>
                <button
                    onClick={handleReport}
                    className="mt-4 bg-red-600 text-white px-4 py-2 rounded"
                >
                    Submit Report
                </button>
            </div>
        </div>
    );
};


