import { Button } from '@amboni/ui'
import { Secao, P, Demo, Titulo, H3, Aviso, TabelaProps, FacaNaoFaca, Bloco } from '../lib/blocos'

export default function ButtonPage() {
  return (
    <>
      <Titulo eyebrow="Componentes" lead="O componente mais simples da biblioteca é onde mais gente escorrega.">
        Button
      </Titulo>

      <Secao>
        <Bloco lang="jsx">{`import { Button } from '@amboni/ui'`}</Bloco>
      </Secao>

      <Secao titulo="Variantes">
        <Demo
          codigo={`<Button variant="primary">Salvar</Button>
<Button>Cancelar</Button>            // secondary é o padrão
<Button variant="ghost">Ver mais</Button>
<Button variant="danger">Apagar</Button>`}
        >
          <Button variant="primary">Salvar</Button>
          <Button>Cancelar</Button>
          <Button variant="ghost">Ver mais</Button>
          <Button variant="danger">Apagar</Button>
        </Demo>
        <P>
          <strong>Uma primária por tela.</strong> A variante primária significa "é isto que você
          veio fazer aqui". Duas primárias lado a lado não destacam nada — só dividem a atenção.
          É justamente por isso que o padrão é <code>secondary</code>: a primária é a exceção
          que você escolhe, não o que sai por acidente de um <code>&lt;Button&gt;</code> sem prop.
        </P>
        <Aviso>
          O <code>danger</code> usa vermelho <strong>e</strong> a palavra. Nunca só a cor: cerca
          de 1 em cada 12 homens não distingue vermelho de verde. Quem carrega o aviso é o
          rótulo — a cor só reforça.
        </Aviso>
      </Secao>

      <Secao titulo="Tamanhos">
        <Demo
          codigo={`<Button size="sm">Pequeno</Button>
<Button size="md">Médio</Button>
<Button size="lg">Grande</Button>`}
        >
          <Button size="sm">Pequeno</Button>
          <Button size="md">Médio</Button>
          <Button size="lg">Grande</Button>
        </Demo>
        <P>
          As alturas — 36, 44 e 52px — vêm do token <code>--amb-altura-*</code>, não de um
          número escrito no CSS do botão. <strong>Campo e botão dividem o mesmo token</strong>,
          e é por isso que eles batem no milímetro num formulário. Quando cada componente
          decide a própria altura, eles divergem por 2px na primeira vez que alguém mexe em um
          só; ninguém abre chamado para isso, todo mundo só acha o formulário meio torto.
        </P>
        <P>
          Os 44px do padrão saem do alvo de toque do iOS — o menor tamanho que ainda se acerta
          com o dedo em movimento. Mesmo o <code>sm</code> fica bem acima dos 24px que a WCAG
          pede.
        </P>
      </Secao>

      <Secao titulo="Carregando">
        <Demo
          codigo={`<Button loading>Salvando</Button>
<Button variant="secondary" loading>Sincronizando</Button>`}
        >
          <Button loading>Salvando</Button>
          <Button variant="secondary" loading>Sincronizando</Button>
        </Demo>
        <H3>Três decisões escondidas aqui</H3>
        <P>
          <strong>1. O botão não encolhe.</strong> O rótulo continua ocupando espaço
          (<code>visibility: hidden</code>, não <code>display: none</code>). Sem isso o botão
          muda de largura no meio do clique e o layout pula.
        </P>
        <P>
          <strong>2. Carregando não é desabilitado.</strong> Por baixo ele usa
          <code> disabled</code> para bloquear o duplo clique, mas continua com a aparência
          ativa. Lavado a 50%, pareceria indisponível — e ele não está, só está ocupado.
        </P>
        <P>
          <strong>3. Quem pediu menos movimento, o giro para.</strong> Em
          <code> prefers-reduced-motion</code> a animação some e o estado continua sendo
          anunciado por <code>aria-busy</code>. Animação em loop causa enjoo em parte das
          pessoas — não é preferência estética.
        </P>
      </Secao>

      <Secao titulo="Com ícone">
        <Demo
          codigo={`<Button iconLeft={<Plus />}>Nova campanha</Button>
<Button iconRight={<Seta />}>Avançar</Button>

// Só ícone: nenhum filho de texto. O formato quadrado é inferido.
<Button variant="ghost" iconLeft={<X />} aria-label="Fechar" />`}
        >
          <Button iconLeft={<span>＋</span>}>Nova campanha</Button>
          <Button iconRight={<span>→</span>}>Avançar</Button>
          <Button variant="ghost" iconLeft={<span>✕</span>} aria-label="Fechar" />
        </Demo>
        <P>
          Não existe prop <code>icon</code>: o botão vira quadrado sozinho quando recebe ícone e
          nenhum texto. Uma prop a menos para você lembrar de passar — e uma a menos para
          esquecer e ficar com um retângulo torto.
        </P>
        <Aviso tipo="warn">
          Botão só de ícone <strong>precisa</strong> de <code>aria-label</code>. Sem ele, o leitor
          de tela anuncia "botão" e pronto — a pessoa não sabe se fecha, salva ou apaga. Em
          desenvolvimento, a biblioteca <strong>avisa no console</strong> quando isso acontece;
          este é o erro de acessibilidade mais comum em painéis.
        </Aviso>
      </Secao>

      <Secao titulo="Navegar não é executar">
        <P>
          O <code>Button</code> é sempre um <code>&lt;button&gt;</code> — ele não vira link. Isso
          é deliberado: se a ação é <em>ir para algum lugar</em>, o elemento certo é o
          <code> &lt;a&gt;</code>, com a aparência de botão se você quiser.
        </P>
        <Bloco lang="css">{`/* Um link com cara de botão — sem fingir ser um. */
.link-botao {
  display: inline-flex;
  align-items: center;
  height: 40px;
  padding: 0 var(--amb-espaco-4);
  border-radius: var(--amb-raio-md);
  background: var(--amb-color-brand-solid);
  color: var(--amb-color-text-onBrand);
  font-weight: var(--amb-peso-semibold);
  text-decoration: none;
}`}</Bloco>
        <FacaNaoFaca
          faca={{
            titulo: 'Navega? é um <a>. Executa? é um <button>',
            texto: 'Um link abre em nova aba com Ctrl+clique, aparece no histórico e é copiável. Um botão não faz nada disso — e não deve.',
          }}
          naoFaca={{
            titulo: 'onClick com navigate() num <button>',
            texto: 'Quebra o Ctrl+clique, o "abrir em nova aba" e o botão direito. A pessoa acha que o site está com defeito.',
          }}
        />
      </Secao>

      <Secao titulo="Props">
        <TabelaProps
          props={[
            { nome: 'variant', tipo: "'primary' | 'secondary' | 'ghost' | 'danger'", padrao: "'secondary'", descricao: 'O peso visual da ação. A primária se pede; não sai por acidente.' },
            { nome: 'size', tipo: "'sm' | 'md' | 'lg'", padrao: "'md'", descricao: <>Altura: 36, 44 ou 52px, vinda de <code>--amb-altura-*</code>.</> },
            { nome: 'loading', tipo: 'boolean', padrao: 'false', descricao: 'Mostra o giro, bloqueia o clique e mantém a largura.' },
            { nome: 'iconLeft', tipo: 'ReactNode', descricao: 'Ícone antes do rótulo. Sem filho de texto, o botão fica quadrado.' },
            { nome: 'iconRight', tipo: 'ReactNode', descricao: 'Ícone depois do rótulo.' },
            { nome: 'block', tipo: 'boolean', padrao: 'false', descricao: 'Ocupa a linha inteira. Comum em formulário no celular.' },
            { nome: 'type', tipo: "'button' | 'submit' | 'reset'", padrao: "'button'", descricao: <>Padrão <code>button</code> de propósito — veja abaixo.</> },
            { nome: '…rest', tipo: 'ButtonHTMLAttributes', descricao: <>Tudo que um <code>&lt;button&gt;</code> aceita: <code>onClick</code>, <code>disabled</code>, <code>aria-*</code>, <code>form</code>.</> },
          ]}
        />
        <Aviso>
          <strong>Por que <code>type="button"</code> por padrão?</strong> O HTML manda um
          <code> &lt;button&gt;</code> dentro de <code>&lt;form&gt;</code> ser
          <code> submit</code>. Resultado clássico: um botão "Adicionar item" envia o formulário
          inteiro e recarrega a página. A biblioteca inverte esse padrão — quem quer enviar pede
          <code> type="submit"</code> explicitamente.
        </Aviso>
      </Secao>
    </>
  )
}
