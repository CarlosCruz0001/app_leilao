import React, { useState, useContext } from "react";
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

  const navigate = useNavigate();
  const { supabase } = useContext(SocketContext);

  const handleCreateAuction = async () => {
    console.log("Iniciando criação do leilão...");

    if (
      !title ||
      !description ||
      !initialValue ||
      !duration ||
      !image ||
      !dataHoraRealizacao
    ) {
      setError("Todos os campos devem ser preenchidos!");
      console.error("Erro: Campos obrigatórios não preenchidos");
      return;
    }

    try {
      console.log("Enviando imagem para o Supabase...");
      const { data, error: uploadError } = await supabase.storage
        .from("auction-images")
        .upload(`images/${Date.now()}_${image.name}`, image);

      // Após o upload da imagem
      if (uploadError) {
        console.error("Erro ao fazer upload da imagem", uploadError);
        throw new Error("Erro ao fazer upload da imagem");
      }

      // Verificar se o caminho está presente
      if (!data?.path) {
        throw new Error("Caminho da imagem não retornado pelo Supabase");
      }

      // Obter a URL pública CORRETA (publicUrl em vez de publicURL)
      const {
        data: { publicUrl },
      } = supabase.storage.from("auction-images").getPublicUrl(data.path);

      const imageUrl = publicUrl;

      console.log("Imagem enviada com sucesso:", imageUrl); // Agora deve mostrar a URL

      console.log('Inserindo leilão na tabela "leilao"...');
      const { error } = await supabase.from("leilao").insert([
        {
          titulo: title,
          descricao: description,
          valor_inicial: parseFloat(initialValue),
          foto: imageUrl || "", // Garantir que foto não seja null
          prazo_max_minutos: parseInt(duration),
          data_hora_criacao: new Date().toISOString(),
          data_hora_finalizacao: new Date(dataHoraRealizacao).toISOString(),
          status_id: 1, // ID do status
          id_vendedor: 1, // ID do vendedor (ajuste conforme necessário)
          data_hora_realizacao: new Date().toISOString(),
        },
      ]);

      if (error) {
        console.error("Erro ao criar o leilão", error);
        throw new Error("Erro ao criar o leilão");
      }

      console.log("Leilão criado com sucesso!");
      alert("Leilão criado com sucesso!");
      // Resetando os campos
      setTitle("");
      setDescription("");
      setInitialValue("");
      setDuration("");
      setImage(null);
      setDataHoraRealizacao("");
      setError("");
      setImageUrlPreview(null);
      // navigate("/");  // Navegar para a página inicial
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
          onChange={(e) => {
            console.log("Título alterado para:", e.target.value);
            setTitle(e.target.value);
          }}
        />
        <textarea
          className={styles.textarea}
          placeholder="Descrição do Leilão"
          value={description}
          onChange={(e) => {
            console.log("Descrição alterada para:", e.target.value);
            setDescription(e.target.value);
          }}
        />
        <input
          className={styles.input}
          type="number"
          placeholder="Valor Inicial"
          value={initialValue}
          onChange={(e) => {
            console.log("Valor Inicial alterado para:", e.target.value);
            setInitialValue(e.target.value);
          }}
        />
        <input
          className={styles.input}
          type="number"
          placeholder="Tempo de Duração (em minutos)"
          value={duration}
          onChange={(e) => {
            console.log("Duração alterada para:", e.target.value);
            setDuration(e.target.value);
          }}
        />
        <input
          className={styles.input}
          type="datetime-local"
          value={dataHoraRealizacao}
          onChange={(e) => {
            console.log("Data e Hora alterada para:", e.target.value);
            setDataHoraRealizacao(e.target.value);
          }}
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
