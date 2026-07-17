import { Menu, ItemMenu, SeparadorMenu, RotuloMenu, Button } from '@amboni/ui'
import { Secao, P, Demo, Titulo, H3, Aviso, TabelaProps, FacaNaoFaca, Bloco, Teclado } from '../lib/blocos'

export default function MenuPage() {
  return (
    <>
      <Titulo
        eyebrow="Componentes"
        lead="Uma lista de ações. Se o que você quer é escolher um valor, o componente é outro."
      >
        Menu
      </Titulo>

      <Secao>
        <Bloco lang="jsx">{`import { Menu, ItemMenu, SeparadorMenu, RotuloMenu } from '@amboni/ui'`}</Bloco>
      </Secao>

      <Secao titulo="Menu ou Selecao? — leia antes de tudo">
        <P>
          <strong>Menu é AÇÃO. Selecao é VALOR.</strong> A diferença não é visual — os dois abrem
          uma lista embaixo de um botão. É de natureza:
        </P>
        <P>
          <code>Menu</code> — "Editar", "Duplicar", "Excluir". Clicar{' '}
          <strong>faz algo agora</strong>. Não guarda estado, não entra em formulário, não tem
          "escolhido".
        </P>
        <P>
          <code>Selecao</code> — "Categoria: Fones". Clicar <strong>guarda um dado</strong> que vai
          ser enviado depois.
        </P>
        <FacaNaoFaca
          faca={{
            titulo: 'Menu para o que acontece ao clicar',
            texto: 'O menu de três pontinhos no fim da linha da tabela: Editar, Duplicar, Excluir. Cada item dispara e o menu fecha.',
          }}
          naoFaca={{
            titulo: 'Menu para escolher a categoria do produto',
            texto: 'Quebra o formulário: não há valor para submeter, e o padrão ARIA de menu não tem como dizer "este está escolhido". Isso é Selecao.',
          }}
        />
        <Aviso tipo="warn">
          O erro simétrico também dói: <code>Selecao</code> para ações confunde de outro jeito — a
          pessoa escolhe "Excluir" na lista e <strong>fica esperando um botão de confirmar que não
          existe</strong>.
        </Aviso>
      </Secao>

      <Secao titulo="Uso">
        <Demo
          variante="centro"
          codigo={`<Menu
  gatilho={<Button variant="ghost" aria-label="Ações do cliente">⋯</Button>}
  alinhamento="fim"
>
  <RotuloMenu>Cliente</RotuloMenu>
  <ItemMenu icone={<Lapis />} atalho="⌘E" onClick={editar}>Editar</ItemMenu>
  <ItemMenu onClick={duplicar}>Duplicar</ItemMenu>
  <ItemMenu disabled onClick={exportar}>Exportar</ItemMenu>
  <SeparadorMenu />
  <ItemMenu perigo icone={<Lixeira />} onClick={excluir}>Excluir</ItemMenu>
</Menu>`}
        >
          <Menu gatilho={<Button variant="ghost">Ações</Button>}>
            <RotuloMenu>Cliente</RotuloMenu>
            <ItemMenu atalho="⌘E" onClick={() => {}}>Editar</ItemMenu>
            <ItemMenu onClick={() => {}}>Duplicar</ItemMenu>
            <ItemMenu disabled onClick={() => {}}>Exportar</ItemMenu>
            <SeparadorMenu />
            <ItemMenu perigo onClick={() => {}}>Excluir</ItemMenu>
          </Menu>
        </Demo>
        <P>
          O gatilho é <strong>clonado</strong>: ele recebe <code>aria-haspopup</code>,{' '}
          <code>aria-expanded</code>, <code>aria-controls</code> e o ref. Por isso precisa ser um
          elemento que <strong>aceite ref e repasse props para o DOM</strong> — o{' '}
          <code>&lt;Button&gt;</code> da casa ou um <code>&lt;button&gt;</code> nativo. Um
          componente que engole props não funciona.
        </P>
        <P>
          O <code>onClick</code> que você já tinha no gatilho continua rodando — o Menu não
          sequestra o handler de quem o passou.
        </P>
      </Secao>

      <Secao titulo="Foco: o oposto do combobox">
        <P>
          Ao abrir, <strong>o foco vai para o primeiro item</strong>. Esta é a confusão mais comum
          entre os dois padrões, então vale a comparação lado a lado:
        </P>
        <Bloco lang="jsx">{`Menu               → o foco REAL vai para o primeiro item.
Selecao buscavel   → o foco FICA no campo; só uma marca virtual
                     (aria-activedescendant) anda pela lista.`}</Bloco>
        <P>
          E é proposital nos dois casos: <strong>no menu não há nada para digitar</strong>, então o
          foco real pode (e deve) ir para os itens. No combobox, tirar o foco do campo mataria a
          digitação.
        </P>
        <P>
          <strong>Esc devolve o foco ao gatilho.</strong> Sem isso, quem fecha pelo teclado é
          jogado para o topo da página (o foco volta para o <code>&lt;body&gt;</code>) e precisa
          navegar tudo de novo até onde estava.
        </P>
        <P>
          <strong>Clique fora não devolve o foco</strong> — de propósito. A pessoa clicou em outro
          lugar porque quer ir para lá; puxar o foco de volta para o gatilho seria roubar o gesto
          dela. Mesmo componente, dois gestos, duas respostas.
        </P>
        <Aviso>
          Enter e Espaço não estão implementados: <strong>o item é um <code>&lt;button&gt;</code> de
          verdade</strong>, e o navegador já dispara o clique nas duas teclas. Reimplementar só
          criaria disparo em dobro. O Esc também chama <code>stopPropagation</code> — dentro de um
          modal, o mesmo Esc fecharia o menu <em>e</em> o modal atrás dele. Um Esc, um nível.
        </Aviso>
      </Secao>

      <Secao titulo="pointerdown, não click — o bug clássico">
        <Bloco lang="jsx">{`function aoApontar(e: PointerEvent) {
  if (!raizRef.current?.contains(e.target as Node)) fechar(false)
}
document.addEventListener('pointerdown', aoApontar)`}</Bloco>
        <P>
          Duas coisas aqui não são detalhe, e as duas geram o mesmo sintoma: <strong>"o menu não
          faz nada quando eu clico"</strong>.
        </P>
        <P>
          <strong>A checagem <code>contains</code>.</strong> Sem ela, o toque no próprio item
          desmontaria o painel ainda no aperto do dedo — o <code>click</code> nunca chegaria ao
          item e o <code>onClick</code> não rodaria. O listener de fechar precisa saber distinguir
          "clicou fora" de "clicou no menu".
        </P>
        <P>
          <strong>E o evento ser <code>pointerdown</code>.</strong> Um listener de{' '}
          <code>click</code> no <code>document</code> chega tarde demais para fechar antes do
          próximo gesto e cedo demais para deixar o item agir, dependendo da ordem de propagação.{' '}
          <code>pointerdown</code> + <code>contains</code> é o par que funciona.
        </P>
        <P>
          O painel também <strong>só existe no DOM quando aberto</strong>: um menu escondido por CSS
          continua sendo lido pelo leitor de tela e tabulável em alguns navegadores.
        </P>
      </Secao>

      <Secao titulo="Item desabilitado">
        <P>
          <code>ItemMenu disabled</code> vira <code>aria-disabled</code>, não o{' '}
          <code>disabled</code> do HTML: o item <strong>continua sendo anunciado</strong> e
          continua recebendo hover — dá para explicar por que está indisponível. Um{' '}
          <code>disabled</code> de verdade some do leitor de tela em parte dos navegadores.
        </P>
        <Aviso tipo="warn">
          <strong>Limitação honesta.</strong> As setas <strong>pulam</strong> os itens
          desabilitados (é o comportamento dos menus nativos do sistema). O custo é assumido: quem
          navega só por teclado <strong>não descobre que a ação existe ali</strong>. Por isso a
          recomendação é <strong>esconder a ação impossível</strong> e deixar o{' '}
          <code>disabled</code> para o que volta a ficar disponível daqui a pouco — um "Exportar"
          que espera o relatório terminar, não um "Excluir" que esta pessoa nunca vai poder usar.
        </Aviso>
      </Secao>

      <Secao titulo="Alinhamento — e a limitação da borda">
        <Demo
          variante="centro"
          codigo={`<Menu gatilho={…} alinhamento="fim">…</Menu>`}
        >
          <Menu gatilho={<Button variant="ghost">Alinhado ao fim</Button>} alinhamento="fim">
            <ItemMenu onClick={() => {}}>Editar</ItemMenu>
            <ItemMenu perigo onClick={() => {}}>Excluir</ItemMenu>
          </Menu>
        </Demo>
        <Aviso tipo="warn">
          <strong>Não há detecção de colisão com a borda da janela.</strong> Isso exigiria medir a
          tela a cada abertura, ou uma dependência tipo floating-ui — que esta biblioteca não tem e
          não quer ter. Perto da borda direita, <strong>use <code>alinhamento="fim"</code></strong>.
          É exatamente o caso do menu no fim de uma linha de tabela, que é onde isso importa: com o
          padrão <code>inicio</code>, o painel cresceria para fora da tela.
        </Aviso>
      </Secao>

      <Secao titulo="perigo e atalho">
        <P>
          <code>perigo</code> pinta o item de vermelho — mas <strong>o rótulo precisa dizer a
          palavra</strong> ("Excluir"). Cerca de 1 em cada 12 homens não distingue vermelho de
          verde: para essas pessoas a cor simplesmente não existe. Cor é reforço, nunca o aviso.
        </P>
        <P>
          <code>atalho</code> mostra a dica de teclado à direita — e{' '}
          <strong>não é <code>aria-hidden</code></strong>. Escondê-lo deixaria o menu "mais limpo"
          no leitor de tela tirando o dado <em>justamente de quem navega por teclado</em>. O nome do
          item vira "Editar ⌘E", e tudo bem. Note que ele é só a dica visual:{' '}
          <strong>não registra atalho nenhum</strong> — quem escuta a tecla é o produto.
        </P>
      </Secao>

      <Secao titulo="Teclado">
        <P>
          O gatilho abre pelo clique <em>e</em> pelas setas — e a seta escolhida decide onde o foco
          cai, porque descer até "Excluir" no fim de um menu de oito itens é a razão de o ↑ existir.
          Dentro do painel, o Tab não anda de item em item: quem anda são as setas, e o Tab sai do
          menu inteiro. Os itens ficam todos em <code>tabIndex=-1</code> justamente para isso.
        </P>
        <Teclado
          apg="https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/"
          atalhos={[
            { tecla: '↓', faz: <>No gatilho: abre o menu e foca o <strong>primeiro</strong> item.</> },
            { tecla: '↑', faz: <>No gatilho: abre o menu e foca o <strong>último</strong> item — o atalho para chegar em "Excluir" sem percorrer o menu inteiro.</> },
            { tecla: '↑ ↓', faz: <>Com o menu aberto: andam entre os itens e <strong>circulam</strong> nas duas pontas. Pulam os desabilitados — veja a limitação acima.</> },
            { tecla: 'Home', faz: 'Primeiro item habilitado.' },
            { tecla: 'End', faz: 'Último item habilitado.' },
            { tecla: 'Enter Espaço', faz: <>Ativam o item focado. Vêm do navegador: o item é um <code>&lt;button&gt;</code> de verdade. Depois de agir, o menu fecha.</> },
            { tecla: 'Esc', faz: <>Fecha e <strong>devolve o foco ao gatilho</strong>. Chama <code>stopPropagation</code>: dentro de um <code>Dialogo</code>, fecha só o menu — um Esc, um nível.</> },
            { tecla: 'Tab', faz: <>Fecha o menu e segue para o próximo campo da <strong>página</strong> — não para o próximo item. Sem <code>preventDefault</code>: o Tab tem que continuar sendo o Tab.</> },
          ]}
        />
      </Secao>

      <Secao titulo="Props">
        <H3>Menu</H3>
        <TabelaProps
          props={[
            { nome: 'gatilho', tipo: 'ReactElement', descricao: <>O botão que abre. É clonado — precisa aceitar ref e repassar props para o DOM.</> },
            { nome: 'alinhamento', tipo: "'inicio' | 'fim'", padrao: "'inicio'", descricao: <>De que lado o painel cresce. <code>fim</code> perto da borda direita.</> },
            { nome: 'className', tipo: 'string', descricao: 'Vai na raiz (o wrapper que ancora o painel).' },
          ]}
        />
        <H3>ItemMenu</H3>
        <TabelaProps
          props={[
            { nome: 'onClick', tipo: '(e: MouseEvent) => void', descricao: 'A ação. O menu fecha sozinho depois — deixá-lo aberto taparia o resultado do que a pessoa acabou de disparar.' },
            { nome: 'icone', tipo: 'ReactNode', descricao: 'Decorativo (aria-hidden). Quem nomeia a ação é o texto.' },
            { nome: 'perigo', tipo: 'boolean', descricao: 'Ação destrutiva. A cor reforça o rótulo; nunca o substitui.' },
            { nome: 'disabled', tipo: 'boolean', descricao: <>Vira <code>aria-disabled</code>. As setas pulam por cima — veja a limitação acima.</> },
            { nome: 'atalho', tipo: 'string', descricao: 'Dica visual de teclado ("⌘E"). Não registra nada.' },
            { nome: '…rest', tipo: 'ButtonHTMLAttributes', descricao: <>É um <code>&lt;button&gt;</code>. <code>disabled</code>, <code>children</code> e <code>onClick</code> são reescritos pelo componente.</> },
          ]}
        />
        <H3>SeparadorMenu e RotuloMenu</H3>
        <TabelaProps
          props={[
            { nome: 'SeparadorMenu', tipo: 'HTMLAttributes<HTMLDivElement>', descricao: <>Linha entre grupos. <code>role="separator"</code> e não uma div qualquer: assim o leitor de tela também percebe a divisão que o olho percebe.</> },
            { nome: 'RotuloMenu', tipo: 'HTMLAttributes<HTMLDivElement>', descricao: <>Título de uma seção do menu ("Cliente", "Pedido").</> },
          ]}
        />
        <Aviso>
          <strong>Limitação assumida do <code>RotuloMenu</code>:</strong> ele é um rótulo{' '}
          <em>visual</em>. Não agrupa semanticamente (<code>role="group"</code> +{' '}
          <code>aria-labelledby</code>), porque para isso os itens teriam que ser filhos dele — e
          isso mudaria a forma de escrever o menu inteiro. Para o leitor de tela, os itens seguem
          soltos no menu. <strong>Se a distinção entre as seções for essencial, ponha a palavra no
          rótulo do item.</strong>
        </Aviso>
      </Secao>
    </>
  )
}
