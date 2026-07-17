import { contraste, paleta } from '@amboni/tokens'
import { Button, Selo } from '@amboni/ui'
import { Secao, P, Demo, Titulo, H3, Aviso, Bloco, FacaNaoFaca } from '../lib/blocos'

/** Contraste calculado na hora — mesma função que roda no CI. */
const r = (fg: string, bg: string) => `${contraste(fg, bg).toFixed(2)}:1`

/** As classes com o roxo cravado, contadas no código do VEAR em julho de 2026. */
const USOS = [
  { classe: 'text-[#5C2684]', n: 93, vira: 'text-brand' },
  { classe: 'border-[#5C2684]', n: 73, vira: 'border-brand' },
  { classe: 'bg-[#5C2684]', n: 46, vira: 'bg-brand' },
  { classe: 'ring-[#5C2684]', n: 40, vira: 'ring-brand' },
  { classe: 'from-[#5C2684]', n: 29, vira: 'from-brand' },
  { classe: 'to-[#5C2684]', n: 2, vira: 'to-brand' },
  { classe: 'shadow-[#5C2684]', n: 2, vira: 'shadow-brand' },
  { classe: 'via-[#5C2684]', n: 1, vira: 'via-brand' },
]

export default function GuiaTailwindPage() {
  const total = USOS.reduce((s, u) => s + u.n, 0)

  return (
    <>
      <Titulo
        eyebrow="Guias"
        lead="O VEAR tem 313 roxos cravados no código. Nenhum deles sabe que é a cor da marca."
      >
        Conviver com o Tailwind
      </Titulo>

      <Secao titulo="A ponte">
        <P>
          Tailwind v4 não tem mais <code>tailwind.config.js</code> — a configuração é CSS. Ligar
          os tokens é uma linha por cor, no mesmo arquivo onde você importa o Tailwind:
        </P>
        <Bloco lang="css">{`@import "tailwindcss";
@import "@amboni/tokens/tokens.css";

@theme inline {
  --color-brand:         var(--amb-color-brand-solid);
  --color-brand-subtle:  var(--amb-color-brand-subtle);
  --color-surface:       var(--amb-color-surface);
  --color-ink:           var(--amb-color-text-primary);
  --color-ink-muted:     var(--amb-color-text-secondary);
}`}</Bloco>
        <P>
          Pronto: <code>bg-brand</code>, <code>text-brand</code>, <code>border-brand</code>,{' '}
          <code>ring-brand</code>, <code>from-brand</code>, <code>shadow-brand</code> passam a
          existir. <strong>Uma entrada gera a família inteira de utilitários</strong> — o
          Tailwind deriva todos a partir de <code>--color-*</code>.
        </P>

        <H3>Por que <code>inline</code>, e não só <code>@theme</code></H3>
        <P>
          Com <code>@theme</code>, o Tailwind cria <code>--color-brand</code> no{' '}
          <code>:root</code> e o utilitário vira <code>var(--color-brand)</code>. O valor é
          resolvido <strong>onde a variável foi definida</strong> — no <code>:root</code>. Se um
          dia você escurecer só um pedaço da página (<code>&lt;div
          data-amb-theme="dark"&gt;</code> num painel de preview), esse pedaço continua puxando
          o valor do <code>:root</code>, que é claro.
        </P>
        <P>
          Com <code>@theme inline</code>, o utilitário sai com{' '}
          <code>var(--amb-color-brand-solid)</code> escrito dentro dele, e a variável é resolvida{' '}
          <strong>no elemento</strong> — onde o <code>data-amb-theme</code> mais próximo vale.
          Compilado, a diferença é literalmente esta:
        </P>
        <Bloco lang="css">{`/* @theme inline  →  o utilitário aponta direto para o token */
.bg-brand   { background-color: var(--amb-color-brand-solid); }
.ring-brand { --tw-ring-color:  var(--amb-color-brand-solid); }`}</Bloco>
        <Aviso>
          Enquanto o tema estiver só no <code>&lt;html&gt;</code>, os dois funcionam igual.
          Use <code>inline</code> mesmo assim: custa uma palavra e evita o dia em que alguém põe
          um tema aninhado e passa a tarde procurando por que aquele card ficou claro.
        </Aviso>
      </Secao>

      <Secao titulo="O caso VEAR: 313 roxos">
        <P>
          Não é retórica, é <code>grep</code>. No frontend do VEAR, hoje:{' '}
          <strong>522 cores cravadas em 42 arquivos</strong> (524 se contar as duas escritas
          com canal alfa, <code>#ffffff18</code>). Dessas,{' '}
          <strong>313 são o mesmo <code>#5C2684</code></strong> — o roxo da marca, escrito à mão,
          trezentas e treze vezes. Outras 97 são o <code>#E6007E</code>, o rosa de apoio.
        </P>
        <P>
          Nenhuma delas sabe que é a cor da marca. São 313 strings independentes que{' '}
          <em>por acaso</em> têm o mesmo valor. Trocar o roxo do VEAR hoje é um{' '}
          <code>sed</code> em 42 arquivos e uma reza.
        </P>
        <div className="doc-table-wrap">
          <table className="doc-table">
            <thead>
              <tr>
                <th>Classe de hoje</th>
                <th className="doc-num">Ocorrências</th>
                <th>Vira</th>
              </tr>
            </thead>
            <tbody>
              {USOS.map(u => (
                <tr key={u.classe}>
                  <td><code>{u.classe}</code></td>
                  <td className="doc-num">{u.n}</td>
                  <td><code className="doc-mono-brand">{u.vira}</code></td>
                </tr>
              ))}
              <tr>
                <td><strong>total em classe utilitária</strong></td>
                <td className="doc-num"><strong>{total}</strong></td>
                <td>
                  <strong>cobertos por 1 linha</strong> de <code>@theme</code>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <P>
          Os {total} usos em classe utilitária são resolvidos por{' '}
          <strong>uma única entrada</strong> <code>--color-brand</code>. As ~27 restantes até
          313 estão fora de classe — em <code>linear-gradient()</code> no{' '}
          <code>index.css</code>, em <code>rgba()</code> de keyframe, em prop de{' '}
          <code>recharts</code>. Essas têm que ser olhadas uma a uma, e é por isso que a próxima
          seção existe.
        </P>
      </Secao>

      <Secao titulo="Por que não busca-e-troca">
        <P>
          A tentação é óbvia: <code>sed -i 's/#5C2684/var(--amb-color-brand-solid)/g'</code> e
          almoçar. Três motivos para não.
        </P>
        <P>
          <strong>1. Dentro de classe do Tailwind, não é CSS.</strong>{' '}
          <code>bg-[#5C2684]</code> é um nome de classe que o compilador lê. Trocar por{' '}
          <code>bg-[var(--amb-color-brand-solid)]</code> até funciona, mas você trocou um hex
          cravado por uma variável cravada — continua sem nome, continua sem saber que é a
          marca, e ainda ficou mais feio de ler. O ganho é <code>bg-brand</code>.
        </P>
        <P>
          <strong>2. O <code>sed</code> não distingue papel.</strong> Os 93{' '}
          <code>text-[#5C2684]</code> são texto: precisam de contraste. Os 46{' '}
          <code>bg-[#5C2684]</code> são fundo: precisam que o texto por cima tenha contraste. Os
          2 <code>shadow-[#5C2684]</code> são decoração pura: não precisam de nada. Uma
          substituição cega trata os três igual — e é exatamente assim que nasce um{' '}
          <code>#0FA6BE</code> ilegível.
        </P>
        <P>
          <strong>3. Maiúscula.</strong> As 313 ocorrências estão escritas{' '}
          <code>#5C2684</code>, em maiúscula. <code>#5c2684</code> minúsculo aparece{' '}
          <strong>zero</strong> vez. Um <code>grep</code> sem <code>-i</code> acerta os 313 por
          sorte; no dia em que alguém escrever a mesma cor em minúscula, o script passa direto
          e ninguém percebe. Cor cravada não tem quem a valide — é essa a doença, e trocar por
          outra string cravada não cura.
        </P>
        <FacaNaoFaca
          faca={{
            titulo: 'bg-[#5C2684] → bg-brand',
            texto: 'A classe passa a dizer o PAPEL. Trocar a marca do VEAR vira uma linha em MARCAS, e todo o resto acompanha — inclusive o tema escuro, que ninguém escreveu ainda.',
          }}
          naoFaca={{
            titulo: 'bg-[#5C2684] → bg-[var(--amb-color-brand-solid)]',
            texto: 'Funciona e não resolve nada: continua uma string solta, repetida 313 vezes, que nenhum teste alcança. Você trocou a dívida de lugar.',
          }}
        />
      </Secao>

      <Secao titulo="A troca é de graça (no claro)">
        <P>
          Um detalhe que faz o VEAR ser o caso fácil: a escala roxa foi{' '}
          <strong>ancorada no <code>#5C2684</code> original</strong>. Ele é o{' '}
          <code>purple[700]</code>, e <code>brand.solid</code> no tema claro é justamente o 700.
        </P>
        <div className="doc-table-wrap">
          <table className="doc-table">
            <thead>
              <tr><th>Antes</th><th>Depois</th><th className="doc-num">Cor final</th><th>Pixel</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><code>bg-[#5C2684]</code></td>
                <td><code className="doc-mono-brand">bg-brand</code></td>
                <td className="doc-num"><code>{paleta.purple[700]}</code></td>
                <td><span className="doc-pill doc-pill--ok">IDÊNTICO</span></td>
              </tr>
            </tbody>
          </table>
        </div>
        <P>
          <strong>A tela clara do VEAR não muda um pixel.</strong> Isso é raro e é de propósito:
          uma migração que muda a cor e a estrutura ao mesmo tempo é impossível de revisar —
          qualquer diferença vira discussão sobre se foi de propósito. Aqui, se algo mudou de
          cor no claro, é bug.
        </P>
        <P>
          O roxo ajuda de novo no contraste: branco sobre <code>#5C2684</code> dá{' '}
          <strong>{r('#ffffff', '#5C2684')}</strong> — folgado. O VEAR nunca teve o problema que
          o iSafe teve; a marca deles já era escura o bastante para ser fundo de texto.
        </P>
      </Secao>

      <Secao titulo="O rosa não tem token (leia antes de migrar)">
        <P>
          Honestidade acima de conveniência: <strong>o <code>#E6007E</code> do VEAR, usado 97
          vezes, não tem equivalente semântico hoje.</strong>
        </P>
        <P>
          A escala <code>pink</code> existe nos primitivos, ancorada no{' '}
          <code>#E6007E</code> (é o <code>pink[500]</code>). Mas <code>construirTema</code> tem{' '}
          <strong>uma</strong> cor de marca — <code>MARCAS = {'{'} isafe: cyan, vear: purple {'}'}</code> —
          e só a marca vira variável CSS. Os primitivos <strong>não</strong> são emitidos:{' '}
          não existe <code>--amb-color-pink-500</code>. Então <code>from-[#5C2684]
          to-[#E6007E]</code>, o gradiente da identidade do VEAR, hoje só migra pela metade.
        </P>
        <P>As saídas, em ordem de preferência:</P>
        <Bloco lang="css">{`/* 1. Deixe o rosa fora do @theme, com nome próprio, até existir token.
      Uma linha, um lugar, um nome — em vez de 97 hex soltos. */
@theme inline {
  --color-brand: var(--amb-color-brand-solid);
}
:root {
  --vear-rosa: #E6007E;          /* apoio da marca — sem token semântico ainda */
}
@theme inline {
  --color-accent: var(--vear-rosa);
}

/* 2. O gradiente vira utilitário do Tailwind, não CSS solto */
/* antes:  <div class="bg-[linear-gradient(135deg,#5C2684,#E6007E)]">  */
/* depois: <div class="bg-gradient-to-br from-brand to-accent">        */`}</Bloco>
        <Aviso tipo="warn">
          <strong>Antes de promover o rosa a token, meça.</strong> Branco sobre{' '}
          <code>#E6007E</code> dá <strong>{r('#ffffff', '#E6007E')}</strong> — passa em AA por{' '}
          <em>zero</em> de margem (o mínimo é 4,5:1). Ele funciona como fundo de botão hoje e
          reprovaria com qualquer ajuste de um dígito. Como <em>texto</em> sobre branco é pior:{' '}
          <strong>{r('#E6007E', '#ffffff')}</strong>. Se o rosa virar marca de verdade, ele vai
          escurecer para virar <code>solid</code> — como o ciano do iSafe escureceu. Melhor
          saber disso agora.
        </Aviso>
      </Secao>

      <Secao titulo="A armadilha do tema escuro">
        <P>
          Esta é a que custa uma tarde, e vale ler mesmo sem tema escuro no projeto.
        </P>
        <P>
          São <strong>dois mecanismos diferentes</strong>. Os nossos tokens respondem a um
          atributo: <code>[data-amb-brand="vear"][data-amb-theme="dark"]</code> — e{' '}
          <strong>só</strong> a ele. Não há{' '}
          <code>@media (prefers-color-scheme)</code> nenhum no <code>tokens.css</code>. O{' '}
          <code>dark:</code> do Tailwind, por padrão, é o oposto: é{' '}
          <code>@media (prefers-color-scheme: dark)</code>, e ignora atributo.
        </P>
        <P>
          O resultado de deixar assim: numa máquina com o sistema no claro, você
          põe <code>data-amb-theme="dark"</code>. Os nossos componentes escurecem. Todo{' '}
          <code>dark:bg-slate-900</code> do Tailwind <strong>não dispara</strong> — a media
          query é falsa. <strong>Metade da tela fica clara</strong>, e o bug só aparece para
          quem tem o SO no modo contrário do seu.
        </P>
        <P>Amarrar os dois é uma linha:</P>
        <Bloco lang="css">{`@import "tailwindcss";
@import "@amboni/tokens/tokens.css";

/* O dark: do Tailwind passa a obedecer o MESMO atributo que os tokens. */
@custom-variant dark (&:where([data-amb-theme="dark"], [data-amb-theme="dark"] *));

@theme inline {
  --color-brand: var(--amb-color-brand-solid);
}`}</Bloco>
        <P>Compilado, o <code>dark:</code> deixa de ser media query e vira seletor:</P>
        <Bloco lang="css">{`.dark\\:bg-surface:where([data-amb-theme="dark"], [data-amb-theme="dark"] *) {
  background-color: var(--amb-color-surface);
}`}</Bloco>
        <P>
          Agora existe <strong>um</strong> interruptor. <code>setAttribute('data-amb-theme',
          'dark')</code> vira os dois lados juntos, e não há como divergirem.
        </P>
        <Aviso>
          <strong>No VEAR isto é preventivo, não corretivo.</strong> O projeto tem{' '}
          <strong>zero</strong> ocorrências de <code>dark:</code> hoje — não existe tema escuro
          lá. Colocar a linha antes do primeiro <code>dark:</code> custa nada. Descobrir depois
          de 200 deles custa a tarde.
        </Aviso>
        <P>
          Se você <em>quer</em> seguir a preferência do sistema, não escolha o padrão do
          Tailwind — escolha o atributo, e deixe o JS ler a preferência uma vez:
        </P>
        <Bloco lang="jsx">{`const escuro = window.matchMedia('(prefers-color-scheme: dark)').matches
document.documentElement.setAttribute('data-amb-theme', escuro ? 'dark' : 'light')`}</Bloco>
        <P>
          Assim a preferência do sistema continua valendo, mas atravessa um lugar só. E a pessoa
          pode trocar no app sem que o SO discorde.
        </P>
      </Secao>

      <Secao titulo="Ajustar nossos componentes com Tailwind">
        <P>
          Todo componente aceita <code>className</code>, e o Tailwind ganha de nós em
          especificidade quando é utilitário de layout. Então dá para posicionar sem lutar:
        </P>
        <Demo
          codigo={`<Button variant="primary" className="w-full sm:w-auto">Enviar cotação</Button>
<Selo tom="sucesso" className="ml-2 shrink-0">Ativo</Selo>`}
        >
          <Button variant="primary" className="w-full sm:w-auto">Enviar cotação</Button>
          <Selo tom="sucesso" className="ml-2 shrink-0">Ativo</Selo>
        </Demo>
        <FacaNaoFaca
          faca={{
            titulo: 'Layout, espaço, posição pelo Tailwind',
            texto: 'w-full, ml-2, shrink-0, col-span-2. É o que o Tailwind faz melhor e onde a biblioteca não tem opinião.',
          }}
          naoFaca={{
            titulo: 'Repintar o componente por fora',
            texto: 'className="bg-pink-500 rounded-none" num <Button> é reescrever o componente pelo lado de fora. Se a variante que você quer não existe, ela falta na biblioteca — abra a discussão em vez de remendar em 12 telas.',
          }}
        />
      </Secao>

      <Secao titulo="A ordem de migração do VEAR">
        <P>
          O VEAR é React 19 + Tailwind v4 puro, sem biblioteca de componentes. Isso muda a
          conta em relação ao iSafe: não há nada para <em>substituir</em>, só HTML solto para{' '}
          <em>promover</em>. É mais fácil.
        </P>
        <P>
          <strong>1. Ponte + atributos.</strong> Os dois <code>@import</code>, o{' '}
          <code>@theme inline</code>, o <code>@custom-variant</code> e{' '}
          <code>data-amb-brand="vear" data-amb-theme="light"</code> no{' '}
          <code>&lt;html&gt;</code>. Nada muda na tela — é isso que você quer ver.
        </P>
        <P>
          <strong>2. Os 286 utilitários.</strong> <code>-[#5C2684]</code> → <code>-brand</code>,
          arquivo por arquivo. No claro, o diff visual é zero — o revisor só precisa conferir
          que nenhum hex sobrou.
        </P>
        <P>
          <strong>3. O que sobrou fora de classe.</strong> Os gradientes do{' '}
          <code>index.css</code>, os <code>rgba()</code> dos keyframes, as cores do{' '}
          <code>recharts</code>. Uma a uma, com decisão consciente sobre o rosa.
        </P>
        <P>
          <strong>4. Aí sim, componentes.</strong> Os 4 <code>StatCard</code> reescritos do VEAR
          viram um <code>&lt;StatCard&gt;</code>. Mas isso é outra conversa — e só depois que a
          cor tiver nome.
        </P>
      </Secao>
    </>
  )
}
