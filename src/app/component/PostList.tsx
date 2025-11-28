"use client";
import React from "react";


import { ForumQuestion } from "../types";
import { getProfileUrl } from "./getProfileUrl";



export default function PostList({
  questions,
  loading,
  openPost,
}: {
  questions: ForumQuestion[];
  loading: boolean;
  openPost: (Askid: number) => void;
}) {
  if (loading) return <p className="text-center text-gray-500">กำลังโหลด...</p>;

  if (!loading && questions.length === 0)
    return <p className="text-center text-gray-500">ยังไม่มีกระทู้</p>;

  return (
    <ul className="space-y-4">
      {questions.map((q) => (
        <li
          key={q.Askid}
          onClick={() => openPost(q.Askid)}
          className="p-4 border rounded-lg shadow-sm hover:bg-gray-50 transition cursor-pointer"
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3 mb-1">
              <img
                src={getProfileUrl(q.Cprofile, q.Cname)}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="text-xs text-gray-600 flex gap-2">
                {q.Cname}
                <span className="text-gray-400">•</span>
                <span>{new Date(q.Askdate).toLocaleString("th-TH")}</span>
              </div>
            </div>

            <h2 className="text-lg font-semibold text-green-700">
              {q.Asktopic}
            </h2>

            <p className="text-gray-600 text-sm line-clamp-2">
              {q.Askdetails}
            </p>

            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>👁 {q.Askvisits}</span>
              <span>💬 {q.ReplyCount}</span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
