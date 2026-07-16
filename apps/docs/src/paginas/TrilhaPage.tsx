import { Trilha, ItemTrilha } from '@amboni/ui'
import { Secao, P, Demo, Titulo, H3, Aviso, TabelaProps, FacaNaoFaca, Bloco } from '../lib/blocos'

export default function TrilhaPage() {
  return (
    <>
      <Titulo
        eyebrow="Componentes"
        lead="O caminho até aqui. O último item é onde a pessoa está — e por isso não é link."
      >
        Trilha
      </Titulo>

      <Secao>
        <Bloco lang="jsx">{`import { Trilha, ItemTrilha } from '@amboni/ui'`}</Bloco>
      </Secao>

      <Secao titulo="Uso">
        <Demo
          variante="plain"
          codigo={`<Trilha>
  <ItemTrilha href="/">Início</ItemTrilha>
  <ItemTrilha href="/clientes">Clientes</ItemTrilha>
  <ItemTrilha>Maria Silva</ItemTrilha>
</Trilha>`}
        >
          <Trilha>
            <ItemTrilha href="#">Início</ItemTrilha>
            <ItemTrilha href="#">Clientes</ItemTrilha>
            <ItemTrilha>Maria Silva</ItemTrilha>
          </Trilha>
        </Demo>
        <P>
          Você não marca qual é o item atual: <strong>é sempre o último</strong>. A Trilha conta os
          filhos e avisa cada um pelo contexto. Uma prop a menos para passar — e uma a menos para
          esquecer e ficar com dois "você está aqui" na mesma linha.
        </P>
      </Secao>

      <Secao titulo="O item atual não é link">
        <P>
          O último item vira <code>aria-current="page"</code> e sai de{' '}
          <code>&lt;a&gt;</code> para <code>&lt;span&gt;</code>{' '}
          <strong>mesmo que você passe <code>href</code></strong>. Não se navega para onde já se
          está: o clique recarrega a mesma tela e, no teclado, é mais uma parada que não leva a
          lugar nenhum. O <code>aria-current</code> é o que faz o leitor de tela anunciar "página
          atual" — sem ele, a trilha é uma fileira de links onde o último parece igual aos outros.
        </P>
      </Secao>

      <Secao titulo="O separador é decorativo">
        <Bloco lang="jsx">{`<span className="amb-trilha__sep" aria-hidden="true">/</span>`}</Bloco>
        <P>
          Sem o <code>aria-hidden</code>, o leitor de tela lê{' '}
          <strong>"Início barra Clientes barra Maria Silva"</strong>. A barra é um desenho, não
          informação — a hierarquia já vem do <code>&lt;ol&gt;</code>, que anuncia "lista de 3
          itens" e diz a profundidade do caminho de graça.
        </P>
        <P>
          É <code>&lt;ol&gt;</code> e não <code>&lt;ul&gt;</code> justamente por isso:{' '}
          <strong>a ordem É a informação</strong>. Início vem antes de Clientes, e isso não é
          arbitrário. E o conjunto é um <code>&lt;nav aria-label="Trilha"&gt;</code>, o que permite
          pular direto para ele pela lista de regiões — uma <code>&lt;div&gt;</code> de links não
          aparece nessa lista.
        </P>
      </Secao>

      <Secao titulo="Caminho fundo — max">
        <Demo
          variante="plain"
          codigo={`<Trilha max={3}>
  <ItemTrilha href="/">Início</ItemTrilha>
  <ItemTrilha href="/clientes">Clientes</ItemTrilha>
  <ItemTrilha href="/clientes/sc">Santa Catarina</ItemTrilha>
  <ItemTrilha href="/clientes/sc/criciuma">Criciúma</ItemTrilha>
  <ItemTrilha>Maria Silva</ItemTrilha>
</Trilha>
// → Início / … / Criciúma / Maria Silva`}
        >
          <Trilha max={3}>
            <ItemTrilha href="#">Início</ItemTrilha>
            <ItemTrilha href="#">Clientes</ItemTrilha>
            <ItemTrilha href="#">Santa Catarina</ItemTrilha>
            <ItemTrilha href="#">Criciúma</ItemTrilha>
            <ItemTrilha>Maria Silva</ItemTrilha>
          </Trilha>
        </Demo>
        <P>
          <strong>O primeiro e o último sempre aparecem</strong> — são a origem e o lugar onde a
          pessoa está. O que colapsa é o meio. Clique no "…" da demo acima: ele expande.
        </P>

        <H3>O "…" é um botão, não um texto morto</H3>
        <P>
          Um "…" decorativo é o pior dos mundos: ele <strong>anuncia que existe caminho escondido
          e não deixa chegar nele</strong>. Beco sem saída. Aqui ele é um botão com rótulo de
          verdade — "Mostrar 2 itens ocultos do caminho" — que expande a trilha no lugar.
        </P>
        <P>
          Um menu suspenso seria mais elegante e exigiria camada, foco preso e fechar-no-Esc. A
          Trilha não é lugar de estrear isso: um botão que expande resolve com o que a biblioteca
          já tem.
        </P>

        <H3>Nunca troca UM item por "…"</H3>
        <P>
          Com 5 itens e <code>max=&#123;4&#125;</code>, o colapso esconderia exatamente um item — então não
          colapsa nada. O <code>"…"</code> <strong>ocupa o mesmo espaço que o próprio item</strong>{' '}
          e entrega menos: em vez do nome do lugar, um caroço que precisa de mais um clique. Não há
          troca vantajosa aí.
        </P>
        <FacaNaoFaca
          faca={{
            titulo: 'Colapsar só quando some com 2 ou mais',
            texto: 'É a regra que o componente já aplica sozinho: total > max + 1. Você passa o max e ele decide se vale a pena.',
          }}
          naoFaca={{
            titulo: 'Trocar "Santa Catarina" por "…"',
            texto: 'Mesma largura na tela, menos informação, mais um clique. É perda pura.',
          }}
        />
        <Aviso>
          <code>max=&#123;1&#125;</code> é tratado como <code>2</code>. Com um item só não sobraria
          nem origem nem destino, e a trilha perderia a razão de existir. O valor também é truncado
          — <code>max</code> vem do produto, mas não custa nada não confiar.
        </Aviso>
      </Secao>

      <Secao titulo="As três formas de um item">
        <Bloco lang="jsx">{`<ItemTrilha href="/clientes">Clientes</ItemTrilha>   // <a> de verdade
<ItemTrilha onClick={ir}>Clientes</ItemTrilha>       // <button>
<ItemTrilha>Rascunho</ItemTrilha>                    // só texto`}</Bloco>
        <P>
          Com <code>href</code> é um <code>&lt;a&gt;</code>: abre em nova aba com Ctrl+clique,
          aparece no histórico, é copiável. Com só <code>onClick</code> é um{' '}
          <code>&lt;button&gt;</code>, <strong>não um <code>&lt;a href="#"&gt;</code></strong> — um
          link falso é anunciado como link, promete o Ctrl+clique que não cumpre e suja o
          histórico. Sem nenhum dos dois, vira texto: nada de link que não leva a lugar nenhum.
        </P>
        <P>
          Para router (navegar sem recarregar), passe os <strong>dois</strong>: o{' '}
          <code>href</code> mantém o link real para quem abre em nova aba, e o <code>onClick</code>{' '}
          deixa o router interceptar o clique normal.
        </P>
      </Secao>

      <Secao titulo="Props">
        <H3>Trilha</H3>
        <TabelaProps
          props={[
            { nome: 'max', tipo: 'number', descricao: <>Máximo de itens visíveis antes de colapsar o meio. Sem <code>max</code>, mostra tudo. Mínimo efetivo 2.</> },
            { nome: 'aria-label', tipo: 'string', padrao: "'Trilha'", descricao: 'Sobrescreva quando houver duas navs na página — dois "Trilha" não distinguem nada.' },
            { nome: '…rest', tipo: 'HTMLAttributes<HTMLElement>', descricao: <>Vai no <code>&lt;nav&gt;</code>.</> },
          ]}
        />
        <H3>ItemTrilha</H3>
        <TabelaProps
          props={[
            { nome: 'href', tipo: 'string', descricao: <>Vira <code>&lt;a&gt;</code>. Ignorado no item atual, que nunca é link.</> },
            { nome: 'onClick', tipo: '() => void', descricao: <>Sozinho vira <code>&lt;button&gt;</code>. Junto com <code>href</code>, é o gancho do router.</> },
            { nome: 'icone', tipo: 'ReactNode', descricao: 'Decorativo (aria-hidden). Quem narra o item é o texto.' },
            { nome: 'className', tipo: 'string', descricao: <>Vai no <code>&lt;li&gt;</code>.</> },
          ]}
        />
      </Secao>
    </>
  )
}
