import { useEffect, useState } from 'react'
import { PAGINAS, type Pagina } from './rotas'
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

  const grupos = [...new Set(PAGINAS.map(p => p.grupo))]

  return (
    <div className="doc-shell">
      <header className="doc-top">
        <a className="doc-logo" href="#/inicio">
          <span className="doc-logo__mark">A</span>
          @amboni/ui
        </a>
        <span className="doc-tag">v0.1</span>

        <div className="doc-top__spacer" />

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

      <nav className="doc-side" aria-label="Seções da documentação">
        <div className="doc-side__inner">
        {grupos.map(g => (
          <div className="doc-side__group" key={g}>
            <div className="doc-side__title">{g}</div>
            {PAGINAS.filter(p => p.grupo === g).map(p => (
              <a
                key={p.slug}
                className="doc-side__link"
                href={`#/${p.slug}`}
                aria-current={p.slug === pagina.slug ? 'page' : undefined}
              >
                {p.titulo}
                {p.selo && <span className="doc-side__badge">{p.selo}</span>}
              </a>
            ))}
          </div>
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
