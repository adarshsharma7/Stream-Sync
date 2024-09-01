"use client";
import axios from 'axios';
import Fuse from 'fuse.js';
import { Loader2 } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { CiSearch } from "react-icons/ci";
import Image from 'next/image'; // Ensure you have 'next/image' imported

function Page() {
    const [searchVisible, setSearchVisible] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [heading, setHeading] = useState("");
    const [usernameFetchingMessage, setUsernameFetchingMessage] = useState("");
    const [suggestions, setSuggestions] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false); // Added loading state

    const searchRef = useRef(null);

    const handleClickOutside = (event) => {
        if (searchRef.current && !searchRef.current.contains(event.target)) {
            setSuggestions(false);
            setSearchVisible(false);
        }
    };

    useEffect(() => {
        const findUsers = async () => {
            try {
                setSearchLoading(true);
                let response = await axios.get("/api/users/getusers");
                setUsers(response.data.data); // Ensure the API returns data in the expected format
                setFilteredUsers(response.data.data);
                setSearchLoading(false);
            } catch (error) {
                setSearchLoading(false);
                // Handle error
            }
        };
        findUsers();
    }, []);

    useEffect(() => {
        document.addEventListener('click', handleClickOutside, true);
        return () => {
            document.removeEventListener('click', handleClickOutside, true);
        };
    }, []);

    useEffect(() => {
        // Initialize Fuse after users have been set
        const fuse = new Fuse(users, {
            keys: ['username'], // Adjust according to the actual structure of your user data
            includeScore: true,
            threshold: 0.3, // Adjust the threshold for sensitivity (0.0 to 1.0)
        });

        const handleSearch = (term) => {
            setSearchTerm(term);
            setUsernameFetchingMessage("")
            setHeading(`Search for: ${term}`);

            if (term.trim() === "") {
                setFilteredUsers(users);

                setHeading("");
            } else {
                // Perform fuzzy search
                const results = fuse.search(term);
                const filteredResults = results.map(result => result.item);

                if (filteredResults.length === 0) {
                    setUsernameFetchingMessage("No user found");
                } else {
                    setFilteredUsers(filteredResults);
                }
            }
        };

        // Use handleSearch here if needed
        handleSearch(searchTerm);
    }, [users, searchTerm]);

    return (
        <div className='w-full h-full flex flex-col relative'>
            <div className='flex w-full h-[20%] border-2 border-red-500 justify-between items-center'>
                <h1>YouChat</h1>
                <div className='flex items-center gap-3 h-full' ref={searchRef}>
                    <div className={`flex items-center bg-gray-100 rounded-full p-2 ${searchVisible ? 'hidden' : 'block'}`} onClick={() => setSearchVisible(true)}>
                        <CiSearch className='text-2xl text-gray-600 cursor-pointer' />
                    </div>
                    {searchVisible && (
                        <div className='absolute top-0 md:left-96 left-44 right-0 flex h-7 items-center bg-gray-100 px-4 py-2 rounded-full'>
                            <CiSearch className='text-2xl text-gray-600' />
                            <input
                                type="text"
                                placeholder="Search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onFocus={() => setSuggestions(true)}
                                className='bg-transparent outline-none ml-2 flex-grow h-full'
                            />
                        </div>
                    )}
                </div>
            </div>
            <div className='w-full h-full border-2 border-green-500'>
                {/* all chats users */}
            </div>
            {suggestions && (
                <div className='top-8 absolute max-h-[300px] w-full gap-5 border-2 border-b-red-950 overflow-y-auto flex flex-col p-3 items-center bg-gray-100'>

                    {usernameFetchingMessage ?
                        (
                            <div>{usernameFetchingMessage}</div>
                        ) : (

                            filteredUsers.map((user, index) => (
                                <div key={index} className='w-full h-[10%] flex items-center p-2 cursor-pointer'>
                                    <div className='overflow-hidden h-10 w-10 rounded-full relative'>
                                        <Image
                                            src={user.avatar}
                                            alt="dp"
                                            fill
                                            sizes="40px" // Adjust according to your requirements
                                            style={{ objectFit: "cover" }}
                                        />
                                    </div>
                                    <h1 className='ml-2'>{user.username}</h1>
                                </div>
                            ))


                        )}



                </div>
            )}
        </div>
    );
}

export default Page;
