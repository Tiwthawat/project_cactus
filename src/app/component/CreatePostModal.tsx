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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white w-full max-w-xl rounded-2xl p-6 shadow-xl border border-white/30">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">สร้างกระทู้ใหม่</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-xl transition"
            aria-label="close"
          >
            ✕
          </button>
        </div>

        <div className="flex items-center gap-3 mb-5">
          <img
            src={getProfileUrl(user?.Cprofile || null, user?.Cname)}
            className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-100"
            alt={user?.Cname || "user"}
          />
          <div>
            <div className="font-semibold text-gray-900">{user?.Cname}</div>
            <div className="text-xs text-gray-500">โพสต์สาธารณะ</div>
          </div>
        </div>

        <input
          type="text"
          placeholder="หัวข้อกระทู้"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="
            w-full bg-white text-gray-800
            border border-gray-200 rounded-2xl px-4 py-3 mb-3
            shadow-sm placeholder:text-gray-400
            focus:outline-none focus:ring-4 focus:ring-emerald-200 focus:border-emerald-300
          "
        />

        <textarea
          placeholder="รายละเอียดกระทู้..."
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          className="
            w-full bg-white text-gray-800
            border border-gray-200 rounded-2xl px-4 py-3 h-36
            shadow-sm placeholder:text-gray-400
            focus:outline-none focus:ring-4 focus:ring-emerald-200 focus:border-emerald-300
          "
        />

        <button
          onClick={submitPost}
          disabled={!topic.trim() || !details.trim()}
          className="
            w-full mt-4 bg-emerald-600 text-white py-3 rounded-full font-semibold
            hover:bg-emerald-700 transition
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          โพสต์กระทู้
        </button>
      </div>
    </div>
  );
}
