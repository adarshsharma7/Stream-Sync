import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';


const LoginRequired = ({ featureName }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false)
  

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md text-center">
        <h2 className="text-xl font-semibold text-yellow-700 mb-4">
          You are not logged in
        </h2>
        <p className="mb-4 text-gray-600">
          Please login to access your <span className="font-semibold">{featureName}</span> and personalized features.
        </p>
        <button
          onClick={() =>{ 
            setLoading(true)
            router.push('/sign-in')
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          { loading ?   <Loader2 className="animate-spin text-blue-500" /> : "Go to Login"}
        </button>
      </div>
    </div>
  );
};

export default LoginRequired;
