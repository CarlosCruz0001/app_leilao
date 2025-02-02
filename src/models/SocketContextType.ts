import { Auction } from "./Auction";
import { Bid } from "./Bid";
import { SupabaseClient } from '@supabase/supabase-js';

export type SocketContextType = {
    supabase: SupabaseClient; // Você pode ajustar o tipo de `supabase` conforme a necessidade
    bids: Bid[];
    currentBid: number | null;
    leilao: Auction | null;
    setBids: React.Dispatch<React.SetStateAction<Bid[]>>;
    setCurrentBid: React.Dispatch<React.SetStateAction<number | null>>;
    updateAuctionStatus: () => void;
  };