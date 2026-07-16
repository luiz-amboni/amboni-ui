import { contraste, WCAG, construirTema, MARCAS, type Marca } from '@amboni/tokens'
import { Secao, P, Titulo, H3, Aviso, Bloco, FacaNaoFaca } from '../lib/blocos'

/**
 * Esta página não afirma que a biblioteca é acessível — ela CALCULA, na sua frente, com
 * a mesma função que reprova o build. Um selo "WCAG AA" escrito à mão numa página de
 * documentação não vale nada; qualquer um digita isso.
 */
const COMBINACOES = [
  { chave: 'texto principal sobre o fundo', fg: (t: T) => t.color.text.primary, bg: (t: T) => t.color.bg, min: WCAG.AA_TEXTO },
  { chave: 'texto secundário sobre o fundo', fg: (t: T) => t.color.text.secondary, bg: (t: T) => t.color.bg, min: WCAG.AA_TEXTO },
  { chave: 'texto apagado sobre o fundo', fg: (t: T) => t.color.text.muted, bg: (t: T) => t.color.bg, min: WCAG.AA_TEXTO },
  { chave: 'texto do botão primário', fg: (t: T) => t.color.text.onBrand, bg: (t: T) => t.color.brand.solid, min: WCAG.AA_TEXTO },
  { chave: 'texto da marca sobre o fundo', fg: (t: T) => t.color.brand.text, bg: (t: T) => t.color.bg, min: WCAG.AA_TEXTO },
  { chave: 'texto de erro sobre o fundo', fg: (t: T) => t.color.danger.text, bg: (t: T) => t.color.bg, min: WCAG.AA_TEXTO },
  { chave: 'texto de sucesso sobre o fundo', fg: (t: T) => t.color.success.text, bg: (t: T) => t.color.bg, min: WCAG.AA_TEXTO },
]

type T = ReturnType<typeof construirTema>

/**
 * Quantas combinações esta página confere de verdade. Derivado, não digitado: um número
 * escrito à mão numa página de documentação apodrece no primeiro dia em que alguém
 * acrescenta uma marca — e aí a página mente com cara de autoridade.
 */
export const VERIFICACOES = COMBINACOES.length * Object.keys(MARCAS).length * 2

