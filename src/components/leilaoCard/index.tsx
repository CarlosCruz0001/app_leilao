import { useState, useEffect, useContext, useCallback } from "react";
import { SocketContext } from "../../context/SocketContext";
import { useNavigate } from "react-router-dom";  // Importar useNavigate
import styles from "./style.module.css";

const LeilaoCard = ({ leilaoId }: { leilaoId: number }) => {
  const [leilao, setLeilao] = useState<any | null>(null);
  const [vendedor, setVendedor] = useState<any | null>(null);
  const [status, setStatus] = useState<any | null>(null);
  const { supabase } = useContext(SocketContext);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();  // Inicializando o hook de navegação

  const fetchLeilaoData = useCallback(async () => {
    const { data, error } = await supabase
      .from("leilao")
      .select(
        "titulo, descricao, valor_inicial, prazo_max_minutos, data_hora_realizacao, status_id, id_vendedor, foto"
      )
      .eq("id", leilaoId)
      .single();

    if (error) {
      console.error("Erro ao buscar dados do leilão:", error);
    } else {
      setLeilao(data);
    }
  }, [supabase, leilaoId]);

  const fetchVendedorData = useCallback(async () => {
    if (!leilao?.id_vendedor) return;
    const { data, error } = await supabase
      .from("usuario")
      .select("nome")
      .eq("id", leilao.id_vendedor)
      .single();

    if (error) {
      console.error("Erro ao buscar dados do vendedor:", error);
    } else {
      setVendedor(data);
    }
  }, [supabase, leilao?.id_vendedor]);

  const fetchStatusData = useCallback(async () => {
    if (!leilao?.status_id) return;
    const { data, error } = await supabase
      .from("status_leilao")
      .select("status")
      .eq("id", leilao.status_id)
      .single();

    if (error) {
      console.error("Erro ao buscar o Status do leilão:", error);
    } else {
      setStatus(data);
    }
  }, [supabase, leilao?.status_id]);

  useEffect(() => {
    fetchLeilaoData();
  }, [fetchLeilaoData]);

  useEffect(() => {
    fetchVendedorData();
  }, [fetchVendedorData]);

  useEffect(() => {
    fetchStatusData();
  }, [fetchStatusData]);

  // Navegar automaticamente para /Leilao quando status_id for 2
  useEffect(() => {
    if (status?.status === 2) {
      navigate("/Leilao");
    }
  }, [status, navigate]);

  const getCardStyle = () => {
    if (isHovered) {
      switch (leilao?.status_id) {
        case 1:
          return styles.hoveredStatus1;
        case 2:
          return styles.hoveredStatus2;
        case 3:
          return styles.hoveredStatus3;
        case 4:
          return styles.hoveredStatus4;
        default:
          return styles.defaultHoveredStatus;
      }
    }
    return styles.defaultStatus; // Cor padrão quando não estiver em hover
  };

  return leilao ? (
    <div
      className={`${styles.card} ${getCardStyle()}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles.cardImage}>
        <img className={styles.image} src={leilao.foto} alt={leilao.titulo} />
      </div>
      <div className={styles.cardContent}>
        <h2 className={styles.title}>{leilao.titulo}</h2>
        <p className={styles.description}>Descrição: {leilao.descricao}</p>
        <p className={styles.price}>Valor Inicial: R${leilao.valor_inicial.toFixed(2)}</p>
        <p className={styles.prazo}>Prazo: {leilao.prazo_max_minutos} minutos</p>
        <p className={styles.status}>
          Status: {status ? status.status : "Carregando..."}
        </p>
        <p className={styles.vendedor}>Vendedor: {vendedor ? vendedor.nome : "Carregando..."}</p>
        <p className={styles.date}>
          Data de Realização: {new Date(leilao.data_hora_realizacao).toLocaleString()}
        </p>
      </div>

      {/* Status aparece somente quando o hover é ativado */}
      {status && (
        <div
          className={`${styles.statusOverlay} ${isHovered ? styles.visible : ''}`}
        >
          <span>{status.status}</span>
        </div>
      )}
    </div>
  ) : (
    <div className={styles.loading}>Carregando dados do leilão...</div>
  );
};

export default LeilaoCard;
