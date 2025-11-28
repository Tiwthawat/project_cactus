"use client";
import React from "react";
import { UserData } from "../types";
import { getProfileUrl } from "./getProfileUrl";





export default function CreatePostModal({
  show,
  user,
  topic,
  details,
  setTopic,
  setDetails,
  submitPost,
  onClose,
}: {
  show: boolean;
  user: UserData | null;
  topic: string;
  details: string;
  setTopic: (v: string) => void;
  setDetails: (v: string) => void;
  submitPost: () => void;
  onClose: () => void;
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-xl rounded-xl p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">สร้างกระทู้ใหม่</h2>
          <button onClick={onClose}>✕</button>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <img
            src={getProfileUrl(user?.Cprofile || null, user?.Cname)}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="font-semibold">{user?.Cname}</div>
        </div>

        <input
          type="text"
          placeholder="หัวข้อกระทู้"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full border p-2 rounded-lg mb-3"
        />

        <textarea
          placeholder="รายละเอียดกระทู้..."
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          className="w-full border p-2 rounded-lg h-32"
        />

        <button
          onClick={submitPost}
          className="w-full mt-4 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
        >
          โพสต์กระทู้
        </button>
      </div>
    </div>
  );
}
