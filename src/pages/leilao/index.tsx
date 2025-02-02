import React, { useState, useEffect, useContext, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SocketContext } from "../../context/SocketContext";
import { Bid } from "../../models/Bid";
import { Auction } from "../../models/Auction";
import styles from "./style.module.css";

interface Vendedor {
  nome: string;
}

function AuctionPage() {
  const { id, userId } = useParams<{ id: string; userId: string }>(); // id do leilão e userId do usuário
  const [currentBid, setCurrentBid] = useState<number | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [leilao, setLeilao] = useState<Auction | null>(null);
  const [vendedor, setVendedor] = useState<Vendedor | null>(null);
  const [user, setUser] = useState<Vendedor | null>(null);
  const [userLoading, setUserLoading] = useState<boolean>(true);
  const { supabase } = useContext(SocketContext);
  const navigate = useNavigate();

  const fetchLeilaoData = useCallback(async () => {
    if (!id) return;
    console.log("Buscando dados do leilão para o ID:", id);
    const { data, error } = await supabase
      .from("leilao")
      .select(
        "titulo, descricao, valor_inicial, prazo_max_minutos, data_hora_realizacao, status_id, id_vendedor, foto"
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("Erro ao buscar dados do leilão:", error);
    } else {
      console.log("Dados do leilão recebidos:", data);
      setLeilao(data);
      setCurrentBid(data.valor_inicial);
    }
  }, [supabase, id]);

  const fetchVendedorData = useCallback(async () => {
    if (!leilao?.id_vendedor) return;
    console.log("Buscando dados do vendedor para o ID:", leilao.id_vendedor);
    const { data, error } = await supabase
      .from("usuario")
      .select("nome")
      .eq("id", leilao.id_vendedor)
      .single();

    if (error) {
      console.error("Erro ao buscar dados do vendedor:", error);
    } else {
      console.log("Dados do vendedor recebidos:", data);
      setVendedor(data);
    }
  }, [supabase, leilao?.id_vendedor]);

  const fetchUserData = useCallback(async () => {
    if (!userId) return;
    console.log("Buscando dados do usuário para o ID:", userId);
    setUserLoading(true);
    const { data, error, count } = await supabase
      .from("usuario")
      .select("nome")
      .eq("id", userId) // Usando o userId da URL
      .single();

    setUserLoading(false);

    if (error) {
      console.error("Erro ao buscar dados do usuário:", error);
    } else {
      if (count === 0) {
        console.log("Nenhum usuário encontrado com o ID fornecido.");
      } else if (data) {
        console.log("Dados do usuário recebidos:", data);
        setUser(data);
      }
    }
  }, [supabase, userId]);

  const handleBidSubmit = () => {
    if (userLoading) {
      alert("Aguarde, estamos carregando seus dados...");
      return;
    }

    if (!user) {
      alert("Não foi possível identificar o usuário.");
      return;
    }

    if (currentBid === null) {
      console.log("Tentativa de lance antes de carregar o valor inicial.");
      return;
    }

    const newBid: Bid = {
      username: user.nome, // Usando o nome do usuário carregado
      value: currentBid + 10,
      auctionId: id || "", // id do leilão
    };

    console.log("Novo lance calculado:", newBid);
    setCurrentBid(newBid.value);
    setBids([...bids, newBid]);

    alert(`Lance de R$ ${newBid.value.toFixed(2)} aceito!`);
  };

  useEffect(() => {
    console.log("Carregando dados do leilão...");
    fetchLeilaoData();
    fetchUserData(); // Busca os dados do usuário logado
  }, [fetchLeilaoData, fetchUserData]);

  useEffect(() => {
    if (leilao) {
      console.log("Dados do leilão carregados:", leilao);
      fetchVendedorData(); // Busca os dados do vendedor quando o leilão for carregado
    }
  }, [fetchVendedorData, leilao]);

  return (
    <div className={styles["main-container"]}>
      <div className={styles.container}>
        <h1>Leilão ao Vivo - Item {id}</h1>
        <div className={styles.cardImage}>
          <img
            className={styles.image}
            src={leilao?.foto || ""}
            alt={leilao?.titulo || "Imagem"}
          />
        </div>
        <div className={styles.cardContent}>
          <h2 className={styles.title}>{leilao?.titulo || "Carregando..."}</h2>
          <p className={styles.description}>
            Descrição: {leilao?.descricao || "Carregando..."}
          </p>
          <p className={styles.price}>
            Valor Inicial: R${" "}
            {leilao ? leilao.valor_inicial.toFixed(2) : "Carregando..."}
          </p>
          <p className={styles.prazo}>
            Prazo: {leilao?.prazo_max_minutos} minutos
          </p>
          <p className={styles.prazo}>
            Data/Hora: {leilao?.data_hora_realizacao}
          </p>
          <p className={styles.seller}>
            Vendedor: {vendedor?.nome || "Carregando..."}
          </p>
        </div>
      </div>

      <div className={styles.container}>
        <button className={styles.button} onClick={handleBidSubmit}>
          Fazer lance
        </button>
        <h3>Lances feitos</h3>
        <div className={styles["bids-list"]}>
          {bids.map((bid, index) => (
            <div key={index}>
              <p>
                {bid.username} fez um lance de R$ {bid.value.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AuctionPage;
