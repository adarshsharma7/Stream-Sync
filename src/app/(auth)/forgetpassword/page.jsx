'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation'; // Import useSearchParams
import axios from 'axios'; 

// The ForgetPassword component itself
function ForgetPasswordComponent() {
  const searchParams = useSearchParams(); // Get search params
  const token = searchParams.get('token'); // Extract token from URL query params

  const [password, setPassword] = useState({
    newPassword: "",
    confirmPassword: ""
  });
  const [message, setMessage] = useState("");
  const [processing, setProcessing] = useState(false);

  const changePassword = async () => {
    if (password.newPassword.length < 6) {
      setMessage("Password must be 6 characters");
    } else {
      setProcessing(true);
      try {
        let response = await axios.post('/api/users/forgetPasswordPage', {
          password: password.confirmPassword,
          token: token
        });
        setProcessing(false);
        setMessage(response.data.message);
      } catch (error) {
        setProcessing(false);
        setMessage("Error occurred while resetting password");
      }
    }
  };

  useEffect(() => {
    if (password.newPassword !== password.confirmPassword) {
      setMessage("Passwords do not match");
    } else {
      setMessage("");
    }
  }, [password.confirmPassword]);

  if (!token) {
    return <p>Loading...</p>; // Optionally show loading if token is missing
  }

  return (
    <div className="w-full h-screen flex justify-center items-center flex-col gap-3 bg-slate-500">
      <div>
        <img src="/images/download.jpeg" alt="YoutubeImg" />
      </div>
      <h1 className={`text-center ${message || processing ? "" : "invisible"}`}>
        {processing ? "Processing..." : message ? message : "a"}
      </h1>
      <div className="flex flex-col">
        <input 
          placeholder="Enter New Password" 
          className="p-3 text-black" 
          type="password" 
          value={password.newPassword} 
          onChange={(e) => setPassword({ ...password, newPassword: e.target.value })} 
        />
        <input
          readOnly={!password.newPassword}
          type="password" 
          placeholder="Confirm Your Password" 
          className={`${password.newPassword === "" ? "opacity-40" : ""} p-3 mt-2 text-black`} 
          value={password.confirmPassword} 
          onChange={(e) => setPassword({ ...password, confirmPassword: e.target.value })} 
        />
      </div>
      <button
        onClick={(e) => {
          e.preventDefault();
          changePassword();
        }}
        hidden={message === "Password is reset Succesfully"} 
        className="bg-blue-800 text-white"
      >
        {password.newPassword === password.confirmPassword ? "Change Password" : ""}
      </button>
    </div>
  );
}

// The main export with Suspense boundary
export default function ForgetPassword() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <ForgetPasswordComponent />
    </Suspense>
  );
}
