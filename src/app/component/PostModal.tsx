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
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl overflow-hidden animate-fadeIn">

        {/* HEADER */}
        <div className="flex justify-between items-center px-4 py-3 border-b">
          <h2 className="text-lg font-semibold">{selectedPost.topic.Asktopic}</h2>

          <button className="text-gray-500 text-xl" onClick={onClose}>✕</button>
        </div>

        {/* BODY */}
        <div className="p-4 max-h-[70vh] overflow-y-auto">

          {/* เจ้าของโพสต์ */}
          <div className="flex items-center gap-3 mb-4">
            <img
              src={getProfileUrl(selectedPost.topic.Cprofile, selectedPost.topic.Cname)}
              className="w-10 h-10 rounded-full"
            />

            <div className="flex-1">
              <div className="font-semibold">{selectedPost.topic.Cname}</div>
              <div className="text-xs text-gray-500">
                {new Date(selectedPost.topic.Askdate).toLocaleString("th-TH")}
              </div>
            </div>

            {/* ⭐ ปุ่มแก้ไข/ลบโพสต์ */}
            {user && user.Cid === selectedPost.topic.Cid && (
              <div className="flex gap-2">
                <button
                  onClick={() => onEditPost(selectedPost.topic)}
                  className="text-blue-600 text-sm"
                >
                  แก้ไข
                </button>

                <button
                  onClick={() => onDeletePost(selectedPost.topic.Askid)}
                  className="text-red-600 text-sm"
                >
                  ลบ
                </button>
              </div>
            )}
          </div>

          {/* รายละเอียดโพสต์ */}
          <p className="text-gray-800 text-sm whitespace-pre-line mb-6">
            {selectedPost.topic.Askdetails}
          </p>

          {/* คอมเมนต์ */}
          <h3 className="font-semibold mb-3">ความคิดเห็น</h3>

          {selectedPost.comments.length === 0 && (
            <p className="text-gray-400 text-sm">ยังไม่มีความคิดเห็น</p>
          )}

          {selectedPost.comments.map((c) => (
            <div key={c.Replyid} className="mb-4 border-b pb-3">

              <div className="flex items-center gap-2 mb-1">

                <img
                  src={getProfileUrl(c.Cprofile, c.Cname)}
                  className="w-8 h-8 rounded-full"
                />

                <div className="font-semibold text-sm flex-1">
                  {c.Cname}
                </div>

                {/* ⭐ ปุ่มแก้ไข/ลบคอมเมนต์ */}
                {user && user.Cid === c.Cid && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEditReply(c)}
                      className="text-blue-600 text-xs"
                    >
                      แก้ไข
                    </button>

                    <button
                      onClick={() => onDeleteReply(c.Replyid)}
                      className="text-red-600 text-xs"
                    >
                      ลบ
                    </button>
                  </div>
                )}
              </div>

              <p className="text-gray-700 text-sm whitespace-pre-line">
                {c.Replydetails}
              </p>

              <div className="text-xs text-gray-400 mt-1">
                {new Date(c.Replydate).toLocaleString("th-TH")}
              </div>
            </div>
          ))}

          {/* ช่องคอมเมนต์ */}
          <div className="mt-6 border-t pt-4">
            <textarea
              className="w-full border rounded-lg p-2 text-sm"
              placeholder="แสดงความคิดเห็น..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />

            <button
              onClick={submitReply}
              className="mt-3 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              ส่งความคิดเห็น
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
