import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const raiz = resolve(import.meta.dirname, '../../..')
const ler = (arq) => readFileSync(resolve(raiz, '.github/workflows', arq), 'utf8')

/**
 * O contrato dos workflows — YAML que ninguém testa até quebrar em produção.
 *
 * Estes testes existem porque cada um deles corresponde a uma falha que já aconteceu, e
 * cujo sintoma não apontava para a causa.
 */
describe('publicar.yml', () => {
  const s = ler('publicar.yml')

  it('usa Node 24+ — publicar por OIDC exige npm 11.5.1, e o Node 22 traz o 10.9', () => {
    // A falha real: a publicação sem token reprovou com o repositório certo, o workflow
    // certo e a configuração certa no npmjs.com. Só o npm era velho demais para conhecer
    // o mecanismo — e o erro não menciona versão nenhuma. Node 22 → npm 10.9.8; Node 24 →
    // npm 11.16.
    const m = s.match(/node-version:\s*(\d+)/)
    expect(m, 'publicar.yml não declara node-version').toBeTruthy()
    expect(Number(m[1]), 'Node < 24 traz npm < 11.5.1 e o OIDC não funciona').toBeGreaterThanOrEqual(24)
  })

  it('pede id-token: write — sem isso o GitHub não emite a credencial do OIDC', () => {
    expect(s).toMatch(/id-token:\s*write/)
  })

  it('roda os testes ANTES de publicar', () => {
    // Publicar no npm é quase irreversível (a janela de despublicar é de 72h). O teste
    // precisa vir antes, não depois.
    const iTeste = s.indexOf('npm test')
    const iPublicar = s.indexOf('changeset publish')
    expect(iTeste, 'publicar.yml não roda npm test').toBeGreaterThan(-1)
    expect(iTeste, 'npm test tem que vir ANTES do publish').toBeLessThan(iPublicar)
  })

  it('publica com changeset, não com npm publish direto', () => {
    // `npm publish` responde 403 ao reencontrar uma versão que já existe — e derrubaria o
    // workflow no primeiro pacote, deixando o segundo sem subir. Com dois pacotes de
    // versão casada, isso publica a biblioteca pela METADE: a UI lendo variáveis de um
    // `tokens` que não chegou, e a tela de quem instalou fica sem cor.
    expect(s).toMatch(/changeset publish/)
  })

  it('dispara por release, nunca por push', () => {
    // O main recebe commit o dia todo. Nenhum deles deveria poder chegar sozinho na
    // máquina de quem instalou.
    expect(s).toMatch(/on:\s*\n\s*release:/)
    expect(s).not.toMatch(/^\s*push:/m)
  })
})

describe('todos os workflows', () => {
  it('declaram permissions — sem isso herdam o padrão do repositório', () => {
    // Repositório antigo costuma vir com leitura E ESCRITA por padrão. Um CI que só
    // compila não precisa poder empurrar commit: se uma dependência de build for
    // comprometida, a diferença entre "leu o código" e "escreveu no repo" é essa linha.
    for (const arq of ['ci.yml', 'publicar.yml', 'docs.yml', 'visual.yml']) {
      expect(ler(arq), `${arq} não declara permissions`).toMatch(/permissions:/)
    }
  })

  it('não usam pull_request_target — o vetor clássico de roubo de segredo', () => {
    for (const arq of ['ci.yml', 'publicar.yml', 'docs.yml', 'visual.yml']) {
      expect(ler(arq), `${arq} usa pull_request_target`).not.toMatch(/pull_request_target/)
    }
  })
})
