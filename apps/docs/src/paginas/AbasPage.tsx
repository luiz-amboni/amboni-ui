import { useState } from 'react'
import { Abas, ListaAbas, Aba, PainelAba } from '@amboni/ui'
import { Secao, P, Demo, Titulo, H3, Aviso, TabelaProps, FacaNaoFaca, Bloco } from '../lib/blocos'

function DemoLinha() {
  const [aba, setAba] = useState('pedidos')
  return (
    <Abas valor={aba} onChange={setAba}>
      <ListaAbas aria-label="Seções do cliente">
        <Aba valor="pedidos" contador={12}>Pedidos</Aba>
        <Aba valor="mensagens">Mensagens</Aba>
        <Aba valor="notas" disabled>Notas fiscais</Aba>
      </ListaAbas>
      <PainelAba valor="pedidos">12 pedidos, o último em 3 de julho.</PainelAba>
      <PainelAba valor="mensagens">Conversa no WhatsApp desde abril.</PainelAba>
      <PainelAba valor="notas">—</PainelAba>
    </Abas>
  )
}

function DemoPilula() {
  const [periodo, setPeriodo] = useState('semana')
  return (
    <Abas valor={periodo} onChange={setPeriodo} variante="pilula">
      <ListaAbas aria-label="Período do gráfico">
        <Aba valor="dia">Dia</Aba>
        <Aba valor="semana">Semana</Aba>
        <Aba valor="mes">Mês</Aba>
      </ListaAbas>
      <PainelAba valor="dia">Investido hoje: R$ 71,20.</PainelAba>
      <PainelAba valor="semana">Investido na semana: R$ 498,40.</PainelAba>
      <PainelAba valor="mes">Investido no mês: R$ 1.994,31.</PainelAba>
    </Abas>
  )
}

