import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // Importe o hook useParams
import styles from './style.module.css'; // Importando o módulo de estilo

function AuctionPage() {
  const { id } = useParams(); // Captura o parâmetro 'id' da URL
  const [bid, setBid] = useState('');
  const [currentBid, setCurrentBid] = useState(100); // Exemplo de lance inicial
  const [bids, setBids] = useState([]); // Estado para armazenar os lances dados

  const handleBidChange = (event) => {
    setBid(event.target.value);
  };

  const handleBidSubmit = (event) => {
    event.preventDefault();
    if (Number(bid) > currentBid) {
      setCurrentBid(Number(bid));
      setBids([...bids, `R$ ${bid}`]); // Adiciona o lance à lista de lances
      alert(`Lance de R$ ${bid} aceito!`);
    } else {
      alert('O lance precisa ser maior que o valor atual.');
    }
    setBid('');
  };

  useEffect(() => {
    console.log(`Leilão do item com ID: ${id}`);
  }, [id]);

  return (
    <div className={styles['main-container']}>
      {/* Contêiner para dar lances */}
      <div className={styles.container}>
        <h1>Leilão ao Vivo - Item {id}</h1>
        <p>Valor atual do lance: R$ {currentBid}</p>

        <form onSubmit={handleBidSubmit}>
          <input
            className={styles.input}
            type="number"
            value={bid}
            onChange={handleBidChange}
            placeholder="Digite seu lance"
            required
            min={currentBid + 1}
          />
          <br />
          <button className={styles.button} type="submit">
            Dar Lance
          </button>
        </form>
      </div>

      {/* Contêiner para exibir os lances dados */}
      <div className={styles.container}>
        <h1>Lances Dados</h1>
        <div className={styles['bids-list']}>
          {bids.length === 0 ? (
            <p>Nenhum lance ainda.</p>
          ) : (
            bids.map((bid, index) => (
              <div key={index} className={styles['bid-item']}>
                {bid}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default AuctionPage;
