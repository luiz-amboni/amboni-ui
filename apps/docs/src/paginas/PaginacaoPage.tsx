import { useState } from 'react'
import { Paginacao } from '@amboni/ui'
import { Secao, P, Demo, Titulo, H3, Aviso, TabelaProps, FacaNaoFaca, Bloco, Teclado } from '../lib/blocos'

function DemoSimples() {
  const [pagina, setPagina] = useState(5)
  return <Paginacao pagina={pagina} totalPaginas={10} onChange={setPagina} />
}

function DemoCompleta() {
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(20)
  const totalItens = 137
  const totalPaginas = Math.ceil(totalItens / porPagina)
  return (
    <Paginacao
      pagina={pagina}
      totalPaginas={totalPaginas}
      onChange={setPagina}
      totalItens={totalItens}
      porPagina={porPagina}
      onPorPaginaChange={n => {
        setPorPagina(n)
        setPagina(1)
      }}
    />
  )
}

export default function PaginacaoPage() {
  return (
    <>
      <Titulo
        eyebrow="Componentes"
        lead="A régua de botões é enfeite. O componente é a função que decide onde vão as reticências."
      >
        Paginacao
      </Titulo>

      <Secao>
        <Bloco lang="jsx">{`import { Paginacao, janelaPaginas } from '@amboni/ui'`}</Bloco>
      </Secao>

      <Secao titulo="Uso">
        <Demo
          variante="plain"
          codigo={`<Paginacao pagina={p} totalPaginas={10} onChange={setP} />`}
        >
          <DemoSimples />
        </Demo>
        <Demo
          variante="plain"
          codigo={`// Completa — resumo e itens por página
<Paginacao
  pagina={p} totalPaginas={7} onChange={setP}
  totalItens={137} porPagina={porPagina}
  onPorPaginaChange={n => { setPorPagina(n); setP(1) }}
/>`}
        >
          <DemoCompleta />
        </Demo>
      </Secao>

      <Secao titulo="janelaPaginas é o componente de verdade">
        <P>
          Ela é <strong>pura e exportada</strong> — e não por generosidade. É aqui que mora todo o
          risco de erro da paginação; a régua de botões em volta é enfeite. Se você montar uma
          paginação própria, reuse esta função testada em vez de reinventar a lógica das
          reticências às três da tarde.
        </P>
        <Bloco lang="jsx">{`janelaPaginas(pagina, totalPaginas, raio = 1) → ItemPagina[]

type ItemPagina = number | 'elipse-inicio' | 'elipse-fim'`}</Bloco>
        <P>
          As duas reticências são valores <strong>diferentes</strong> de propósito: com{' '}
          <code>'…'</code> nos dois lados, o React receberia duas chaves iguais na mesma lista e
          reclamaria.
        </P>

        <H3>A tabela de casos</H3>
        <Bloco lang="jsx">{`janelaPaginas(1, 1)      → [1]                                    // uma página só: nada de "…"
janelaPaginas(2, 3)      → [1, 2, 3]                              // três cabem inteiras
janelaPaginas(4, 7)      → [1, 2, 3, 4, 5, 6, 7]                  // sete ainda cabem
janelaPaginas(1, 10)     → [1, 2, 'elipse-fim', 10]               // começo: colapsa à direita
janelaPaginas(5, 10)     → [1, 'elipse-inicio', 4, 5, 6, 'elipse-fim', 10]
janelaPaginas(10, 10)    → [1, 'elipse-inicio', 9, 10]            // fim: colapsa à esquerda
janelaPaginas(50, 100)   → [1, 'elipse-inicio', 49, 50, 51, 'elipse-fim', 100]
janelaPaginas(50, 100, 2)→ [1, 'elipse-inicio', 48, 49, 50, 51, 52, 'elipse-fim', 100]`}</Bloco>
        <P>
          Quatro invariantes que os testes verificam para <strong>todos</strong> os pares de página
          e total até 60: a primeira e a última sempre aparecem (são as âncoras do começo e do
          fim); a atual sempre está na janela (senão a pessoa não vê onde está); nunca repete
          página; nunca põe dois "…" colados.
        </P>
      </Secao>

      <Secao titulo="Entrada suja é entrada esperada">
        <P>
          Esta função é alimentada por <code>?page=</code> na URL — <strong>texto que qualquer um
          digita</strong>. Ela não valida a entrada e reclama; ela absorve.
        </P>
        <Bloco lang="jsx">{`janelaPaginas(1, 0)      → []                          // não existe "página 1 de 0"
janelaPaginas(1, -5)     → []                          // total negativo
janelaPaginas(0, 10)     → [1, 2, 'elipse-fim', 10]    // página 0 prende em 1
janelaPaginas(-3, 10)    → [1, 2, 'elipse-fim', 10]    // negativa prende em 1
janelaPaginas(999, 10)   → [1, 'elipse-inicio', 9, 10] // acima do total prende na última
janelaPaginas(NaN, 10)   → [1, 2, 'elipse-fim', 10]    // NaN não explode
janelaPaginas(3.7, 10)   → [1, 2, 3, 4, 'elipse-fim', 10]  // quebrada é truncada`}</Bloco>
        <Aviso tipo="warn">
          <strong>Total 0 devolve <code>[]</code>, não <code>[1]</code>.</strong> Não existe "página
          1 de 0". Devolver <code>[1]</code> desenharia um botão que navega para o nada — e, pior,
          diria à pessoa que a busca dela tem resultado.
        </Aviso>
        <P>
          O mesmo vale no componente: <code>&lt;Paginacao pagina=&#123;999&#125; totalPaginas=&#123;10&#125;&gt;</code>{' '}
          trata como a última página, não como um estado impossível. Uma URL colada não é um bug do
          usuário.
        </P>
      </Secao>

      <Secao titulo="A regra fina: um buraco de UMA página mostra o número">
        <Bloco lang="jsx">{`janelaPaginas(4, 10)  → [1, 2, 3, 4, 5, 'elipse-fim', 10]
                            ↑ o 2 aparece: o buraco à esquerda era só ele

janelaPaginas(5, 10)  → [1, 'elipse-inicio', 4, 5, 6, 'elipse-fim', 10]
                            ↑ agora faltam 2 e 3 — aí o "…" ganha`}</Bloco>
        <P>
          É a mesma regra do "…" da <strong>Trilha</strong>, pelo mesmo motivo: as reticências{' '}
          <strong>ocupam o mesmo espaço que o número</strong> e ainda escondem para onde ele leva.
          Trocar um por outro é perda pura. Só compensa quando o "…" some com duas páginas ou mais.
        </P>
      </Secao>

      <Secao titulo="Reusa o Button">
        <P>
          Os números e as setas são <code>&lt;Button&gt;</code> da casa —{' '}
          <code>ghost</code> para as outras páginas, <code>primary</code> para a atual. Não houve o
          que parametrizar: o estado "página atual" já cabia numa variante que existe.
        </P>
        <P>
          Uma paginação com botão próprio nasce com outra altura, outro hover e outro anel de foco,
          e <strong>diverge do resto do sistema no primeiro ajuste</strong> — alguém mexe no Button
          e a paginação fica para trás, 2px mais baixa. Ninguém abre chamado para isso; todo mundo
          só acha a tabela meio torta.
        </P>
      </Secao>

      <Secao titulo="Três decisões que parecem detalhe">
        <H3>1. O rótulo do seletor é visível</H3>
        <P>
          <code>&lt;label&gt;Por página&lt;/label&gt;</code>, não <code>aria-label</code>.{' '}
          <strong>Quem enxerga também precisa saber o que é aquele "20" solto no canto.</strong>{' '}
          Esconder o rótulo e deixar só a versão para leitor de tela resolve a acessibilidade e
          mantém o problema para todo mundo.
        </P>
        <P>
          E um <code>porPagina</code> fora da lista padrão (um <code>25</code> vindo da URL){' '}
          <strong>entra na lista</strong> em vez de sumir: um <code>&lt;select&gt;</code> cujo valor
          não existe entre as opções mostra a primeira e mente.
        </P>

        <H3>2. Com uma página só, os botões somem — o resumo fica</H3>
        <P>
          Os botões não têm função com uma página; o resumo e o seletor continuam tendo. A linha
          inteira desaparecendo faria <strong>a tabela pular de altura toda vez que um filtro
          reduzisse o resultado a uma página</strong>. Some tudo só quando não sobra nada
          (<code>totalPaginas &lt;= 1</code> e sem resumo nem seletor) — aí o componente não
          renderiza.
        </P>

        <H3>3. onPorPaginaChange não volta para a página 1 sozinho</H3>
        <FacaNaoFaca
          faca={{
            titulo: 'setPorPagina(n); setPagina(1)',
            texto: 'Quem estava na página 9 de 10 com 10 itens fica fora da faixa ao pular para 100 por página. Volte para a 1 — é uma linha.',
          }}
          naoFaca={{
            titulo: 'Esperar que o componente resolva',
            texto: 'Um onChange disparado por baixo do pano é pior que o problema que resolve: vira duas buscas no servidor, e um dia alguém depura por que a página muda sozinha.',
          }}
        />
        <P>
          É a mesma família de decisão do <code>type="button"</code> no <code>Button</code>: a
          biblioteca prefere o comportamento previsível ao comportamento esperto.
        </P>
      </Secao>

      <Secao titulo="O que o leitor de tela ouve">
        <P>
          Trocar de página troca o conteúdo da tabela, <strong>longe daqui</strong>. Sem uma região
          viva, a pessoa clica em "Próxima" e não ouve nada acontecer. Por isso existe um{' '}
          <code>role="status"</code> invisível anunciando "Página 3 de 10" — e ele está no DOM desde
          o começo de propósito: <strong>uma região viva inserida junto com o texto não é
          anunciada</strong>.
        </P>
        <P>
          Os botões dizem para onde levam ("Ir para a página 4"), não o número solto — "botão 4,
          botão 5, botão 6" não diz nada a ninguém. E as reticências são <code>aria-hidden</code>:
          "reticências" narrado não informa, e quem usa leitor de tela já tem o "Página 3 de 10",
          que diz muito mais.
        </P>
      </Secao>

      <Secao titulo="Teclado">
        <P>
          Não há teclado próprio aqui, e é consequência direta de "Reusa o Button": os números e as
          setas são <code>&lt;Button&gt;</code> da casa, o seletor é um <code>&lt;select&gt;</code>{' '}
          nativo, e cada um traz o seu teclado pronto. Um componente de paginação que inventasse
          atalhos <em>também</em> teria inventado o próprio botão — e divergiria do sistema no
          primeiro ajuste.
        </P>
        <Teclado
          atalhos={[
            { tecla: 'Tab', faz: <>Anda pelos botões (anterior, números, próxima) e chega no seletor "Por página". <strong>Botão desabilitado sai da ordem de foco</strong>: na página 1, o Tab não passa por "Página anterior" — é <code>disabled</code> de verdade.</> },
            { tecla: 'Enter Espaço', faz: <>Acionam o botão focado. Vêm do <code>&lt;button&gt;</code>. Apertar na página em que já se está não faz nada — sem esse guarda, cada acionamento dispararia outra busca idêntica no servidor.</> },
            { tecla: '↑ ↓', faz: <>No seletor "Por página": trocam o tamanho da página. Teclado do <code>&lt;select&gt;</code> nativo — o mesmo da <code>Selecao</code> no modo padrão.</> },
          ]}
        />
        <Aviso>
          A tecla não é o problema desta barra; <strong>saber que algo mudou</strong> é. Trocar de
          página troca o conteúdo da tabela, longe daqui: quem usa leitor de tela aperta Enter em
          "Próxima" e não ouviria nada acontecer. Quem resolve isso é o <code>role="status"</code>{' '}
          da seção acima, não um atalho.
        </Aviso>
      </Secao>

      <Secao titulo="Props">
        <TabelaProps
          props={[
            { nome: 'pagina', tipo: 'number', descricao: 'A página atual. Fora da faixa, prende na borda em vez de quebrar.' },
            { nome: 'totalPaginas', tipo: 'number', descricao: 'Quantas páginas existem.' },
            { nome: 'onChange', tipo: '(pagina: number) => void', descricao: 'Clicar na página ATUAL não dispara — sem o guarda, cada clique repetiria a mesma busca no servidor.' },
            { nome: 'totalItens', tipo: 'number', descricao: <>Total de registros. Com <code>porPagina</code>, mostra o resumo "1–20 de 137". Zero vira "Nenhum item".</> },
            { nome: 'porPagina', tipo: 'number', descricao: <>Tamanho da página. Precisa vir junto com <code>totalItens</code> para o resumo aparecer.</> },
            { nome: 'onPorPaginaChange', tipo: '(porPagina: number) => void', descricao: <>Habilita o seletor (10/20/50/100). <strong>Volte para a página 1 aqui.</strong></> },
            { nome: 'size', tipo: "'sm' | 'md'", padrao: "'md'", descricao: <>Repassado ao <code>&lt;Button&gt;</code>.</> },
            { nome: 'className', tipo: 'string', descricao: <>Vai na <code>&lt;nav&gt;</code>.</> },
          ]}
        />
        <Aviso>
          Os números saem formatados em <strong>pt-BR</strong> ("12.345"), fixo. A biblioteca é
          brasileira e serve dois produtos em português — um locale configurável seria uma prop que
          ninguém nunca passaria. E a última página não inventa registros: com 137 itens e 20 por
          página, a sétima diz "121–137 de 137", não "121–140 de 137".
        </Aviso>
      </Secao>
    </>
  )
}