export default function AbasPage() {
  return (
    <>
      <Titulo
        eyebrow="Componentes"
        lead="O teclado é o componente inteiro. Sem ele, sobra um <div onClick> bonito."
      >
        Abas
      </Titulo>

      <Secao>
        <Bloco lang="jsx">{`import { Abas, ListaAbas, Aba, PainelAba } from '@amboni/ui'`}</Bloco>
        <P>
          São quatro peças porque cada uma tem um trabalho: <code>Abas</code> guarda quem está
          ativa, <code>ListaAbas</code> é a régua e o teclado, <code>Aba</code> é o botão,
          <code> PainelAba</code> é o conteúdo. O componente é <strong>controlado</strong> — o
          estado é do produto, não da biblioteca.
        </P>
      </Secao>

      <Secao titulo="Uso">
        <Demo
          variante="plain"
          codigo={`const [aba, setAba] = useState('pedidos')

<Abas valor={aba} onChange={setAba}>
  <ListaAbas aria-label="Seções do cliente">
    <Aba valor="pedidos" contador={12}>Pedidos</Aba>
    <Aba valor="mensagens">Mensagens</Aba>
    <Aba valor="notas" disabled>Notas fiscais</Aba>
  </ListaAbas>
  <PainelAba valor="pedidos">…</PainelAba>
  <PainelAba valor="mensagens">…</PainelAba>
</Abas>`}
        >
          <DemoLinha />
        </Demo>
        <Aviso tipo="warn">
          <code>ListaAbas</code> <strong>precisa</strong> de <code>aria-label</code>. Numa página
          com duas listas, "abas" e "abas" não distingue nada. A biblioteca{' '}
          <strong>avisa no console</strong> em desenvolvimento quando falta.
        </Aviso>
      </Secao>

      <Secao titulo="Roving tabindex — o coração do componente">
        <P>
          Só a aba <strong>ativa</strong> tem <code>tabIndex=0</code>. Todas as outras ficam em
          <code> -1</code>. Não é detalhe de implementação: é a diferença entre um Tab que
          funciona e um Tab que castiga.
        </P>
        <P>
          Com <code>tabIndex=0</code> em todas — o que sai de graça de oito
          <code> &lt;button&gt;</code> na mesma div — quem chega pelo teclado precisa passar por
          <strong> oito paradas</strong> antes de alcançar o conteúdo que veio ler. Aqui o Tab
          pula a régua inteira e cai direto no painel. <strong>A navegação entre abas é das
          setas</strong>, não do Tab.
        </P>
        <Bloco lang="jsx">{`←  →     andam entre as abas, e CIRCULAM (da última volta para a primeira)
Home     primeira aba
End      última aba
Tab      sai da régua e cai no painel`}</Bloco>
        <P>
          As setas <strong>pulam as abas desabilitadas</strong>. Parar numa aba morta é um beco
          sem saída: a pessoa aperta Enter e nada acontece. E circular importa — travar na ponta
          obriga a voltar tecla por tecla até o começo.
        </P>
        <P>
          Andar de seta já <strong>ativa</strong> a aba (é a recomendação da APG): quem chega
          pela seta vê o conteúdo na hora, igual a quem clica. O custo é que passar por 5 abas
          monta 5 painéis — se o painel for caro, quem carrega sob demanda é o conteúdo dele, não
          a régua.
        </P>
        <P>
          O <code>PainelAba</code> tem <code>tabIndex=0</code> justamente para receber esse Tab.
          Se o painel só tiver texto, sem isso ele fica inalcançável — e não dá para rolá-lo pelo
          teclado.
        </P>
      </Secao>

      <Secao titulo="Por que aria-disabled, e não o disabled do HTML">
        <P>
          Uma <code>&lt;Aba disabled&gt;</code> recebe <code>aria-disabled</code>. Um
          <code> disabled</code> de verdade sai da ordem de foco — e aí aparece o caso que
          justifica tudo: <strong>se a aba ATIVA for desabilitada por regra de negócio</strong>{' '}
          (uma permissão que mudou, um pedido que foi cancelado),{' '}
          <strong>ninguém sobra com <code>tabIndex=0</code> e a régua inteira desaparece do
          teclado</strong>. Com <code>aria-disabled</code> ela continua descobrível — só não age.
        </P>
        <P>
          O preço é honesto: <strong>Enter num botão com <code>aria-disabled</code> ainda dispara
          o <code>onClick</code></strong> — o navegador não conhece a nossa regra. Por isso há um
          guarda no TSX, além do <code>pointer-events</code> do CSS. Duas camadas para o mesmo
          bloqueio, porque cada uma cobre um buraco da outra.
        </P>
      </Secao>

      <Secao titulo="O teclado lê o DOM, não um registro em estado">
        <P>
          A navegação por setas busca as abas com{' '}
          <code>querySelectorAll('[role="tab"]')</code> na hora em que a tecla é apertada. A
          alternativa — cada <code>Aba</code> se cadastrar num array no contexto — parece mais
          "React" e está errada: <strong>a ordem de foco tem que ser a ordem visual</strong>, e só
          o DOM sabe qual é ela depois que o produto reordena, filtra ou esconde abas por
          permissão. Um registro em estado seria uma segunda lista para divergir da primeira.
        </P>
      </Secao>

      <Secao titulo="Variantes">
        <Demo
          variante="plain"
          codigo={`<Abas valor={periodo} onChange={setPeriodo} variante="pilula">
  <ListaAbas aria-label="Período do gráfico">
    <Aba valor="dia">Dia</Aba>
    <Aba valor="semana">Semana</Aba>
    <Aba valor="mes">Mês</Aba>
  </ListaAbas>
  …
</Abas>`}
        >
          <DemoPilula />
        </Demo>
        <FacaNaoFaca
          faca={{
            titulo: 'linha para seção, pilula para visão do mesmo dado',
            texto: 'Pedidos / Mensagens / Notas são lugares diferentes — linha. Dia / Semana / Mês é o mesmo dado por outra lente — pilula.',
          }}
          naoFaca={{
            titulo: 'Escolher a variante pelo que ficou mais bonito',
            texto: 'A pastilha sólida agrupa: lê-se como UM controle com N opções. Usá-la para navegar entre seções promete um filtro que não existe.',
          }}
        />
      </Secao>

      <Secao titulo="Duas decisões que você só nota quando faltam">
        <H3>Todas as abas têm o mesmo peso de fonte</H3>
        <P>
          Inclusive a ativa. Engrossar só a ativa <strong>alarga o texto</strong> e empurra as
          vizinhas de lugar a cada clique — a régua dança sob o dedo, e a aba que a pessoa ia
          clicar em seguida já saiu do lugar. Quem marca a ativa é a cor da marca e o sublinhado,
          que não ocupam espaço nenhum.
        </P>
        <H3>Só o painel ativo existe no DOM</H3>
        <P>
          Trade-off assumido, e vale dizer o lado ruim: <strong>o estado interno do painel morre
          ao trocar de aba</strong> — um filtro digitado volta ao início. Em troca, 8 abas não
          viram 8 buscas ao abrir a tela, que é o problema real num painel. Quem precisa preservar
          estado sobe o estado para fora do painel.
        </P>
      </Secao>

      <Secao titulo="O valor vira id — e por isso é higienizado">
        <P>
          <code>aria-controls</code> e <code>aria-labelledby</code> são IDREF: o navegador separa
          os IDs por <strong>espaço</strong>. Um <code>valor="meus pedidos"</code> viraria duas
          referências quebradas e a ligação aba↔painel sumiria — <strong>sem erro nenhum, sem
          aviso</strong>. O componente troca tudo que não é letra, número, <code>_</code> ou
          <code> -</code> por <code>_</code> antes de montar o id.
        </P>
        <P>
          Você não precisa fazer nada com isso. Está aqui porque é o tipo de bug que consome uma
          tarde: funciona no mouse, funciona no olho, e só o leitor de tela sabe que está quebrado.
        </P>
      </Secao>

      <Secao titulo="Props">
        <H3>Abas</H3>
        <TabelaProps
          props={[
            { nome: 'valor', tipo: 'string', descricao: 'A aba ativa. Controlado — quem manda é o produto.' },
            { nome: 'onChange', tipo: '(valor: string) => void', descricao: 'Chamado no clique e na seta.' },
            { nome: 'variante', tipo: "'linha' | 'pilula'", padrao: "'linha'", descricao: 'linha para navegação de seção; pilula para alternar a visão do mesmo dado.' },
            { nome: 'className', tipo: 'string', descricao: 'Vai na raiz.' },
          ]}
        />
        <H3>ListaAbas</H3>
        <TabelaProps
          props={[
            { nome: 'aria-label', tipo: 'string', descricao: <><strong>Obrigatório na prática.</strong> Sem ele (ou <code>aria-labelledby</code>) a biblioteca avisa no console.</> },
            { nome: '…rest', tipo: 'HTMLAttributes<HTMLDivElement>', descricao: <>Tudo que uma <code>&lt;div&gt;</code> aceita. O <code>onKeyDown</code> que você passar roda antes do teclado da régua, não no lugar dele.</> },
          ]}
        />
        <H3>Aba</H3>
        <TabelaProps
          props={[
            { nome: 'valor', tipo: 'string', descricao: <>Casa com o <code>valor</code> de um <code>&lt;PainelAba&gt;</code>.</> },
            { nome: 'contador', tipo: 'number', descricao: 'Número ao lado do rótulo. Entra no nome acessível de propósito — "Pedidos 12". 12 pedidos é informação, não enfeite.' },
            { nome: 'icone', tipo: 'ReactNode', descricao: 'Decorativo (aria-hidden). Quem narra a aba é o texto.' },
            { nome: 'disabled', tipo: 'boolean', padrao: 'false', descricao: <>Vira <code>aria-disabled</code>, não o <code>disabled</code> do HTML.</> },
            { nome: '…rest', tipo: 'ButtonHTMLAttributes', descricao: <>É um <code>&lt;button&gt;</code> de verdade.</> },
          ]}
        />
        <H3>PainelAba</H3>
        <TabelaProps
          props={[
            { nome: 'valor', tipo: 'string', descricao: <>Casa com o <code>valor</code> de uma <code>&lt;Aba&gt;</code>. Fora da aba ativa, não renderiza.</> },
            { nome: '…rest', tipo: 'HTMLAttributes<HTMLDivElement>', descricao: 'Vai no painel.' },
          ]}
        />
        <Aviso>
          <code>&lt;Aba&gt;</code> e <code>&lt;PainelAba&gt;</code> fora de <code>&lt;Abas&gt;</code>{' '}
          <strong>lançam erro</strong>, em vez de renderizar em silêncio. Sem o contexto eles
          sairiam sem <code>aria-controls</code> e sem teclado: quebrados, mas com aparência de
          certos. Um erro explícito custa um minuto; um componente que parece funcionar custa uma
          auditoria.
        </Aviso>
      </Secao>
    </>
  )
}
