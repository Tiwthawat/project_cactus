'use client';
import React, { useEffect, useState } from "react";
import { apiFetch } from "@/app/lib/apiFetch";
import PostList from "@/app/component/PostList";
import PostModal from "@/app/component/PostModal";
import CreatePostModal from "@/app/component/CreatePostModal";
import { ForumQuestion, ForumReply, ForumTopicDetail, UserData } from "@/app/types";
import { getProfileUrl } from "@/app/component/getProfileUrl";



export default function ForumPage() {
  const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";

  const [questions, setQuestions] = useState<ForumQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedPost, setSelectedPost] = useState<ForumTopicDetail | null>(null);
  const [openModal, setOpenModal] = useState(false);

  const [replyText, setReplyText] = useState("");

  const [user, setUser] = useState<UserData | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [topic, setTopic] = useState("");
  const [details, setDetails] = useState("");

  /* โหลด user */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    apiFetch(`${API}/me`,)
      .then((res) => res.json())
      .then((data) => setUser(data.user || null));
  }, []);

  /* โหลดรายการกระทู้ */
  const loadList = async () => {
    const res = await apiFetch(`${API}/forum/list`);
    const data = await res.json();
    if (Array.isArray(data)) setQuestions(data);
    setLoading(false);
  };

  useEffect(() => {
    loadList();
  }, []);

  /* เปิดโพสต์ */
  const openPost = async (Askid: number) => {
    const res = await apiFetch(`${API}/forum/${Askid}`);
    const data = await res.json();
    setSelectedPost(data);
    setOpenModal(true);
  };

  /* ส่งคอมเมนต์ */
  const submitReply = async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("กรุณาเข้าสู่ระบบ");

    const res = await apiFetch(
      `${API}/forum/${selectedPost!.topic.Askid}/reply`,
      {
        method: "POST",
        body: JSON.stringify({ Replydetails: replyText }),
      }
    );

    const data = await res.json();
    if (data.success) {
      const reload = await apiFetch(`${API}/forum/${selectedPost!.topic.Askid}`);
      setSelectedPost(await reload.json());
      setReplyText("");
    }
  };

  /* สร้างโพสต์ใหม่ */
  const submitPost = async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("กรุณาเข้าสู่ระบบ");

    const res = await apiFetch(`${API}/forum`, {
      method: "POST",
     
      body: JSON.stringify({ Asktopic: topic, Askdetails: details }),
    });

    const data = await res.json();
    if (data.success) {
      await loadList();
      setShowModal(false);
      setTopic("");
      setDetails("");
    }
  };

  const onDeletePost = async (Askid: number) => {
    if (!confirm("ต้องการลบกระทู้นี้จริงไหม?")) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    await apiFetch(`${API}/forum/${Askid}`, {
      method: "DELETE",
      
    });

    setOpenModal(false);
    await loadList();
  };
  const onEditPost = async (topicData: ForumQuestion) => {
    const newTopic = prompt("แก้ไขหัวข้อ:", topicData.Asktopic);
    const newDetails = prompt("แก้ไขรายละเอียด:", topicData.Askdetails);

    if (!newTopic || !newDetails) return;

    const token = localStorage.getItem("token");

    await apiFetch(`${API}/forum/${topicData.Askid}`, {
      method: "PUT",
      
      body: JSON.stringify({
        Asktopic: newTopic,
        Askdetails: newDetails,
      }),
    });

    const reload = await apiFetch(`${API}/forum/${topicData.Askid}`);
    setSelectedPost(await reload.json());
    await loadList();
  };const onDeleteReply = async (Replyid: number) => {
  if (!confirm("ต้องการลบความคิดเห็นนี้?")) return;

  const token = localStorage.getItem("token");
  if (!token) return;

  await apiFetch(`${API}/forum/reply/${Replyid}`, {
    method: "DELETE",
    
  });

  // reload post
  const reload = await apiFetch(`${API}/forum/${selectedPost!.topic.Askid}`);
  setSelectedPost(await reload.json());
};

  const onEditReply = async (reply: ForumReply) => {
    const newText = prompt("แก้ไขความคิดเห็น:", reply.Replydetails);
    if (!newText) return;

    const token = localStorage.getItem("token");

    await apiFetch(`${API}/forum/reply/${reply.Replyid}`, {
      method: "PUT",
      
      body: JSON.stringify({ Replydetails: newText }),
    });

    const reload = await apiFetch(`${API}/forum/${selectedPost!.topic.Askid}`);
    setSelectedPost(await reload.json());
  };


  return (
  <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white pt-32 px-4">
    <div className="mx-auto w-full max-w-3xl text-black">
      {/* header */}
      <div className="flex items-center justify-between mb-4">
        <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur border border-emerald-100 text-emerald-700 px-5 py-2 rounded-full text-sm font-semibold shadow-sm">
          กระทู้ถาม–ตอบ
          <span className="text-xs font-normal text-emerald-600/70">community</span>
        </div>
      </div>

      {/* create post */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 mb-6 flex gap-3 items-center">
        <img
          src={getProfileUrl(user?.Cprofile || null, user?.Cname)}
          className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-100"
        />

        <button
          onClick={() => user && setShowModal(true)}
          className="flex-1 text-left bg-white border border-gray-200 px-4 py-3 rounded-full text-gray-700
                     hover:bg-emerald-50 hover:border-emerald-200 transition
                     focus:outline-none focus:ring-4 focus:ring-emerald-200"
        >
          {user ? (
            <span className="flex items-center justify-between gap-2">
              <span className="text-gray-700">คุณคิดอะไรอยู่ {user.Cname}</span>
              <span className="text-xs text-gray-400">เขียนโพสต์…</span>
            </span>
          ) : (
            "เข้าสู่ระบบเพื่อโพสต์กระทู้"
          )}
        </button>
      </div>

      <PostList questions={questions} loading={loading} openPost={openPost} />

      {openModal && (
        <PostModal
          selectedPost={selectedPost}
          replyText={replyText}
          setReplyText={setReplyText}
          submitReply={submitReply}
          onClose={async () => {
            setOpenModal(false);
            await loadList();
          }}
          user={user}
          onDeletePost={onDeletePost}
          onEditPost={onEditPost}
          onDeleteReply={onDeleteReply}
          onEditReply={onEditReply}
        />
      )}

      <CreatePostModal
        show={showModal}
        user={user}
        topic={topic}
        details={details}
        setTopic={setTopic}
        setDetails={setDetails}
        submitPost={submitPost}
        onClose={() => setShowModal(false)}
      />
    </div>
  </main>
);


}
