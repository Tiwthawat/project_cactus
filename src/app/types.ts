// src/app/types.ts

/* ===========================
   Auction Types
=========================== */
export type Status = "open" | "closed";

export interface Auction {
  Aid: number;
  start_price: number | string;
  current_price: number | string;
  min_increment?: number | string;
  end_time: string;
  status: Status;

  PROid: number;
  PROname: string;
  PROpicture: string;
  PROdetail?: string;
  PROdesc?: string;

  seller_name?: string;
  winner_id?: number | null;
  winner_name?: string;
  latest_bidder_id?: number | null;
  latest_bidder_name?: string | null;
  latest_bid_amount?: number | null;
  final_price?: number | null;
  winnerName?: string | null;
}

export interface Leader {
  user_id: number;
  username: string;
  amount: number;
  created_at: string;
}

/* ===========================
   Forum Types
=========================== */

export interface ForumQuestion {
  Askid: number;
  Cid: number;
  Asktopic: string;
  Askdetails: string;
  Askdate: string;
  Askvisits: number;
  Cname: string;
  Cprofile: string | null;
  ReplyCount: number;
  Askimages?: string[] | string | null;
}

export interface ForumReply {
  Replyid: number;
  Askid: number;
  Cid: number;
  Replydetails: string;
  Replydate: string;
  Cname: string;
  Cprofile: string | null;
   Replyrole?: "user" | "admin";
  Replyimages?: string[] | string | null;
  Adminid?: number | null;
}

export interface ForumTopicDetail {
  topic: ForumQuestion;
  comments: ForumReply[];
}

export interface UserData {
  Cid: number;
  Cname: string;
  Cprofile: string | null;
}
