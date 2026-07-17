import { Campo, CampoForm } from '@amboni/ui'
import { Secao, P, Demo, Titulo, H3, Aviso, TabelaProps, FacaNaoFaca, Bloco } from '../lib/blocos'
import { Playground } from '../lib/Playground'

export default function CampoPage() {
  return (
    <>
      <Titulo
        eyebrow="Componentes"
        lead="Um <input> de verdade com uma moldura em volta. A moldura é o que permite ter ícone e “R$” dentro do campo sem quebrar nada do que o navegador já fazia."
      >
        Campo
      </Titulo>

      <Secao titulo="Experimente">
        <Playground
          componente="Campo"
          controles={[
            { prop: 'size', tipo: 'select', opcoes: ['sm', 'md', 'lg'], padrao: 'md' },
            { prop: 'placeholder', tipo: 'texto', padrao: '', placeholder: 'ex.: Buscar cliente' },
            { prop: 'prefixo', tipo: 'texto', padrao: '', placeholder: 'ex.: R$' },
            { prop: 'sufixo', tipo: 'texto', padrao: '', placeholder: 'ex.: kg' },
            { prop: 'limpar', tipo: 'bool', padrao: false },
            { prop: 'erro', tipo: 'bool', padrao: false },
            { prop: 'disabled', tipo: 'bool', padrao: false },
          ]}
          // aria-label aqui e não como controle: solto no palco, o campo não tem rótulo, e
          // um exemplo mudo para leitor de tela é o oposto do que esta página defende. No
          // seu produto quem faz isto é o <CampoForm> — por isso ele não sai no código.
          render={p => <Campo {...p} aria-label={p.placeholder || 'Campo de exemplo'} />}
        />
        <P>
          Ligue o <code>erro</code> sozinho e repare no que acontece: a moldura fica vermelha
          e mais nada. Nenhuma palavra, nenhum motivo. É por isso que o erro de verdade mora
          no <code>CampoForm</code>, que exige a mensagem junto.
        </P>
      </Secao>

      <Secao>
        <Bloco lang="jsx">{`import { Campo } from '@amboni/ui'`}</Bloco>
        <P>
          O <code>Campo</code> sozinho é um campo mudo: ele não tem rótulo. Quem amarra
          rótulo, ajuda e erro é o <code>CampoForm</code> — é lá que quase todo
          <code> Campo</code> deveria estar. Aqui embaixo os exemplos aparecem soltos só
          para não repetir o wrapper em cada demonstração.
        </P>
      </Secao>

      <Secao titulo="Tamanhos">
        <Demo
          codigo={`<Campo size="sm" placeholder="Pequeno" />
<Campo placeholder="Médio" />        // md é o padrão
<Campo size="lg" placeholder="Grande" />`}
        >
          <Campo size="sm" aria-label="Pequeno" placeholder="Pequeno" />
          <Campo aria-label="Médio" placeholder="Médio" />
          <Campo size="lg" aria-label="Grande" placeholder="Grande" />
        </Demo>
        <P>
          36, 44 e 52px, do token <code>--amb-altura-*</code> — <strong>o mesmo token do
          Button</strong>. É por isso que campo e botão batem no milímetro numa barra de
          filtros. Quando cada componente decide a própria altura, eles divergem por 2px na
          primeira vez que alguém mexe em um só.
        </P>
        <Aviso tipo="warn">
          <strong>A prop <code>size</code> não é a do HTML.</strong> O
          <code> &lt;input&gt;</code> nativo já tem um atributo <code>size</code> — a largura
          em número de caracteres, coisa de 1995. Os dois não cabem no mesmo nome, então a
          interface usa <code>Omit&lt;…, 'size'&gt;</code> e a nossa <code>size</code> é a
          altura. Sem o Omit o TypeScript recusa a interface inteira. Mesmo caminho do
          <code> Card</code> com <code>title</code>.
        </Aviso>
      </Secao>

      <Secao titulo="Ícones e afixos">
        <Demo
          codigo={`<Campo iconeEsq={<Lupa />} placeholder="Buscar cliente" />
<Campo prefixo="R$" inputMode="decimal" placeholder="0,00" />
<Campo sufixo=".com.br" placeholder="minhaloja" />`}
        >
          <Campo aria-label="Buscar cliente" iconeEsq={<span>🔍</span>} placeholder="Buscar cliente" />
          <Campo aria-label="Valor" prefixo="R$" inputMode="decimal" placeholder="0,00" />
          <Campo aria-label="Domínio" sufixo=".com.br" placeholder="minhaloja" />
        </Demo>
        <P>
          A ordem dos adornos é fixa: <strong>prefixo · ícone · TEXTO · limpar · ícone ·
          sufixo</strong>. O que é moldura fica na borda; o que age sobre o texto fica colado
          nele.
        </P>
        <P>
          O afixo tem fundo próprio e uma linha divisória. Sem a divisória, o "R$" parece
          texto já digitado dentro do campo — e as pessoas apagam.
        </P>
        <Aviso>
          <strong>Prefixo, sufixo e ícone são <code>aria-hidden</code>.</strong> Soltos no meio
          da moldura, o leitor de tela leria "R$" antes do rótulo, fora de ordem e sem contexto.
          A unidade é informação do <em>rótulo</em>:
          <code> &lt;CampoForm label="Valor" ajuda="em reais"&gt;</code> — aí ela é anunciada
          junto com o campo, no lugar certo.
        </Aviso>
      </Secao>

      <Secao titulo="Limpar">
        <Demo
          codigo={`<Campo limpar defaultValue="iPhone 15" iconeEsq={<Lupa />} />`}
        >
          <Campo aria-label="Busca" limpar defaultValue="iPhone 15" iconeEsq={<span>🔍</span>} />
        </Demo>
        <P>
          O X só aparece quando há conteúdo — limpar o vazio não faz sentido — e some em campo
          desabilitado ou só-leitura.
        </P>

        <H3>A armadilha que este botão evita</H3>
        <P>
          Esvaziar um campo parece uma linha de código: <code>input.value = ''</code>. Ela é
          <strong> a origem de um bug clássico</strong>. O React guarda o último valor num
          rastreador interno; escrever direto na propriedade atualiza esse rastreador junto, o
          React conclui que "nada mudou" e <strong>o <code>onChange</code> nunca dispara</strong>.
          A tela mostra o campo vazio e o estado do formulário continua com o texto antigo.
        </P>
        <Bloco lang="js">{`// O que o Campo faz por baixo — o setter nativo passa por fora do rastreador
const setterNativo = Object.getOwnPropertyDescriptor(
  window.HTMLInputElement.prototype, 'value',
)?.set
setterNativo?.call(input, '')
input.dispatchEvent(new Event('input', { bubbles: true }))`}</Bloco>
        <P>
          Assim o React vê a diferença e dispara o <code>onChange</code> de verdade — com
          <code> value</code> vazio, como se a pessoa tivesse apagado à mão. Quem usa
          react-hook-form ou um <code>useState</code> não fica com estado sujo. Há um teste
          travando exatamente isto.
        </P>
        <P>
          Duas decisões menores no mesmo botão: <strong>o foco volta para o campo</strong> (o
          botão clicado some do DOM; sem devolver o foco ele cai no <code>&lt;body&gt;</code> e
          quem navega por teclado é jogado para o topo da página) e <strong>ele entra na ordem
          de tabulação</strong>. Muita biblioteca põe <code>tabIndex={-1}</code> aqui "para não
          poluir o Tab" — e aí a ação passa a existir só para quem tem mouse.
        </P>
      </Secao>

      <Secao titulo="Erro: declarado uma vez só">
        <Demo
          codigo={`// O jeito certo: o erro é declarado no CampoForm, e só lá.
<CampoForm label="E-mail" erro="E-mail inválido">
  <Campo type="email" defaultValue="joao@" />
</CampoForm>`}
        >
          <CampoForm label="E-mail" erro="E-mail inválido">
            <Campo type="email" defaultValue="joao@" />
          </CampoForm>
        </Demo>
        <P>
          O <code>CampoForm</code> manda <code>aria-invalid</code> para o controle, e o
          <code> Campo</code> <strong>lê esse atributo e se pinta sozinho</strong>. Você não
          repete o erro nos dois lugares — porque duas fontes de verdade divergem cedo ou tarde,
          e o resultado é um campo com ARIA de inválido e visual de válido: quem ouve sabe do
          erro, quem vê não.
        </P>
        <FacaNaoFaca
          faca={{
            titulo: 'O erro mora no CampoForm',
            texto: '<CampoForm erro="E-mail inválido"><Campo /></CampoForm> — a moldura vermelha, o aria-invalid e a mensagem lida saem todos do mesmo lugar.',
          }}
          naoFaca={{
            titulo: 'Repetir o erro no Campo',
            texto: '<CampoForm erro="..."><Campo erro /></CampoForm> é redundante hoje e mentiroso amanhã, quando alguém atualizar só um dos dois.',
          }}
        />
        <P>
          A prop <code>erro</code> booleana do <code>Campo</code> existe para o caso solto:
          validação sem <code>CampoForm</code>. Aí ela liga o <code>aria-invalid</code> junto —
          nunca só a borda.
        </P>
      </Secao>

      <Secao titulo="O anel de foco é a exceção documentada da biblioteca">
        <P>
          Todo componente daqui usa a classe <code>.amb-focus-ring</code>, que casa com
          <code> :focus-visible</code>. O <code>Campo</code> não: quem recebe o foco é o
          <code> &lt;input&gt;</code> lá dentro, então o anel sairia desenhado <em>por dentro</em>
          da moldura, colado no texto. A moldura é que precisa do anel.
        </P>
        <Bloco lang="css">{`/* O anel sobe para a moldura — e o input desliga o dele, senão saem dois. */
.amb-campo:focus-within {
  outline: 2px solid var(--amb-color-border-focus);
  outline-offset: 2px;
  border-color: var(--amb-color-border-focus);
}
.amb-campo__input { outline: none; }`}</Bloco>
        <P>
          <code>:focus-within</code> em vez de <code>:focus-visible</code> é seguro
          <em> justamente aqui</em>: o navegador já trata campo de texto como sempre-visível ao
          foco — clicar com o mouse num input mostra o anel, ao contrário de um botão. O
          resultado é o mesmo, e o desenho continua saindo de um lugar só.
        </P>
        <P>
          No erro o anel vem vermelho junto com a borda. Um anel azul em volta de uma borda
          vermelha faz a pessoa achar que já corrigiu.
        </P>
      </Secao>

      <Secao titulo="Desabilitado não é lavado">
        <Demo
          codigo={`<Campo disabled defaultValue="não editável" />
<Campo readOnly defaultValue="só leitura" />`}
        >
          <Campo aria-label="Desabilitado" disabled defaultValue="não editável" />
          <Campo aria-label="Só leitura" readOnly defaultValue="só leitura" />
        </Demo>
        <P>
          O campo desabilitado muda de <strong>fundo</strong>, não de opacidade. Meia opacidade
          joga o contraste do texto para baixo de 2:1 e o campo vira um borrão — inclusive o
          valor que ele ainda precisa mostrar. Fundo afundado + texto secundário dizem
          "bloqueado" e continuam legíveis.
        </P>
      </Secao>

      <Secao titulo="Props">
        <TabelaProps
          props={[
            { nome: 'size', tipo: "'sm' | 'md' | 'lg'", padrao: "'md'", descricao: <>Altura: 36, 44 ou 52px. <strong>Não</strong> é o <code>size</code> do HTML.</> },
            { nome: 'iconeEsq', tipo: 'ReactNode', descricao: 'Ícone antes do texto (lupa, calendário). Decorativo — quem narra é o rótulo.' },
            { nome: 'iconeDir', tipo: 'ReactNode', descricao: 'Ícone depois do texto.' },
            { nome: 'erro', tipo: 'boolean', descricao: <>Pinta a moldura e liga <code>aria-invalid</code>. <strong>Dispensável dentro de um <code>CampoForm erro</code></strong> — ele já manda o atributo.</> },
            { nome: 'prefixo', tipo: 'ReactNode', descricao: <>Texto colado na esquerda, dentro da moldura ("R$"). <code>aria-hidden</code>.</> },
            { nome: 'sufixo', tipo: 'ReactNode', descricao: <>Texto colado na direita ("kg", "%"). <code>aria-hidden</code>.</> },
            { nome: 'limpar', tipo: 'boolean', padrao: 'false', descricao: 'Mostra o X quando há conteúdo. Dispara onChange de verdade.' },
            { nome: 'className / style', tipo: 'string / CSSProperties', descricao: <>Vão na <strong>moldura</strong>, não no input — a moldura é a caixa que se vê.</> },
            { nome: '…rest', tipo: "InputHTMLAttributes (sem 'size')", descricao: <>É um <code>&lt;input&gt;</code> de verdade: <code>type</code>, <code>value</code>, <code>onChange</code>, <code>placeholder</code>, <code>inputMode</code>, <code>maxLength</code>, <code>disabled</code>, <code>readOnly</code>.</> },
          ]}
        />
        <Aviso>
          <strong>O <code>ref</code> chega no <code>&lt;input&gt;</code>, não na moldura.</strong> O
          <code> register</code> do react-hook-form chama <code>ref.current.focus()</code> e lê
          <code> ref.current.value</code>; se o ref parasse na <code>&lt;div&gt;</code>, ele
          quebraria em silêncio. Tem teste.
        </Aviso>
      </Secao>
    </>
  )
}
