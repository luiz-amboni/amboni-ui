import { fonte, tamanhoFonte, peso } from '@amboni/tokens'
import { Secao, P, Demo, Titulo, H3, Aviso, FacaNaoFaca } from '../lib/blocos'

const ESCALA: { token: keyof typeof tamanhoFonte; uso: string }[] = [
  { token: 'xs', uso: 'Etiqueta, rótulo de tabela' },
  { token: 'sm', uso: 'Texto de apoio' },
  { token: 'base', uso: 'Texto padrão da interface' },
  { token: 'md', uso: 'Título de card' },
  { token: 'lg', uso: 'Subtítulo de seção' },
  { token: 'xl', uso: 'Título de seção' },
  { token: '2xl', uso: 'Título de página' },
  { token: '3xl', uso: 'Número grande de KPI' },
]

export default function Tipografia() {
  return (
    <>
      <Titulo eyebrow="Fundamentos" lead="Três famílias, nove tamanhos. Menos escolhas, menos jeitos de errar.">
        Tipografia
      </Titulo>

      <Secao titulo="As famílias">
        <div className="doc-table-wrap">
          <table className="doc-table">
            <thead><tr><th>Token</th><th>Fonte</th><th>Onde</th></tr></thead>
            <tbody>
              <tr>
                <td><code className="doc-mono-brand">--amb-fonte-sans</code></td>
                <td style={{ fontFamily: fonte.sans, fontSize: 16 }}>Inter</td>
                <td>Tudo. É o padrão.</td>
              </tr>
              <tr>
                <td><code className="doc-mono-brand">--amb-fonte-display</code></td>
                <td style={{ fontFamily: fonte.display, fontSize: 16, fontWeight: 700 }}>Sora</td>
                <td>Só títulos. Tem personalidade demais para um parágrafo.</td>
              </tr>
              <tr>
                <td><code className="doc-mono-brand">--amb-fonte-mono</code></td>
                <td style={{ fontFamily: fonte.mono, fontSize: 15 }}>JetBrains Mono</td>
                <td>Código e <strong>número que se compara na vertical</strong>.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <Aviso>
          <strong>Por que mono em número?</strong> Em fonte proporcional o "1" é mais estreito que
          o "8", então R$ 1.111 e R$ 8.888 não alinham numa coluna — e comparar vira adivinhação.
          Alternativa mais leve: <code>font-variant-numeric: tabular-nums</code> na Inter.
        </Aviso>
      </Secao>

      <Secao titulo="A escala">
        <Demo variante="plain">
          <div style={{ width: '100%', display: 'grid', gap: 14 }}>
            {ESCALA.map(({ token, uso }) => (
              <div key={token} style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
                <code className="doc-mono-brand" style={{ minWidth: 130, fontSize: 12 }}>
                  {token} · {tamanhoFonte[token]}
                </code>
                <span style={{ fontSize: tamanhoFonte[token], fontWeight: 600, lineHeight: 1.2 }}>
                  {uso}
                </span>
              </div>
            ))}
          </div>
        </Demo>
        <P>
          A escala é <strong>fechada</strong>. Não existe "um pouquinho maior": se o tamanho que
          você quer não está aqui, a hierarquia é que está errada, não a escala.
        </P>
      </Secao>

      <Secao titulo="Os pesos">
        <Demo variante="plain">
          <div style={{ display: 'grid', gap: 8, width: '100%' }}>
            {Object.entries(peso).map(([nome, v]) => (
              <div key={nome} style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
                <code className="doc-mono-brand" style={{ minWidth: 130, fontSize: 12 }}>{nome} · {v}</code>
                <span style={{ fontWeight: v, fontSize: 18 }}>O rato roeu a roupa do rei</span>
              </div>
            ))}
          </div>
        </Demo>
      </Secao>

      <Secao titulo="Comprimento de linha">
        <FacaNaoFaca
          faca={{
            titulo: 'Limitar o parágrafo a ~65 caracteres',
            texto: 'max-width: 65ch. O olho perde a linha seguinte quando ela é longa demais — e reler a mesma linha cansa mais que ler.',
          }}
          naoFaca={{
            titulo: 'Deixar o texto ocupar a tela toda',
            texto: 'Num monitor largo, um parágrafo de 200 caracteres por linha é fisicamente difícil de acompanhar.',
          }}
        />
        <H3>Altura de linha</H3>
        <P>
          Quanto maior o texto, menor a altura relativa: um título em 3rem com
          <code> line-height: 1.6</code> parece desmontado. Título usa ~1,05; parágrafo, ~1,6.
        </P>
      </Secao>
    </>
  )
}
