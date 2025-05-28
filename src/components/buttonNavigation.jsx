"use client"
import React from 'react';
import { IoMdHome } from "react-icons/io";
import { RiUserFollowFill } from "react-icons/ri";
import { CiCirclePlus } from "react-icons/ci";
import { BsChatDots } from "react-icons/bs";
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useUser } from '@/context/context';
import { useSession } from 'next-auth/react';
import { HiOutlineUser } from 'react-icons/hi';


function ButtonNavigation() {
    const router = useRouter();
    const pathname = usePathname();  // 🔥 Active route check karne ke liye
    const { state } = useUser();
    const { data: session } = useSession();
    const user = session?.user;

    return (
        <div className='no-select fixed bottom-0 left-0 right-0 h-14 bg-white shadow-md flex justify-around items-center text-gray-700 text-2xl z-40'>

            {/* Home Button */}
            <div
                className={`relative group cursor-pointer ${pathname === "/dashboard" ? "text-blue-500" : ""}`}
                onClick={() => router.push('/dashboard')}
            >
                <IoMdHome />
                <div className='tooltip absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2'>
                    Home
                </div>
            </div>

            {/* Subscription Button */}
            <div
                className={`relative group cursor-pointer ${pathname === "/subscriptions" ? "text-blue-500" : ""}`}
                onClick={() => router.push('/subscriptions')}
            >
                <RiUserFollowFill />
                <div className='tooltip absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2'>
                    Subscription
                </div>
            </div>

            {/* Upload Button */}
            <div
                className={`relative group cursor-pointer text-3xl ${pathname === "/upload" ? "text-blue-500" : ""}`}
                onClick={() => router.push('/upload')}
            >
                <CiCirclePlus />
                <div className='tooltip absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2'>
                    Upload
                </div>
            </div>

            {/* Chat Button */}
            <div
                className={`relative group cursor-pointer ${pathname === "/chat" ? "text-blue-500" : ""}`}
                onClick={() => router.push('/chat')}
            >
                <BsChatDots />
                <div className='tooltip absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2'>
                    Chat
                </div>
            </div>

            {/* Profile Button */}
            <div
                className={`relative group cursor-pointer ${pathname === "/profile" ? "border-2 border-blue-500 rounded-full p-1" : ""}`}
                onClick={() => router.push('/profile')}
            >
                <div className='w-10 h-10 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center'>
                    {!user ? (
                        <HiOutlineUser className="text-xl text-gray-800" />
                    ) : (
                        <img src={state.currentUserAvatar} alt="userDp" />
                    )}


                </div>
                <div className='tooltip absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2'>
                    Profile
                </div>
            </div>

        </div>
    );
}

export default ButtonNavigation;
