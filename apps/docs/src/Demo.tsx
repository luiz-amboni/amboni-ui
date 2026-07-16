import { useState, useEffect, type ReactNode } from 'react'
import { Button } from '@amboni/ui'
import { construirTema, contraste, MARCAS, type Marca } from '@amboni/tokens'

/**
 * O site de documentação.
 *
 * Um design system sem documentação é uma pasta de componentes. O que faz alguém
 * ADOTAR é conseguir: ver funcionando, copiar o código, e entender quando NÃO usar.
 *
 * Duas coisas aqui não existem em site nenhum de biblioteca, e são o nosso diferencial:
 *  · o seletor de marca/tema no topo, mostrando ao vivo que o MESMO componente serve
 *    iSafe e VEAR, claro e escuro;
 *  · a tabela de contraste com a nota real de cada par — calculada no navegador,
 *    na sua frente, não prometida num rodapé.
 */

// ── peças do site ────────────────────────────────────────────────────────────

function Secao({ id, titulo, desc, children }: { id: string; titulo: string; desc?: string; children: ReactNode }) {
  return (
    <section id={id} style={{ marginBottom: 64, scrollMarginTop: 88 }}>
      <h2 style={{ font: '800 28px/1.2 Sora, sans-serif', letterSpacing: '-.02em', margin: '0 0 6px' }}>{titulo}</h2>
      {desc && <p style={{ color: 'var(--amb-color-text-secondary)', margin: '0 0 20px', maxWidth: 720 }}>{desc}</p>}
      {children}
    </section>
  )
}

