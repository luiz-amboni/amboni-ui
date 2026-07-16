import { useState } from 'react'
import { Selecao, type OpcaoSelecao, type SelecaoSize } from '@amboni/ui'
import { Secao, P, Demo, Titulo, H3, Aviso, TabelaProps, FacaNaoFaca, Bloco } from '../lib/blocos'

const integracoes: OpcaoSelecao[] = [
  { valor: 'bling', rotulo: 'Bling' },
  { valor: 'shopify', rotulo: 'Shopify' },
  { valor: 'tiny', rotulo: 'Tiny', desabilitada: true },
  { valor: 'omie', rotulo: 'Omie' },
]

const agrupadas: OpcaoSelecao[] = [
  { valor: 'bling', rotulo: 'Bling', grupo: 'ERP' },
  { valor: 'omie', rotulo: 'Omie', grupo: 'ERP' },
  { valor: 'shopify', rotulo: 'Shopify', grupo: 'Loja' },
  { valor: 'nuvem', rotulo: 'Nuvemshop', grupo: 'Loja' },
]

const cidades: OpcaoSelecao[] = [
  { valor: 'cri', rotulo: 'Criciúma' },
  { valor: 'sp', rotulo: 'São Paulo' },
  { valor: 'rj', rotulo: 'Rio de Janeiro' },
  { valor: 'fln', rotulo: 'Florianópolis' },
]

/** Um select controlado que nunca atualiza esconde bug de valor — aqui e nos testes. */
function Exemplo({
  opcoes = integracoes,
  inicial = '',
  rotulo = 'Integração',
  placeholder = 'Escolha a integração',
  ...props
}: {
  opcoes?: OpcaoSelecao[]
  inicial?: string
  rotulo?: string
  placeholder?: string
  size?: SelecaoSize
  erro?: string
  buscavel?: boolean
  limpavel?: boolean
}) {
  const [valor, setValor] = useState(inicial)
  return (
    <Selecao
      aria-label={rotulo}
      placeholder={placeholder}
      opcoes={opcoes}
      valor={valor}
      onChange={setValor}
      {...props}
    />
  )
}

