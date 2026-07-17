import { useState } from 'react'
import { Selo, Etiqueta } from '@amboni/ui'
import { Secao, P, Demo, Titulo, H3, Aviso, TabelaProps, FacaNaoFaca, Bloco } from '../lib/blocos'
import { Playground } from '../lib/Playground'

const TONS = ['neutro', 'marca', 'sucesso', 'aviso', 'perigo', 'info'] as const

function DemoFiltros() {
  const [filtros, setFiltros] = useState(['Ativos', 'Criciúma', 'Últimos 30 dias'])

  return (
    <>
      {filtros.map(f => (
        <Etiqueta key={f} tom="marca" removivel onRemover={() => setFiltros(filtros.filter(x => x !== f))}>
          {f}
        </Etiqueta>
      ))}
      {filtros.length < 3 && (
        <Etiqueta onClick={() => setFiltros(['Ativos', 'Criciúma', 'Últimos 30 dias'])}>
          Restaurar filtros da demo
        </Etiqueta>
      )}
    </>
  )
}

export default function SeloPage() {
  return (
    <>
      <Titulo
        eyebrow="Componentes"
        lead="Duas pílulas quase idênticas na tela e completamente diferentes no significado. Escolher a errada é o erro mais comum da dupla."
      >
        Selo e Etiqueta
      </Titulo>

      <Secao titulo="Experimente">
        <Playground
          componente="Selo"
          variante="centro"
          controles={[
            { prop: 'tom', tipo: 'select', opcoes: ['neutro', 'marca', 'sucesso', 'aviso', 'perigo', 'info'], padrao: 'neutro' },
            { prop: 'variante', tipo: 'select', opcoes: ['suave', 'solido', 'contorno'], padrao: 'suave' },
            { prop: 'size', tipo: 'select', opcoes: ['sm', 'md'], padrao: 'md' },
            { prop: 'pontinho', tipo: 'bool', padrao: false },
            { prop: 'children', tipo: 'texto', padrao: 'Entregue' },
          ]}
          render={p => <Selo {...p}>{p.children}</Selo>}
        />
        <P>
          Apague o texto e olhe o que sobra: uma pílula colorida que não informa nada. É
          exatamente o que 1 em cada 12 homens vê quando o tom é o único sinal — e é por isso
          que o <code>children</code> do Selo é obrigatório no TypeScript.
        </P>
      </Secao>

      <Secao>
        <Bloco lang="jsx">{`import { Selo, Etiqueta } from '@amboni/ui'`}</Bloco>
      </Secao>

      <Secao titulo="Qual dos dois?">
        <Demo
          codigo={`<Selo tom="sucesso" pontinho>Entregue</Selo>       // o sistema decidiu. Você lê.
<Etiqueta tom="marca" removivel onRemover={tirar}>Ativos</Etiqueta>  // você pôs. Você tira.`}
        >
          <Selo tom="sucesso" pontinho>Entregue</Selo>
          <Etiqueta tom="marca" removivel onRemover={() => {}}>Ativos</Etiqueta>
        </Demo>
        <P>
          <strong>Selo é ESTADO.</strong> O sistema decidiu e está te informando: "Entregue",
          "Falhou", "Pendente". Read-only. Você lê e segue a vida.
        </P>
        <P>
          <strong>Etiqueta é ENTRADA.</strong> Você criou e pode tirar: um filtro aplicado, um
          destinatário escolhido, uma tag num cliente.
        </P>
        <H3>O teste rápido: existe um X?</H3>
        <P>
          Se a pessoa pode remover aquilo, é <code>Etiqueta</code>. Se ela só está sendo
          informada, é <code>Selo</code> — e um <strong>Selo com X é uma promessa que a tela não
          pode cumprir</strong>: "posso desentregar a mensagem?". É por isso que a prop{' '}
          <code>removivel</code> só existe na Etiqueta. A escolha do componente não é estética,
          é semântica.
        </P>
        <FacaNaoFaca
          faca={{
            titulo: 'Status da entrega = Selo. Filtro aplicado = Etiqueta',
            texto: 'O nome do componente já conta ao próximo dev se aquilo ali é informação ou controle. Ele não precisa ler o resto do arquivo.',
          }}
          naoFaca={{
            titulo: 'Etiqueta para mostrar "Entregue"',
            texto: 'Ela tem borda de coisa manipulável e aceita onClick e X. Cedo ou tarde alguém adiciona o X — e a tela promete desfazer o que não dá.',
          }}
        />
      </Secao>

      <Secao titulo="Selo — a cor nunca é o único sinal">
        <Demo
          codigo={`<Selo tom="sucesso" pontinho>Entregue</Selo>
<Selo tom="perigo">Falhou</Selo>
<Selo tom="aviso">Pendente</Selo>`}
        >
          {TONS.map(t => (
            <Selo key={t} tom={t} pontinho>{t}</Selo>
          ))}
        </Demo>
        <P>
          Um selo verde "Entregue" e um vermelho "Falhou" são <strong>o mesmo selo</strong> para
          cerca de 1 em cada 12 homens (daltonismo vermelho-verde), para quem imprime em preto e
          branco, para quem está no sol e para quem usa leitor de tela.
        </P>
        <P>
          Por isso <code>children</code> é <strong>obrigatório</strong>: o texto carrega o
          significado, a cor só ajuda a achar mais rápido. E por isso o <code>pontinho</code> é{' '}
          <code>aria-hidden</code> — ele é enfeite de varredura visual, para o olho achar a linha
          na tabela, não informação.
        </P>
        <P>
          A pílula também é sinal: <strong>a forma diferencia o selo do texto ao redor mesmo sem
          cor nenhuma</strong> — no print de tela, no tema de alto contraste, na impressão.
        </P>
        <Aviso tipo="warn">
          O TypeScript já exige <code>children</code>, mas{' '}
          <code>{`children={ativo && 'Ativo'}`}</code> passa pelo tipo e chega como{' '}
          <code>false</code>. A biblioteca <strong>avisa no console em desenvolvimento</strong>{' '}
          em vez de renderizar uma bolinha muda em produção.
        </Aviso>
      </Secao>

      <Secao titulo="Variantes do Selo">
        <Demo
          codigo={`<Selo tom="sucesso">Entregue</Selo>                     // suave é o padrão
<Selo tom="perigo" variante="solido">Falhou</Selo>
<Selo tom="marca" variante="contorno">Novo</Selo>`}
        >
          {(['suave', 'solido', 'contorno'] as const).map(v => (
            <Selo key={v} tom="sucesso" variante={v}>{v}</Selo>
          ))}
          {(['suave', 'solido', 'contorno'] as const).map(v => (
            <Selo key={`p-${v}`} tom="perigo" variante={v}>{v}</Selo>
          ))}
        </Demo>
        <P>
          <strong><code>suave</code></strong> é o padrão: discreto o bastante para conviver com
          dezenas deles numa tabela sem virar árvore de natal.{' '}
          <strong><code>solido</code></strong> é para o selo que precisa saltar — um "Falhou" no
          meio de trinta "Entregue". Use com parcimônia: se tudo salta, nada salta.{' '}
          <strong><code>contorno</code></strong> é para quando o fundo já é tingido e um segundo
          tingido some.
        </P>
      </Secao>

      <Secao titulo="Por que o sólido não usa a cor sólida">
        <P>
          Esta é a decisão mais contraintuitiva da biblioteca, e vale entender.{' '}
          <strong>A variante <code>solido</code> usa o token <code>-text</code> como FUNDO</strong>{' '}
          — e a superfície como texto. Não o <code>-solid</code>, que seria o caminho óbvio.
        </P>
        <Bloco lang="css">{`/* O que a biblioteca faz */
.amb-selo--solido {
  background: var(--amb-selo-texto);   /* o token -text, invertido */
  color: var(--amb-color-surface);
}

/* O caminho óbvio — e reprovado */
.badge--solid {
  background: var(--amb-color-success-solid);  /* #10b981 */
  color: white;                                /* ~2,5:1 — reprova */
}`}</Bloco>
        <P>
          O motivo é aritmético. O par testado em <code>@amboni/tokens</code> é
          "<code>&lt;estado&gt;.text</code> sobre <code>surface</code> passa em AA".{' '}
          <strong>Contraste é simétrico</strong> — a razão entre duas cores não muda se você
          trocar qual é o fundo. Então inverter o par preserva exatamente a mesma razão já
          aprovada, sem inventar combinação nova nenhuma.
        </P>
        <P>
          Já o <code>-solid</code> com texto branco rende cerca de <strong>2,5:1</strong> no
          sucesso (<code>#10b981</code>) e <strong>2,1:1</strong> no aviso (<code>#f59e0b</code>).
          Reprova feio — e <strong>é assim que quase toda biblioteca entrega "badge sólido"</strong>.
          O verde e o âmbar da paleta existem para preencher barra de progresso e pintar
          bolinha, não para receber texto em cima.
        </P>
        <Aviso>
          Um selo vermelho ilegível é pior que nenhum selo: ele ocupa o lugar da informação sem
          entregá-la. Se você precisa de "badge sólido" fora daqui, o teste é o mesmo — meça o
          par que você está usando, não confie no que parece bonito no Figma.
        </Aviso>
      </Secao>

      <Secao titulo="Etiqueta — o X">
        <Demo codigo={`<Etiqueta tom="marca" removivel onRemover={() => tirarFiltro('ativos')}>Ativos</Etiqueta>
// O X vira aria-label="Remover Ativos" sozinho.`}>
          <DemoFiltros />
        </Demo>
        <P>
          O X <strong>diz o que remove</strong>. Quando o filho é texto puro, a Etiqueta deduz
          sozinha: "Remover Ativos". Numa barra com 8 filtros, 8 botões "Remover" idênticos
          deixam quem usa leitor de tela sem saber qual é qual — é a diferença entre uma lista
          navegável e um labirinto.
        </P>
        <Bloco lang="jsx">{`// Conteúdo que não é texto puro: a dedução não funciona, e o rótulo precisa ser dito.
<Etiqueta removivel onRemover={tirar} rotuloRemover="Remover filtro Ativos">
  <strong>Status:</strong> Ativos
</Etiqueta>`}</Bloco>
        <P>
          Tentar ser esperto com <code>{'<strong>Status:</strong> Ativos'}</code> daria
          "[object Object]". Melhor exigir <code>rotuloRemover</code> — e{' '}
          <strong>avisar no console</strong> quando ele falta.
        </P>
        <P>
          O X tem <strong>20px de alvo</strong> e fica visível sempre. X que só aparece no hover
          não existe para quem usa toque nem para quem navega por teclado — e este é o botão que{' '}
          <em>apaga</em> algo.
        </P>
      </Secao>

      <Secao titulo="Clicável + removível: dois botões, nunca aninhados">
        <Demo codigo={`<Etiqueta
  tom="marca"
  onClick={editarFiltro}     // corpo clicável
  removivel
  onRemover={tirarFiltro}    // X
>
  Últimos 30 dias
</Etiqueta>`}>
          <Etiqueta tom="marca" onClick={() => {}} removivel onRemover={() => {}}>
            Últimos 30 dias
          </Etiqueta>
          <Etiqueta onClick={() => {}}>Só clicável — a pílula inteira é o alvo</Etiqueta>
          <Etiqueta>Sem clique: é um span</Etiqueta>
        </Demo>
        <P>
          Etiqueta clicável + X são <strong>duas ações no mesmo desenho</strong>. A saída
          preguiçosa seria <code>&lt;button&gt;</code> com <code>&lt;button&gt;</code> dentro:
          HTML inválido. O navegador "conserta" isso sozinho jogando o X <em>para fora</em> da
          etiqueta — <strong>e quebra o layout de um jeito que só aparece em produção</strong>,
          porque o React renderiza o que você escreveu e o parser do navegador é que reescreve a
          árvore.
        </P>
        <P>
          Aqui os dois botões são <strong>irmãos</strong> dentro de um <code>&lt;span&gt;</code>{' '}
          que não recebe foco: a pílula é só desenho. O teclado ganha dois pontos de parada
          distintos, na ordem esperada — corpo, depois X — e o HTML fica válido.
        </P>
        <P>
          O elemento muda conforme o uso, e isso é de propósito: <strong>só clicável</strong> vira
          um <code>&lt;button&gt;</code> inteiro (alvo maior, mais fácil de acertar);{' '}
          <strong>sem clique nenhum</strong> vira <code>&lt;span&gt;</code> — não há por que
          fingir de botão o que não faz nada, e um botão falso vira parada de Tab para lugar
          nenhum.
        </P>
        <Aviso>
          A Etiqueta tem <strong>borda sempre</strong>, o Selo suave não. Borda é a pista de que
          ali tem algo manipulável — e é a pista que <strong>sobrevive ao tema de alto contraste
          do sistema</strong>, onde o navegador descarta os fundos tingidos.
        </Aviso>
      </Secao>

      <Secao titulo="Props">
        <H3>Selo</H3>
        <TabelaProps
          props={[
            { nome: 'children', tipo: 'ReactNode', descricao: <><strong>Obrigatório.</strong> O rótulo. É ele que carrega o significado — a cor só reforça.</> },
            { nome: 'tom', tipo: "'neutro' | 'marca' | 'sucesso' | 'aviso' | 'perigo' | 'info'", padrao: "'neutro'", descricao: 'Reforça o texto, nunca substitui.' },
            { nome: 'variante', tipo: "'suave' | 'solido' | 'contorno'", padrao: "'suave'", descricao: 'Sólido é a exceção que salta. Se tudo salta, nada salta.' },
            { nome: 'size', tipo: "'sm' | 'md'", padrao: "'md'", descricao: 'sm cabe em célula densa. Abaixo disso o texto para de ser lido.' },
            { nome: 'pontinho', tipo: 'boolean', padrao: 'false', descricao: <>Bolinha antes do texto. Decorativa (<code>aria-hidden</code>) — serve para o olho achar a linha.</> },
            { nome: '…rest', tipo: 'HTMLAttributes<HTMLSpanElement>', descricao: <>É um <code>&lt;span&gt;</code>. Aceita <code>title</code>, <code>aria-*</code>, <code>ref</code>.</> },
          ]}
        />

        <H3>Etiqueta</H3>
        <TabelaProps
          props={[
            { nome: 'children', tipo: 'ReactNode', descricao: <><strong>Obrigatório.</strong> O texto que a nomeia — para o olho e para o leitor de tela.</> },
            { nome: 'tom', tipo: "'neutro' | 'marca' | 'sucesso' | 'aviso' | 'perigo' | 'info'", padrao: "'neutro'", descricao: 'Os mesmos seis tons do Selo.' },
            { nome: 'size', tipo: "'sm' | 'md'", padrao: "'md'", descricao: 'Alturas de 24 e 28px: a etiqueta acompanha um campo de busca, não uma barra de ferramentas.' },
            { nome: 'icone', tipo: 'ReactNode', descricao: 'Antes do texto. Decorativo — quem nomeia é o texto.' },
            { nome: 'removivel', tipo: 'boolean', padrao: 'false', descricao: <>Mostra o X. Só faz sentido com <code>onRemover</code>.</> },
            { nome: 'onRemover', tipo: '() => void', descricao: 'Chamado ao clicar no X. O clique não borbulha para o onClick do corpo.' },
            { nome: 'onClick', tipo: '() => void', descricao: 'Torna o corpo clicável (ex.: clicar no filtro para editá-lo).' },
            { nome: 'rotuloRemover', tipo: 'string', padrao: '`Remover ${children}`', descricao: <>Necessário quando <code>children</code> não é texto puro. Diga O QUE remove.</> },
            { nome: '…rest', tipo: 'HTMLAttributes<HTMLElement>', descricao: <>O elemento muda: <code>&lt;span&gt;</code>, <code>&lt;button&gt;</code> ou <code>&lt;span&gt;</code> com dois botões dentro.</> },
          ]}
        />
      </Secao>
    </>
  )
}