/** Exemplo vivo + o código que o produz. O código é copiável — é assim que se adota. */
function Exemplo({ codigo, children }: { codigo: string; children: ReactNode }) {
  const [copiado, setCopiado] = useState(false)
  return (
    <div style={{ border: '1px solid var(--amb-color-border-default)', borderRadius: 'var(--amb-raio-lg)', overflow: 'hidden', marginBottom: 16 }}>
      <div style={{ padding: 24, background: 'var(--amb-color-surface)', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {children}
      </div>
      <div style={{ position: 'relative', background: 'var(--amb-color-surfaceSunken)', borderTop: '1px solid var(--amb-color-border-default)' }}>
        <pre style={{ margin: 0, padding: '14px 16px', overflow: 'auto', font: '400 12.5px/1.6 "JetBrains Mono", monospace', color: 'var(--amb-color-text-secondary)' }}>
          {codigo}
        </pre>
        <button
          onClick={() => { navigator.clipboard.writeText(codigo); setCopiado(true); setTimeout(() => setCopiado(false), 1400) }}
          style={{
            position: 'absolute', top: 8, right: 8, border: '1px solid var(--amb-color-border-default)',
            background: 'var(--amb-color-surface)', color: 'var(--amb-color-text-secondary)',
            borderRadius: 'var(--amb-raio-sm)', padding: '4px 10px', font: '600 11px Inter, sans-serif', cursor: 'pointer',
          }}
        >
          {copiado ? '✓ copiado' : 'copiar'}
        </button>
      </div>
    </div>
  )
}

/** O par faça/não faça. Sem isto, todo mundo usa errado e a culpa é da biblioteca. */
function FacaNaoFaca({ faca, naoFaca }: { faca: { t: string; d: string }; naoFaca: { t: string; d: string } }) {
  const cel = (cor: string, tag: string, t: string, d: string) => (
    <div style={{ flex: 1, minWidth: 260, border: `1px solid ${cor}`, borderRadius: 'var(--amb-raio-md)', padding: 16, background: 'var(--amb-color-surface)' }}>
      <div style={{ font: '800 10px Inter', letterSpacing: '.08em', textTransform: 'uppercase', color: cor, marginBottom: 6 }}>{tag}</div>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{t}</div>
      <div style={{ fontSize: 13, color: 'var(--amb-color-text-secondary)' }}>{d}</div>
    </div>
  )
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
      {cel('var(--amb-color-success-text)', '✓ faça', faca.t, faca.d)}
      {cel('var(--amb-color-danger-text)', '✕ não faça', naoFaca.t, naoFaca.d)}
    </div>
  )
}

/** Tabela de propriedades — o contrato do componente. */
function Props({ linhas }: { linhas: Array<[string, string, string, string]> }) {
  const th: React.CSSProperties = { textAlign: 'left', padding: '10px 14px', font: '800 10px Inter', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--amb-color-text-muted)', borderBottom: '1px solid var(--amb-color-border-default)' }
  const td: React.CSSProperties = { padding: '11px 14px', fontSize: 13, borderBottom: '1px solid var(--amb-color-border-default)', verticalAlign: 'top' }
  const mono: React.CSSProperties = { ...td, font: '500 12.5px "JetBrains Mono", monospace', color: 'var(--amb-color-brand-text)', whiteSpace: 'nowrap' }
  return (
    <div style={{ overflowX: 'auto', border: '1px solid var(--amb-color-border-default)', borderRadius: 'var(--amb-raio-lg)', background: 'var(--amb-color-surface)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
        <thead><tr><th style={th}>prop</th><th style={th}>tipo</th><th style={th}>padrão</th><th style={th}>o que faz</th></tr></thead>
        <tbody>
          {linhas.map(([p, t, d, o]) => (
            <tr key={p}>
              <td style={mono}>{p}</td>
              <td style={{ ...td, font: '400 12px "JetBrains Mono", monospace', color: 'var(--amb-color-text-secondary)' }}>{t}</td>
              <td style={{ ...td, font: '400 12px "JetBrains Mono", monospace', color: 'var(--amb-color-text-muted)' }}>{d}</td>
              <td style={{ ...td, color: 'var(--amb-color-text-secondary)' }}>{o}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * A prova de acessibilidade — calculada no seu navegador, agora.
 * É o argumento mais forte da biblioteca: não prometemos, mostramos a conta.
 */
function TabelaContraste({ marca, modo }: { marca: Marca; modo: 'light' | 'dark' }) {
  const t = construirTema(marca, modo)
  const pares: Array<[string, string, string, number]> = [
    ['Texto principal', t.color.text.primary, t.color.surface, 4.5],
    ['Texto secundário', t.color.text.secondary, t.color.surface, 4.5],
    ['Texto apagado', t.color.text.muted, t.color.surface, 3],
    ['Texto no botão primário', t.color.text.onBrand, t.color.brand.solid, 4.5],
    ['Destaque da marca', t.color.brand.text, t.color.surface, 4.5],
    ['Anel de foco', t.color.border.focus, t.color.surface, 3],
    ['Texto de erro', t.color.danger.text, t.color.surface, 4.5],
    ['Texto de sucesso', t.color.success.text, t.color.surface, 4.5],
  ]
  const th: React.CSSProperties = { textAlign: 'left', padding: '10px 14px', font: '800 10px Inter', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--amb-color-text-muted)', borderBottom: '1px solid var(--amb-color-border-default)' }
  const td: React.CSSProperties = { padding: '10px 14px', fontSize: 13, borderBottom: '1px solid var(--amb-color-border-default)' }

  return (
    <div style={{ overflowX: 'auto', border: '1px solid var(--amb-color-border-default)', borderRadius: 'var(--amb-raio-lg)', background: 'var(--amb-color-surface)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
        <thead><tr><th style={th}>par</th><th style={th}>amostra</th><th style={{ ...th, textAlign: 'right' }}>nota</th><th style={{ ...th, textAlign: 'right' }}>mínimo</th><th style={th}></th></tr></thead>
        <tbody>
          {pares.map(([nome, fg, bg, min]) => {
            const r = contraste(fg, bg)
            const ok = r >= min
            return (
              <tr key={nome}>
                <td style={td}>{nome}</td>
                <td style={td}>
                  <span style={{ background: bg, color: fg, padding: '4px 10px', borderRadius: 'var(--amb-raio-sm)', border: '1px solid var(--amb-color-border-default)', fontWeight: 700, fontSize: 12 }}>
                    Exemplo
                  </span>
                </td>
                <td style={{ ...td, textAlign: 'right', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: ok ? 'var(--amb-color-success-text)' : 'var(--amb-color-danger-text)' }}>
                  {r.toFixed(2)}
                </td>
                <td style={{ ...td, textAlign: 'right', color: 'var(--amb-color-text-muted)', fontVariantNumeric: 'tabular-nums' }}>{min.toFixed(1)}</td>
                <td style={td}>
                  <span style={{ font: '800 10px Inter', letterSpacing: '.05em', padding: '3px 8px', borderRadius: 999, background: ok ? 'var(--amb-color-success-subtle)' : 'var(--amb-color-danger-subtle)', color: ok ? 'var(--amb-color-success-text)' : 'var(--amb-color-danger-text)' }}>
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

// ── página ───────────────────────────────────────────────────────────────────

/** Lê marca/tema da URL (?marca=vear&tema=dark) — assim o link é compartilhável:
 *  dá para mandar "olha como fica no VEAR escuro" para alguém. */
function daUrl<T extends string>(chave: string, valido: readonly T[], padrao: T): T {
  const v = new URLSearchParams(window.location.search).get(chave) as T | null
  return v && valido.includes(v) ? v : padrao
}

export default function Demo() {
  const [marca, setMarca] = useState<Marca>(() =>
    daUrl('marca', Object.keys(MARCAS) as Marca[], 'isafe'))
  const [modo, setModo] = useState<'light' | 'dark'>(() =>
    daUrl('tema', ['light', 'dark'] as const, 'light'))

  // Aplica no <html> e guarda na URL — é assim que o produto real faz também.
  useEffect(() => {
    document.documentElement.setAttribute('data-amb-brand', marca)
    document.documentElement.setAttribute('data-amb-theme', modo)
    const u = new URL(window.location.href)
    u.searchParams.set('marca', marca)
    u.searchParams.set('tema', modo)
    window.history.replaceState(null, '', u)
  }, [marca, modo])

  const seletor: React.CSSProperties = {
    border: '1px solid var(--amb-color-border-strong)', background: 'var(--amb-color-surface)',
    color: 'var(--amb-color-text-primary)', borderRadius: 'var(--amb-raio-md)',
    padding: '7px 12px', font: '600 13px Inter, sans-serif', cursor: 'pointer',
  }

  return (
    <div style={{ background: 'var(--amb-color-bg)', color: 'var(--amb-color-text-primary)', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      {/* barra fixa: a troca de marca/tema é a demonstração mais forte da biblioteca */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 1100, background: 'var(--amb-color-surface)',
        borderBottom: '1px solid var(--amb-color-border-default)', padding: '12px 24px',
        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      }}>
        <strong style={{ font: '800 15px Sora, sans-serif', letterSpacing: '-.01em' }}>@amboni/ui</strong>
        <span style={{ fontSize: 12, color: 'var(--amb-color-text-muted)' }}>v0.0.0</span>
        <div style={{ flex: 1 }} />
        <label style={{ fontSize: 12, color: 'var(--amb-color-text-secondary)', fontWeight: 600 }} htmlFor="marca">Marca</label>
        <select id="marca" value={marca} onChange={e => setMarca(e.target.value as Marca)} style={seletor}>
          {Object.keys(MARCAS).map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <label style={{ fontSize: 12, color: 'var(--amb-color-text-secondary)', fontWeight: 600 }} htmlFor="modo">Tema</label>
        <select id="modo" value={modo} onChange={e => setModo(e.target.value as 'light' | 'dark')} style={seletor}>
          <option value="light">claro</option>
          <option value="dark">escuro</option>
        </select>
      </header>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px 96px' }}>
        <h1 style={{ font: '900 44px/1.1 Sora, sans-serif', letterSpacing: '-.03em', margin: '0 0 12px' }}>
          Um design system<br />para produtos de verdade.
        </h1>
        <p style={{ fontSize: 17, color: 'var(--amb-color-text-secondary)', maxWidth: 640, marginBottom: 28 }}>
          Neutro — funciona com MUI, Tailwind ou CSS puro. Temável — a mesma peça serve
          marcas diferentes. E acessível <strong>por prova</strong>: o contraste é calculado
          no teste, e cor ilegível quebra o build.
        </p>
        <div style={{ display: 'flex', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
          <Button variant="primary">Começar</Button>
          <Button variant="secondary">Ver no GitHub</Button>
        </div>
        <p style={{ font: '500 12.5px "JetBrains Mono", monospace', color: 'var(--amb-color-text-muted)', marginTop: 18 }}>
          npm install @amboni/ui
        </p>

        <hr style={{ border: 0, borderTop: '1px solid var(--amb-color-border-default)', margin: '48px 0' }} />

        <Secao
          id="prova"
          titulo="A prova de acessibilidade"
          desc="Esta tabela é calculada no seu navegador, agora, com a fórmula da WCAG. Troque a marca e o tema no topo: nenhum par reprova em nenhuma combinação — porque o build não deixaria."
        >
          <TabelaContraste marca={marca} modo={modo} />
          <p style={{ fontSize: 13, color: 'var(--amb-color-text-muted)', marginTop: 12 }}>
            Isso já pegou um problema real: texto branco sobre o ciano <code>#0fa6be</code> dá
            2,91 — reprovado. O botão primário de um sistema em produção era ilegível para quem
            tem baixa visão. Ninguém tinha visto no olho.
          </p>
        </Secao>

        <Secao
          id="button"
          titulo="Button"
          desc="A ação. Um <button> de verdade por baixo — então teclado, foco e leitor de tela funcionam de graça."
        >
          <h3 style={{ font: '700 15px Sora', margin: '0 0 10px' }}>Variantes</h3>
          <Exemplo codigo={`<Button variant="primary">Salvar alterações</Button>
<Button variant="secondary">Cancelar</Button>
<Button variant="ghost">Voltar</Button>
<Button variant="danger">Excluir cliente</Button>`}>
            <Button variant="primary">Salvar alterações</Button>
            <Button variant="secondary">Cancelar</Button>
            <Button variant="ghost">Voltar</Button>
            <Button variant="danger">Excluir cliente</Button>
          </Exemplo>

          <h3 style={{ font: '700 15px Sora', margin: '24px 0 10px' }}>Tamanhos</h3>
          <Exemplo codigo={`<Button size="sm">Pequeno</Button>
<Button size="md">Médio</Button>
<Button size="lg">Grande</Button>`}>
            <Button size="sm">Pequeno</Button>
            <Button size="md">Médio</Button>
            <Button size="lg">Grande</Button>
          </Exemplo>

          <h3 style={{ font: '700 15px Sora', margin: '24px 0 10px' }}>Carregando</h3>
          <Exemplo codigo={`<Button variant="primary" loading>Salvar</Button>`}>
            <Button variant="primary" loading>Salvar</Button>
            <span style={{ fontSize: 13, color: 'var(--amb-color-text-secondary)' }}>
              O clique é bloqueado — sem isso, dois cliques rápidos viram dois cadastros.
            </span>
          </Exemplo>

          <h3 style={{ font: '700 15px Sora', margin: '24px 0 10px' }}>Quando usar cada uma</h3>
          <FacaNaoFaca
            faca={{ t: 'Uma ação primária por tela', d: 'O primário é o caminho que você quer que a pessoa siga. Se tudo é primário, nada é.' }}
            naoFaca={{ t: 'Vários primários competindo', d: 'Dois botões da cor da marca lado a lado fazem a pessoa parar para escolher.' }}
          />
          <FacaNaoFaca
            faca={{ t: '"Excluir cliente"', d: 'O rótulo diz o que vai acontecer. Quem não distingue vermelho continua entendendo.' }}
            naoFaca={{ t: 'Só um ícone de lixeira vermelho', d: '1 em cada 12 homens não distingue vermelho de verde. A cor sozinha não é aviso.' }}
          />

          <h3 style={{ font: '700 15px Sora', margin: '24px 0 10px' }}>Propriedades</h3>
          <Props linhas={[
            ['variant', "'primary' | 'secondary' | 'ghost' | 'danger'", "'secondary'", 'O peso da ação na tela.'],
            ['size', "'sm' | 'md' | 'lg'", "'md'", 'Altura. Mesmo o sm tem 32px — alvo menor é difícil de acertar no toque.'],
            ['loading', 'boolean', 'false', 'Giro + clique bloqueado + aria-busy. O rótulo não some do DOM (o botão não encolhe).'],
            ['block', 'boolean', 'false', 'Ocupa a largura toda. Comum em formulário no celular.'],
            ['iconLeft / iconRight', 'ReactNode', '—', 'Ícone decorativo. Quem narra o botão é o texto.'],
            ['type', "'button' | 'submit' | 'reset'", "'button'", "Padrão 'button' de propósito: o default do HTML é 'submit' e envia o form sem querer."],
          ]} />
        </Secao>

        <Secao
          id="tokens"
          titulo="Tokens"
          desc="A fonte da verdade. Três camadas: valor cru → significado → tema. Os componentes usam só a camada semântica — é isso que faz a mesma peça servir marcas diferentes."
        >
          <Exemplo codigo={`.meu-card {
  background: var(--amb-color-surface);
  color: var(--amb-color-text-primary);
  border: 1px solid var(--amb-color-border-default);
  border-radius: var(--amb-raio-lg);
  padding: var(--amb-espaco-4);
}`}>
            <div style={{ background: 'var(--amb-color-surface)', color: 'var(--amb-color-text-primary)', border: '1px solid var(--amb-color-border-default)', borderRadius: 'var(--amb-raio-lg)', padding: 'var(--amb-espaco-4)', fontSize: 14 }}>
              Um card usando só tokens — troque a marca no topo e veja.
            </div>
          </Exemplo>
          <FacaNaoFaca
            faca={{ t: 'var(--amb-color-brand-solid)', d: 'O nome diz a intenção. Trocar a marca é uma linha.' }}
            naoFaca={{ t: '#0FA6BE', d: 'Cor cravada. É por isso que um dos CRMs tem 522 hex espalhados por 42 arquivos.' }}
          />
        </Secao>

        <footer style={{ borderTop: '1px solid var(--amb-color-border-default)', paddingTop: 24, marginTop: 64, fontSize: 13, color: 'var(--amb-color-text-muted)' }}>
          MIT © Luiz Amboni · feito para o iSafe CRM e o VEAR B2G
        </footer>
      </main>
    </div>
  )
}
