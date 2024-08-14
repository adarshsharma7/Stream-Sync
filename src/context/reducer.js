import * as actionTypes from './actionTypes';

const reducer = (state, action) => {
  switch (action.type) {
    case actionTypes.FETCHED_ALL_VIDEOS:
      return {
        ...state,
        fetchedAllVideos: action.payload,
      };
    case actionTypes.FETCHED_PROFILE:
      return {
        ...state,
        profile: action.payload,
      };
    case actionTypes.SET_LIKED_ERROR:
      return {
        ...state,
        likedError: action.payload,
      };
    case actionTypes.SET_WATCHHISTORY_ERROR:
      return {
        ...state,
        watchHistoryError: action.payload,
      };
    case actionTypes.SET_UPLOADEDVIDEOS_ERROR:
      return {
        ...state,
        uploadedVideosError: action.payload,
      };
      case actionTypes.UPDATE_WATCH_HISTORY:
        return {
          ...state,
          profile: {
            ...state.profile,
            watchHistory: action.payload,
          },
        };
        case actionTypes.CURRENT_USER_AVATAR:
          return {
            ...state,
            currentUserAvatar: action.payload,
          };
        case actionTypes.SET_SUBSCRIBER_COUNT:
          return {
            ...state,
            subscriberCount: action.payload,
          };
        case actionTypes.SET_USER_SUBSCRIBE:
          return {
            ...state,
            userSubscribe: action.payload,
          };
        case actionTypes.SET_IS_SUBSCRIBE:
          return {
            ...state,
            isSubscribe: action.payload,
          };
      default:
        return state;
  }
};

export default reducer;
