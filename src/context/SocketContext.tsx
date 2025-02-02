import { ReactNode, createContext, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

import { Auction } from "../models/Auction";
import { Bid } from "../models/Bid";
import { SocketContextType } from "../models/SocketContextType";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const initialValue: SocketContextType = {
  supabase,
  bids: [],
  currentBid: null,
  leilao: null, // Inicializa leilao com null
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
  const [leilao, setLeilao] = useState<Auction | null>(null);

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
          setCurrentBid((prevBid) =>
            newBid.value > (prevBid || 0) ? newBid.value : prevBid
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "lances" },
        (payload) => {
          const updatedBid = payload.new as Bid;
          console.log("Lance atualizado:", updatedBid);
          setBids((prev) =>
            prev.map((bid) => (bid.id === updatedBid.id ? updatedBid : bid))
          );
          setCurrentBid((prevBid) =>
            updatedBid.value > (prevBid || 0) ? updatedBid.value : prevBid
          );
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

    // Canal para status de leilão
    const auctionChannel = supabase
      .channel("realtime:leilao") // Nome do canal ajustado
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "leilao" },
        (payload) => {
          const updatedAuction = payload.new as Auction;
          console.log("Leilão atualizado:", updatedAuction);
          if (updatedAuction.status_id === 3) {
            setLeilao((prevLeilao) => ({
              ...prevLeilao,
              ...updatedAuction
            }));
        }
        }
      )
      .subscribe();

    // Função para verificar leilões e atualizar status 2
    const checkAuctionStatusToTwo = async () => {
      //console.log("Verificando leilões que precisam de atualização...");

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
        //console.log("Nenhum leilão precisa ser atualizado.");
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
    checkAuctionStatusToTwo();
    const intervalId2 = setInterval(checkAuctionStatusToTwo, 60 * 1000);

    /////////////////////////////////////////

    // Função para verificar leilões e atualizar status 2
    const checkAuctionStatusToThree = async () => {
      //console.log("Verificando leilões que precisam de atualização...");

      const now = new Date();
      now.setHours(now.getHours() - 4); // Ajuste para UTC-4

      const { data: auctions, error } = await supabase
        .from("leilao")
        .select("id, status_id, data_hora_finalizacao")
        .eq("status_id", 2) // Apenas leilões que ainda não mudaram
        .lte("data_hora_finalizacao", now.toISOString());

      if (error) {
        console.error("Erro ao buscar leilões:", error);
        return;
      }

      if (!auctions.length) {
        //console.log("Nenhum leilão precisa ser atualizado.");
        return;
      }

      console.log(`Atualizando ${auctions.length} leilões para status 3...`);
      for (const auction of auctions) {
        const { error: updateError } = await supabase
          .from("leilao")
          .update({ status_id: 3 })
          .eq("id", auction.id);

        if (updateError) {
          console.error(`Erro ao atualizar leilão ${auction.id}:`, updateError);
        } else {
          console.log(`Leilão ${auction.id} atualizado para status 2.`);
        }
      }
    };

    // Inicia a verificação imediatamente e depois a cada 1 minuto
    checkAuctionStatusToThree();
    const intervalId3 = setInterval(checkAuctionStatusToThree, 60 * 10);

    return () => {
      console.log("Unsubscribing from channel...");
      supabase.removeChannel(channel);
      supabase.removeChannel(auctionChannel);
      clearInterval(intervalId2);
      clearInterval(intervalId3);
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        supabase,
        bids,
        currentBid,
        leilao,
        setBids,
        setCurrentBid,
        updateAuctionStatus: () => {},
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
