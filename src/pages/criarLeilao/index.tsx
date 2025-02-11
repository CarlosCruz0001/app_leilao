import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { SocketContext } from "../../context/SocketContext";
import styles from "./style.module.css";

const CreateAuctionScreen = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [initialValue, setInitialValue] = useState("");
  const [duration, setDuration] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [dataHoraRealizacao, setDataHoraRealizacao] = useState("");
  const [error, setError] = useState("");
  const [imageUrlPreview, setImageUrlPreview] = useState<string | null>(null); // Para a visualização da imagem
  const [user, setUser] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null); 
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { supabase } = useContext(SocketContext);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error("Erro ao obter o usuário:", error.message);
        return;
      }

      if (user) {
        setUser(user);
        console.log("Usuário autenticado:", user);

        // Consultar o ID do usuário pela tabela de usuários
        const { data, error: userTypeError } = await supabase
          .from("usuario")
          .select("id")
          .eq("email", user.email)
          .single();

        if (userTypeError) {
          console.error("Erro ao obter o tipo de usuário:", userTypeError.message);
        }

        if (data) {
          console.log("ID do usuário encontrado:", data.id);
          setUserId(data.id); // Agora o ID é armazenado corretamente
        } else {
          console.log("Nenhum id de usuário encontrado.");
        }
      }

      setLoading(false);
    };

    getUser();
  }, [supabase]);

  const handleCreateAuction = async () => {
    console.log("Iniciando criação do leilão...");
  
    if (!title || !description || !initialValue || !duration || !image || !dataHoraRealizacao) {
      setError("Todos os campos devem ser preenchidos!");
      console.error("Erro: Campos obrigatórios não preenchidos");
      return;
    }
  
    try {
      console.log("Enviando imagem para o Supabase...");
      const { data, error: uploadError } = await supabase.storage
        .from("auction-images")
        .upload(`images/${Date.now()}_${image.name}`, image);
  
      if (uploadError) {
        console.error("Erro ao fazer upload da imagem", uploadError);
        throw new Error("Erro ao fazer upload da imagem");
      }
  
      if (!data?.path) {
        throw new Error("Caminho da imagem não retornado pelo Supabase");
      }
  
      const { data: publicUrlData } = supabase.storage.from("auction-images").getPublicUrl(data.path);
      const imageUrl = publicUrlData.publicUrl;
  
      console.log("Imagem enviada com sucesso:", imageUrl);
  
      console.log('Inserindo leilão na tabela "leilao"...');
  
      const createdAt = new Date(); // Data e hora de criação do leilão
      const adjustedDate = new Date(dataHoraRealizacao);
      adjustedDate.setHours(adjustedDate.getHours() - 4); // Ajustar para UTC-4
  
      const prazoEmMinutos = parseInt(duration);
      const finalizacao = new Date(adjustedDate.getTime() + prazoEmMinutos * 60000); // Soma os minutos ao tempo de criação
  
      const { error } = await supabase.from("leilao").insert([
        {
          titulo: title,
          descricao: description,
          valor_inicial: parseFloat(initialValue),
          foto: imageUrl || "",
          prazo_max_minutos: prazoEmMinutos,
          data_hora_criacao: createdAt.toISOString(),
          data_hora_finalizacao: finalizacao.toISOString(), // Armazena a data e hora final
          status_id: 1,
          id_vendedor: userId,
          data_hora_realizacao: adjustedDate.toISOString(),
        },
      ]);
  
      if (error) {
        console.error("Erro ao criar o leilão", error);
        throw new Error("Erro ao criar o leilão");
      }
  
      console.log("Leilão criado com sucesso!");
      alert("Leilão criado com sucesso!");
  
      setTitle("");
      setDescription("");
      setInitialValue("");
      setDuration("");
      setImage(null);
      setDataHoraRealizacao("");
      setError("");
      setImageUrlPreview(null);
      navigate("/");
    } catch (err) {
      console.error("Erro no processo de criação do leilão:", err);
      setError((err as Error).message || "Ocorreu um erro!");
    }
  };
  
  
  

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("Imagem selecionada:", file);
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        console.log("Imagem carregada para pré-visualização:", imageUrl);
        setImageUrlPreview(imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Criar Leilão</h1>
      <div className={styles.inputContainer}>
        <input
          className={styles.input}
          type="text"
          placeholder="Título do Leilão"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className={styles.textarea}
          placeholder="Descrição do Leilão"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          className={styles.input}
          type="number"
          placeholder="Valor Inicial"
          value={initialValue}
          onChange={(e) => setInitialValue(e.target.value)}
        />
        <input
          className={styles.input}
          type="number"
          placeholder="Tempo de Duração (em minutos)"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />
        <input
          className={styles.input}
          type="datetime-local"
          value={dataHoraRealizacao}
          onChange={(e) => setDataHoraRealizacao(e.target.value)}
        />
        <input
          className={styles.input}
          type="file"
          accept="image/*"
          onChange={handleImagePick}
        />
        {imageUrlPreview && (
          <img
            src={imageUrlPreview}
            alt="Produto"
            className={styles.imagePreview}
          />
        )}
      </div>
      {error && <p className={styles.error}>{error}</p>}
      <button className={styles.createButton} onClick={handleCreateAuction}>
        Criar Leilão
      </button>
    </div>
  );
};

export default CreateAuctionScreen;
