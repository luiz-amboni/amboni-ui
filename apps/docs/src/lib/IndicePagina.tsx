import { useEffect, useState } from 'react'
import './IndicePagina.css'

/**
 * O índice da página (o "CONTENTS" da direita, no MUI).
 *
 * Numa página de 3.000 palavras — e várias das nossas são —, sem índice a pessoa não sabe
 * o que existe abaixo da dobra, e a única saída é rolar caçando. O índice transforma a
 * página numa tela consultável em vez de um texto para ler na ordem.
 *
 * Lê os títulos do DOM RENDERIZADO, e não de uma lista por página. Motivo: uma lista à
 * mão apodrece em toda seção nova — e falha em silêncio, o pior jeito de falhar. O DOM é
 * a única fonte que não tem como discordar da tela.
 */

interface Item {
  id: string
  texto: string
  nivel: number
}

export function IndicePagina({ rota }: { rota: string }) {
  const [itens, setItens] = useState<Item[]>([])
  const [ativo, setAtivo] = useState('')

  // `rota` na dependência: o índice tem que ser relido a cada troca de página. Sem isso
  // ele congela nos títulos da primeira página aberta.
  useEffect(() => {
    const achados = [...document.querySelectorAll<HTMLElement>('.doc-h2[id], .doc-h3[id]')].map(el => ({
      id: el.id,
      // `el.textContent` engoliria o "#" do link de âncora que vive dentro do título, e o
      // índice mostraria "Variantes#". Some com o link antes de ler — num clone, para não
      // arrancar a âncora da página de verdade.
      texto: (() => {
        const c = el.cloneNode(true) as HTMLElement
        c.querySelector('.doc-ancora')?.remove()
        return c.textContent?.trim() ?? ''
      })(),
      nivel: el.classList.contains('doc-h3') ? 3 : 2,
    }))
    setItens(achados)
    setAtivo(achados[0]?.id ?? '')
  }, [rota])

  // IntersectionObserver em vez de ouvir `scroll`: o `scroll` dispara dezenas de vezes por
  // segundo e obriga a medir todos os títulos em cada disparo — o navegador faz esse
  // trabalho sozinho, melhor e sem travar a rolagem.
  useEffect(() => {
    if (itens.length === 0) return

    const obs = new IntersectionObserver(
      entradas => {
        // Vários títulos podem estar visíveis ao mesmo tempo; quem manda é o mais ALTO
        // dentre os visíveis. Pegar "o último que entrou" faria o destaque saltar para
        // trás ao rolar para cima.
        const visiveis = entradas
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visiveis[0]) setAtivo(visiveis[0].target.id)
      },
      // A faixa cobre do topo (abaixo da barra fixa) até 70% da tela: um título só conta
      // como "onde estou" quando está na região que a pessoa realmente está lendo.
      { rootMargin: '-70px 0px -70% 0px', threshold: 0 },
    )

    for (const it of itens) {
      const el = document.getElementById(it.id)
      if (el) obs.observe(el)
    }
    return () => obs.disconnect()
  }, [itens])

  // Página curta não merece índice: um índice de um item só ocupa espaço e não orienta.
  if (itens.length < 3) return null

  return (
    <aside className="doc-indice" aria-label="Índice da página">
      <div className="doc-indice__inner">
        <div className="doc-indice__titulo">Nesta página</div>
        <nav>
          {itens.map(it => (
            <a
              key={it.id}
              href={`#${it.id}`}
              className={`doc-indice__link doc-indice__link--n${it.nivel}`}
              aria-current={ativo === it.id ? 'location' : undefined}
              onClick={e => {
                // O href começa com "#", e o site inteiro roteia por hash: deixar o
                // navegador seguir esse link TROCARIA A ROTA para uma que não existe, e a
                // página cairia no fallback. Rolamos na mão e mantemos o hash da rota.
                e.preventDefault()
                document.getElementById(it.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                setAtivo(it.id)
              }}
            >
              {it.texto}
            </a>
          ))}
        </nav>
      </div>
    </aside>
  )
}
