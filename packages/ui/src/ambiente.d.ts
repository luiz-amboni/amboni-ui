/**
 * O mínimo de `process` que esta biblioteca usa.
 *
 * Ela chama `process.env.NODE_ENV !== 'production'` para avisar no console em
 * desenvolvimento (botão só de ícone sem `aria-label`, tabela vazia sem estado vazio).
 * É a convenção do ecossistema React: todo bundler troca essa expressão por uma
 * constante no build e o `if` inteiro some do pacote de produção.
 *
 * Declarado aqui em vez de instalar `@types/node` porque isto é uma biblioteca de
 * NAVEGADOR: puxar os tipos do Node inteiro faria `fs`, `path` e `Buffer` passarem a
 * existir para o TypeScript, e alguém acabaria importando um deles sem o compilador
 * reclamar — o erro só apareceria no navegador de quem instala, em produção.
 *
 * Nasceu de um upgrade: vitest 2→4 e vite 6→7 pararam de arrastar os tipos do Node por
 * transitividade. O código dependia deles sem nunca ter declarado a dependência.
 */
declare const process: {
  env: {
    NODE_ENV?: string
  }
}
