// src/app/types.ts
export type Status = 'open' | 'closed';

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
  winner_name?: string ;

  latest_bidder_id?: number | null;
  latest_bidder_name?: string | null;
  latest_bid_amount?: number | null;
  final_price?: number | null;
  winnerName?: string;
  
}

export interface Leader {
  user_id: number;
  username: string;
  amount: number;
  created_at: string;
}
