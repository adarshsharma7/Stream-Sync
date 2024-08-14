

import axios from "axios";



export const checkSubscribed = async (ownerId, dispatch) => {

    try {
        let response = await axios.post("/api/users/subscribecheck", { owner: ownerId });
        if (response.data.message == "Subscribed") {
            dispatch({ type: "SET_USER_SUBSCRIBE", payload: true })

        } else if (response.data.message == "Unsubscribed") {
            dispatch({ type: "SET_USER_SUBSCRIBE", payload: false })

        } else {
            // seterrorMessage(response.data.message);
        }
    } catch (error) {
        console.error("Error checking subscription:", error);
    }
};




export const subscribe = async (ownerId, state, dispatch) => {
    dispatch({ type: "SET_IS_SUBSCRIBE", payload: true })
    if (state.userSubscribe) {

        dispatch({ type: "SET_USER_SUBSCRIBE", payload: false })
        dispatch({ type: "SET_SUBSCRIBER_COUNT", payload: state.subscriberCount - 1 })


    } else {
        dispatch({ type: "SET_USER_SUBSCRIBE", payload: true })
        dispatch({ type: "SET_SUBSCRIBER_COUNT", payload: state.subscriberCount + 1 })

    }
    dispatch({ type: "SET_IS_SUBSCRIBE", payload: false })


    await axios.post("/api/users/subscribe", { owner: ownerId });

}