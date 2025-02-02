import React, { useState, useEffect, useContext, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SocketContext } from "../../context/SocketContext";
import styles from "./style.module.css";

interface Leilao {
  titulo: string;
  descricao: string;
  valor_inicial: number;
  prazo_max_minutos: number;
  data_hora_realizacao: string;
  status_id: number;
  id_vendedor: number;
  foto: string;
}

interface Vendedor {
  nome: string;
}

function AuctionPage() {
  const { id } = useParams<{ id: string }>();
  const [currentBid, setCurrentBid] = useState<number | null>(null);
  const [bids, setBids] = useState<string[]>([]);
  const [leilao, setLeilao] = useState<Leilao | null>(null);
  const [vendedor, setVendedor] = useState<Vendedor | null>(null);
  const { supabase } = useContext(SocketContext);
  const navigate = useNavigate();

  const fetchLeilaoData = useCallback(async () => {
    if (!id) return;
    console.log("Buscando dados do leilão para o ID:", id);
    const { data, error } = await supabase
      .from("leilao")
      .select(
        "titulo, descricao, valor_inicial, prazo_max_minutos, data_hora_realizacao, status_id, id_vendedor, foto, valor_inicial"
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("Erro ao buscar dados do leilão:", error);
    } else {
      console.log("Dados do leilão recebidos:", data);
      setLeilao(data);
      setCurrentBid(data.valor_inicial); // Definindo o lance inicial após o carregamento
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

  const handleBidSubmit = () => {
    if (currentBid === null) {
      console.log("Tentativa de lance antes de carregar o valor inicial.");
      return; // Garante que o lance inicial não seja feito antes de carregar o valor
    }
    console.log("Valor atual do lance:", currentBid);
    const newBid = currentBid + 10;
    console.log("Novo lance calculado:", newBid);
    setCurrentBid(newBid); // Atualizando o valor do lance
    setBids([...bids, `R$ ${newBid}`]);
    alert(`Lance de R$ ${newBid} aceito!`);
  };

  useEffect(() => {
    console.log("Carregando dados do leilão...");
    fetchLeilaoData();
  }, [fetchLeilaoData]);

  useEffect(() => {
    if (leilao) {
      console.log("Dados do leilão carregados:", leilao);
      fetchVendedorData();
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
            Prazo: {leilao?.prazo_max_minutos || "Carregando..."} minutos
          </p>
          <p className={styles.vendedor}>
            Vendedor: {vendedor?.nome || "Carregando..."}
          </p>
          <p className={styles.date}>
            Data de Realização:{" "}
            {leilao
              ? new Date(leilao.data_hora_realizacao).toLocaleString()
              : "Carregando..."}
          </p>
        </div>
      </div>
      <div>
        <button className={styles.button} onClick={handleBidSubmit}>
          Dar Lance (+10)
        </button>
        <div className={styles.container}>
          <h1>Lances Dados</h1>
          <div className={styles["bids-list"]}>
            {bids.length === 0 ? (
              <p>Nenhum lance ainda.</p>
            ) : (
              bids.map((bid, index) => (
                <div key={index} className={styles["bid-item"]}>
                  {bid}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuctionPage;
