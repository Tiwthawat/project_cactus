"use client";

import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/app/lib/apiFetch";
import PostModal from "@/app/component/PostModal";
import CreatePostModal from "@/app/component/CreatePostModal";
import { ForumQuestion, ForumTopicDetail, UserData } from "@/app/types";
import { getProfileUrl } from "@/app/component/getProfileUrl";
import Lightbox from "@/app/component/Lightbox";

/* ---------------------------
  helpers: url + json
----------------------------*/
const trimSlash = (s: string) => s.replace(/\/+$/, "");

const toApiUrl = (apiBase: string, p: string) => {
  if (!p) return "";

  let clean = String(p).trim();

  // ✅ DB เก็บมาเป็น /public/forum/xxx แต่ express เสิร์ฟเป็น /forum/xxx
  if (clean.startsWith("/public/forum/")) {
    clean = clean.replace("/public/forum/", "/forum/");
  } else if (clean.startsWith("public/forum/")) {
    clean = "/" + clean.replace("public/forum/", "forum/");
  }

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

/* ---------------------------
  UI: tiny icons (no emoji)
----------------------------*/
function IconEye(props: { className?: string }) {
  return (
    <svg
      className={props.className || "w-4 h-4"}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.3 12s3.6-7 9.7-7 9.7 7 9.7 7-3.6 7-9.7 7-9.7-7-9.7-7Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.2A3.2 3.2 0 1 0 12 8.8a3.2 3.2 0 0 0 0 6.4Z" />
    </svg>
  );
}

function IconChat(props: { className?: string }) {
  return (
    <svg
      className={props.className || "w-4 h-4"}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.5 18.5 4 20V6.8C4 5.8 4.8 5 5.8 5h12.4C19.2 5 20 5.8 20 6.8v8.4c0 1-.8 1.8-1.8 1.8H7.5Z"
      />
    </svg>
  );
}

function IconPhoto(props: { className?: string }) {
  return (
    <svg
      className={props.className || "w-4 h-4"}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.8 7h14.4c1 0 1.8.8 1.8 1.8v9.4c0 1-.8 1.8-1.8 1.8H4.8c-1 0-1.8-.8-1.8-1.8V8.8C3 7.8 3.8 7 4.8 7Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 11.2a1.4 1.4 0 1 0 0-2.8 1.4 1.4 0 0 0 0 2.8Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 16l-5.2-5.2a1.2 1.2 0 0 0-1.7 0L6.5 18" />
    </svg>
  );
}

function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "emerald";
}) {
  const cls =
    tone === "emerald"
      ? "bg-emerald-50 text-emerald-800 border-emerald-100"
      : "bg-gray-50 text-gray-700 border-gray-200";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`}>
      {children}
    </span>
  );
}

/* ---------------------------
  UI: thumb strip
----------------------------*/
function ThumbStrip({
  urls,
  onOpen,
}: {
  urls: string[];
  onOpen: (index: number) => void;
}) {
  if (urls.length <= 1) return null;

  // โชว์แค่ 6 รูปในแถบ
  const show = urls.slice(0, 6);
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

      <div className="text-xs text-gray-400 mt-1">คลิกรูปเพื่อเปิดดูแบบเลื่อนภาพ</div>
    </div>
  );
}

/* ---------------------------
  ForumPage
----------------------------*/
export default function ForumPage() {
  const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";

  const [questions, setQuestions] = useState<ForumQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedPost, setSelectedPost] = useState<ForumTopicDetail | null>(null);
  const [openModal, setOpenModal] = useState(false);

  const [user, setUser] = useState<UserData | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [topic, setTopic] = useState("");
  const [details, setDetails] = useState("");

  // create post images
  const [postFiles, setPostFiles] = useState<File[]>([]);
  const [posting, setPosting] = useState(false);

  // ✅ Lightbox state (ใช้ทั้งหน้า list)
  const [lbOpen, setLbOpen] = useState(false);
  const [lbImages, setLbImages] = useState<string[]>([]);
  const [lbStart, setLbStart] = useState(0);

  const openLightbox = (images: string[], startIndex: number) => {
    setLbImages(images);
    setLbStart(startIndex);
    setLbOpen(true);
  };

  /* โหลด user */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    apiFetch(`${API}/me`)
      .then((res) => res.json())
      .then((data) => setUser(data.user || null))
      .catch(() => setUser(null));
  }, [API]);

  /* โหลดรายการกระทู้ */
  const loadList = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`${API}/forum/list`);
      const data = await res.json();
      if (Array.isArray(data)) setQuestions(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* เปิดโพสต์ */
  const openPost = async (Askid: number) => {
    const res = await apiFetch(`${API}/forum/${Askid}`);
    const data = await res.json();
    setSelectedPost(data);
    setOpenModal(true);
  };

  /* สร้างโพสต์ใหม่ (multipart) */
  const submitPost = async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("กรุณาเข้าสู่ระบบ");
    if (!topic.trim() || !details.trim()) return;

    try {
      setPosting(true);

      const fd = new FormData();
      fd.append("Asktopic", topic.trim());
      fd.append("Askdetails", details.trim());
      postFiles.forEach((f) => fd.append("images", f));

      const res = await fetch(`${trimSlash(API)}/forum`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) return alert(data?.error || "โพสต์ไม่สำเร็จ");

      await loadList();
      setShowModal(false);
      setTopic("");
      setDetails("");
      setPostFiles([]);
    } finally {
      setPosting(false);
    }
  };

  const onDeletePost = async (Askid: number) => {
    if (!confirm("ต้องการลบกระทู้นี้จริงไหม?")) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    await apiFetch(`${API}/forum/${Askid}`, { method: "DELETE" });

    setOpenModal(false);
    await loadList();
  };

  const onEditPost = async (topicData: ForumQuestion) => {
    const newTopic = prompt("แก้ไขหัวข้อ:", topicData.Asktopic);
    const newDetails = prompt("แก้ไขรายละเอียด:", topicData.Askdetails);
    if (!newTopic || !newDetails) return;

    await apiFetch(`${API}/forum/${topicData.Askid}`, {
      method: "PUT",
      body: JSON.stringify({
        Asktopic: newTopic,
        Askdetails: newDetails,
      }),
    });

    const reload = await apiFetch(`${API}/forum/${topicData.Askid}?count=0`);
    setSelectedPost(await reload.json());
    await loadList();
  };

  /* ---------------------------
    list view: derived thumbnails
  ----------------------------*/
  const listRows = useMemo(() => {
    return questions.map((q) => {
      const imgs = safeJsonArray((q as any).Askimages).map((p) => toApiUrl(API, p));
      const first = imgs[0] || "";
      return { q, imgs, first, count: imgs.length };
    });
  }, [questions, API]);

  return (
    <>
      <main className="min-h-screen bg-gradient-to-b from-emerald-50/60 via-white to-white pt-32 px-4">
        <div className="mx-auto w-full max-w-3xl text-black">
          {/* header */}
          <div className="flex items-center justify-between mb-5">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur border border-emerald-100 text-emerald-800 px-5 py-2 rounded-full text-sm font-semibold shadow-sm">
              Community
              <span className="text-xs font-normal text-emerald-700/70">ถาม–ตอบ</span>
            </div>

            <button
              onClick={() => user && setShowModal(true)}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 text-white text-sm font-semibold shadow-sm hover:bg-emerald-700 transition disabled:opacity-50"
              disabled={!user}
              title={user ? "สร้างกระทู้ใหม่" : "เข้าสู่ระบบก่อน"}
            >
              สร้างกระทู้
            </button>
          </div>

          {/* create post quick box */}
          <div className="bg-white/80 backdrop-blur border border-gray-200 rounded-3xl shadow-sm p-4 mb-6 flex gap-3 items-center">
            <img
              src={getProfileUrl(user?.Cprofile || null, user?.Cname)}
              className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-100"
              alt="me"
            />

            <button
              onClick={() => user && setShowModal(true)}
              className="flex-1 text-left bg-white border border-gray-200 px-4 py-3 rounded-full text-gray-700
                         hover:bg-emerald-50 hover:border-emerald-200 transition
                         focus:outline-none focus:ring-4 focus:ring-emerald-200"
            >
              {user ? (
                <span className="flex items-center justify-between gap-2">
                  <span className="text-gray-800">โพสต์คำถามใหม่…</span>
                  <span className="text-xs text-gray-400">รองรับแนบรูป</span>
                </span>
              ) : (
                "เข้าสู่ระบบเพื่อโพสต์กระทู้"
              )}
            </button>

            <button
              onClick={() => user && setShowModal(true)}
              className="sm:hidden inline-flex items-center justify-center h-11 px-4 rounded-full bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
              disabled={!user}
              title={user ? "สร้างกระทู้ใหม่" : "เข้าสู่ระบบก่อน"}
            >
              โพสต์
            </button>
          </div>

          {/* list */}
          {loading ? (
            <div className="text-center text-gray-500 py-10">กำลังโหลด...</div>
          ) : listRows.length === 0 ? (
            <div className="text-center text-gray-500 py-10">ยังไม่มีกระทู้</div>
          ) : (
            <ul className="space-y-4">
              {listRows.map(({ q, imgs, first, count }) => (
                <li
                  key={q.Askid}
                  onClick={() => openPost(q.Askid)}
                  className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden
                             hover:shadow-md hover:border-emerald-200 transition cursor-pointer"
                >
                  <div className="p-4 sm:p-5 flex gap-3">
                    <img
                      src={getProfileUrl(q.Cprofile, q.Cname)}
                      className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-100"
                      alt={q.Cname}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-extrabold text-gray-900 line-clamp-1">
                            {q.Asktopic}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            <span className="font-semibold text-gray-700">{q.Cname}</span>
                            <span className="mx-2 text-gray-300">•</span>
                            <span>{new Date(q.Askdate).toLocaleString("th-TH")}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-600 shrink-0">
                          <Pill>
                            <IconEye className="w-4 h-4" />
                            <span>{q.Askvisits}</span>
                          </Pill>
                          <Pill>
                            <IconChat className="w-4 h-4" />
                            <span>{q.ReplyCount}</span>
                          </Pill>
                          {count > 0 && (
                            <Pill tone="emerald">
                              <IconPhoto className="w-4 h-4" />
                              <span>{count}</span>
                            </Pill>
                          )}
                        </div>
                      </div>

                      <div className="text-sm text-gray-700 mt-3 whitespace-pre-line line-clamp-2">
                        {q.Askdetails}
                      </div>

                      {/* ✅ รูปแนบ: HERO + thumbs */}
                      {first && (
                        <div className="mt-4">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openLightbox(imgs, 0);
                            }}
                            className="group relative w-full overflow-hidden rounded-3xl border border-gray-200 bg-black"
                            title="เปิดดูรูป"
                          >
                            <div className="w-full max-h-[52vh] flex items-center justify-center bg-black">
                              <img
                                src={first}
                                alt="post"
                                className="w-full h-auto max-h-[52vh] object-contain"
                                loading="lazy"
                              />
                            </div>

                            {/* overlay label (premium) */}
                            <div className="absolute left-3 bottom-3">
                              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/92 border border-white/60 shadow-sm">
                                <IconPhoto className="w-4 h-4" />
                                รูปแนบ {count}
                              </span>
                            </div>

                            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition" />
                          </button>

                          <div onClick={(e) => e.stopPropagation()}>
                            <ThumbStrip urls={imgs} onOpen={(i) => openLightbox(imgs, i)} />
                          </div>
                        </div>
                      )}

                      <div className="mt-4 flex items-center justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openPost(q.Askid);
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition"
                        >
                          เปิดกระทู้
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Post modal */}
          {openModal && (
            <PostModal
              apiBase={API}
              selectedPost={selectedPost}
              onReload={async () => {
                if (!selectedPost?.topic?.Askid) return;
                const reload = await apiFetch(
                  `${API}/forum/${selectedPost.topic.Askid}?count=0`
                );
                setSelectedPost(await reload.json());
              }}
              onClose={async () => {
                setOpenModal(false);
                await loadList();
              }}
              user={user}
              onDeletePost={onDeletePost}
              onEditPost={onEditPost}
            />
          )}

          {/* Create post modal */}
          <CreatePostModal
            show={showModal}
            user={user}
            topic={topic}
            details={details}
            setTopic={setTopic}
            setDetails={setDetails}
            submitPost={submitPost}
            onClose={() => setShowModal(false)}
            files={postFiles}
            setFiles={setPostFiles}
            posting={posting}
          />
        </div>
      </main>

      {/* ✅ Lightbox */}
      <Lightbox open={lbOpen} images={lbImages} startIndex={lbStart} onClose={() => setLbOpen(false)} />
    </>
  );
}
