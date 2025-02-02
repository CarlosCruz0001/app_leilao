import { ReactNode, createContext, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Bid = {
  id: number;
  value: number;
  user_id: string;
  username: string;
  created_at: string;
  auction_id: string;
};

export type Auction = {
  id: number;
  status_id: number;
  data_hora_realizacao: string; // ISO format
};

type SocketContextType = {
  supabase: typeof supabase;
  bids: Bid[];
  currentBid: number | null;
  setBids: React.Dispatch<React.SetStateAction<Bid[]>>;
  setCurrentBid: React.Dispatch<React.SetStateAction<number | null>>;
  updateAuctionStatus: () => void;
};

const initialValue: SocketContextType = {
  supabase,
  bids: [],
  currentBid: null,
  setBids: () => {},
  setCurrentBid: () => {},
  updateAuctionStatus: () => {},
};

// **Criação do contexto**
export const SocketContext = createContext<SocketContextType>(initialValue);

type Props = {
  children: ReactNode;
};

export const SocketContextProvider = ({ children }: Props) => {
  const [bids, setBids] = useState<Bid[]>([]);
  const [currentBid, setCurrentBid] = useState<number | null>(null);

  useEffect(() => {
    console.log("Setting up real-time subscription...");

    const channel = supabase
      .channel("realtime_lances")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "lances" },
        (payload) => {
          const newBid = payload.new as Bid;
          console.log("Novo lance recebido:", newBid);
          setBids((prev) => [newBid, ...prev]);
          setCurrentBid((prevBid) => (newBid.value > (prevBid || 0) ? newBid.value : prevBid));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "lances" },
        (payload) => {
          const updatedBid = payload.new as Bid;
          console.log("Lance atualizado:", updatedBid);
          setBids((prev) => prev.map((bid) => (bid.id === updatedBid.id ? updatedBid : bid)));
          setCurrentBid((prevBid) => (updatedBid.value > (prevBid || 0) ? updatedBid.value : prevBid));
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "lances" },
        (payload) => {
          const deletedBidId = payload.old.id;
          console.log("Lance excluído:", deletedBidId);
          setBids((prev) => prev.filter((bid) => bid.id !== deletedBidId));
        }
      )
      .subscribe();

    // Função para verificar leilões e atualizar status
    const checkAuctionStatus = async () => {
      console.log("Verificando leilões que precisam de atualização...");

      const now = new Date();
      now.setHours(now.getHours() - 4); // Ajuste para UTC-4

      const { data: auctions, error } = await supabase
        .from("leilao")
        .select("id, status_id, data_hora_realizacao")
        .eq("status_id", 1) // Apenas leilões que ainda não mudaram
        .lte("data_hora_realizacao", now.toISOString());

      if (error) {
        console.error("Erro ao buscar leilões:", error);
        return;
      }

      if (!auctions.length) {
        console.log("Nenhum leilão precisa ser atualizado.");
        return;
      }

      console.log(`Atualizando ${auctions.length} leilões para status 2...`);
      for (const auction of auctions) {
        const { error: updateError } = await supabase
          .from("leilao")
          .update({ status_id: 2 })
          .eq("id", auction.id);

        if (updateError) {
          console.error(`Erro ao atualizar leilão ${auction.id}:`, updateError);
        } else {
          console.log(`Leilão ${auction.id} atualizado para status 2.`);
        }
      }
    };

    // Inicia a verificação imediatamente e depois a cada 1 minuto
    checkAuctionStatus();
    const intervalId = setInterval(checkAuctionStatus, 60 * 1000);

    return () => {
      console.log("Unsubscribing from channel...");
      supabase.removeChannel(channel);
      clearInterval(intervalId);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ supabase, bids, currentBid, setBids, setCurrentBid, updateAuctionStatus: () => {} }}>
      {children}
    </SocketContext.Provider>
  );
};
