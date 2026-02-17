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
          className="
            group bg-white border border-gray-200 rounded-2xl p-4 shadow-sm
            hover:shadow-md hover:border-emerald-200 hover:bg-emerald-50/30
            transition cursor-pointer
          "
        >
          <div className="flex gap-3">
            <img
              src={getProfileUrl(q.Cprofile, q.Cname)}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-100"
              alt={q.Cname}
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="font-medium text-gray-700">{q.Cname}</span>
                <span className="text-gray-300">•</span>
                <span className="truncate">{new Date(q.Askdate).toLocaleString("th-TH")}</span>
              </div>

              <h2 className="mt-1 text-base sm:text-lg font-semibold text-emerald-700 group-hover:text-emerald-800 line-clamp-1">
                {q.Asktopic}
              </h2>

              <p className="mt-1 text-gray-600 text-sm line-clamp-2">
                {q.Askdetails}
              </p>

              <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center gap-1">👁 <b className="font-semibold text-gray-500">{q.Askvisits}</b></span>
                  <span className="inline-flex items-center gap-1">💬 <b className="font-semibold text-gray-500">{q.ReplyCount}</b></span>
                </div>

                <span className="text-emerald-600/60 group-hover:text-emerald-700">
                  แตะเพื่ออ่าน →
                </span>
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
