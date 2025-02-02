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

type SocketContextType = {
  supabase: typeof supabase;
  bids: Bid[];
  currentBid: number | null;
  setBids: React.Dispatch<React.SetStateAction<Bid[]>>;
  setCurrentBid: React.Dispatch<React.SetStateAction<number | null>>;
};

const initialValue: SocketContextType = {
  supabase,
  bids: [],
  currentBid: null,
  setBids: () => {},
  setCurrentBid: () => {},
};

export const SocketContext = createContext(initialValue);

type Props = {
  children: ReactNode;
};

export const SocketContextProvider = ({ children }: Props) => {
  const [bids, setBids] = useState<Bid[]>([]);
  const [currentBid, setCurrentBid] = useState<number | null>(null);

  useEffect(() => {
    console.log("Setting up real-time subscription...");

    // Canal único para todos os eventos de lances
    const channel = supabase
      .channel("realtime_lances")
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'lances',
        },
        (payload) => {
          const newBid = payload.new as Bid;
          console.log('Novo lance recebido:', newBid);
      
          // Adiciona o novo lance no início do array para manter a ordem decrescente
          setBids((prev) => [newBid, ...prev]);
      
          // Atualiza o lance atual se necessário
          setCurrentBid((prevBid) => {
            return newBid.value > (prevBid || 0) ? newBid.value : prevBid;
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "lances",
        },
        (payload) => {
          const updatedBid = payload.new as Bid;
          console.log("Lance atualizado:", updatedBid);

          // Atualiza o estado de forma segura
          setBids((prev) =>
            prev.map((bid) => (bid.id === updatedBid.id ? updatedBid : bid))
          );

          // Atualiza o lance atual
          setCurrentBid((prevBid) => {
            if (!prevBid || updatedBid.value > prevBid) {
              return updatedBid.value;
            }
            return prevBid;
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "lances",
        },
        (payload) => {
          const deletedBidId = payload.old.id;
          console.log("Lance excluído:", deletedBidId);

          // Atualiza o estado de forma segura
          setBids((prev) => prev.filter((bid) => bid.id !== deletedBidId));
        }
      )
      .subscribe();

    // Limpeza do canal quando o componente for desmontado
    return () => {
      console.log("Unsubscribing from channel...");
      supabase.removeChannel(channel);
    };
  }, []); // [] assegura que o efeito execute apenas uma vez, quando o componente for montado

  return (
    <SocketContext.Provider
      value={{ supabase, bids, currentBid, setBids, setCurrentBid }}
    >
      {children}
    </SocketContext.Provider>
  );
};