export default function SelecaoPage() {
  return (
    <>
      <Titulo
        eyebrow="Componentes"
        lead="Escolher um valor de uma lista. Um <select> de verdade por padrão — e a razão disso cabe em duas palavras: celular."
      >
        Selecao
      </Titulo>

      <Secao>
        <Bloco lang="jsx">{`import { Selecao } from '@amboni/ui'`}</Bloco>
        <P>
          <strong>Selecao é para VALOR</strong> ("qual categoria?"). Para AÇÕES — Editar,
          Excluir — o componente é o <code>Menu</code>. Trocar os dois dá um menu que parece um
          campo de formulário, ou um campo que some da tela ao ser usado.
        </P>
      </Secao>

      <Secao titulo="A decisão: nativo por padrão">
        <Demo
          codigo={`<Selecao
  aria-label="Integração"
  opcoes={integracoes}
  valor={valor}
  onChange={setValor}
  placeholder="Escolha a integração"
/>`}
        >
          <Exemplo />
        </Demo>
        <P>
          Isto é um <code>&lt;select&gt;</code>, e é deliberado. O nativo dá de graça o que um
          combobox customizado leva meses para imitar mal: teclado completo, busca por
          digitação, e — o que mais pesa — <strong>a roda nativa do celular</strong>, aquela
          lista grande e confortável do iOS/Android. <strong>Nenhum select customizado ganha
          dela no toque.</strong>
        </P>
        <P>
          Há um teste travando o <code>tagName</code> em <code>SELECT</code>. Se um dia isto
          virar uma <code>&lt;div role="combobox"&gt;</code>, o teste quebra e a decisão volta à
          mesa — em vez de ser trocada de passagem num refactor.
        </P>

        <H3>O preço, honestamente</H3>
        <P>
          <strong>A lista aberta do <code>&lt;select&gt;</code> é desenhada pelo sistema
          operacional, não pelo nosso CSS.</strong> Consequências reais, não teóricas:
        </P>
        <P>
          <strong>1.</strong> Não dá para pôr ícone na opção. <strong>2.</strong> Não dá para
          alinhar a fonte da lista com a do resto do painel. <strong>3.</strong> No iOS/Android a
          roda ignora tudo o que escrevermos — de propósito: é a melhor experiência de toque que
          existe, e é justamente por ela que o nativo é o padrão.
        </P>
        <P>
          O que estilizamos é o <em>campo fechado</em>, que é o que fica na tela o tempo todo. O
          <code> appearance: base-select</code> resolveria o resto (Chrome 135+, Safari 27), mas
          o Firefox ainda não tem — então não construímos nada em cima dele.
        </P>
        <Aviso tipo="warn">
          <strong>O rótulo é obrigação de quem usa.</strong> Passe <code>aria-label</code> ou um
          <code> &lt;label htmlFor&gt;</code> apontando para o <code>id</code>. Um select sem
          rótulo é um campo mudo no leitor de tela — a <code>Selecao</code> não tem prop de
          rótulo próprio.
        </Aviso>
      </Secao>

      <Secao titulo="Buscável: quando o custo se paga">
        <Demo
          codigo={`// Só com lista longa (30+). Isto CUSTA a roda nativa do celular.
<Selecao buscavel limpavel opcoes={cidades} valor={cidade}
         onChange={setCidade} placeholder="Busque a cidade" />`}
        >
          <Exemplo opcoes={cidades} buscavel limpavel rotulo="Cidade" placeholder="Busque a cidade" />
        </Demo>
        <P>
          Com <code>buscavel</code> o componente vira um combobox completo do padrão APG: setas,
          Enter, Esc, Home/End, <code>aria-activedescendant</code>, foco preso no campo de busca.
          A busca <strong>ignora acento</strong> — quem digita "sao" acha "São Paulo", porque
          ninguém acentua enquanto filtra e uma busca que exige acento parece quebrada.
        </P>
        <FacaNaoFaca
          faca={{
            titulo: 'Ligar com 30+ opções',
            texto: 'Numa lista de 200 cidades, rolar a roda nativa é pior que digitar três letras. Aí o combobox ganha.',
          }}
          naoFaca={{
            titulo: 'Ligar "porque fica mais bonito"',
            texto: 'Com 5 opções você trocou a roda nativa do celular por uma lista custom para não ganhar nada. No toque, é uma perda direta.',
          }}
        />

        <H3>Três limitações que vêm junto</H3>
        <P>
          <strong>1. O <code>ref</code> muda de elemento.</strong> No nativo ele aponta para o
          <code> &lt;select&gt;</code>; com <code>buscavel</code>, para o <code>&lt;input&gt;</code>
          do combobox. São componentes diferentes por baixo — daí o tipo
          <code> SelecaoRef = HTMLSelectElement | HTMLInputElement</code>. O que interessa na
          prática (<code>.focus()</code>, para mandar o foco ao campo que falhou na validação)
          funciona nos dois.
        </P>
        <P>
          <strong>2. Só o modo nativo participa de submit de formulário.</strong> O
          <code> name</code> num combobox buscável não manda valor nenhum: o
          <code> &lt;input&gt;</code> ali guarda o <em>rótulo</em> que está sendo mostrado, não o
          valor. Em formulário nativo, use o modo nativo — ou mande o valor por estado.
        </P>
        <P>
          <strong>3. A lista aberta é nossa.</strong> É a contrapartida: você ganha o controle
          visual que o nativo não dá, e perde a roda. Ganhou o que queria, pagou o que custa.
        </P>
      </Secao>

      <Secao titulo="Placeholder e limpável">
        <Demo
          codigo={`<Selecao placeholder="Escolha a categoria" ... />          // não escolhível
<Selecao placeholder="Escolha a categoria" limpavel ... />  // vira o caminho de volta`}
        >
          <Exemplo inicial="bling" limpavel />
        </Demo>
        <P>
          O <code>placeholder</code> vira uma <code>&lt;option value=""&gt;</code>
          <strong> desabilitada</strong>: sem isso a pessoa "escolhe" o texto de instrução e manda
          <code> ''</code> para o formulário como se fosse um valor.
        </P>
        <P>
          Com <code>limpavel</code> ele <strong>deixa de ser desabilitado de propósito</strong> —
          passa a ser o caminho de volta para o vazio <em>dentro da roda nativa</em>. No celular é
          assim que se limpa; melhor do que caçar um X de 12px com o dedo. O X continua existindo
          para quem está no mouse, e só aparece quando há o que limpar.
        </P>
        <Aviso>
          Escreva a escolha no placeholder — <strong>"Escolha a categoria"</strong> —, não
          "Selecione…". O placeholder é a única pista do que a lista contém antes de ela abrir.
        </Aviso>
      </Secao>

      <Secao titulo="Grupos e opções bloqueadas">
        <Demo
          codigo={`const opcoes = [
  { valor: 'bling',  rotulo: 'Bling',  grupo: 'ERP' },
  { valor: 'shopify', rotulo: 'Shopify', grupo: 'Loja' },
  { valor: 'tiny',   rotulo: 'Tiny', desabilitada: true },
]`}
        >
          <Exemplo opcoes={agrupadas} />
        </Demo>
        <P>
          <code>grupo</code> vira <code>&lt;optgroup&gt;</code> no nativo e
          <code> role="group"</code> no buscável — o nativo já sabe agrupar, não precisamos
          ensinar.
        </P>
        <P>
          <strong><code>desabilitada</code> não é o mesmo que sumir da lista.</strong> Some quando
          a opção não faz sentido; desabilite quando ela faz sentido mas está bloqueada — assim a
          pessoa entende que a opção <em>existe</em> e pode procurar como liberá-la. No modo
          buscável ela usa <code>aria-disabled</code>, não <code>hidden</code>: continua anunciada,
          só não é escolhível. E as setas a pulam.
        </P>
      </Secao>

      <Secao titulo="Erro é texto, não booleano">
        <Demo
          codigo={`<Selecao erro="Escolha uma integração" ... />`}
        >
          <Exemplo erro="Escolha uma integração" />
        </Demo>
        <P>
          Um <code>erro</code> booleano só poderia pintar a borda de vermelho — e
          <strong> pintar a borda sem dizer o que está errado não conserta nada</strong>. Pior:
          quem não distingue vermelho não vê nem o aviso. Sendo texto, a mensagem é obrigatória
          por construção; ela liga <code>aria-invalid</code> e se amarra ao campo por
          <code> aria-describedby</code>, então o leitor de tela chega no motivo em vez de parar
          em "inválido".
        </P>
        <P>
          É por isso que a <code>Selecao</code> traz o erro dentro de si, ao contrário do
          <code> Campo</code>: ela já resolve o vínculo sozinha, sem precisar do
          <code> CampoForm</code>.
        </P>
      </Secao>

      <Secao titulo="Tamanhos">
        <Demo
          codigo={`<Selecao size="sm" ... />
<Selecao size="md" ... />   // padrão
<Selecao size="lg" ... />`}
        >
          <Exemplo size="sm" />
          <Exemplo />
          <Exemplo size="lg" />
        </Demo>
        <P>
          36, 44 e 52px — o mesmo <code>--amb-altura-*</code> do <code>Button</code> e do
          <code> Campo</code>. É o que mantém os três alinhados numa barra de filtros. Cravar px
          aqui quebraria essa linha.
        </P>
      </Secao>

      <Secao titulo="Props">
        <TabelaProps
          props={[
            { nome: 'opcoes', tipo: 'OpcaoSelecao[]', descricao: 'A lista. Ver a tabela abaixo.' },
            { nome: 'valor', tipo: 'string', descricao: <><strong>Controlado, sempre.</strong> <code>''</code> = nada escolhido (mostra o placeholder).</> },
            { nome: 'onChange', tipo: '(valor: string) => void', descricao: <>Recebe o <strong>valor da opção</strong>, não o evento. Quem chama quer o dado, não o DOM.</> },
            { nome: 'placeholder', tipo: 'string', descricao: 'Diga a escolha ("Escolha a categoria"), não "Selecione…".' },
            { nome: 'size', tipo: "'sm' | 'md' | 'lg'", padrao: "'md'", descricao: 'Altura: 36, 44 ou 52px.' },
            { nome: 'erro', tipo: 'string', descricao: <><strong>Texto, não booleano.</strong> Liga <code>aria-invalid</code> e amarra a mensagem ao campo.</> },
            { nome: 'buscavel', tipo: 'boolean', padrao: 'false', descricao: <>Vira combobox com filtro. <strong>Só com lista longa</strong> — custa a roda nativa do celular.</> },
            { nome: 'limpavel', tipo: 'boolean', padrao: 'false', descricao: 'Mostra o X e libera o placeholder como volta ao vazio. Só quando vazio é válido.' },
            { nome: 'disabled', tipo: 'boolean', descricao: 'Bloqueia o controle.' },
            { nome: 'name', tipo: 'string', descricao: <>Nome no formulário. <strong>Só o modo nativo participa de um submit.</strong></> },
            { nome: 'required', tipo: 'boolean', descricao: 'Validação nativa do navegador.' },
            { nome: 'id', tipo: 'string', descricao: <>Para amarrar um <code>&lt;label htmlFor&gt;</code>.</> },
          ]}
        />
        <H3>OpcaoSelecao</H3>
        <TabelaProps
          props={[
            { nome: 'valor', tipo: 'string', descricao: <>O que vai para o <code>onChange</code> e para o banco.</> },
            { nome: 'rotulo', tipo: 'string', descricao: 'O que a pessoa lê.' },
            { nome: 'desabilitada', tipo: 'boolean', descricao: 'Existe, mas está bloqueada agora. Diferente de sumir da lista.' },
            { nome: 'grupo', tipo: 'string', descricao: <>Agrupa. Vira <code>&lt;optgroup&gt;</code> no nativo, <code>role="group"</code> no buscável.</> },
          ]}
        />
        <Aviso>
          <code>SelecaoRef</code> é <code>HTMLSelectElement | HTMLInputElement</code> — o
          componente muda de natureza junto com <code>buscavel</code>. Se você só chama
          <code> .focus()</code>, os dois servem.
        </Aviso>
      </Secao>
    </>
  )
}
