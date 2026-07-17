import { paleta, contraste, WCAG, type Escala, type NomePaleta } from '@amboni/tokens'
import { Secao, P, Demo, Aviso, Titulo, H3, Bloco, FacaNaoFaca } from '../lib/blocos'

const NIVEIS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const

/**
 * Os números de contraste desta página são CALCULADOS na hora, com a mesma função que
 * roda nos testes. Documentação que repete valores digitados à mão mente em silêncio no
 * dia em que a cor muda — aqui, se a paleta mudar, a página muda junto.
 */
function Escalas({ nome, escala }: { nome: string; escala: Escala }) {
  return (
    <div className="doc-scale">
      <div className="doc-scale__name">{nome}</div>
      <div className="doc-swatches">
        {NIVEIS.map(n => {
          const cor = escala[n]
          // texto claro ou escuro por cima? quem decide é o contraste, não o olho
          const claro = contraste(cor, '#ffffff') > contraste(cor, '#0f172a')
          return (
            <div
              key={n}
              className="doc-swatch"
              style={{ background: cor }}
              title={`${nome}[${n}] — ${cor}`}
            >
              <span className="doc-swatch__n" style={{ color: claro ? '#fff' : '#0f172a' }}>{n}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function LinhaContraste({ fg, bg, rotulo, uso }: { fg: string; bg: string; rotulo: string; uso: string }) {
  const r = contraste(fg, bg)
  const ok = r >= WCAG.AA_TEXTO
  return (
    <tr>
      <td>
        <span style={{ background: bg, color: fg, padding: '4px 10px', borderRadius: 6, fontWeight: 700 }}>
          {rotulo}
        </span>
      </td>
      <td>{uso}</td>
      <td className="doc-num">{r.toFixed(2)}:1</td>
      <td>
        <span className={`doc-pill ${ok ? 'doc-pill--ok' : 'doc-pill--bad'}`}>
          {ok ? 'PASSA' : 'REPROVA'}
        </span>
      </td>
    </tr>
  )
}

export default function Cores() {
  return (
    <>
      <Titulo
        eyebrow="Fundamentos"
        lead="A cor é a decisão mais fácil de errar de um jeito que ninguém percebe — até alguém não conseguir ler o botão."
      >
        Cores
      </Titulo>

      <Secao titulo="As três camadas">
        <P>
          Toda cor passa por três níveis antes de chegar na tela. Parece burocracia; é o que
          permite trocar a marca inteira mexendo em uma linha.
        </P>
        <div className="doc-table-wrap">
          <table className="doc-table">
            <thead>
              <tr><th>Camada</th><th>Exemplo</th><th>Quem usa</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Primitiva</strong><br /><span style={{ opacity: 0.7 }}>o valor cru</span></td>
                {/* Lido da paleta, não digitado. Esta célula já dizia `#0e7490`, um valor
                    que nunca existiu — nesta página, que prega justamente calcular em vez
                    de repetir número à mão. A ironia é o melhor argumento que ela tem. */}
                <td><code>cyan[700] = {paleta.cyan[700]}</code></td>
                <td>Ninguém, direto. É matéria-prima.</td>
              </tr>
              <tr>
                <td><strong>Semântica</strong><br /><span style={{ opacity: 0.7 }}>o papel</span></td>
                <td><code>brand.solid</code>, <code>text.primary</code></td>
                <td>Quem constrói componentes.</td>
              </tr>
              <tr>
                <td><strong>Tema</strong><br /><span style={{ opacity: 0.7 }}>o resultado</span></td>
                <td><code>--amb-color-brand-solid</code></td>
                <td>O CSS na tela.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <Aviso>
          <strong>Por que não usar a primitiva direto?</strong> Porque <code>cyan[700]</code> não
          diz o que é. <code>brand.solid</code> diz. No tema escuro o valor vira
          <code> cyan[400]</code> — e nenhum componente precisa saber disso.
        </Aviso>
      </Secao>

      <Secao titulo="A regra que quase ninguém aplica">
        <P>
          No tema escuro, a cor da marca <strong>não</strong> é a mesma do tema claro. Um fundo
          escuro precisa de uma cor mais clara por cima, não mais forte. Inverter isso é o erro
          mais comum de tema escuro amador.
        </P>
        <Bloco lang="jsx">{`const marca = (e, claro) =>
  claro
    ? { solid: e[700], solidHover: e[800], subtle: e[50],  text: e[700] }
    : { solid: e[400], solidHover: e[300], subtle: '…',    text: e[300] }`}</Bloco>
        <FacaNaoFaca
          faca={{
            titulo: 'Escolher o nível pelo fundo',
            texto: 'Fundo claro pede a cor escura (700). Fundo escuro pede a clara (400). O papel é o mesmo; o valor não.',
          }}
          naoFaca={{
            titulo: 'Usar a mesma cor nos dois temas',
            texto: 'A cor da marca aplicada igual no claro e no escuro sempre falha em um dos dois — geralmente no que você não testou.',
          }}
        />
      </Secao>

      <Secao titulo="O contraste é testado, não estimado">
        <P>
          Os números abaixo são calculados agora, nesta página, pela mesma função que roda no
          CI. A norma WCAG AA pede <strong>{WCAG.AA_TEXTO}:1</strong> para texto.
        </P>
        <div className="doc-table-wrap">
          <table className="doc-table">
            <thead>
              <tr><th>Amostra</th><th>Onde aparece</th><th className="doc-num">Contraste</th><th>Norma</th></tr>
            </thead>
            <tbody>
              <LinhaContraste fg="#ffffff" bg="#0FA6BE" rotulo="Salvar" uso="Cor da marca iSafe como fundo de botão" />
              <LinhaContraste fg="#ffffff" bg={paleta.cyan[700]} rotulo="Salvar" uso="O que a biblioteca usa no lugar" />
              <LinhaContraste fg={paleta.slate[400]} bg="#ffffff" rotulo="texto de apoio" uso="Cinza claro como texto secundário" />
              <LinhaContraste fg={paleta.slate[500]} bg="#ffffff" rotulo="texto de apoio" uso="O que a biblioteca usa no lugar" />
            </tbody>
          </table>
        </div>
        <Aviso tipo="warn">
          A primeira linha é real: era o botão principal do CRM iSafe, em produção, por meses.
          Ninguém tinha notado — <strong>quem escolhe a cor da marca costuma ter a melhor visão
          da sala</strong>. O teste não tem esse privilégio.
        </Aviso>
      </Secao>

      <Secao titulo="A paleta completa">
        <P>
          Onze níveis por escala, de 50 (quase branco) a 950 (quase preto). Passe o mouse para
          ver o valor.
        </P>
        <Demo variante="plain">
          <div style={{ width: '100%' }}>
            {(Object.keys(paleta) as NomePaleta[]).map(n => (
              <Escalas key={n} nome={n} escala={paleta[n]} />
            ))}
          </div>
        </Demo>
        <H3>Quem é quem</H3>
        <div className="doc-table-wrap">
          <table className="doc-table">
            <thead><tr><th>Escala</th><th>Papel</th></tr></thead>
            <tbody>
              <tr><td><code className="doc-mono-brand">cyan</code></td><td>Marca da iSafe</td></tr>
              <tr><td><code className="doc-mono-brand">purple</code></td><td>Marca da VEAR</td></tr>
              <tr><td><code className="doc-mono-brand">slate</code></td><td>Texto, fundo, borda — 90% da tela</td></tr>
              <tr><td><code className="doc-mono-brand">green</code></td><td>Sucesso, positivo</td></tr>
              <tr><td><code className="doc-mono-brand">amber</code></td><td>Atenção</td></tr>
              <tr><td><code className="doc-mono-brand">red</code></td><td>Erro, destrutivo</td></tr>
              <tr><td><code className="doc-mono-brand">blue</code></td><td>Informação</td></tr>
              {/* Dizia "reserva para uma terceira marca"; o primitives.ts diz "apoio da
                  marca VEAR (#e6007e no original)". Duas verdades sobre o mesmo token, e
                  o código ganha — é ele que alguém vai ler antes de usar. */}
              <tr>
                <td><code className="doc-mono-brand">pink</code></td>
                <td>
                  Apoio da marca VEAR (o <code>#e6007e</code> do original).
                  <strong> Ainda não é token</strong>: <code>MARCAS</code> aceita uma escala por
                  marca, então o rosa do VEAR não tem <code>var(--amb-*)</code> — é a
                  lacuna real da migração deles.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Secao>
    </>
  )
}
