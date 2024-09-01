"use client"
import React from 'react';
import { IoMdHome } from "react-icons/io";
import { RiUserFollowFill } from "react-icons/ri";
import { CiCirclePlus } from "react-icons/ci";
import { BsChatDots } from "react-icons/bs";
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/context';

function ButtonNavigation() {
    const router = useRouter();
    const { state } = useUser();

    return (
        <div className='no-select fixed bottom-0 left-0 right-0 h-14 bg-white shadow-md flex justify-around items-center text-gray-700 text-2xl z-40'>
            <div className='relative group cursor-pointer' onClick={() => router.push('/dashboard')}>
                <IoMdHome />
                <div className='tooltip absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2'>
                    Home
                </div>
            </div>
            <div className='relative group cursor-pointer' onClick={() => router.push('/subscriptions')}>
                <RiUserFollowFill />
                <div className='tooltip absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2'>
                    Subscription
                </div>
            </div>
            <div className='relative group cursor-pointer text-3xl' onClick={() => router.push('/upload')}>
                <CiCirclePlus />
                <div className='tooltip absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2'>
                    Upload
                </div>
            </div>
            <div className='relative group cursor-pointer' onClick={() => router.push('/chat')}>
                <BsChatDots />
                <div className='tooltip absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2'>
                    Chat
                </div>
            </div>
            <div className='relative group cursor-pointer' onClick={() => router.push('/profile')}>
                <div className='w-10 h-10 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center'>
                    <img src={state.currentUserAvatar} alt="userDp" />
                </div>
                <div className='tooltip absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2'>
                    Profile
                </div>
            </div>
        </div>
    );
}

export default ButtonNavigation;
