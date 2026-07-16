import { useRef } from 'react'
import { ProvedorAvisos, useAviso, Button } from '@amboni/ui'
// ⚠️ Dois `Aviso` no projeto: o da biblioteca é o TOAST (documentado aqui); o dos blocos
// é a caixa de destaque do site. Este entra como `Destaque` para não confundir ninguém.
import { Secao, P, Demo, Titulo, H3, Aviso as Destaque, TabelaProps, FacaNaoFaca, Bloco } from '../lib/blocos'

function DemoTons() {
  const aviso = useAviso()
  return (
    <>
      <Button variant="primary" onClick={() => aviso.sucesso('Cliente salvo')}>sucesso</Button>
      <Button onClick={() => aviso.info('Sincronização agendada para as 3h')}>info</Button>
      <Button onClick={() => aviso.aviso('Telefone sem o 9º dígito', { descricao: 'A mensagem sai, mas pode não chegar.' })}>
        aviso
      </Button>
      <Button variant="danger" onClick={() => aviso.erro('Não foi possível enviar', { descricao: 'O WhatsApp recusou: número sem conta.' })}>
        erro
      </Button>
    </>
  )
}

function DemoAcao() {
  const aviso = useAviso()
  return (
    <Button onClick={() => aviso.sucesso('Mensagem agendada', { acao: { rotulo: 'Desfazer', onClick: () => aviso.info('Agendamento cancelado') } })}>
      Agendar mensagem
    </Button>
  )
}

function DemoFila() {
  const aviso = useAviso()
  return (
    <Button
      onClick={() => {
        for (let i = 1; i <= 5; i++) aviso.info(`Pedido #${1000 + i} sincronizado`)
      }}
    >
      Disparar 5 de uma vez
    </Button>
  )
}

function DemoFecharNaMao() {
  const aviso = useAviso()
  // useRef, e não um objeto solto: mostrar um aviso repinta este componente, e um
  // `{ current }` criado no corpo do render nasceria vazio de novo — o id se perderia.
  const id = useRef<string | null>(null)
  return (
    <>
      <Button
        onClick={() => {
          if (id.current) return
          id.current = aviso.info('Enviando...', { fixo: true })
        }}
      >
        Começar envio
      </Button>
      <Button
        variant="ghost"
        onClick={() => {
          if (!id.current) return
          aviso.fechar(id.current)
          id.current = null
          aviso.sucesso('Envio concluído')
        }}
      >
        Terminar
      </Button>
    </>
  )
}

