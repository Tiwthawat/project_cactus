"use client";

import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/app/lib/apiFetch";
import { ForumReply, ForumTopicDetail, ForumQuestion, UserData } from "../types";
import { getProfileUrl } from "./getProfileUrl";
import Lightbox from "./Lightbox";

/* ---------------------------
  helpers: image url + json
----------------------------*/
const trimSlash = (s: string) => s.replace(/\/+$/, "");

const toApiUrl = (apiBase: string, p: string) => {
  if (!p) return "";

  let clean = String(p).trim();

  // ✅ เผื่อ DB เก็บเป็น /public/forum/xxx แต่ express เสิร์ฟจริงเป็น /forum/xxx
  if (clean.startsWith("/public/forum/")) clean = clean.replace("/public/forum/", "/forum/");
  else if (clean.startsWith("public/forum/")) clean = "/" + clean.replace("public/forum/", "forum/");

  if (clean.startsWith("http")) return clean;
  if (clean.startsWith("/")) return `${trimSlash(apiBase)}${clean}`;
  return `${trimSlash(apiBase)}/${clean}`;
};

function safeJsonArray(v: any): string[] {
  if (!v) return [];
  try {
    const parsed = typeof v === "string" ? JSON.parse(v) : v;
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function isAdminReply(reply: any) {
  return reply?.Replyrole === "admin" || !!reply?.Adminid;
}

/* ---------------------------
  UI: icons (no emoji)
----------------------------*/
function IconX(props: { className?: string }) {
  return (
    <svg className={props.className || "w-5 h-5"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function IconPhoto(props: { className?: string }) {
  return (
    <svg className={props.className || "w-4 h-4"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.8 7h14.4c1 0 1.8.8 1.8 1.8v9.4c0 1-.8 1.8-1.8 1.8H4.8c-1 0-1.8-.8-1.8-1.8V8.8C3 7.8 3.8 7 4.8 7Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 11.2a1.4 1.4 0 1 0 0-2.8 1.4 1.4 0 0 0 0 2.8Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 16l-5.2-5.2a1.2 1.2 0 0 0-1.7 0L6.5 18" />
    </svg>
  );
}

function IconEdit(props: { className?: string }) {
  return (
    <svg className={props.className || "w-4 h-4"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z" />
    </svg>
  );
}

function IconTrash(props: { className?: string }) {
  return (
    <svg className={props.className || "w-4 h-4"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 6V4.5A1.5 1.5 0 0 1 9.5 3h5A1.5 1.5 0 0 1 16 4.5V6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 6 7.5 20h9L17.5 6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 10v7M14 10v7" />
    </svg>
  );
}

function IconSend(props: { className?: string }) {
  return (
    <svg className={props.className || "w-4 h-4"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M22 2 11 13" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M22 2 15 22l-4-9-9-4 20-7Z" />
    </svg>
  );
}

function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "emerald" | "amber";
}) {
  const cls =
    tone === "emerald"
      ? "bg-emerald-50 text-emerald-800 border-emerald-100"
      : tone === "amber"
      ? "bg-amber-50 text-amber-900 border-amber-100"
      : "bg-gray-50 text-gray-700 border-gray-200";

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`}>
      {children}
    </span>
  );
}

function GhostButton({
  onClick,
  children,
  tone = "neutral",
}: {
  onClick: () => void;
  children: React.ReactNode;
  tone?: "neutral" | "danger";
}) {
  const cls =
    tone === "danger"
      ? "text-rose-700 hover:bg-rose-50 border-rose-100"
      : "text-gray-700 hover:bg-gray-50 border-gray-200";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border bg-white transition ${cls}`}
    >
      {children}
    </button>
  );
}

/* ---------------------------
  UI: Full image + thumbs
----------------------------*/
function ThumbStrip({
  urls,
  onOpen,
}: {
  urls: string[];
  onOpen: (index: number) => void;
}) {
  if (urls.length <= 1) return null;

  const show = urls.slice(0, 8);
  const more = urls.length - show.length;

  return (
    <div className="mt-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {show.map((u, i) => (
          <button
            key={`${u}-${i}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen(i);
            }}
            className="relative shrink-0 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 hover:border-emerald-200 transition"
            title={`รูปที่ ${i + 1}`}
          >
            <img src={u} alt="thumb" className="h-16 w-24 object-cover" loading="lazy" />
            {more > 0 && i === show.length - 1 && (
              <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                <div className="text-white text-sm font-bold">+{more}</div>
              </div>
            )}
          </button>
        ))}
      </div>
      <div className="text-xs text-gray-400 mt-1">ใช้ลูกศรใน Lightbox เพื่อเลื่อนรูป</div>
    </div>
  );
}

function FullImageBlock({
  urls,
  onOpen,
}: {
  urls: string[];
  onOpen: (index: number) => void;
}) {
  if (!urls.length) return null;

  const first = urls[0];

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpen(0);
        }}
        className="group relative w-full overflow-hidden rounded-3xl border border-gray-200 bg-black"
        title="เปิดดูรูป"
      >
        <div className="w-full h-[52vh] sm:h-[60vh] flex items-center justify-center bg-black">
          <img src={first} alt="post" className="max-h-full max-w-full object-contain" loading="lazy" />
        </div>

        <div className="absolute left-3 bottom-3">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/92 border border-white/60 shadow-sm">
            <IconPhoto className="w-4 h-4" />
            รูปแนบ {urls.length}
          </span>
        </div>

        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition" />
      </button>

      <ThumbStrip urls={urls} onOpen={onOpen} />
    </div>
  );
}

/* ---------------------------
  main component
----------------------------*/
export default function PostModal({
  apiBase,
  selectedPost,
  onReload,
  onClose,
  user,
  onDeletePost,
  onEditPost,
}: {
  apiBase: string;
  selectedPost: ForumTopicDetail | null;
  onReload: () => Promise<void>;
  onClose: () => void;
  user: UserData | null;
  onDeletePost: (Askid: number) => void;
  onEditPost: (topic: ForumQuestion) => void;
}) {
  // ✅ ใช้ env สำหรับรูป
  const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";

  const [replyText, setReplyText] = useState("");
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);

  // ✅ Lightbox (โพสต์+คอมเมนต์ใช้ร่วมกัน)
  const [lbOpen, setLbOpen] = useState(false);
  const [lbImages, setLbImages] = useState<string[]>([]);
  const [lbStart, setLbStart] = useState(0);
  const openLightbox = (images: string[], startIndex: number) => {
    setLbImages(images);
    setLbStart(startIndex);
    setLbOpen(true);
  };

  // preview urls (avoid memory leak)
  const previewUrls = useMemo(() => replyFiles.map((f) => URL.createObjectURL(f)), [replyFiles]);
  useEffect(() => {
    return () => {
      previewUrls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [previewUrls]);

  if (!selectedPost) return null;

  const isOwnerPost = user && user.Cid === selectedPost.topic.Cid;

  // ✅ map image paths -> API URLs (ใช้ env base)
  const topicImages = useMemo(() => {
    const arr = safeJsonArray((selectedPost.topic as any).Askimages);
    return arr.map((p) => toApiUrl(API, p));
  }, [selectedPost.topic, API]);

  const comments = selectedPost.comments || [];

  const pickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    if (!list.length) return;

    const next = [...replyFiles, ...list].slice(0, 6);
    setReplyFiles(next);
    e.target.value = "";
  };

  const removeFile = (idx: number) => {
    setReplyFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const submitReply = async () => {
    if (!replyText.trim() && replyFiles.length === 0) return;

    try {
      setSending(true);

      const fd = new FormData();
      fd.append("Replydetails", replyText.trim());
      replyFiles.forEach((f) => fd.append("images", f));

      const res = await apiFetch(`/forum/${selectedPost.topic.Askid}/reply`, {
        method: "POST",
        body: fd,
      });

      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) return alert(data?.error || "ส่งความคิดเห็นไม่สำเร็จ");

      setReplyText("");
      setReplyFiles([]);
      await onReload();
    } finally {
      setSending(false);
    }
  };

  const onDeleteReply = async (Replyid: number) => {
    if (!confirm("ต้องการลบความคิดเห็นนี้?")) return;

    await apiFetch(`/forum/reply/${Replyid}`, { method: "DELETE" });
    await onReload();
  };

  const onEditReply = async (reply: ForumReply) => {
    const newText = prompt("แก้ไขความคิดเห็น:", reply.Replydetails);
    if (!newText) return;

    await apiFetch(`/forum/reply/${reply.Replyid}`, {
      method: "PUT",
      body: JSON.stringify({ Replydetails: newText }),
    });

    await onReload();
  };

  return (
    <>
      {/* overlay */}
      <div className="fixed inset-0 bg-black/55 backdrop-blur-[2px] flex items-center justify-center z-50 px-4">
        {/* modal */}
        <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden border border-white/30">
          {/* HEADER */}
          <div className="flex justify-between items-center px-5 py-4 border-b bg-white/80 backdrop-blur">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900 line-clamp-1">
                {selectedPost.topic.Asktopic}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">รายละเอียดกระทู้และความคิดเห็น</div>
            </div>

            <button
              className="text-gray-500 hover:text-gray-900 transition p-2 rounded-full hover:bg-gray-50"
              onClick={onClose}
              aria-label="close"
              type="button"
            >
              <IconX className="w-5 h-5" />
            </button>
          </div>

          {/* BODY */}
          <div className="p-5 max-h-[82vh] overflow-y-auto">
            {/* topic card */}
            <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-5">
              <div className="flex items-start gap-3">
                <img
                  src={getProfileUrl(selectedPost.topic.Cprofile, selectedPost.topic.Cname)}
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-100"
                  alt={selectedPost.topic.Cname}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-extrabold text-gray-900">{selectedPost.topic.Cname}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(selectedPost.topic.Askdate).toLocaleString("th-TH")}
                      </div>
                    </div>

                    {isOwnerPost && (
                      <div className="flex gap-2 shrink-0">
                        <GhostButton onClick={() => onEditPost(selectedPost.topic)}>
                          <IconEdit className="w-4 h-4" />
                          แก้ไข
                        </GhostButton>
                        <GhostButton
                          onClick={() => onDeletePost(selectedPost.topic.Askid)}
                          tone="danger"
                        >
                          <IconTrash className="w-4 h-4" />
                          ลบ
                        </GhostButton>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 text-sm text-gray-800 whitespace-pre-line leading-relaxed">
                    {selectedPost.topic.Askdetails}
                  </div>

                  <FullImageBlock urls={topicImages} onOpen={(i) => openLightbox(topicImages, i)} />
                </div>
              </div>
            </div>

            {/* comments header */}
            <div className="mt-6 flex items-end justify-between">
              <div>
                <div className="text-base font-extrabold text-gray-900">ความคิดเห็น</div>
                <div className="text-xs text-gray-500 mt-1">แสดงทั้งหมด {comments.length} รายการ</div>
              </div>
            </div>

            {/* comments list */}
            <div className="mt-4 space-y-4">
              {comments.length === 0 && (
                <div className="text-center text-gray-500 py-10 bg-white border border-gray-200 rounded-3xl">
                  ยังไม่มีความคิดเห็น
                </div>
              )}

              {comments.map((c: any) => {
                const admin = isAdminReply(c);
                const isOwnerReply = !!user && !!c.Cid && user.Cid === c.Cid && !admin;

                const displayName = admin
                  ? c.Aname || c.Cname || "Official"
                  : c.Cname || "User";

                const replyImages = safeJsonArray(c.Replyimages).map((p) => toApiUrl(API, p));

                return (
                  <div
                    key={c.Replyid}
                    className={
                      admin
                        ? "bg-white border border-amber-200 rounded-3xl shadow-sm p-5"
                        : "bg-white border border-gray-200 rounded-3xl shadow-sm p-5"
                    }
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={getProfileUrl(c.Cprofile, displayName)}
                        className={
                          admin
                            ? "w-10 h-10 rounded-full object-cover ring-2 ring-amber-100"
                            : "w-10 h-10 rounded-full object-cover ring-2 ring-emerald-50"
                        }
                        alt={displayName}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="font-extrabold text-sm text-gray-900">{displayName}</div>
                              {admin && (
                                <Pill tone="amber">
                                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                                  Official
                                </Pill>
                              )}
                            </div>

                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(c.Replydate).toLocaleString("th-TH")}
                            </div>
                          </div>

                          {(isOwnerReply || admin) && (
                            <div className="flex gap-2 shrink-0">
                              <GhostButton onClick={() => onEditReply(c)}>
                                <IconEdit className="w-4 h-4" />
                                แก้ไข
                              </GhostButton>
                              <GhostButton onClick={() => onDeleteReply(c.Replyid)} tone="danger">
                                <IconTrash className="w-4 h-4" />
                                ลบ
                              </GhostButton>
                            </div>
                          )}
                        </div>

                        <div className="mt-3 text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                          {c.Replydetails}
                        </div>

                        {replyImages.length > 0 && (
                          <div className="mt-4">
                            <button
                              type="button"
                              onClick={() => openLightbox(replyImages, 0)}
                              className="group relative w-full overflow-hidden rounded-3xl border border-gray-200 bg-black"
                              title="เปิดดูรูป"
                            >
                              <div className="w-full h-[38vh] sm:h-[45vh] flex items-center justify-center bg-black">
                                <img
                                  src={replyImages[0]}
                                  alt="reply"
                                  className="max-h-full max-w-full object-contain"
                                  loading="lazy"
                                />
                              </div>

                              <div className="absolute left-3 bottom-3">
                                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/92 border border-white/60 shadow-sm">
                                  <IconPhoto className="w-4 h-4" />
                                  รูปแนบ {replyImages.length}
                                </span>
                              </div>

                              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition" />
                            </button>

                            <ThumbStrip urls={replyImages} onOpen={(i) => openLightbox(replyImages, i)} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* reply box */}
            <div className="mt-6 bg-white border border-gray-200 rounded-3xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-extrabold text-gray-900">ตอบกลับ</div>
                <div className="text-xs text-gray-500">แนบรูปได้สูงสุด 6 รูป</div>
              </div>

              <textarea
                className="
                  w-full bg-white text-gray-800
                  border border-gray-200 rounded-2xl px-4 py-3 text-sm
                  shadow-sm placeholder:text-gray-400
                  focus:outline-none focus:ring-4 focus:ring-emerald-200 focus:border-emerald-300
                "
                rows={3}
                placeholder={user ? "พิมพ์ความคิดเห็นของคุณ…" : "เข้าสู่ระบบเพื่อแสดงความคิดเห็น"}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                disabled={!user || sending}
              />

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <IconPhoto className="w-4 h-4" />
                  แนบรูป
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={pickFiles}
                    disabled={!user || sending}
                  />
                </label>

                {replyFiles.length > 0 && (
                  <div className="text-xs text-gray-500">เลือกแล้ว {replyFiles.length} รูป</div>
                )}
              </div>

              {/* previews */}
              {replyFiles.length > 0 && (
                <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {previewUrls.map((url, idx) => (
                    <div
                      key={url}
                      className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50"
                    >
                      <img src={url} alt={`preview-${idx}`} className="h-24 w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center"
                        title="ลบรูปนี้"
                      >
                        <IconX className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={submitReply}
                disabled={!user || sending || (!replyText.trim() && replyFiles.length === 0)}
                className="
                  mt-4 inline-flex items-center justify-center gap-2 w-full sm:w-auto
                  bg-emerald-600 text-white px-6 py-3 rounded-full font-semibold text-sm
                  hover:bg-emerald-700 transition
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                <IconSend className="w-4 h-4" />
                {sending ? "กำลังส่ง..." : "ส่งความคิดเห็น"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Lightbox */}
      <Lightbox open={lbOpen} images={lbImages} startIndex={lbStart} onClose={() => setLbOpen(false)} />
    </>
  );
}
