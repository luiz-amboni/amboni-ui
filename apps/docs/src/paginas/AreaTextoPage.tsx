import { AreaTexto, CampoForm } from '@amboni/ui'
import { Secao, P, Demo, Titulo, H3, Aviso, TabelaProps, FacaNaoFaca, Bloco, Teclado } from '../lib/blocos'

export default function AreaTextoPage() {
  return (
    <>
      <Titulo
        eyebrow="Componentes"
        lead="Texto longo. Duas decisões pequenas — quando medir a altura e como contar caracteres — separam uma caixa que funciona de uma que atrapalha."
      >
        AreaTexto
      </Titulo>

      <Secao>
        <Bloco lang="jsx">{`import { AreaTexto } from '@amboni/ui'`}</Bloco>
        <P>
          É um <code>&lt;textarea&gt;</code> de verdade. Diferente do <code>Campo</code>, aqui a
          moldura é do próprio controle: sem adorno interno, não há motivo para uma caixa em
          volta — e assim o anel de foco vem do <code>.amb-focus-ring</code> da base, sem
          exceção nenhuma.
        </P>
      </Secao>

      <Secao titulo="O básico">
        <Demo
          codigo={`<CampoForm label="Observação" ajuda="o que o cliente pediu">
  <AreaTexto rows={3} placeholder="Escreva à vontade" />
</CampoForm>`}
        >
          <CampoForm label="Observação" ajuda="o que o cliente pediu">
            <AreaTexto rows={3} placeholder="Escreva à vontade" />
          </CampoForm>
        </Demo>
        <P>
          A altura mínima é o dobro de um campo de uma linha. Não é estética: é a altura que diz
          "escreva à vontade" antes de qualquer rótulo ser lido. O puxador de redimensionar fica
          <strong> só na vertical</strong> — o diagonal deixa arrastar a largura para fora do card
          e estourar o layout.
        </P>
      </Secao>

      <Secao titulo="autoResize">
        <Demo
          codigo={`<AreaTexto autoResize placeholder="A caixa cresce com o texto" />`}
        >
          <AreaTexto aria-label="Cresce" autoResize placeholder="A caixa cresce com o texto" />
        </Demo>

        <H3>A linha que parece redundante e não é</H3>
        <Bloco lang="js">{`el.style.height = 'auto'              // <- esta
el.style.height = \`\${el.scrollHeight}px\``}</Bloco>
        <P>
          <code>scrollHeight</code> <strong>nunca é menor que a altura atual do elemento</strong>.
          Se a altura continuar fixa em 200px de uma medição anterior, ele devolve 200 para
          sempre. Resultado: a caixa cresce e <em>nunca mais encolhe</em> — a pessoa apaga o
          texto e fica um buraco branco no formulário. Zerar a altura antes de medir é o que
          permite medir o texto, e não a caixa. Tem teste.
        </P>
        <P>
          A medição roda em <code>useLayoutEffect</code>, não <code>useEffect</code>: o ajuste
          acontece antes do navegador pintar. Com <code>useEffect</code> a caixa aparece na
          altura errada por um frame e "pula" na frente da pessoa.
        </P>
        <Aviso>
          Com <code>autoResize</code> o puxador manual é desligado — os dois brigam pela altura:
          a pessoa arrasta, digita uma letra e a altura volta sozinha. A altura também não tem
          transição, de propósito: animar cada linha nova deixa o texto tremendo enquanto se
          escreve.
        </Aviso>
      </Secao>

      <Secao titulo="Contador">
        <Demo
          codigo={`<AreaTexto maxLength={500} contador defaultValue="..." />
<AreaTexto maxLength={80} contador defaultValue="..." />   // perto do limite
<AreaTexto contador />                                     // sem limite: só o número`}
        >
          <AreaTexto aria-label="Com limite" maxLength={500} contador defaultValue="Cliente pediu para chamar no fim da tarde." />
          <AreaTexto aria-label="Perto do limite" maxLength={80} contador defaultValue="Cliente pediu para chamar no fim da tarde, depois das 17h." />
          <AreaTexto aria-label="Sem limite" contador defaultValue="Sem limite técnico." />
        </Demo>
        <P>
          Com <code>maxLength</code> o contador vira <code>"120/500"</code>; sem ele,
          <code> "120 caracteres"</code>. A partir de <strong>90% do limite</strong> ele muda de
          tom — mas o número <code>"480/500"</code> já dizia tudo sozinho. A cor é reforço, como
          em todo o resto da biblioteca.
        </P>

        <H3>Por que o contador existe</H3>
        <P>
          <strong>O <code>maxLength</code> corta texto colado em silêncio.</strong> A pessoa cola
          um parágrafo de 700 caracteres num campo de 500, o navegador aceita 500 e joga o resto
          fora sem avisar nada — nem um som, nem uma borda. O contador é o único aviso de que
          isso aconteceu.
        </P>
        <P>
          <strong>Contador sem <code>maxLength</code> conta assim mesmo.</strong> Existe caso
          real sem limite técnico mas com limite humano — uma observação que ninguém vai ler se
          passar de três linhas — e ver o número já regula a escrita. Sumir seria pior: a prop
          foi pedida de propósito, e ignorá-la em silêncio é o tipo de coisa que se descobre em
          produção.
        </P>
      </Secao>

      <Secao titulo="O contador não é uma live region">
        <P>
          Um <code>aria-live</code> ali dispararia <strong>a cada tecla</strong>. O leitor de
          tela ficaria interrompendo a própria pessoa a cada letra — "1 de 500", "2 de 500", "3
          de 500" — enquanto ela tenta escrever. Inutilizável.
        </P>
        <FacaNaoFaca
          faca={{
            titulo: 'O limite vai no `ajuda` do CampoForm',
            texto: '<CampoForm ajuda="máximo de 500 caracteres"> anuncia a regra UMA vez, no foco, antes de a pessoa começar. O contador fica no DOM para quem quiser conferir.',
          }}
          naoFaca={{
            titulo: 'aria-live no contador',
            texto: 'Anunciar o número a cada tecla é interromper a pessoa no meio da própria frase. O que ela precisa saber é o limite, dito uma vez — não o placar.',
          }}
        />
        <Bloco lang="jsx">{`<CampoForm label="Observação" ajuda="máximo de 500 caracteres">
  <AreaTexto maxLength={500} contador autoResize />
</CampoForm>`}</Bloco>
      </Secao>

      <Secao titulo="Erro">
        <Demo
          codigo={`<CampoForm label="Motivo" erro="Explique em pelo menos 20 caracteres">
  <AreaTexto defaultValue="não deu" />
</CampoForm>`}
        >
          <CampoForm label="Motivo" erro="Explique em pelo menos 20 caracteres">
            <AreaTexto defaultValue="não deu" />
          </CampoForm>
        </Demo>
        <P>
          Mesmo contrato do <code>Campo</code>: o <code>CampoForm</code> manda
          <code> aria-invalid</code> e a <code>AreaTexto</code> lê o atributo e se pinta sozinha.
          A prop <code>erro</code> booleana só serve para validação solta, sem wrapper.
        </P>
      </Secao>

      <Secao titulo="Teclado">
        <P>
          Como o <code>Campo</code>, a <code>AreaTexto</code> <strong>não implementa tecla
          nenhuma</strong>: é um <code>&lt;textarea&gt;</code> nativo, e o que o
          <code> autoResize</code> e o <code>contador</code> fazem acontece no{' '}
          <code>onChange</code>, depois que o navegador já escreveu a letra. Nenhuma tecla é
          interceptada no caminho.
        </P>
        <Teclado
          atalhos={[
            { tecla: 'Tab', faz: <>Move o foco para a área e, apertado de novo, <strong>sai dela</strong> — não indenta. Sequestrar o Tab aqui é a armadilha clássica do editor de código embutido: quem navega por teclado ficaria preso dentro da caixa, sem saída.</> },
            { tecla: 'Enter', faz: <>Quebra a linha. <strong>Não envia o formulário</strong>, ao contrário do <code>&lt;Campo&gt;</code> — comportamento nativo do <code>&lt;textarea&gt;</code>. Para enviar, a pessoa usa o botão (ou você trata a tecla no seu <code>onKeyDown</code>).</> },
            { tecla: '↑ ↓ Home End', faz: 'Andam pelo texto, linha a linha. Edição nativa, intocada.' },
          ]}
        />
        <Aviso tipo="warn">
          Com <code>maxLength</code>, o navegador <strong>para de aceitar a digitação em
          silêncio</strong> ao bater no limite: nenhuma tecla dá erro, nada é anunciado, e o texto
          colado é cortado sem aviso. Não há tecla para documentar aqui — há um buraco do HTML. É
          exatamente por isso que o <code>contador</code> existe, e por que o limite deve estar na{' '}
          <code>ajuda</code> do <code>CampoForm</code>, dito antes de a pessoa começar a escrever.
        </Aviso>
      </Secao>

      <Secao titulo="Props">
        <TabelaProps
          props={[
            { nome: 'autoResize', tipo: 'boolean', padrao: 'false', descricao: 'A caixa cresce com o texto, sem rolagem interna. Desliga o puxador manual.' },
            { nome: 'contador', tipo: 'boolean', padrao: 'false', descricao: <>Contagem embaixo à direita. Com <code>maxLength</code>: "120/500". Sem: "120 caracteres".</> },
            { nome: 'maxLength', tipo: 'number', descricao: <>Limite. <strong>Corta texto colado em silêncio</strong> — por isso o contador existe.</> },
            { nome: 'erro', tipo: 'boolean', descricao: <>Pinta a moldura e liga <code>aria-invalid</code>. Dispensável dentro de <code>CampoForm erro</code>.</> },
            { nome: 'rows', tipo: 'number', padrao: '3', descricao: <>Altura inicial em linhas. Ignorado na prática com <code>autoResize</code>.</> },
            { nome: '…rest', tipo: 'TextareaHTMLAttributes', descricao: <>É um <code>&lt;textarea&gt;</code>: <code>value</code>, <code>onChange</code>, <code>placeholder</code>, <code>disabled</code>, <code>readOnly</code>, <code>name</code>.</> },
          ]}
        />
        <Aviso>
          Como no <code>Campo</code>, o <code>ref</code> chega no <code>&lt;textarea&gt;</code>,
          não no wrapper — senão o <code>register</code> do react-hook-form quebra calado. E o
          desabilitado muda de fundo, não de opacidade: meia opacidade derruba o contraste do
          texto que a pessoa ainda precisa ler.
        </Aviso>
      </Secao>
    </>
  )
}
