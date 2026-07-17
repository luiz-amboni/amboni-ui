import { useEffect, useState } from 'react'
import { PAGINAS, type Pagina } from './rotas'
import { Busca } from './lib/Busca'
import { IndicePagina } from './lib/IndicePagina'
import './docs.css'

type Marca = 'isafe' | 'vear'
type Tema = 'light' | 'dark'

/**
 * O tema mora na URL (?marca=vear&tema=dark), não no estado.
 *
 * Dois motivos. O prático: o link fica compartilhável — "olha o botão na marca da VEAR
 * no escuro" é uma URL, não um passo a passo. O histórico: a primeira versão observava
 * o atributo do <html> com MutationObserver para reagir à troca... e o próprio
 * observador escrevia o atributo que observava. Loop infinito, aba travada.
 */
function lerUrl() {
  const p = new URLSearchParams(location.search)
  const marca = p.get('marca') === 'vear' ? 'vear' : 'isafe'
  const tema = p.get('tema') === 'dark' ? 'dark' : 'light'
  return { marca: marca as Marca, tema: tema as Tema }
}

function rotaAtual(): string {
  return location.hash.replace(/^#\/?/, '') || 'inicio'
}

export default function App() {
  const [{ marca, tema }, setCfg] = useState(lerUrl)
  const [rota, setRota] = useState(rotaAtual)
  const [menuAberto, setMenuAberto] = useState(false)

  useEffect(() => {
    const r = document.documentElement
    r.setAttribute('data-amb-brand', marca)
    r.setAttribute('data-amb-theme', tema)

    const url = new URL(location.href)
    url.searchParams.set('marca', marca)
    url.searchParams.set('tema', tema)
    history.replaceState(null, '', url) // replace, não push: trocar tema não é navegar
  }, [marca, tema])

  useEffect(() => {
    const onHash = () => {
      setRota(rotaAtual())
      setMenuAberto(false) // no celular, navegar tem que fechar o menu
      window.scrollTo(0, 0) // sem isso, trocar de página mantém a rolagem no meio do texto
    }
    addEventListener('hashchange', onHash)
    return () => removeEventListener('hashchange', onHash)
  }, [])

  const pagina: Pagina = PAGINAS.find(p => p.slug === rota) ?? PAGINAS[0]
  const Corpo = pagina.componente

  useEffect(() => {
    document.title = `${pagina.titulo} — @amboni/ui`
  }, [pagina])

  /**
   * `?secao=xxx` é o link de âncora (ver `Cabecalho` em lib/blocos.tsx): o hash já é a
   * rota, então a seção viaja na busca. Rolar até ela precisa esperar a página montar —
   * daí os dois quadros. Um só não basta: o primeiro entrega o DOM da rota anterior.
   */
  useEffect(() => {
    const alvo = new URLSearchParams(location.search).get('secao')
    if (!alvo) return
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        document.getElementById(alvo)?.scrollIntoView({ block: 'start' }),
      ),
    )
  }, [rota])

  const grupos = [...new Set(PAGINAS.map(p => p.grupo))]

  return (
    <div className="doc-shell">
      <header className="doc-top">
        <button
          className="doc-menu-btn"
          aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuAberto}
          onClick={() => setMenuAberto(v => !v)}
        >
          <span aria-hidden>{menuAberto ? '✕' : '☰'}</span>
        </button>

        <a className="doc-logo" href="#/inicio">
          <span className="doc-logo__mark">A</span>
          @amboni/ui
        </a>
        {/* Lido do package.json no build — dizia "v0.1" enquanto o npm já tinha a 0.2.1. */}
        <a
          className="doc-tag"
          href="https://www.npmjs.com/package/@amboni/ui"
          target="_blank"
          rel="noreferrer"
        >
          v{__VERSAO__}
        </a>

        <div className="doc-top__spacer" />

        <Busca />

        <div className="doc-switch">
          <span className="doc-switch__label">Marca</span>
          <div className="doc-seg">
            <BotaoSeg on={marca === 'isafe'} onClick={() => setCfg(c => ({ ...c, marca: 'isafe' }))}>
              <i className="doc-dot doc-dot--isafe" /> iSafe
            </BotaoSeg>
            <BotaoSeg on={marca === 'vear'} onClick={() => setCfg(c => ({ ...c, marca: 'vear' }))}>
              <i className="doc-dot doc-dot--vear" /> VEAR
            </BotaoSeg>
          </div>
        </div>

        <div className="doc-seg">
          <BotaoSeg on={tema === 'light'} onClick={() => setCfg(c => ({ ...c, tema: 'light' }))}>☀︎ Claro</BotaoSeg>
          <BotaoSeg on={tema === 'dark'} onClick={() => setCfg(c => ({ ...c, tema: 'dark' }))}>☾ Escuro</BotaoSeg>
        </div>
      </header>

      <nav
        className={`doc-side${menuAberto ? ' is-aberto' : ''}`}
        aria-label="Seções da documentação"
      >
        <div className="doc-side__inner">
          {grupos.map(g => (
            <GrupoMenu key={g} titulo={g} paginas={PAGINAS.filter(p => p.grupo === g)} atual={pagina.slug} />
          ))}
        </div>
      </nav>

      <main className="doc-main">
        <div className="doc-wrap">
          <Corpo />
          <footer className="doc-foot">
            <span>Construído com os próprios tokens — nenhum hex nesta página.</span>
            <a href="https://github.com/luiz-amboni/amboni-ui">GitHub ↗</a>
          </footer>
        </div>
      </main>

      {/* `key` na rota força o índice a remontar: sem isso ele guardaria os títulos da
          página anterior e apontaria para âncoras que já não existem no DOM. */}
      <IndicePagina key={pagina.slug} rota={pagina.slug} />
    </div>
  )
}

