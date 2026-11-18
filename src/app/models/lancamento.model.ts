export interface LancamentoRequest {
  descricao: string;
  valor: number;
  dataLancamento: string;
  observacao: string | null;
  categoriaId: number;
}

export interface LancamentoResponse extends LancamentoRequest {
  id: number;
  categoriaDescricao: string;
  usuarioId: number;
}