export default function AvisoPage() {
  return (
    // Um provedor para a página inteira: cada <ProvedorAvisos> cria a sua região no canto
    // da tela, e dois deles se sobreporiam ali.
    <ProvedorAvisos>
      <Titulo
        eyebrow="Componentes"
        lead="O toast. O componente onde mais decisões estão escondidas — e onde a maioria das bibliotecas erra a mais importante delas em silêncio."
      >
        Aviso
      </Titulo>

      <Secao>
        <Bloco lang="jsx">{`import { ProvedorAvisos, useAviso } from '@amboni/ui'`}</Bloco>
        <P>
          Três peças: <code>ProvedorAvisos</code> (um por app, no topo da árvore),
          <code> useAviso()</code> (dispara de qualquer lugar) e o aviso em si, que você nunca
          renderiza à mão.
        </P>
        <Bloco lang="jsx">{`// No topo do app, uma vez só
<ProvedorAvisos>
  <App />
</ProvedorAvisos>

// Em qualquer lugar abaixo
const aviso = useAviso()
aviso.sucesso('Cliente salvo')`}</Bloco>
      </Secao>

      <Secao titulo="Os quatro tons">
        <Demo
          codigo={`const aviso = useAviso()

aviso.sucesso('Cliente salvo')
aviso.info('Sincronização agendada para as 3h')
aviso.aviso('Telefone sem o 9º dígito', { descricao: 'A mensagem sai, mas pode não chegar.' })
aviso.erro('Não foi possível enviar', { descricao: 'O WhatsApp recusou: número sem conta.' })`}
        >
          <DemoTons />
        </Demo>
        <P>
          Os atalhos são açúcar sobre <code>mostrar({'{ titulo, tom }'})</code>. Todos devolvem o
          <code> id</code> do aviso — guarde só se for precisar fechar na mão.
        </P>
        <P>
          Cada tom tem uma <strong>forma</strong> de ícone diferente, não só uma cor: círculo com
          "i", círculo com check, triângulo com "!" e octógono com "✕". Cerca de 1 em cada 12
          homens não distingue vermelho de verde — para essas pessoas, um "sucesso" verde e um
          "erro" vermelho são o mesmo retângulo cinza. São as mesmas formas do
          <code> Alerta</code>.
        </P>
      </Secao>

      <Secao titulo="A região existe desde sempre, vazia">
        <P>
          Este é o ponto central do componente, e é o bug que a maioria das bibliotecas de toast
          tem: <strong>criar o container junto com o primeiro aviso não anuncia nada.</strong>
        </P>
        <P>
          O leitor de tela monta a lista de regiões vivas quando a página carrega e observa as
          que <em>já existiam</em>. Uma região <code>aria-live</code> que nasce com conteúdo
          dentro tipicamente não dispara — o conteúdo já estava lá quando ela passou a ser
          observada.
        </P>
        <Destaque tipo="warn">
          O sintoma é cruel: <strong>funciona perfeitamente no olho</strong>, passa em todo teste
          visual, e quem depende de leitor de tela simplesmente nunca é avisado de nada. Não há
          chamado aberto para isso, porque quem descobriria não está lá para reclamar.
        </Destaque>
        <P>
          Por isso a <code>&lt;div aria-live&gt;</code> é renderizada sempre, mesmo sem nenhum
          aviso na tela — e um teste garante que ela está lá, vazia, antes do primeiro.
        </P>
        <P>
          A região usa <code>aria-relevant="additions"</code>: só anuncia o que <em>entra</em>.
          Sem isso, fechar um aviso faz o leitor de tela ler a remoção — a pessoa dispensa a
          mensagem e ouve a mensagem de novo, como prêmio.
        </P>
        <P>
          E é <code>aria-live="polite"</code> na região, com o <code>role</code> no
          <strong> item</strong>: o erro sai <code>role="alert"</code> (assertive, interrompe) e
          o resto <code>role="status"</code> (polite, espera). É o nó mais próximo do que foi
          inserido que manda na urgência, então o erro sai assertivo mesmo dentro de uma região
          polite. Marcar tudo como <code>alert</code> é gritar toda frase: a pessoa desliga o
          recurso e aí nem o erro de verdade chega.
        </P>
        <P>
          A região é fixa e invisível no canto para sempre, o que criaria um problema físico: ela
          engoliria os cliques daquele canto, em toda tela, o tempo todo, sem nada aparecer para
          explicar o porquê. <code>pointer-events: none</code> nela; os avisos devolvem
          <code> auto</code> para si mesmos.
        </P>
      </Secao>

      <Secao titulo="Quem some sozinho e quem fica">
        <P>A ordem das regras importa, e cada linha tem um motivo:</P>
        <TabelaProps
          props={[
            { nome: '1. fixo', tipo: 'fica', descricao: 'Quem pediu, mandou.' },
            { nome: '2. duracao', tipo: 'o número que você passou', descricao: <>Saída de emergência: <strong>vence todas as regras abaixo</strong>, inclusive as de erro e ação.</> },
            { nome: '3. tom: erro', tipo: 'fica', descricao: 'Erro sai quando a pessoa fecha, não quando o relógio bate.' },
            { nome: '4. tem acao', tipo: 'fica', descricao: 'Um aviso com ação é uma pergunta — pergunta espera resposta.' },
            { nome: '5. o resto', tipo: 'pelo tamanho do texto', descricao: 'Ver a seção seguinte.' },
          ]}
        />
        <H3>Erro não some sozinho</H3>
        <P>
          Um erro que evapora deixa a pessoa com o problema e <strong>sem o texto do
          problema</strong> — e é exatamente esse texto que ela precisaria copiar para pedir
          ajuda. "Deu um erro, sumiu antes de eu ler" é um chamado impossível de atender.
        </P>
        <H3>Com ação também não</H3>
        <P>
          Sumir sozinho leva o botão junto: a pessoa vê "Desfazer", move o mouse, e o botão some
          no caminho. Ou some antes de ela decidir.
        </P>
        <Demo
          codigo={`aviso.sucesso('Mensagem agendada', {
  acao: { rotulo: 'Desfazer', onClick: cancelar },
})`}
        >
          <DemoAcao />
        </Demo>
        <P>
          Clicar na ação <strong>executa e fecha</strong> — a ação já foi tomada; deixar o botão
          na tela convida a clicar de novo, e "desfazer o desfazer" ninguém espera. Uma ação por
          aviso: duas saídas viram nenhuma.
        </P>
      </Secao>

      <Secao titulo="Duração pelo tamanho do texto">
        <P>
          <strong>Os 3 segundos da praxe são falha de WCAG 2.2.1, não gosto.</strong> É o padrão
          da indústria e é hostil: some antes de quem lê devagar, de quem usa lupa e de quem só
          desviou o olho para o teclado.
        </P>
        <P>Aqui a conta sai do texto:</P>
        <TabelaProps
          props={[
            { nome: '400ms', tipo: 'por palavra', descricao: '≈150 palavras/min — velocidade de leitura sem pressa.' },
            { nome: '5s', tipo: 'piso', descricao: 'O tempo de perceber que algo apareceu e virar o olho.' },
            { nome: '12s', tipo: 'teto', descricao: 'Passou disso, o texto é grande demais para um aviso — era para ser um Alerta na própria tela.' },
          ]}
        />
        <P>
          A <code>descricao</code> só entra na conta quando é texto puro. <code>ReactNode</code>
          pode ser uma árvore inteira e não dá para medir sem renderizar — medir o que dá é
          melhor que ignorar.
        </P>
        <Destaque>
          <code>duracao</code> existe, mas <strong>passe só quando souber por quê</strong>. Ela
          vence tudo, inclusive as regras de erro e ação não sumirem. É a saída de quem tem um
          caso que a biblioteca não previu — e assume a decisão. A biblioteca opina, não algema.
        </Destaque>
      </Secao>

      <Secao titulo="Hover e foco pausam a pilha inteira">
        <P>
          Passar o mouse pausa o cronômetro. Sair retoma <strong>de onde parou</strong>, não do
          começo: sem guardar o saldo, todo hover reiniciaria o relógio e um aviso de 5s
          sobreviveria a tarde inteira de quem costuma passar o mouse pela tela sem querer.
        </P>
        <P>
          E pausa <strong>a pilha inteira</strong>, não só o aviso sob o cursor. Se os outros
          continuassem correndo, o de baixo sumiria enquanto a pessoa lê o de cima — e a pilha se
          reposiciona justamente sob o olho dela.
        </P>
        <P>
          O <strong>foco</strong> pausa junto com o mouse. Quem navega por teclado chega no X ou
          no botão de ação pelo Tab: se o aviso continuasse correndo, ele evaporaria com o foco
          em cima, e o foco iria parar no <code>&lt;body&gt;</code>, do nada. Ler uma mensagem não
          pode ser uma corrida contra o relógio (WCAG 2.2.1).
        </P>
      </Secao>

      <Secao titulo="O excedente espera na fila">
        <Demo codigo={`// limite padrão: 3 na tela. Os outros esperam a vez.
for (const p of pedidos) aviso.info(\`Pedido #\${p.id} sincronizado\`)`}>
          <DemoFila />
        </Demo>
        <P>
          Só <code>limite</code> (3) aparecem juntos — 20 avisos empilhados viram uma parede que
          tampa a tela e ninguém lê. O excedente <strong>espera a vez</strong>, não é descartado.
        </P>
        <FacaNaoFaca
          faca={{
            titulo: 'Fila: o quarto aviso espera um lugar vagar',
            texto: 'Nada se perde, nada é arrancado da tela. O cronômetro de quem está na fila só começa quando ele aparece — senão venceria a validade esperando a vez.',
          }}
          naoFaca={{
            titulo: 'Descartar o novo, ou empurrar o mais antigo para fora',
            texto: 'Descartar perde informação. Empurrar o antigo arranca da tela justamente o que a pessoa pode estar lendo agora — e se for erro, arranca o erro.',
          }}
        />
        <P>
          O preço, assumido: <strong>três erros fixos na tela seguram a fila</strong> até alguém
          fechá-los. É o caso em que empilhar mais cinco avisos por cima seria pior — o erro é
          que precisa de atenção, não o "copiado!".
        </P>
      </Secao>

      <Secao titulo="Fechar na mão">
        <Demo
          codigo={`const id = useRef<string | null>(null)

id.current = aviso.info('Enviando...', { fixo: true })
await enviar()
aviso.fechar(id.current)`}
        >
          <DemoFecharNaMao />
        </Demo>
        <P>
          <code>fixo</code> + <code>fechar(id)</code> é o par para o processo que tem começo e
          fim conhecidos. <code>useRef</code> e não um objeto solto: mostrar um aviso repinta o
          componente, e um <code>{'{ current }'}</code> criado no corpo do render nasceria vazio
          de novo — o id se perde e o "terminar" não fecha nada.
        </P>
        <P>
          O X de cada aviso tem <code>aria-label="Fechar aviso: {'{titulo}'}"</code>. Com três
          avisos na tela, três botões "Fechar" são indistinguíveis na lista de botões do leitor
          de tela — a pessoa não sabe qual está fechando.
        </P>
      </Secao>

      <Secao titulo="Sem provedor, ele explode">
        <Bloco>{`[@amboni/ui] useAviso() precisa de um <ProvedorAvisos> acima na árvore.`}</Bloco>
        <P>
          Falha alto e cedo, de propósito. Sem o provedor, o aviso não teria onde aparecer e o
          <code> mostrar</code> viraria um no-op silencioso — a pessoa clica em "Salvar", nada
          acontece, e o bug só aparece em produção.
        </P>
      </Secao>

      <Secao titulo="Detalhes que valem saber">
        <P>
          <strong>Não há animação de saída.</strong> Um aviso saindo continua no DOM enquanto a
          animação roda: ainda recebe Tab, ainda é lido pelo leitor de tela, e a fila fica presa
          esperando um lugar que "já vagou". O ganho estético não paga um elemento fantasma
          alcançável pelo teclado.
        </P>
        <P>
          <strong>Fundo sólido, diferente do <code>Alerta</code>.</strong> O Alerta vive dentro
          do layout, com um fundo conhecido atrás, e pode ser tingido. O aviso flutua sobre
          qualquer coisa — uma tabela, um gráfico, outro aviso. Fundo translúcido aqui vira texto
          sobre listra.
        </P>
        <P>
          <strong>A API de <code>useAviso()</code> é estável para sempre.</strong> Se ela mudasse
          a cada aviso na tela, todo componente que a chama repintaria junto.
        </P>
      </Secao>

      <Secao titulo="Props — ProvedorAvisos">
        <TabelaProps
          props={[
            { nome: 'children', tipo: 'ReactNode', descricao: 'A árvore inteira do app.' },
            { nome: 'limite', tipo: 'number', padrao: '3', descricao: 'Quantos aparecem ao mesmo tempo. O excedente espera na fila — não é descartado.' },
          ]}
        />
      </Secao>

      <Secao titulo="API — useAviso()">
        <TabelaProps
          props={[
            { nome: 'mostrar', tipo: '(opcoes: AvisoOpcoes) => string', descricao: <>A forma completa. Devolve o <code>id</code>.</> },
            { nome: 'sucesso', tipo: '(titulo, opcoes?) => string', descricao: 'Atalho. As opções são as mesmas, menos `titulo` e `tom`.' },
            { nome: 'erro', tipo: '(titulo, opcoes?) => string', descricao: 'Idem — e este não some sozinho.' },
            { nome: 'aviso', tipo: '(titulo, opcoes?) => string', descricao: 'Idem.' },
            { nome: 'info', tipo: '(titulo, opcoes?) => string', descricao: 'Idem.' },
            { nome: 'fechar', tipo: '(id: string) => void', descricao: 'Fecha na mão. O par do `fixo`.' },
          ]}
        />
      </Secao>

      <Secao titulo="Props — AvisoOpcoes">
        <TabelaProps
          props={[
            { nome: 'titulo', tipo: 'string', descricao: 'Uma linha que resolve sozinha. Quem só passou o olho lê apenas isto.' },
            { nome: 'descricao', tipo: 'ReactNode', descricao: 'O detalhe. Opcional de propósito: aviso é interrupção, não documentação.' },
            { nome: 'tom', tipo: "'sucesso' | 'erro' | 'aviso' | 'info'", padrao: "'info'", descricao: <>Só <code>erro</code> interrompe o leitor de tela — e só ele fica até fecharem.</> },
            { nome: 'duracao', tipo: 'number', descricao: <>Tempo de tela em ms. <strong>Vence todas as regras automáticas.</strong> Sem ela, a conta sai do texto.</> },
            { nome: 'acao', tipo: 'AvisoAcao', descricao: <>Um botão: <code>{'{ rotulo, onClick }'}</code>. Clicar executa e fecha. Ter ação faz o aviso não sumir sozinho.</> },
            { nome: 'fixo', tipo: 'boolean', padrao: 'false', descricao: 'Fica até fecharem na mão. Use quando a mensagem exige decisão.' },
          ]}
        />
      </Secao>
    </ProvedorAvisos>
  )
}
