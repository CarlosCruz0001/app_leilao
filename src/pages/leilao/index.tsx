import React, { useState, useEffect, useContext, useCallback } from "react";
import { useParams } from "react-router-dom";
import { SocketContext } from "../../context/SocketContext";
import { Auction } from "../../models/Auction";
import styles from "./style.module.css";
import { Vendedor } from "../../models/Vendedor";


function AuctionPage() {
  const { id, userId } = useParams<{ id: string; userId: string }>();
  const [leilaoModel, setLeilao] = useState<Auction | null>(null);
  const [vendedor, setVendedor] = useState<Vendedor | null>(null);
  const [user, setUser] = useState<Vendedor | null>(null);
  const [userLoading, setUserLoading] = useState<boolean>(true);
  const { supabase, bids, currentBid, leilao, setBids, setCurrentBid } =
    useContext(SocketContext);

  const fetchLeilaoData = useCallback(async () => {
    console.log("Fetching auction data...");
    
    if (!id) return;
    const { data, error } = await supabase
      .from("leilao")
      .select("*")
      .eq("id", id)
      .single();

    if (!error && data) {
      setLeilao(data);
      setCurrentBid(data.valor_inicial);
      console.log("Auction data fetched:", data);
    } else {
      console.error("Error fetching auction data:", error);
    }
  }, [supabase, id, setCurrentBid]);

  const fetchVendedorData = useCallback(async () => {
    console.log("Fetching seller data...");
    if (!leilaoModel?.id_vendedor) return;
    const { data, error } = await supabase
      .from("usuario")
      .select("nome")
      .eq("id", leilaoModel.id_vendedor)
      .single();

    if (!error && data) {
      setVendedor(data);
      console.log("Seller data fetched:", data);
    } else {
      console.error("Error fetching seller data:", error);
    }
  }, [supabase, leilaoModel?.id_vendedor]);

  const fetchUserData = useCallback(async () => {
    console.log("Fetching user data...");
    if (!userId) return;
    setUserLoading(true);
    const { data, error } = await supabase
      .from("usuario")
      .select("nome")
      .eq("id", userId)
      .single();

    setUserLoading(false);
    if (!error && data) {
      setUser(data);
      console.log("User data fetched:", data);
    } else {
      console.error("Error fetching user data:", error);
    }
  }, [supabase, userId]);

  const fetchBids = useCallback(async () => {
    console.log("Fetching bids...");
    if (!id) return;
    const { data, error } = await supabase
      .from("lances")
      .select("id, value, user_id, username, created_at, auction_id")
      .eq("auction_id", id)
      .order("created_at", { ascending: false }); // Ordena decrescente
  
    if (!error && data) {
      setBids(data); // Atualiza os lances com a lista ordenada
      setCurrentBid(data[0]?.value || leilaoModel?.valor_inicial || 0); // Define o maior lance ou o lance inicial
      console.log("Bids fetched:", data);
    } else {
      console.error("Error fetching bids:", error);
    }
  }, [supabase, id, leilaoModel?.valor_inicial, setCurrentBid, setBids]);

  const handleBidSubmit = async () => {
    console.log("Handling bid submission...");
    if (!user || !id) {
      alert("Erro ao processar lance. Usuário não identificado.");
      console.error("User data is missing.");
      return;
    }
  
    // Verifica se há lances existentes
    let newBidValue = 0;
  
    if (bids.length === 0) {
      // Se não houver lances, o primeiro lance será o valor inicial
      newBidValue = leilaoModel?.valor_inicial || 0;
      console.log("Primeiro lance, valor inicial: R$ ${newBidValue.toFixed(2)}");
    } else {
      // Caso contrário, adiciona R$ 10 ao maior lance
      const highestBid = bids[0].value; // O maior lance é o primeiro da lista (decrescente)
      newBidValue = highestBid + 10;
      console.log("Lance subsequente, valor: R$ ${newBidValue.toFixed(2)}");
    }
  
    console.log("Submitting bid with value: ${newBidValue}");
  
    const { error } = await supabase.from("lances").insert({
      auction_id: id,
      user_id: userId,
      username: user.nome,
      value: newBidValue,
    });
  
    if (error) {
      console.error("Error inserting bid:", error);
      alert("Falha ao processar o lance.");
    } else {
      alert(`Lance de R$ ${newBidValue.toFixed(2)} registrado!`);
      fetchBids(); // Atualiza a lista de lances após o novo lance ser inserido
    }
  };

  useEffect(() => {
    console.log("useEffect triggered - Fetching initial data...");
    fetchLeilaoData();
    fetchUserData();
    fetchBids(); // Busca lances iniciais
  }, [fetchLeilaoData, fetchUserData, fetchBids]);
  
  useEffect(() => {
    if (leilaoModel) {
      console.log("Auction data received, fetching seller...");
      fetchVendedorData();
    }
  }, [fetchVendedorData, leilaoModel]);

  useEffect(() => {
    // Assumindo que o socket já está configurado para escutar as atualizações do status_id
    const handleStatusUpdate = (newStatusId: number) => {
      // Atualizando o estado do leilão com o novo status_id
      setLeilao((prevLeilao) => {
        if (prevLeilao) {
          return {
            ...prevLeilao,
            status_id: newStatusId,
          };
        }
        return null;
      });
    };

    // Supondo que a função `onStatusUpdate` seja chamada sempre que o status_id for alterado
    supabase.channel("auction-channel").on("UPDATE", (payload) => {
      if (payload.new.id === id) {
        handleStatusUpdate(payload.new.status_id);
      }
    });
  }, [id, supabase]);

  useEffect(() => {
    if (leilao) {
      console.log(`Leilão ${leilao.id} está no status ${leilao.status_id}`);
    }
  }, [leilao]);
  console.log(`status 1 ${leilaoModel}`);
  console.log(`status 2 ${leilao}`);

  // Adiciona a verificação do status_id no render
  const isAuctionClosed = leilao||leilaoModel?.status_id === 3;
  console.log(`status ${isAuctionClosed}`);
  

  return (
    <div className={styles["main-container"]}>
      <div className={styles.container}>
        <h1>Leilão ao Vivo - Item {id}</h1>
        <div className={styles.cardImage}>
          <img
            className={styles.image}
            src={leilaoModel?.foto || ""}
            alt={leilaoModel?.titulo || "Imagem"}
          />
        </div>
        <div className={styles.cardContent}>
          <h2 className={styles.title}>{leilaoModel?.titulo || "Carregando..."}</h2>
          <p className={styles.description}>
            Descrição: {leilaoModel?.descricao || "Carregando..."}
          </p>
          <p className={styles.price}>
            Lance Atual: R$ {currentBid?.toFixed(2) || "0.00"}
          </p>
          <p className={styles.prazo}>
            Prazo: {leilaoModel?.prazo_max_minutos} minutos
          </p>
          <p className={styles.seller}>
            Vendedor: {vendedor?.nome || "Carregando..."}
          </p>
        </div>
      </div>

      {/* Condicional para mostrar o botão de dar lance ou o card do vencedor */}
      {isAuctionClosed ? (
        <div className={styles.container}>
          <h3>Vencedor</h3>
          {/* Exiba o vencedor aqui, você pode adicionar mais detalhes conforme necessário */}
          <p>O leilão foi encerrado. Vencedor: {bids[0]?.username}</p>
        </div>
      ) : (
        <div className={styles.container}>
          <button
            className={styles.button}
            onClick={handleBidSubmit}
            disabled={userLoading}
          >
            {userLoading ? "Carregando..." : "Dar lance (+ R$ 10,00)"}
          </button>
        </div>
      )}

      <h3>Histórico de Lances</h3>
      <div className={styles["bids-list"]}>
        {bids.length === 0 ? (
          <p>Nenhum lance registrado ainda.</p>
        ) : (
          bids.map((bid, index) => {
            console.log(`Rendering bid ${index + 1}:`, bid);
            return (
              <div key={bid.id} className={styles.bidItem}>
                <p>
                  <strong>{bid.username}</strong> ofereceu{" "}
                  <span className={styles.bidValue}>
                    R$ {bid.value.toFixed(2)}
                  </span>
                  <br />
                  <small>
                    {new Date(bid.created_at).toLocaleTimeString()}
                  </small>
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default AuctionPage;
