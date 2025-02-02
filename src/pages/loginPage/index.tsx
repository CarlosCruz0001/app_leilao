import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { SocketContext } from "../../context/SocketContext";
import styles from "./style.module.css";

const LoginScreen = () => {
  const { supabase } = useContext(SocketContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleLogin = async () => {
    setError("");

    // Tentando autenticar com o Supabase
    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      // Caso ocorra erro na autenticação
      setError(loginError.message);
    } else {
      // Caso o login seja bem-sucedido
      alert("Login bem-sucedido!");
      navigate("/"); // Redirecionando para a página inicial ou dashboard
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Login</h1>
      <div className={styles.inputContainer}>
        <input
          className={styles.input}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className={styles.input}
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && <p className={styles.error}>{error}</p>}
      <button className={styles.loginButton} onClick={handleLogin}>
        Entrar
      </button> 
      <div>
      <button className={styles.backButton} onClick={() => navigate("/")}>
        Voltar para a página inicial
      </button>
      </div>
    </div>
  );
};

export default LoginScreen;
