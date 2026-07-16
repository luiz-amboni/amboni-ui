import { Alerta, Button } from '@amboni/ui'
// O `Aviso` da biblioteca é o toast. O `Aviso` dos blocos é a caixa de destaque do site.
// Mesmo nome, coisas diferentes — aqui ele entra como `Destaque` para não confundir.
import { Secao, P, Demo, Titulo, H3, Aviso as Destaque, TabelaProps, FacaNaoFaca, Bloco } from '../lib/blocos'

export default function AlertaPage() {
  return (
    <>
      <Titulo
        eyebrow="Componentes"
        lead="O sistema falando com quem usa — e decidindo se isso vale interromper a pessoa."
      >
        Alerta
      </Titulo>

      <Secao>
        <Bloco lang="jsx">{`import { Alerta } from '@amboni/ui'`}</Bloco>
      </Secao>

      <Secao titulo="Os quatro tons">
        <Demo
          variante="plain"
          codigo={`<Alerta titulo="Sincronização às 3h" />                    // info é o padrão
<Alerta tom="sucesso" titulo="Cliente salvo" />
<Alerta tom="aviso" titulo="Telefone sem o 9º dígito" />
<Alerta tom="perigo" titulo="Não foi possível enviar" />`}
        >
          <div style={{ display: 'grid', gap: 12, width: '100%' }}>
            <Alerta titulo="Sincronização às 3h">O Bling devolve os pedidos do dia anterior.</Alerta>
            <Alerta tom="sucesso" titulo="Cliente salvo" />
            <Alerta tom="aviso" titulo="Telefone sem o 9º dígito">
              A mensagem sai, mas pode não chegar.
            </Alerta>
            <Alerta tom="perigo" titulo="Não foi possível enviar">
              O WhatsApp recusou a mensagem: número sem conta.
            </Alerta>
          </div>
        </Demo>
        <P>
          <code>info</code> é contexto, nada a fazer. <code>sucesso</code> deu certo.
          <code> aviso</code> deu certo mas tem ressalva — ou vai dar errado se continuar assim.
          <code> perigo</code> falhou, ou vai falhar. A diferença entre os quatro não é só a
          cor: é <strong>quem interrompe a pessoa</strong>.
        </P>
      </Secao>

      <Secao titulo="Só o perigo interrompe">
        <P>
          Um alerta que só existe na tela não existe para quem usa leitor de tela. Quem resolve
          isso é o <code>role</code>, e a escolha não é estética.
        </P>
        <P>
          <strong><code>role="alert"</code></strong> (= <code>aria-live="assertive"</code>)
          <strong> corta a frase que está sendo lida</strong> e anuncia na hora. É o certo para
          <code> perigo</code>: o pagamento falhou, o formulário não enviou — a pessoa precisa
          saber <em>antes</em> de continuar digitando.
        </P>
        <P>
          <strong><code>role="status"</code></strong> (= <code>aria-live="polite"</code>) espera
          a leitura atual terminar. É o certo para <code>info</code>, <code>sucesso</code> e
          <code> aviso</code>: são importantes, não urgentes.
        </P>
        <Destaque tipo="warn">
          Marcar tudo como <code>alert</code> é como <strong>gritar toda frase</strong>. A pessoa
          desliga o recurso — e aí nem o erro de verdade chega. Por isso o
          <code> role</code> não é uma prop: ele sai do tom, e só <code>perigo</code> interrompe.
        </Destaque>
      </Secao>

      <Secao titulo="Cada tom tem uma forma, não só uma cor">
        <P>
          Os quatro ícones são <strong>desenhos diferentes</strong>, não variações do mesmo:
          círculo com "i", círculo com check, triângulo com "!" e octógono com "✕". Cerca de 1
          em cada 12 homens não distingue vermelho de verde — para essas pessoas, um "sucesso"
          verde e um "perigo" vermelho são o mesmo retângulo cinza. <strong>A forma é o que
          sobra.</strong>
        </P>
        <P>
          Triângulo e octógono não saíram do nada: são as formas que a sinalização de trânsito
          já ensinou o mundo inteiro a ler como "atenção" e "pare". A biblioteca pega carona
          nisso em vez de inventar uma linguagem própria.
        </P>
        <P>
          Um teste extrai o SVG dos quatro tons e exige <strong>quatro desenhos únicos</strong>.
          Se alguém unificar os ícones "para ficar mais limpo", quebra ali — antes de chegar em
          produção.
        </P>
        <FacaNaoFaca
          faca={{
            titulo: 'Deixar o ícone padrão de cada tom',
            texto: 'Forma + cor + texto. Três caminhos para a mesma informação: quem lê rápido, quem não vê cor e quem não vê nada chegam ao mesmo lugar.',
          }}
          naoFaca={{
            titulo: 'Passar `icone` para uniformizar os quatro',
            texto: 'Quatro variações do mesmo desenho devolvem o alerta à dependência do vermelho/verde — o problema que os ícones existem para resolver.',
          }}
        />
        <P>
          A prop <code>icone</code> existe para o caso específico (um alerta de sincronização
          com o ícone de sincronizar), não para padronizar o conjunto.
        </P>
      </Secao>

      <Secao titulo="Ação e dispensa">
        <Demo
          variante="plain"
          codigo={`<Alerta
  tom="perigo"
  titulo="Não foi possível enviar"
  acao={<Button variant="danger" size="sm">Tentar de novo</Button>}
  dispensavel
  onDispensar={() => setVisivel(false)}
>
  O WhatsApp recusou a mensagem: número sem conta.
</Alerta>`}
        >
          <div style={{ width: '100%' }}>
            <Alerta
              tom="perigo"
              titulo="Não foi possível enviar"
              acao={<Button variant="danger" size="sm">Tentar de novo</Button>}
              dispensavel
              onDispensar={() => {}}
            >
              O WhatsApp recusou a mensagem: número sem conta.
            </Alerta>
          </div>
        </Demo>
        <H3>Uma ação, não duas</H3>
        <P>
          <code>acao</code> aceita um botão. Um só, de propósito: <strong>duas saídas viram
          nenhuma</strong> — a pessoa para para escolher em vez de agir. Se o caso realmente tem
          dois caminhos, ele não cabe num alerta; cabe num <code>Dialogo</code>, que existe para
          interromper e pedir decisão.
        </P>
        <H3>O X é um botão de verdade</H3>
        <P>
          <code>dispensavel</code> mostra o X; <code>onDispensar</code> é quem faz ele servir
          para algo — o Alerta não some sozinho, quem tira da tela é você. O X recebe foco,
          responde a Enter e Espaço e tem <code>aria-label="Dispensar aviso"</code>: sem rótulo,
          o leitor de tela anuncia só "botão", e ninguém fecha o que não consegue nomear.
        </P>
        <P>
          Sem <code>dispensavel</code> não existe X nenhum. Um alerta permanente não deve
          adicionar uma parada a mais na navegação por teclado.
        </P>
        <Destaque>
          O alvo de clique do X tem <strong>28px</strong>, bem maior que o desenho de 14px. O
          ícone é discreto por educação visual; a área clicável não pode ser — alvo minúsculo é
          ruim no toque e pior para quem tem tremor.
        </Destaque>
      </Secao>

      <Secao titulo="Alerta ou Aviso (toast)?">
        <P>
          Os dois dizem a mesma coisa e escolhem lugares opostos. <strong>O Alerta mora no
          layout</strong>: fica onde o assunto está, não some, e a pessoa pode voltar nele
          depois. <strong>O Aviso flutua e passa</strong>: é a confirmação de algo que já
          terminou.
        </P>
        <FacaNaoFaca
          faca={{
            titulo: 'Erro de formulário → Alerta, dentro do formulário',
            texto: 'O texto do erro fica ali enquanto a pessoa corrige. É dele que ela copia o motivo para pedir ajuda.',
          }}
          naoFaca={{
            titulo: 'Erro de formulário → toast no canto',
            texto: 'A pessoa olha para o campo, o toast aparece longe do olhar, e a mensagem some antes de virar ação.',
          }}
        />
        <P>
          O Alerta também não tem animação de entrada, e isso é escolha: um alerta que desliza
          para dentro chega <em>depois</em> de a pessoa já ter olhado para o lugar errado. No
          caso do erro, atrasa a informação mais urgente da tela. Ele simplesmente está lá.
        </P>
      </Secao>

      <Secao titulo="Props">
        <TabelaProps
          props={[
            { nome: 'tom', tipo: "'info' | 'sucesso' | 'aviso' | 'perigo'", padrao: "'info'", descricao: <>Define cor, ícone <strong>e</strong> quem interrompe o leitor de tela.</> },
            { nome: 'titulo', tipo: 'ReactNode', descricao: 'Uma linha que resume tudo. Quem lê rápido lê só isto.' },
            { nome: 'children', tipo: 'ReactNode', descricao: 'O detalhe: o que aconteceu e o que fazer.' },
            { nome: 'icone', tipo: 'ReactNode', descricao: <>Troca o ícone do tom. <strong>Pense duas vezes</strong> — é ele que diferencia os tons sem cor.</> },
            { nome: 'dispensavel', tipo: 'boolean', padrao: 'false', descricao: <>Mostra o X. Exige <code>onDispensar</code> para fazer algo.</> },
            { nome: 'onDispensar', tipo: '() => void', descricao: 'Quem tira o alerta da tela é você — o componente não se remove.' },
            { nome: 'acao', tipo: 'ReactNode', descricao: 'Um botão. Um só: duas saídas viram nenhuma.' },
            { nome: '…rest', tipo: 'HTMLAttributes<HTMLDivElement>', descricao: <>Tudo de uma <code>&lt;div&gt;</code>, menos <code>role</code> e <code>title</code> — que o componente decide.</> },
          ]}
        />
        <Destaque tipo="warn">
          <code>role</code> está fora da tipagem de propósito. Ele é a consequência do
          <code> tom</code>, e deixá-lo aberto convidaria exatamente o erro que o componente
          existe para evitar: um <code>role="alert"</code> num "Cliente salvo".
        </Destaque>
      </Secao>
    </>
  )
}
