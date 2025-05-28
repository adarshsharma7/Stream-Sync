import React from 'react'
import { useRouter } from 'next/navigation';

function LoginRequiredText({ text }) {
  const router = useRouter();

  return (
    <div className="text-gray-500 font-medium">
      <span
        className="text-red-600 cursor-pointer underline"
        onClick={() => router.push('/sign-in')}
      >
        Login
      </span>{" "}
      {text}
    </div>
  );
}

export default LoginRequiredText;
