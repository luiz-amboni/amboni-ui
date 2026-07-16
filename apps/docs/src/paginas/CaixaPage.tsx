import { Caixa, Radio, GrupoRadio, Interruptor } from '@amboni/ui'
import { Secao, P, Demo, Titulo, H3, Aviso, TabelaProps, FacaNaoFaca, Bloco } from '../lib/blocos'

export default function CaixaPage() {
  return (
    <>
      <Titulo
        eyebrow="Componentes"
        lead="Marcar, escolher e ligar. Três componentes com a mesma técnica por baixo — e uma pergunta que decide qual usar."
      >
        Caixa, Radio e Interruptor
      </Titulo>

      <Secao>
        <Bloco lang="jsx">{`import { Caixa, Radio, GrupoRadio, Interruptor } from '@amboni/ui'`}</Bloco>
      </Secao>

      <Secao titulo="Qual dos três?">
        <TabelaProps
          props={[
            { nome: 'Caixa', tipo: 'marque quantas quiser', padrao: 'espera o Salvar', descricao: 'Campo de formulário. A escolha só vale depois do "Salvar" e dá para desistir antes.' },
            { nome: 'Radio', tipo: 'escolha UMA', padrao: 'espera o Salvar', descricao: <>Opções visíveis e excludentes. Sempre dentro de um <code>GrupoRadio</code>.</> },
            { nome: 'Interruptor', tipo: 'liga/desliga', padrao: 'vale AGORA', descricao: 'Aplica no clique. Não existe "Salvar" depois dele.' },
          ]}
        />
        <P>
          A diferença entre <code>Caixa</code> e <code>Interruptor</code> é de
          <strong> comportamento, não de aparência</strong> — e trocá-los é o erro de uso mais
          comum do design system. Tem seção própria mais abaixo.
        </P>
      </Secao>

      <Secao titulo="A técnica que sustenta os três">
        <P>
          Nos três componentes o <code>&lt;input&gt;</code> nativo <strong>continua no
          DOM</strong>: focável, recebendo o clique, mandando valor no <code>&lt;form&gt;</code>.
          Ele só fica invisível, sobreposto ao desenho. O quadrado, a bolinha e o trilho que você
          vê são <em>irmãos</em> do input, pintados por <code>:checked +</code> no CSS.
        </P>
        <P>
          A alternativa preguiçosa — <code>display: none</code> no input e uma
          <code> &lt;div&gt;</code> desenhada no lugar — é o que quase toda biblioteca "bonita"
          faz, e cobra caro: sem input real não há teclado, não há leitor de tela, não há
          <code> :focus-visible</code>, o valor não vai no formulário e o autofill do navegador
          não enxerga nada. Aqui tudo isso vem de graça, porque o controle é de verdade — só o
          desenho é nosso.
        </P>

        <H3>Por que <code>appearance: none</code> e não <code>opacity: 0</code></H3>
        <Bloco lang="css">{`.amb-caixa__input {
  appearance: none;      /* some, mas o outline continua sendo pintado */
  -webkit-appearance: none;
  z-index: 1;            /* por cima do desenho: é ele quem recebe o clique */
}`}</Bloco>
        <P>
          <code>opacity: 0</code> apaga o elemento inteiro — <strong>inclusive o anel de
          foco</strong>. O anel do <code>.amb-focus-ring</code> sumiria junto e teríamos que
          redesenhá-lo no irmão: <em>duas fontes de verdade para o foco</em>, que divergem no
          primeiro ajuste. Com <code>appearance: none</code> o input some mas o outline continua
          sendo pintado, e cai exato em volta do desenho porque os dois ocupam a mesma célula do
          grid.
        </P>
        <Aviso>
          O rótulo é ligado por <code>for</code>/<code>id</code>, então <strong>clicar no texto
          marca</strong>. Um quadrado de 18px é um alvo minúsculo para o dedo; o rótulo dobra ou
          triplica a área útil sem uma linha de JavaScript.
        </Aviso>
      </Secao>

      <Secao titulo="Caixa">
        <Demo
          codigo={`<Caixa label="Aceito os termos" />
<Caixa label="Receber avisos" descricao="no máximo um por semana, dá para sair quando quiser" />
<Caixa label="Enviar no D+15" defaultChecked />
<Caixa label="Aceito" erro="é obrigatório aceitar para continuar" />`}
        >
          <Caixa label="Aceito os termos" />
          <Caixa label="Receber avisos" descricao="no máximo um por semana, dá para sair quando quiser" />
          <Caixa label="Enviar no D+15" defaultChecked />
          <Caixa label="Aceito" erro="é obrigatório aceitar para continuar" />
        </Demo>
        <P>
          A <code>descricao</code> é <strong>a consequência da escolha, não a repetição
          dela</strong>. Ruim: "Receber e-mails". Bom: "no máximo um por semana, dá para sair
          quando quiser". Ela é lida junto com o rótulo, não só vista.
        </P>
        <P>
          O <code>erro</code> é <strong>texto, não booleano</strong>: pintar de vermelho sem
          dizer o que houve obriga a pessoa a adivinhar — e quem não distingue vermelho não
          recebe aviso nenhum. Sendo texto, ele é lido via <code>aria-describedby</code>, e a
          borda vira reforço.
        </P>

        <H3>Indeterminado — a armadilha</H3>
        <Demo
          codigo={`<Caixa
  label="Todos os clientes"
  checked={todosMarcados}
  indeterminado={algunsMarcados && !todosMarcados}
  onChange={alternarTodos}
/>`}
        >
          <Caixa label="Todos os clientes" indeterminado descricao="3 de 12 marcados" />
        </Demo>
        <P>
          <strong><code>indeterminate</code> não existe como atributo HTML.</strong> Escrever
          <code> &lt;input indeterminate&gt;</code> no JSX não faz absolutamente nada — falha
          calado. Só a <em>propriedade do DOM</em> liga o estado misto (e o <code>:indeterminate</code>
          do CSS, que é quem desenha o traço). É por isso que o componente precisa de um
          <code> ref</code> e de um efeito: não há como fazer isso declarativamente.
        </P>
        <Bloco lang="js">{`useEffect(() => {
  if (interno.current) interno.current.indeterminate = indeterminado
}, [indeterminado])`}</Bloco>
        <P>
          <code>aria-checked="mixed"</code> vai junto porque alguns leitores de tela leem o
          atributo ARIA e ignoram a propriedade. Quando <em>não</em> é misto, o atributo fica
          <code> undefined</code> — aí o estado nativo manda. Reescrever <code>checked</code> em
          ARIA é como as caixas "acessíveis" mentem sobre o próprio estado: o ARIA congela e o
          nativo segue mudando.
        </P>
        <Aviso>
          <strong>Não é um terceiro valor de <code>checked</code>.</strong> Visualmente e para o
          leitor de tela é "misto", mas o <code>checked</code> por baixo continua sendo o que vai
          no <code>&lt;form&gt;</code>. No CSS o <code>:indeterminate</code> ganha de
          <code> :checked</code> — igual ao nativo: um "selecionar todos" com filhos parciais não
          pode mostrar check de tudo marcado.
        </Aviso>
      </Secao>

      <Secao titulo="Radio e GrupoRadio">
        <Demo
          codigo={`<GrupoRadio label="Canal" name="canal" value={canal} onChange={setCanal}>
  <Radio value="wa" label="WhatsApp" descricao="template aprovado pelo Meta" />
  <Radio value="sms" label="SMS" />
  <Radio value="tel" label="Telefone" />
</GrupoRadio>`}
        >
          <GrupoRadio label="Canal" name="canal-demo">
            <Radio value="wa" label="WhatsApp" descricao="template aprovado pelo Meta" defaultChecked />
            <Radio value="sms" label="SMS" />
            <Radio value="tel" label="Telefone" />
          </GrupoRadio>
        </Demo>
        <P>
          <strong>O <code>label</code> do grupo é a PERGUNTA</strong> ("Canal"), não a resposta. O
          agrupamento não é enfeite: sem ele o leitor de tela anuncia 5 rádios soltos, sem dizer
          de que pergunta são — quem chega pelo teclado na terceira opção não faz ideia do que
          está escolhendo. Com ele: <em>"Canal, grupo de opções, WhatsApp, 1 de 3"</em>.
        </P>
        <P>
          A bolinha é <strong>vazada</strong>, a caixa é <strong>preenchida</strong>. Essa
          diferença de forma é que diz "escolha UMA" contra "marque quantas quiser" — quem usa o
          painel todo dia lê isso antes de ler o rótulo.
        </P>

        <H3>Zero <code>onKeyDown</code> — de propósito</H3>
        <P>
          Não há uma linha de tratamento de teclado no <code>GrupoRadio</code>. As setas navegando
          entre as opções, o "um só marcado", o "1 de 3" e o <em>roving tabindex</em> (o grupo
          inteiro é <strong>uma</strong> parada de Tab) saem todos de graça do
          <code> name</code> compartilhado — o navegador faz isso desde sempre.
        </P>
        <FacaNaoFaca
          faca={{
            titulo: 'Delegar ao name compartilhado',
            texto: 'O navegador já implementou setas, exclusividade, contagem e roving tabindex — melhor e em mais casos do que qualquer onKeyDown nosso.',
          }}
          naoFaca={{
            titulo: 'Reimplementar as setas à mão',
            texto: 'É onde as bibliotecas erram: reescrevem com onKeyDown o que já funcionava, e quebram o que não testaram — RTL, Home/End, o "1 de 3".',
          }}
        />

        <H3>Contexto, não <code>cloneElement</code></H3>
        <P>
          O grupo passa <code>name</code>, <code>value</code> e <code>onChange</code> aos filhos
          por contexto. Clonar <code>children</code> seria mais curto e
          <strong> quebraria na hora que alguém envolvesse um <code>Radio</code> em qualquer
          coisa</strong> — um tooltip, um <code>.map</code> dentro de um sub-componente, uma div
          de layout. É exatamente o que as pessoas fazem. O contexto atravessa qualquer
          profundidade.
        </P>
        <Aviso>
          <strong>Grupo sem <code>value</code> é grupo não-controlado</strong> — o DOM guarda a
          escolha, e continua funcionando. É por isso que o componente não crava
          <code> checked</code> nesse caso: o React passaria a chamar de controlado e travaria o
          rádio para sempre, porque não há estado para atualizar. É o bug clássico de wrapper de
          formulário.
        </Aviso>
        <P>
          <code>orientacao="horizontal"</code> só para 2–3 opções de rótulo curto. Acima disso a
          lista vira uma caça ao par certo entre bolinha e texto, e quebra feio no celular.
        </P>
        <Demo
          codigo={`<GrupoRadio label="Período" name="periodo" orientacao="horizontal">`}
        >
          <GrupoRadio label="Período" name="periodo-demo" orientacao="horizontal">
            <Radio value="7" label="7 dias" defaultChecked />
            <Radio value="30" label="30 dias" />
          </GrupoRadio>
        </Demo>
        <Aviso tipo="warn">
          Um <code>Radio</code> sozinho existe, mas é um <strong>beco sem saída: não dá para
          desmarcar</strong>. Escolha entre "sim/não" é <code>Caixa</code> ou
          <code> Interruptor</code>, nunca um rádio único.
        </Aviso>
      </Secao>

      <Secao titulo="Interruptor">
        <Demo
          codigo={`<Interruptor
  label="Enviar dicas automáticas"
  descricao="começa no próximo ciclo, às 9h"
  checked={ativo}
  onChange={e => salvarAgora(e.target.checked)}
/>

<Interruptor size="sm" label="Ativa" />   // dentro de linha de tabela`}
        >
          <Interruptor label="Enviar dicas automáticas" descricao="começa no próximo ciclo, às 9h" defaultChecked />
          <Interruptor label="Robô de resposta" />
          <Interruptor size="sm" label="Ativa" defaultChecked />
        </Demo>
        <P>
          <strong>O rótulo escreve o ESTADO LIGADO</strong> ("Enviar dicas automáticas"), nunca a
          ação ("Ligar envio"). O rótulo não muda quando o interruptor muda — se ele descrevesse a
          ação, estaria errado metade do tempo.
        </P>
        <P>
          Desligado é <strong>cinza neutro, nunca vermelho</strong>: desligado não é erro.
        </P>

        <H3>Interruptor ou Caixa? A pergunta é "quando vale?"</H3>
        <FacaNaoFaca
          faca={{
            titulo: 'Interruptor: vale AGORA',
            texto: 'Ao acionar, algo muda no sistema imediatamente — o envio começa, o robô liga. Não existe "Salvar" depois dele.',
          }}
          naoFaca={{
            titulo: 'Interruptor dentro de um formulário com "Salvar"',
            texto: 'A pessoa aciona, vê o trilho ficar azul e vai embora achando que ficou feito. Nada foi salvo. Ali o componente é a Caixa.',
          }}
        />
        <P>
          O leitor de tela trata os dois de forma diferente, e é por isso que a escolha não é
          estética: <code>role="switch"</code> é anunciado como
          <strong> "ligado/desligado"</strong>; checkbox, como
          <strong> "marcado/desmarcado"</strong>. Usar o errado <em>mente sobre o que vai
          acontecer no clique</em>.
        </P>
        <Aviso tipo="warn">
          Se a ação é lenta ou pode falhar, <strong>o produto precisa mostrar o resultado — e
          reverter o estado se der erro</strong>. A pessoa já foi embora achando que ficou feito.
          É a contrapartida de "vale agora", e ela é sua, não do componente.
        </Aviso>
        <P>
          Por baixo continua um <code>&lt;input type="checkbox"&gt;</code>: é dele que vêm o
          teclado, o foco, o <code>checked</code> e o valor no formulário — nada disso existe em
          <code> &lt;div role="switch"&gt;</code>. O <code>role</code> só troca o anúncio, e o
          navegador deriva o <code>aria-checked</code> do estado nativo sozinho.
        </P>
        <P>
          <strong>O interruptor é onde a tentação da <code>&lt;div onClick&gt;</code> é
          maior</strong> — ele "não parece" um campo de formulário. E é justamente onde dói mais:
          ele costuma ligar coisa que vale na hora, então perder o teclado significa que parte
          das pessoas simplesmente <em>não consegue desligar o sistema</em>.
        </P>
      </Secao>

      <Secao titulo="Props — Caixa">
        <TabelaProps
          props={[
            { nome: 'label', tipo: 'ReactNode', descricao: <><strong>Obrigatório.</strong> O que está sendo marcado. Clicar nele marca a caixa.</> },
            { nome: 'descricao', tipo: 'ReactNode', descricao: 'A consequência da escolha, não a repetição do rótulo. Lida junto com ele.' },
            { nome: 'indeterminado', tipo: 'boolean', padrao: 'false', descricao: <>Estado misto do "selecionar todos". Liga a propriedade do DOM + <code>aria-checked="mixed"</code>.</> },
            { nome: 'erro', tipo: 'string', descricao: <><strong>Texto, não booleano.</strong> Lido via <code>aria-describedby</code>; a borda é só reforço.</> },
            { nome: '…rest', tipo: "InputHTMLAttributes (sem 'type' e 'size')", descricao: <><code>checked</code>, <code>defaultChecked</code>, <code>onChange</code> (evento nativo), <code>disabled</code>, <code>name</code>.</> },
          ]}
        />

        <H3>Props — Radio</H3>
        <TabelaProps
          props={[
            { nome: 'label', tipo: 'ReactNode', descricao: 'A opção. Clicar no texto seleciona.' },
            { nome: 'value', tipo: 'string', descricao: <><strong>Obrigatório.</strong> O valor que vai no formulário quando esta opção estiver escolhida.</> },
            { nome: 'descricao', tipo: 'ReactNode', descricao: 'A consequência de escolher esta opção.' },
            { nome: '…rest', tipo: "InputHTMLAttributes (sem 'type', 'size' e 'value')", descricao: <>O <code>onChange</code> próprio convive com o do grupo: o do grupo atualiza a escolha, o seu é o gancho para reagir só a esta opção.</> },
          ]}
        />

        <H3>Props — GrupoRadio</H3>
        <TabelaProps
          props={[
            { nome: 'label', tipo: 'ReactNode', descricao: <>A <strong>PERGUNTA</strong> ("Enviar quando?"), não a resposta.</> },
            { nome: 'name', tipo: 'string', descricao: <><strong>Obrigatório.</strong> Compartilhado por todos os rádios. É ele que liga a navegação por setas.</> },
            { nome: 'value', tipo: 'string', descricao: 'Omita para um grupo não-controlado (o DOM guarda a escolha).' },
            { nome: 'onChange', tipo: '(value: string) => void', descricao: <>Recebe o <strong>value</strong> da opção, não o evento.</> },
            { nome: 'orientacao', tipo: "'vertical' | 'horizontal'", padrao: "'vertical'", descricao: 'Horizontal só para 2–3 opções de rótulo curto.' },
            { nome: 'erro', tipo: 'string', descricao: <>Lido pelo leitor de tela no grupo inteiro (<code>aria-describedby</code> + <code>aria-invalid</code>).</> },
          ]}
        />

        <H3>Props — Interruptor</H3>
        <TabelaProps
          props={[
            { nome: 'label', tipo: 'ReactNode', descricao: <>O <strong>estado ligado</strong> ("Enviar dicas automáticas"), nunca a ação ("Ligar envio").</> },
            { nome: 'descricao', tipo: 'ReactNode', descricao: 'O efeito de ligar. É onde cabe o aviso de que vale na hora.' },
            { nome: 'size', tipo: "'sm' | 'md'", padrao: "'md'", descricao: <><code>sm</code> para dentro de linha de tabela; <code>md</code> para formulário.</> },
            { nome: '…rest', tipo: "InputHTMLAttributes (sem 'type', 'size' e 'role')", descricao: <><code>checked</code>, <code>onChange</code> (evento nativo), <code>disabled</code>. O <code>role</code> sai das props: <code>switch</code> é o componente.</> },
          ]}
        />
        <Aviso>
          Nos três, o <code>ref</code> chega no <code>&lt;input&gt;</code> nativo — não num
          wrapper. O <code>register</code> do react-hook-form depende disso, e um ref apontando
          para a <code>&lt;div&gt;</code> compila igual e quebra o formulário inteiro. E o
          <code> type</code> fica fora das props de propósito: uma
          <code> &lt;Caixa type="text"&gt;</code> compila e destrói o componente em silêncio.
        </Aviso>
      </Secao>
    </>
  )
}
