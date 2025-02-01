import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import styles from './style.module.css';

const CreateAuctionScreen = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [initialValue, setInitialValue] = useState('');
  const [duration, setDuration] = useState('');
  const [image, setImage] = useState(null);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleCreateAuction = () => {
    if (!title || !description || !initialValue || !duration || !image) {
      setError('Todos os campos devem ser preenchidos!');
      return;
    }

    // Lógica para criar o leilão (salvar no banco de dados ou API)
    alert('Leilão criado com sucesso!');
    // Limpar os campos após criação
    setTitle('');
    setDescription('');
    setInitialValue('');
    setDuration('');
    setImage(null);
    setError('');
    navigate("/");
  };

  const handleImageChange = (e) => {
   // setImage(URL.createObjectURL(e.target.files[0]));
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
          type="file"
          accept="image/*"
          onChange={handleImageChange}
        />
        {image && <img src={image} alt="Produto" className={styles.imagePreview} />}
      </div>
      {error && <p className={styles.error}>{error}</p>}
      <button className={styles.createButton} onClick={handleCreateAuction}>
        Criar Leilão
      </button>
    </div>
  );
};

export default CreateAuctionScreen;
