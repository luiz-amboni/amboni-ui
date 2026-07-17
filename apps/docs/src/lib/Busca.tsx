import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import indice from '../busca-indice.json'
import './Busca.css'

/**
 * A busca ⌘K.
 *
 * Um site de documentação sem busca obriga a pessoa a saber onde a resposta mora — que é
 * exatamente o que ela não sabe, senão não estaria procurando. É o recurso que separa uma
 * doc consultável de um livro que só se lê na ordem.
 *
 * Sem Algolia: são 28 páginas e 277 seções, tudo cabe em memória e a filtragem é
 * instantânea. Uma dependência de busca hospedada aqui custaria uma conta, uma chave e
 * uma requisição de rede para resolver um problema que um `filter` resolve.
 */

interface Resultado {
  slug: string
  titulo: string
  grupo: string
  secao?: string
  ancora?: string
  pontos: number
}

/** Sem acento e sem caixa: "seleção" tem que achar com "selecao". */
const normal = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/**
 * O id de âncora tem que bater com o que o `Secao`/`H3` renderiza — os dois chamam esta
 * função. Se divergirem, o resultado da busca leva para o topo da página em silêncio, e
 * ninguém percebe que o pulo parou de funcionar.
 */
export function idDaAncora(texto: string): string {
  return normal(texto).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

/**
 * Pontua por ONDE casou, não só se casou. Sem isso, digitar "card" traz uma seção
 * perdida de outra página antes da própria página Card — e a pessoa conclui, com razão,
 * que a busca não presta.
 */
export function buscar(termo: string): Resultado[] {
  const q = normal(termo.trim())
  if (q.length < 2) return [] // uma letra casa com tudo; a lista viraria ruído

  const out: Resultado[] = []

  for (const pag of indice) {
    const alvo = normal(pag.titulo)
    if (alvo.includes(q)) {
      out.push({
        slug: pag.slug,
        titulo: pag.titulo,
        grupo: pag.grupo,
        // Exato > começa com > contém: "card" tem que trazer Card antes de StatCard.
        pontos: alvo === q ? 100 : alvo.startsWith(q) ? 80 : 60,
      })
    }
    for (const s of pag.secoes) {
      if (!normal(s.texto).includes(q)) continue
      out.push({
        slug: pag.slug,
        titulo: pag.titulo,
        grupo: pag.grupo,
        secao: s.texto,
        ancora: idDaAncora(s.texto),
        pontos: 30,
      })
    }
  }

  return out.sort((a, b) => b.pontos - a.pontos).slice(0, 12)
}

export function Busca() {
  const [aberto, setAberto] = useState(false)
  const [termo, setTermo] = useState('')
  const [ativo, setAtivo] = useState(0)
  const campoRef = useRef<HTMLInputElement>(null)
  const listaRef = useRef<HTMLUListElement>(null)

  const resultados = useMemo(() => buscar(termo), [termo])

  // ⌘K / Ctrl+K abre de qualquer lugar. É a convenção — Linear, Vercel, GitHub, MUI.
  useEffect(() => {
    const onTecla = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault() // no Firefox o ⌘K vai para a barra de busca do navegador
        setAberto(a => !a)
      }
      if (e.key === 'Escape') setAberto(false)
    }
    addEventListener('keydown', onTecla)
    return () => removeEventListener('keydown', onTecla)
  }, [])

  useEffect(() => {
    if (aberto) {
      setTermo('')
      setAtivo(0)
      // O autoFocus do React não basta: o campo só existe depois deste render.
      queueMicrotask(() => campoRef.current?.focus())
    }
  }, [aberto])

  useEffect(() => setAtivo(0), [termo])

  // O item ativo tem que ficar visível ao navegar por teclado — sem isto, a seta desce
  // para um item fora da área rolável e a pessoa vê a lista parada.
  useEffect(() => {
    listaRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [ativo])

  function ir(r: Resultado) {
    location.hash = `#/${r.slug}`
    setAberto(false)
    if (r.ancora) {
      // O hash da rota acabou de mudar e a página ainda vai montar: pular para a âncora
      // agora acharia o DOM antigo. Um quadro depois, o alvo existe.
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          document.getElementById(r.ancora!)?.scrollIntoView({ block: 'start' }),
        ),
      )
    }
  }

  function noTeclado(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setAtivo(i => (i + 1) % Math.max(resultados.length, 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setAtivo(i => (i - 1 + resultados.length) % Math.max(resultados.length, 1))
    } else if (e.key === 'Enter' && resultados[ativo]) {
      e.preventDefault()
      ir(resultados[ativo])
    }
  }

  return (
    <>
      <button className="doc-busca-abrir" onClick={() => setAberto(true)}>
        <span aria-hidden>⌕</span>
        <span className="doc-busca-abrir__txt">Buscar</span>
        {/* <kbd> é o elemento certo para tecla — não é enfeite, é semântica. */}
        <kbd className="doc-busca-abrir__kbd">⌘K</kbd>
      </button>

      {/**
        * O painel vai para o <body> por PORTAL, e isto não é preferência de arquitetura —
        * é a correção de um bug que chegou como "buscar tá bugado".
        *
        * A `<Busca>` é usada dentro do cabeçalho, e o cabeçalho tem
        * `backdrop-filter: blur(12px)`. Filtro (como `transform`) cria um BLOCO CONTEDOR:
        * o `position: fixed` do painel deixa de se ancorar na janela e passa a se ancorar
        * no cabeçalho. Medido: o fundo que deveria ter 1440x900 tinha **1440x108**.
        *
        * O sintoma é traiçoeiro porque o painel PINTA certo (o conteúdo transborda e
        * aparece): só o alvo do clique fica preso aos 108px. Abaixo disso o clique
        * atravessa para a página. Teclado funcionava, mouse não — e por isso meu teste,
        * que usava Enter, passou. Quem usa o site clica.
        *
        * O portal tira o painel do subárvore do cabeçalho, então nenhum ancestral pode
        * mais capturá-lo. É a mesma armadilha que a doc do <Dica> já registrava.
        */}
      {aberto && createPortal(
        <div
          className="doc-busca__fundo"
          // mousedown, não click: soltar o mouse fora depois de selecionar texto dentro
          // do painel fecharia a busca no meio da seleção.
          onMouseDown={e => e.target === e.currentTarget && setAberto(false)}
        >
          <div className="doc-busca" role="dialog" aria-modal="true" aria-label="Buscar na documentação">
            <div className="doc-busca__topo">
              <span aria-hidden>⌕</span>
              <input
                ref={campoRef}
                className="doc-busca__campo"
                placeholder="Buscar componente, guia, decisão…"
                value={termo}
                onChange={e => setTermo(e.target.value)}
                onKeyDown={noTeclado}
                // O combobox do ARIA: sem isto o leitor de tela não anuncia que existe
                // uma lista respondendo ao que se digita.
                role="combobox"
                aria-expanded={resultados.length > 0}
                aria-controls="doc-busca-lista"
                aria-activedescendant={resultados[ativo] ? `res-${ativo}` : undefined}
                aria-autocomplete="list"
              />
              <kbd className="doc-busca__esc">esc</kbd>
            </div>

            {termo.trim().length >= 2 && (
              <ul className="doc-busca__lista" id="doc-busca-lista" role="listbox" ref={listaRef}>
                {resultados.map((r, i) => (
                  <li key={`${r.slug}-${r.secao ?? ''}-${i}`} id={`res-${i}`} role="option" aria-selected={i === ativo}>
                    <button
                      className={`doc-busca__item${i === ativo ? ' is-ativo' : ''}`}
                      onMouseEnter={() => setAtivo(i)}
                      onClick={() => ir(r)}
                    >
                      <span className="doc-busca__item-txt">
                        <strong>{r.secao ?? r.titulo}</strong>
                        <span className="doc-busca__caminho">
                          {r.grupo} › {r.titulo}
                        </span>
                      </span>
                      <span className="doc-busca__seta" aria-hidden>↵</span>
                    </button>
                  </li>
                ))}
                {resultados.length === 0 && (
                  <li className="doc-busca__vazio">
                    Nada encontrado para <strong>{termo}</strong>.
                    <span> A busca cobre títulos de página e de seção.</span>
                  </li>
                )}
              </ul>
            )}

            <div className="doc-busca__rodape">
              <span><kbd>↑</kbd><kbd>↓</kbd> navegar</span>
              <span><kbd>↵</kbd> abrir</span>
              <span><kbd>esc</kbd> fechar</span>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
