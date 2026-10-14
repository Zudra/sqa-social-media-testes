export interface Usuario {
  email: string;
  password: string;
}

/* Senha aceita tanto pela validação do client quanto pela da API */
export const SENHA_VALIDA = 'Senha123@';

/* Gera um e-mail único por chamada para os testes não dependerem do estado do banco */
export function novoUsuario(prefixo = 'usuario'): Usuario {
  const sufixo = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
  return { email: `${prefixo}.${sufixo}@teste.com`, password: SENHA_VALIDA };
}