/**
 * Grupo do menu, recolhível.
 *
 * Com 9 grupos e 30 páginas, a lista aberta inteira não cabe numa tela de notebook — e
 * uma barra que sempre precisa de rolagem esconde o que existe. Recolher devolve o mapa.
 *
 * O grupo da página atual começa aberto: chegar por link e não ver onde você está na
 * árvore é pior que qualquer economia de espaço.
 */
function GrupoMenu({ titulo, paginas, atual }: { titulo: string; paginas: Pagina[]; atual: string }) {
  const contemAtual = paginas.some(p => p.slug === atual)
  const [aberto, setAberto] = useState(contemAtual)

  // Navegar para outro grupo (pela busca, por exemplo) tem que abrir o grupo de destino.
  useEffect(() => {
    if (contemAtual) setAberto(true)
  }, [contemAtual])

  const id = `menu-${titulo.replace(/\s+/g, '-').toLowerCase()}`

  return (
    <div className="doc-side__group">
      <button
        className="doc-side__title"
        aria-expanded={aberto}
        aria-controls={id}
        onClick={() => setAberto(v => !v)}
      >
        <span className={`doc-side__chevron${aberto ? ' is-aberto' : ''}`} aria-hidden>›</span>
        {titulo}
      </button>
      {/* `hidden` de verdade, não altura zero: senão o Tab entra num grupo fechado e o
          foco some da tela — bug invisível para quem testa só com mouse. */}
      <div id={id} hidden={!aberto}>
        {paginas.map(p => (
          <a
            key={p.slug}
            className="doc-side__link"
            href={`#/${p.slug}`}
            aria-current={p.slug === atual ? 'page' : undefined}
          >
            {p.titulo}
            {p.selo && <span className="doc-side__badge">{p.selo}</span>}
          </a>
        ))}
      </div>
    </div>
  )
}

function BotaoSeg({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button className="doc-seg__btn" aria-pressed={on} onClick={onClick}>
      {children}
    </button>
  )
}
