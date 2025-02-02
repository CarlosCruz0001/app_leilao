import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import styles from "./styles.module.css";
import { SocketContext } from "../../context/SocketContext";
import LeilaoCard from "../../components/leilaoCard";

const Home = () => {
  const { supabase } = useContext(SocketContext);
  const [user, setUser] = useState<any>(null);
  const [userType, setUserType] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [leiloes, setLeiloes] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Busca os leilões disponíveis no banco
    const getLeiloes = async () => {
      console.log("Iniciando busca de leilões...");
      const { data, error } = await supabase.from("leilao").select("*");
      if (error) {
        console.error("Erro ao obter leilões:", error.message);
      } else {
        console.log("Leilões recebidos:", data);
        setLeiloes(data || []);
      }
    };

    // Verifica se existe um usuário autenticado
    const getUser = async () => {
      console.log("Buscando usuário...");
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error("Erro ao obter o usuário:", error.message);
      }

      if (user) {
        setUser(user);
        console.log("Usuário autenticado:", user);

        // Consultar o tipo de usuário pelo email
        const { data, error: userTypeError } = await supabase
          .from("usuario") // Supondo que sua tabela de usuários se chame 'usuarios'
          .select("tipo_de_usuario_id")
          .eq("email", user.email) // Usando o email para consultar o tipo de usuário
          .single();

        if (userTypeError) {
          console.error(
            "Erro ao obter o tipo de usuário:",
            userTypeError.message
          );
        }

        if (data) {
          console.log("Tipo de usuário encontrado:", data.tipo_de_usuario_id);
          setUserType(data.tipo_de_usuario_id); // 1 para vendedor, 2 para comprador
        } else {
          console.log("Nenhum tipo de usuário encontrado.");
        }
      }

      setLoading(false);
    };

    getLeiloes();
    getUser();
  }, [supabase]);

  const handleLogout = async () => {
    console.log("Iniciando logout...");
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Erro ao sair:", error.message);
    } else {
      console.log("Logout realizado com sucesso.");
      setUser(null);
      setUserType(null);
      navigate("/login");
    }
  };

  // Função para redirecionar caso o status_id seja 2
  const handleRedirectIfStatusIsTwo = (status_id: number, leilaoId: number) => {
    console.log(
      `Status do leilão (status_id): ${status_id}, Leilão ID: ${leilaoId}` 
    ); 
    if (status_id === 2) {
      console.log("Redirecionando para a página do leilão...");
      navigate(`/Leilao/${leilaoId}`);
    } else {
      console.log("Status não é 2, não redirecionando.");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.containerBotoes}>
        {loading ? (
          <p>Carregando...</p>
        ) : (
          <>
            {user ? (
              <>
                <p className={styles.userGreeting}>Bem-vindo, {user.email}</p>

                {userType === 1 && (
                  <button
                    className={styles.buttonCriar}
                    onClick={() => navigate("/CriarLeilao")}
                  >
                    Criar Leilão
                  </button>
                )}
                <button className={styles.button} onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  className={styles.button}
                  onClick={() => navigate("/login")}
                >
                  Login
                </button>
                <button
                  className={styles.button}
                  onClick={() => navigate("/signup")}
                >
                  Criar Conta
                </button>
              </>
            )}
          </>
        )}
      </div>
      <div className={styles.containerLeiloes}>
        <h2>Leilões</h2>
        <div>
          {/* Itera sobre a lista de leilões e renderiza um LeilaoCard para cada ID */}
          {leiloes.length > 0 ? (
            leiloes.map((leilao) => (
              <div
                key={leilao.id}
                onClick={() =>
                  handleRedirectIfStatusIsTwo(leilao.status_id, leilao.id)
                }
                style={{ cursor: "pointer" }} // Adicionando cursor para indicar que é clicável
              >
                <LeilaoCard leilaoId={leilao.id} />
              </div>
            ))
          ) : (
            <p>Nenhum leilão disponível no momento.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
