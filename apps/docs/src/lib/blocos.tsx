import { useState, type ReactNode } from 'react'
import { Codigo, type Linguagem } from '../highlight'
import { idDaAncora } from './Busca'

/**
 * As peças do site. Existem pelo mesmo motivo que a biblioteca existe: sem elas, cada
 * página inventaria seu próprio jeito de mostrar um exemplo — e o site do design system
 * seria a primeira coisa inconsistente do projeto.
 */

/**
 * O id sai do TÍTULO, não é escrito à mão em cada página.
 *
 * Três coisas precisam concordar sobre ele: o índice da direita, o resultado da busca e a
 * âncora que a pessoa copia. Se cada uma derivasse o id do seu jeito, o link levaria para
 * o topo da página em silêncio — ninguém abre chamado de âncora quebrada, só conclui que
 * "o site é estranho". Todas chamam `idDaAncora`, então não têm como divergir.
 */
export function Secao({ id, titulo, children }: { id?: string; titulo?: string; children: ReactNode }) {
  const anc = titulo ? (id ?? idDaAncora(titulo)) : id
  return (
    <section className="doc-section">
      {titulo && anc && <Cabecalho nivel={2} id={anc}>{titulo}</Cabecalho>}
      {children}
    </section>
  )
}

/**
 * O link de âncora — o "#" que aparece ao passar o mouse.
 *
 * Ele NÃO pode ser um `href="#id"` comum, e essa é a decisão do arquivo: este site roteia
 * por hash (`#/button`), então um segundo hash na URL não existe — `#variantes`
 * SUBSTITUIRIA a rota, e a página cairia no fallback. Uma URL só tem um hash.
 *
 * A seção vai no parâmetro de busca: `?secao=variantes#/button`. Continua sendo um
 * endereço compartilhável (que é o ponto inteiro da âncora), e o App o lê ao montar para
 * rolar até lá. O clique aqui atualiza a URL sem recarregar — mudar `search` num link de
 * verdade recarregaria a página e a rolagem suave viraria um salto branco.
 */
function Cabecalho({ nivel, id, children }: { nivel: 2 | 3; id: string; children: ReactNode }) {
  const H = nivel === 2 ? 'h2' : 'h3'
  const classe = nivel === 2 ? 'doc-h2' : 'doc-h3'

  function fixar(e: React.MouseEvent) {
    e.preventDefault()
    const url = new URL(location.href)
    url.searchParams.set('secao', id)
    history.replaceState(null, '', url) // replace: fixar âncora não é navegar
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const href = (() => {
    const u = new URL(location.href)
    u.searchParams.set('secao', id)
    return u.pathname + u.search + u.hash
  })()

  return (
    <H className={classe} id={id}>
      {children}
      {/* Não é aria-hidden: quem navega por teclado também copia link de seção. O rótulo
          diz de QUAL seção, senão o leitor de tela anuncia vinte "link para a seção". */}
      <a className="doc-ancora" href={href} onClick={fixar} aria-label={`Link para a seção ${String(children)}`}>
        #
      </a>
    </H>
  )
}

export function P({ children }: { children: ReactNode }) {
  return <p className="doc-p">{children}</p>
}

export function Bloco({ children, lang = 'jsx' }: { children: string; lang?: Linguagem }) {
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    try {
      await navigator.clipboard.writeText(children)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1500)
    } catch {
      // clipboard exige HTTPS e permissão. Falhar aqui é aceitável — o código está
      // visível na tela e dá para selecionar à mão. Quebrar a página, não.
    }
  }

  return (
    <div className="doc-code">
      <button className="doc-copy" onClick={copiar} aria-label="Copiar código">
        {copiado ? '✓ copiado' : 'copiar'}
      </button>
      <pre>
        <Codigo lang={lang}>{children}</Codigo>
      </pre>
    </div>
  )
}

export function Demo({
  children, codigo, variante = 'padrao',
}: {
  children: ReactNode
  codigo?: string
  /** `plain` = fundo liso; `centro` = liso e centralizado; `grid` = grade para cards. */
  variante?: 'padrao' | 'plain' | 'centro' | 'grid'
}) {
  const mod = variante === 'padrao' ? '' : ` doc-demo__stage--${variante}`
  return (
    <div className="doc-demo">
      <div className={`doc-demo__stage${mod}`}>{children}</div>
      {codigo && (
        <div className="doc-code">
          <pre><Codigo>{codigo}</Codigo></pre>
        </div>
      )}
    </div>
  )
}

export interface Prop {
  nome: string
  tipo: string
  padrao?: string
  descricao: ReactNode
}

export function TabelaProps({ props }: { props: Prop[] }) {
  return (
    <div className="doc-table-wrap">
      <table className="doc-table">
        <thead>
          <tr>
            <th>Prop</th>
            <th>Tipo</th>
            <th>Padrão</th>
            <th>O que faz</th>
          </tr>
        </thead>
        <tbody>
          {props.map(p => (
            <tr key={p.nome}>
              <td><code className="doc-mono-brand">{p.nome}</code></td>
              <td><code>{p.tipo}</code></td>
              <td>{p.padrao ? <code>{p.padrao}</code> : <span style={{ opacity: 0.4 }}>—</span>}</td>
              <td>{p.descricao}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function FacaNaoFaca({
  faca, naoFaca,
}: {
  faca: { titulo: string; texto: string }
  naoFaca: { titulo: string; texto: string }
}) {
  return (
    <div className="doc-dd">
      <div className="doc-dd__item doc-dd__item--do">
        <div className="doc-dd__tag">✓ Faça</div>
        <div className="doc-dd__t">{faca.titulo}</div>
        <div className="doc-dd__d">{faca.texto}</div>
      </div>
      <div className="doc-dd__item doc-dd__item--dont">
        <div className="doc-dd__tag">✕ Não faça</div>
        <div className="doc-dd__t">{naoFaca.titulo}</div>
        <div className="doc-dd__d">{naoFaca.texto}</div>
      </div>
    </div>
  )
}

export function Aviso({ children, tipo = 'info' }: { children: ReactNode; tipo?: 'info' | 'warn' }) {
  return <div className={`doc-note${tipo === 'warn' ? ' doc-note--warn' : ''}`}>{children}</div>
}

export function Titulo({ eyebrow, children, lead }: { eyebrow: string; children: string; lead: ReactNode }) {
  return (
    <header>
      <div className="doc-eyebrow">{eyebrow}</div>
      <h1 className="doc-h1">{children}</h1>
      <p className="doc-lead">{lead}</p>
    </header>
  )
}

/**
 * Achata um título em texto puro para virar id de âncora.
 *
 * Precisa existir porque títulos reais têm marcação dentro — `<H3>O <code>flush</code>
 * existe por causa de tabela</H3>`. Minha primeira versão exigia `children: string` e
 * quebrou onze títulos legítimos: era a regra que estava errada, não os títulos.
 *
 * O resultado bate com o que o `gerar-busca.mjs` extrai (ele tira as tags por regex e
 * sobra o mesmo texto), então a âncora do índice e a da busca apontam para o mesmo id.
 */
function textoDe(no: ReactNode): string {
  if (typeof no === 'string' || typeof no === 'number') return String(no)
  if (Array.isArray(no)) return no.map(textoDe).join('')
  if (no && typeof no === 'object' && 'props' in no) {
    return textoDe((no as { props: { children?: ReactNode } }).props.children)
  }
  return ''
}

export function H3({ children }: { children: ReactNode }) {
  return <Cabecalho nivel={3} id={idDaAncora(textoDe(children))}>{children}</Cabecalho>
}
