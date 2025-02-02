export type Auction = {
  id: number;
  titulo: string;
  descricao: string;
  valor_inicial: number;
  prazo_max_minutos: number;
  data_hora_realizacao: string;
  data_hora_criacao: string;
  data_hora_finalizacao: string;
  maior_lance_vencedor: number;
  status_id: number;
  id_vendedor: number;
  id_vencedor: number;
  foto: string;
};

