import { Fragment, type ReactNode } from 'react'
import catalogoBruto from '../api-gerada.json'
import './ApiRef.css'

/**
 * A tabela de props que NÃO pode mentir: tudo aqui vem de `api-gerada.json`, que o prebuild
 * regenera do código a cada build. Não existe onde escrever uma prop à mão — de propósito.
 *
 * <ApiRef componente="Button" />
 */

interface PropApi {
  nome: string
  tipo: string
  obrigatoria: boolean
  padrao?: string
  descricao?: string
}

interface ComponenteApi {
  nome: string
  tipo: string
  arquivo: string
  descricao?: string
  heranca: string[]
  variantes?: boolean
  props: PropApi[]
}

// O JSON entra tipado pelo próprio conteúdo (chaves literais), o que impede indexar por uma
// string qualquer. O contrato acima é a forma real do arquivo — quem o quebrar quebra o
// gerador, não esta linha.
const catalogo = catalogoBruto as unknown as { componentes: Record<string, ComponenteApi> }

/**
 * O JSDoc do código usa crase e negrito — e é bom que use, ele é lido no editor também.
 * Renderizar `\`primary\`` cru na tabela seria vazar sintaxe na cara do leitor, então os dois
 * casos que aparecem de verdade viram marcação. Não é um parser de Markdown e não deve virar:
 * a hora de trocar por uma biblioteca é quando o JSDoc precisar de link ou lista, não antes.
 */
function formatar(texto: string): ReactNode {
  const partes = texto.split(/(`[^`]+`|\*\*[^*]+\*\*)/g)
  return partes.map((parte, i) => {
    if (parte.startsWith('`') && parte.endsWith('`') && parte.length > 2) {
      return <code key={i}>{parte.slice(1, -1)}</code>
    }
    if (parte.startsWith('**') && parte.endsWith('**') && parte.length > 4) {
      return <strong key={i}>{parte.slice(2, -2)}</strong>
    }
    return <Fragment key={i}>{parte}</Fragment>
  })
}

/** Herança citada, não expandida — ver o comentário no gerador. */
function Heranca({ de }: { de: string[] }) {
  return (
    <p className="apiref-nota">
      Aceita também todas as props de{' '}
      {de.map((h, i) => (
        <Fragment key={h}>
          {i > 0 && ' e '}
          <code>{h}</code>
        </Fragment>
      ))}
      .
    </p>
  )
}

export function ApiRef({ componente }: { componente: string }) {
  const api = catalogo.componentes[componente]

  if (!api) {
    // Tabela vazia em silêncio leria como "este componente não tem props" — que é falso, e
    // falso com cara de autoridade. Some em produção (uma caixa vermelha no site publicado
    // não ajuda ninguém) e grita em desenvolvimento, onde ainda dá para consertar.
    if (process.env.NODE_ENV === 'production') {
      console.error(`[ApiRef] "${componente}" não está em api-gerada.json.`)
      return null
    }
    return (
      <div className="apiref-falta" role="alert">
        <strong>ApiRef: "{componente}" não existe em api-gerada.json.</strong>
        <p>
          O gerador só enxerga <code>interface {componente}Props</code> exportada em{' '}
          <code>packages/ui/src/components/</code>. Confira o nome, ou rode{' '}
          <code>node scripts/gerar-api.mjs</code> se o componente é novo.
        </p>
      </div>
    )
  }

  return (
    <>
      {api.variantes && (
        <p className="apiref-nota">
          Este componente tem <strong>variantes que não se misturam</strong>: a mesma prop muda
          de tipo conforme a variante, e o TypeScript cobra a combinação certa.
        </p>
      )}

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
            {api.props.map((p, i) => (
              <tr key={`${p.nome}-${i}`}>
                <td>
                  <code className="doc-mono-brand">{p.nome}</code>
                  {p.obrigatoria && <span className="apiref-obrig">obrigatória</span>}
                </td>
                <td>
                  <code className="apiref-tipo">{p.tipo}</code>
                </td>
                <td>
                  {p.padrao ? <code>{p.padrao}</code> : <span className="apiref-vazio">—</span>}
                </td>
                <td>{p.descricao ? formatar(p.descricao) : <span className="apiref-vazio">—</span>}</td>
              </tr>
            ))}
            {api.props.length === 0 && (
              <tr>
                <td colSpan={4} className="apiref-vazio">
                  Sem props próprias.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {api.heranca.length > 0 && <Heranca de={api.heranca} />}
    </>
  )
}
