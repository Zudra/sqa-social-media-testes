/* URLs do sistema em execução. Podem ser trocadas por variável de ambiente,
   ex.: FRONT_URL=http://localhost:3001 npm test */
export const FRONT_URL = process.env.FRONT_URL ?? 'http://localhost:3000';
export const API_URL = process.env.API_URL ?? 'http://localhost:8080';
