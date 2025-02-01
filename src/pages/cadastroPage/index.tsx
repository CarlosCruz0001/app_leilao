import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./style.module.css";
import { supabase } from "../../supabaseClient";

type UserRole = "user" | "seller";

const SignupScreen = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async () => {
    console.log("Iniciando handleSignup");
    
    if (password !== confirmPassword) {
      console.warn("Erro: As senhas não coincidem.");
      alert("Erro: As senhas não coincidem.");
      return;
    }

    setLoading(true);
    console.log("Supabase Client Status:", supabase ? "OK" : "FALHA");
    console.log("Env Variables:", import.meta.env.VITE_SUPABASE_URL ? "OK" : "FALHA");

    try {
      console.log("Tentando criar usuário com email:", email);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        console.error("Erro ao criar usuário de autenticação:", authError.message);
        throw new Error(authError.message);
      }

      console.log("Usuário de autenticação criado com sucesso.");
      const tipoDeUsuarioId = role === "user" ? 1 : 2;

      console.log("Inserindo usuário na tabela 'usuario'");
      const { error: dbError } = await supabase.from("usuario").insert([
        {
          nome: name,
          email,
          tipo_de_usuario_id: tipoDeUsuarioId,
        },
      ]);

      if (dbError) {
        console.error("Erro ao inserir usuário no banco de dados:", dbError.message);
        throw new Error(dbError.message);
      }

      console.log("Usuário cadastrado com sucesso!");
      alert("Cadastro realizado! Verifique seu email para confirmação.");
      navigate("/login");
    } catch (error: unknown) {
      let errorMessage = "Erro ao realizar cadastro";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      console.error("Erro detalhado:", error);
      alert(errorMessage);
    } finally {
      setLoading(false);
      console.log("Finalizando handleSignup");
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Cadastro</h1>
      <div className={styles.containerInput}>
        <input
          className={styles.input}
          type="text"
          placeholder="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
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
        <input
          className={styles.input}
          type="password"
          placeholder="Confirmação de Senha"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>
      <div className={styles.roleContainer}>
        <button
          className={`${styles.roleButton} ${role === "user" ? styles.selectedRole : ""}`}
          onClick={() => setRole("user")}
        >
          Usuário
        </button>
        <button
          className={`${styles.roleButton} ${role === "seller" ? styles.selectedRole : ""}`}
          onClick={() => setRole("seller")}
        >
          Vendedor
        </button>
      </div>
      <div className={styles.divCadastrar}>
        <button
          className={styles.signupButton}
          onClick={handleSignup}
          disabled={loading}
        >
          {loading ? "Carregando..." : "Cadastrar"}
        </button>
      </div>
    </div>
  );
};

export default SignupScreen;
