"use client";

import React, { useEffect, useMemo, useState } from "react";
import { UserData } from "../types";
import { getProfileUrl } from "./getProfileUrl";

/* ---------------------------
  UI: Image Viewer (same vibe as PostModal)
----------------------------*/
function ImageViewer({
  url,
  onClose,
}: {
  url: string | null;
  onClose: () => void;
}) {
  if (!url) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl border border-white/30">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="text-sm font-semibold text-gray-800">ดูรูปภาพ</div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-800 text-xl"
              aria-label="close"
            >
              ✕
            </button>
          </div>
          <div className="bg-black">
            <img
              src={url}
              alt="full"
              className="w-full max-h-[80vh] object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreatePostModal({
  show,
  user,
  topic,
  details,
  setTopic,
  setDetails,
  submitPost,
  onClose,
  files,
  setFiles,
  posting,
}: {
  show: boolean;
  user: UserData | null;
  topic: string;
  details: string;
  setTopic: (v: string) => void;
  setDetails: (v: string) => void;
  submitPost: () => void;
  onClose: () => void;

  files: File[];
  setFiles: (f: File[]) => void;
  posting: boolean;
}) {
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);

  // ✅ previews (avoid memory leak)
  const previewUrls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => {
    return () => {
      previewUrls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [previewUrls]);

  if (!show) return null;

  const pickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    if (!list.length) return;

    // จำกัด 6 รูป
    const next = [...files, ...list].slice(0, 6);
    setFiles(next);
    e.target.value = "";
  };

  const removeFile = (idx: number) => {
    setFiles(files.filter((_, i) => i !== idx));
  };

  const clearAll = () => setFiles([]);

  const canSubmit = !!topic.trim() && !!details.trim() && !posting;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
        <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl border border-white/30 overflow-hidden">
          {/* header */}
          <div className="px-6 py-4 border-b bg-white/80 backdrop-blur flex items-center justify-between">
            <div>
              <div className="text-lg font-bold text-gray-900">สร้างกระทู้ใหม่</div>
              <div className="text-xs text-gray-500">เขียนให้ชัด คนจะตอบง่าย 👍</div>
            </div>

            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-800 text-xl transition"
              aria-label="close"
              disabled={posting}
              title={posting ? "กำลังโพสต์..." : "ปิด"}
            >
              ✕
            </button>
          </div>

          {/* body */}
          <div className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <img
                src={getProfileUrl(user?.Cprofile || null, user?.Cname)}
                className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-100"
                alt={user?.Cname || "user"}
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{user?.Cname}</div>
                <div className="text-xs text-gray-500">โพสต์สาธารณะ • ทุกคนเห็นได้</div>
              </div>

              {files.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  disabled={posting}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 disabled:opacity-50"
                  title="ลบรูปทั้งหมด"
                >
                  ลบรูปทั้งหมด
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-xs font-semibold text-gray-700 mb-1">หัวข้อ</div>
                <input
                  type="text"
                  placeholder="หัวข้อกระทู้ (สั้น ๆ แต่ชัด)"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="
                    w-full bg-white text-gray-800
                    border border-gray-200 rounded-2xl px-4 py-3
                    shadow-sm placeholder:text-gray-400
                    focus:outline-none focus:ring-4 focus:ring-emerald-200 focus:border-emerald-300
                  "
                  disabled={posting}
                  maxLength={255}
                />
                <div className="mt-1 flex justify-between text-[11px] text-gray-400">
                  <span>ตั้งชื่อดี ๆ คนคลิกอ่านมากขึ้น</span>
                  <span>{topic.length}/255</span>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-gray-700 mb-1">รายละเอียด</div>
                <textarea
                  placeholder="รายละเอียดกระทู้... (ใส่ข้อมูลให้ครบ จะได้ไม่ต้องถามกลับ)"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="
                    w-full bg-white text-gray-800
                    border border-gray-200 rounded-2xl px-4 py-3 h-36
                    shadow-sm placeholder:text-gray-400
                    focus:outline-none focus:ring-4 focus:ring-emerald-200 focus:border-emerald-300
                  "
                  disabled={posting}
                />
              </div>
            </div>

            {/* Upload images */}
            <div className="mt-4 bg-emerald-50/40 border border-emerald-100 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-900">แนบรูป</div>
                  <div className="text-xs text-gray-500">เพิ่มความชัดเจน (สูงสุด 6 รูป)</div>
                </div>

                <div className="text-xs text-gray-600">
                  {files.length}/6
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer">
                  📷 เลือกรูป
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={pickFiles}
                    disabled={posting || files.length >= 6}
                  />
                </label>

                {files.length > 0 && (
                  <div className="text-xs text-gray-500">
                    คลิกรูปเพื่อขยาย • กด ✕ เพื่อลบรูป
                  </div>
                )}

                {files.length >= 6 && (
                  <div className="text-xs font-semibold text-amber-700">
                    ครบ 6 รูปแล้วนะ 😅
                  </div>
                )}
              </div>

              {/* previews */}
              {files.length > 0 && (
                <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {files.map((f, idx) => {
                    const url = previewUrls[idx];
                    return (
                      <div
                        key={`${f.name}-${idx}`}
                        className="relative group rounded-xl overflow-hidden border border-gray-200 bg-white"
                      >
                        <button
                          type="button"
                          onClick={() => setViewerUrl(url)}
                          className="block w-full"
                          title="คลิกเพื่อขยาย"
                          disabled={posting}
                        >
                          <img
                            src={url}
                            alt={f.name}
                            className="h-24 w-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-black/15" />
                        </button>

                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center"
                          title="ลบรูปนี้"
                          disabled={posting}
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* actions */}
            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={posting}
                className="
                  w-full sm:w-auto px-5 py-3 rounded-full font-semibold
                  bg-white text-gray-700 border border-gray-200
                  hover:bg-gray-50 transition
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                ยกเลิก
              </button>

              <button
                onClick={submitPost}
                disabled={!canSubmit}
                className="
                  flex-1 bg-emerald-600 text-white py-3 rounded-full font-semibold
                  hover:bg-emerald-700 transition
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                {posting ? "กำลังโพสต์..." : "โพสต์กระทู้"}
              </button>
            </div>

            {/* hint */}
            {!topic.trim() || !details.trim() ? (
              <div className="mt-3 text-xs text-gray-400">
                * ต้องกรอก “หัวข้อ” และ “รายละเอียด” ก่อนนะ ไม่งั้นคนอ่านงงเหมือนอ่านโจทย์ไม่มีคำถาม
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* image viewer */}
      <ImageViewer url={viewerUrl} onClose={() => setViewerUrl(null)} />
    </>
  );
}
