"use client"
import { useReducer, createContext, useContext } from 'react';
import reducer from './reducer';
// import { BASE_URL } from '../config';

const UserContext = createContext();
const initialState = {
    fetchedAllVideos:[],
    profile:{},
    likedError:"",
    watchHistoryError:"",
    uploadedVideosError:"",
    currentUserAvatar:"",
    subscriberCount:0,
    userSubscribe:false,
    isSubscribe:false
}

export const UserProvider = ({ children }) => {
    const [state, dispatch] = useReducer(reducer, initialState);

    return (
        <UserContext.Provider value={{ state, dispatch}}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);