"use client";
import React from "react";
import { ForumReply, ForumTopicDetail, ForumQuestion, UserData } from "../types";
import { getProfileUrl } from "./getProfileUrl";

export default function PostModal({
  selectedPost,
  replyText,
  setReplyText,
  submitReply,
  onClose,
  user,
  onDeletePost,
  onEditPost,
  onDeleteReply,
  onEditReply,
}: {
  selectedPost: ForumTopicDetail | null;
  replyText: string;
  setReplyText: (t: string) => void;
  submitReply: () => void;
  onClose: () => void;
  user: UserData | null;
  onDeletePost: (Askid: number) => void;
  onEditPost: (topic: ForumQuestion) => void;
  onDeleteReply: (Replyid: number) => void;
  onEditReply: (reply: ForumReply) => void;
}) {
  if (!selectedPost) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div
        className="
          bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden
          border border-white/30
        "
      >
        {/* HEADER */}
        <div className="flex justify-between items-center px-5 py-4 border-b bg-white/80 backdrop-blur">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-1">
            {selectedPost.topic.Asktopic}
          </h2>

          <button
            className="text-gray-500 hover:text-gray-800 text-xl transition"
            onClick={onClose}
            aria-label="close"
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 max-h-[72vh] overflow-y-auto">
          {/* เจ้าของโพสต์ */}
          <div className="flex items-start gap-3 mb-4">
            <img
              src={getProfileUrl(selectedPost.topic.Cprofile, selectedPost.topic.Cname)}
              className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-100"
              alt={selectedPost.topic.Cname}
            />

            <div className="flex-1">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-gray-900">{selectedPost.topic.Cname}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(selectedPost.topic.Askdate).toLocaleString("th-TH")}
                  </div>
                </div>

                {/* ปุ่มแก้ไข/ลบโพสต์ */}
                {user && user.Cid === selectedPost.topic.Cid && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEditPost(selectedPost.topic)}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                    >
                      แก้ไข
                    </button>

                    <button
                      onClick={() => onDeletePost(selectedPost.topic.Askid)}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 transition"
                    >
                      ลบ
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* รายละเอียดโพสต์ */}
          <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-4 mb-6">
            <p className="text-gray-800 text-sm whitespace-pre-line">
              {selectedPost.topic.Askdetails}
            </p>
          </div>

          {/* คอมเมนต์ */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">ความคิดเห็น</h3>
            <span className="text-xs text-gray-400">
              {selectedPost.comments.length} รายการ
            </span>
          </div>

          {selectedPost.comments.length === 0 && (
            <p className="text-gray-400 text-sm">ยังไม่มีความคิดเห็น</p>
          )}

          <div className="space-y-4">
            {selectedPost.comments.map((c) => (
              <div key={c.Replyid} className="border border-gray-100 rounded-2xl p-4 bg-white shadow-sm">
                <div className="flex items-start gap-2">
                  <img
                    src={getProfileUrl(c.Cprofile, c.Cname)}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-emerald-50"
                    alt={c.Cname}
                  />

                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-sm text-gray-900">{c.Cname}</div>

                      {user && user.Cid === c.Cid && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => onEditReply(c)}
                            className="text-blue-600 text-xs hover:underline"
                          >
                            แก้ไข
                          </button>

                          <button
                            onClick={() => onDeleteReply(c.Replyid)}
                            className="text-red-600 text-xs hover:underline"
                          >
                            ลบ
                          </button>
                        </div>
                      )}
                    </div>

                    <p className="text-gray-700 text-sm whitespace-pre-line mt-1">
                      {c.Replydetails}
                    </p>

                    <div className="text-xs text-gray-400 mt-2">
                      {new Date(c.Replydate).toLocaleString("th-TH")}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ช่องคอมเมนต์ */}
          <div className="mt-6 border-t pt-4">
            <textarea
              className="
                w-full bg-white text-gray-800
                border border-gray-200 rounded-2xl px-4 py-3 text-sm
                shadow-sm placeholder:text-gray-400
                focus:outline-none focus:ring-4 focus:ring-emerald-200 focus:border-emerald-300
              "
              rows={3}
              placeholder={user ? "แสดงความคิดเห็น..." : "เข้าสู่ระบบเพื่อแสดงความคิดเห็น"}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              disabled={!user}
            />

            <button
              onClick={submitReply}
              disabled={!user || !replyText.trim()}
              className="
                mt-3 inline-flex items-center justify-center
                bg-emerald-600 text-white px-5 py-2.5 rounded-full font-semibold text-sm
                hover:bg-emerald-700 transition
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              ส่งความคิดเห็น
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