function Tabela({ marca, modo }: { marca: Marca; modo: 'light' | 'dark' }) {
  const t = construirTema(marca, modo)
  return (
    <div className="doc-table-wrap" style={{ marginBottom: 16 }}>
      <table className="doc-table">
        <thead>
          <tr>
            <th>{marca} · {modo === 'light' ? 'claro' : 'escuro'}</th>
            <th className="doc-num">Contraste</th>
            <th className="doc-num">Mínimo</th>
            <th>Resultado</th>
          </tr>
        </thead>
        <tbody>
          {COMBINACOES.map(c => {
            const r = contraste(c.fg(t), c.bg(t))
            const ok = r >= c.min
            return (
              <tr key={c.chave}>
                <td>{c.chave}</td>
                <td className="doc-num">{r.toFixed(2)}:1</td>
                <td className="doc-num" style={{ opacity: 0.6 }}>{c.min}:1</td>
                <td>
                  <span className={`doc-pill ${ok ? 'doc-pill--ok' : 'doc-pill--bad'}`}>
                    {ok ? 'PASSA' : 'REPROVA'}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function Acessibilidade() {
  return (
    <>
      <Titulo
        eyebrow="Fundamentos"
        lead="Não é um selo. É um teste que reprova o build antes de alguém não conseguir ler o botão em produção."
      >
        Acessibilidade
      </Titulo>

      <Secao titulo="A tese">
        <P>
          Quase todo design system diz ser acessível. Quase nenhum <strong>prova</strong>. A
          diferença é onde o erro é descoberto: numa reunião meses depois, ou no
          <code> npm test</code> de quem escreveu.
        </P>
        <Bloco lang="jsx">{`test('o texto do botão primário é legível em toda marca × tema', () => {
  for (const marca of ['isafe', 'vear'] as const) {
    for (const modo of ['light', 'dark'] as const) {
      const t = construirTema(marca, modo)
      expect(contraste(t.color.text.onBrand, t.color.brand.solid))
        .toBeGreaterThanOrEqual(WCAG.AA_TEXTO)
    }
  }
})`}</Bloco>
        <P>
          São dezenas de testes nessa linha, um por combinação de marca × tema × papel da cor.
          Eles não descrevem a intenção — eles <strong>impedem o contrário dela</strong>.
        </P>
      </Secao>

      <Secao titulo="O que esse teste encontrou no primeiro dia">
        <Aviso tipo="warn">
          O azul da marca iSafe (<code>#0FA6BE</code>) com texto branco por cima dá
          <strong> 2,91:1</strong>. A norma pede 4,5:1. Esse era o botão principal do CRM, em
          produção, havia meses — e os números destacados também. <strong>Ninguém tinha
          reportado.</strong>
        </Aviso>
        <P>
          Duas lições, e a segunda é a que importa:
        </P>
        <P>
          <strong>1.</strong> Quem escolhe a cor da marca costuma ter a melhor visão da sala, num
          monitor bom, com luz controlada. O problema é invisível de onde a decisão é tomada.
        </P>
        <P>
          <strong>2.</strong> "Ninguém reclamou" não é evidência de que está bom. É evidência de
          que quem não conseguiu ler <em>foi embora sem avisar</em>. Contraste ruim não gera
          ticket; gera abandono silencioso.
        </P>
        <H3>A marca não morreu</H3>
        <P>
          O <code>#0FA6BE</code> continua vivo em <code>brandVivid</code> — para gráfico, faixa,
          detalhe: onde não existe texto por cima para ficar ilegível. O que mudou não foi a
          cor da marca; foi <strong>onde ela pode aparecer</strong>.
        </P>
      </Secao>

      <Secao titulo="A verificação, agora, nesta página">
        <P>
          As tabelas abaixo são calculadas no seu navegador, com a mesma função do CI —
          <strong> {VERIFICACOES} combinações</strong> de marca × tema × papel da cor. Se algum
          dia uma cor regredir, esta página passa a mostrar "REPROVA" sozinha, sem ninguém
          precisar lembrar de atualizar o texto.
        </P>
        <Aviso>
          Isto não é hipotético: foi <strong>exatamente assim</strong> que o texto apagado do tema
          escuro foi pego. Ele rendia 3,75:1 sobre o card, passava no piso antigo de 3:1 da
          biblioteca, e reprovava na régua real da WCAG. Era a cor do <code>emptyReason</code> do
          StatCard — a frase que explica por que um número está faltando, ilegível justamente
          para quem não estava enxergando o número.
        </Aviso>
        {(Object.keys(MARCAS) as Marca[]).map(m => (
          <div key={m}>
            <Tabela marca={m} modo="light" />
            <Tabela marca={m} modo="dark" />
          </div>
        ))}
      </Secao>

      <Secao titulo="Além da cor">
        <H3>Foco visível</H3>
        <P>
          Todo componente interativo usa <code>.amb-focus-ring</code>, com contraste de
          <strong> {WCAG.AA_NAO_TEXTO}:1</strong> contra o fundo. O anel de foco é como quem
          navega por teclado sabe onde está — <code>outline: none</code> sem substituto deixa a
          pessoa cega dentro da própria tela.
        </P>
        <H3>Movimento</H3>
        <P>
          Toda animação respeita <code>prefers-reduced-motion</code>. Para parte das pessoas,
          movimento em loop causa enjoo de verdade — não é preferência estética.
        </P>
        <H3>A cor nunca sozinha</H3>
        <FacaNaoFaca
          faca={{
            titulo: 'Cor + forma + palavra',
            texto: 'O delta do StatCard tem seta, número e texto. O botão danger tem a palavra "Excluir". A cor é o terceiro sinal, não o único.',
          }}
          naoFaca={{
            titulo: 'Só a cor',
            texto: 'Cerca de 1 em cada 12 homens não distingue vermelho de verde. Para eles, um status que só muda de cor não muda de nada.',
          }}
        />
        <H3>Semântica de verdade</H3>
        <P>
          Card clicável é <code>&lt;button&gt;</code>. Título de card é heading. Não é purismo:
          é o que faz o teclado e o leitor de tela funcionarem sem nenhum código extra.
        </P>
      </Secao>
    </>
  )
}
