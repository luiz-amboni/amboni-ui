import { createRoot } from 'react-dom/client'

import '@amboni/tokens/tokens.css'
import './fontes/fontes.css'
import './galeria.css'

import { Galeria } from './galeria'

/**
 * Ponto de entrada da galeria.
 *
 * Marca e tema saem da URL e vão para o <html>, exatamente como o produto real faz
 * (`data-amb-brand` / `data-amb-theme`). Vai na URL, e não num botão, porque o Playwright
 * precisa abrir a combinação direto — `?marca=vear&tema=dark&cena=dados` é uma cena
 * inteira endereçável. Com estado interno, cada print viraria uma sequência de cliques
 * que pode falhar no meio.
 *
 * Escrito ANTES do render (não num useEffect) para o primeiro quadro pintado já sair na
 * marca certa: um efeito rodaria depois da primeira pintura, e num print rápido dava para
 * pegar o tema errado piscando.
 */
const p = new URLSearchParams(location.search)
const marca = p.get('marca') === 'vear' ? 'vear' : 'isafe'
const tema = p.get('tema') === 'dark' ? 'dark' : 'light'
const cena = p.get('cena') ?? 'tudo'

document.documentElement.setAttribute('data-amb-brand', marca)
document.documentElement.setAttribute('data-amb-theme', tema)
document.documentElement.setAttribute('lang', 'pt-BR')

/**
 * Sem <StrictMode>, e isto é decisão consciente — o padrão do Vite é com.
 *
 * Em desenvolvimento o StrictMode monta cada componente DUAS vezes de propósito, para
 * denunciar efeito que não é idempotente. É excelente numa app; aqui é uma máquina de
 * cena errada. A primeira versão desta galeria abria o Menu num `useEffect`: o efeito
 * rodou duas vezes, o clique abriu e fechou o menu, e o print saiu com a tela vazia — uma
 * baseline que teria congelado "o menu não abre" como o comportamento esperado. Na cena de
 * avisos, foram 8 avisos disparados em vez de 4; só não apareceu no print porque o
 * `limite={4}` do provedor cortou — ou seja, passou por sorte.
 *
 * A galeria não é lugar de caçar efeito duplicado (os 739 testes de comportamento fazem
 * isso). Aqui o que se quer é o DOM final, previsível, uma vez só. Quem precisa de
 * interação — abrir menu, focar um botão — é o spec, com as APIs de verdade do Playwright.
 */
createRoot(document.getElementById('raiz')!).render(<Galeria cena={cena} />)
