import { Campo, AreaTexto, CampoForm } from '@amboni/ui'
import { Secao, P, Demo, Titulo, H3, Aviso, TabelaProps, FacaNaoFaca, Bloco, Teclado } from '../lib/blocos'

export default function CampoFormPage() {
  return (
    <>
      <Titulo
        eyebrow="Componentes"
        lead="O rótulo, a ajuda e o erro de um campo — amarrados por ARIA ao controle. É o componente que ninguém nota até faltar."
      >
        CampoForm
      </Titulo>

      <Secao>
        <Bloco lang="jsx">{`import { CampoForm } from '@amboni/ui'`}</Bloco>
      </Secao>

      <Secao titulo="A razão de existir">
        <P>
          Um <code>&lt;label&gt;</code> solto ao lado de um <code>&lt;input&gt;</code>
          <strong> não é um rótulo</strong>. É um texto que por acaso está perto. Sem
          <code> htmlFor</code> apontando para o <code>id</code>, quem usa leitor de tela ouve
          <em> "campo de edição"</em> e nada mais: não sabe qual campo, não sabe o que digitar,
          e quando erra não sabe o que errou.
        </P>
        <P>
          O <code>CampoForm</code> gera o id, liga o label, amarra a ajuda e o erro por
          <code> aria-describedby</code> e marca <code>aria-invalid</code>. Tudo o que ninguém
          lembra de fazer à mão em 40 campos de um formulário.
        </P>
        <Demo
          codigo={`<CampoForm label="E-mail" ajuda="usamos só para o recibo" obrigatorio>
  <Campo type="email" />
</CampoForm>`}
        >
          <CampoForm label="E-mail" ajuda="usamos só para o recibo" obrigatorio>
            <Campo type="email" placeholder="joao@exemplo.com" />
          </CampoForm>
        </Demo>
        <P>
          A prova de que a ligação é real: <strong>clicar no rótulo foca o campo</strong>. Se
          isso não acontece, não há ligação — só proximidade.
        </P>
      </Secao>

      <Secao titulo="Erro e ajuda: os dois, erro primeiro">
        <Demo
          codigo={`<CampoForm label="Senha" ajuda="mínimo de 8 caracteres" erro="Senha muito curta">
  <Campo type="password" defaultValue="123" />
</CampoForm>`}
        >
          <CampoForm label="Senha" ajuda="mínimo de 8 caracteres" erro="Senha muito curta">
            <Campo type="password" defaultValue="123" />
          </CampoForm>
        </Demo>
        <P>
          A tentação é esconder a ajuda quando aparece um erro — a tela fica mais limpa. Mas
          <strong> a ajuda costuma ser exatamente a informação que falta para consertar</strong>:
          "mínimo de 8 caracteres" é a resposta para "Senha muito curta". Sumir com ela
          justamente no momento do erro é tirar a instrução de quem mais precisa dela.
        </P>
        <P>
          Os dois são anunciados, e a ordem é a ordem da fala: <strong>primeiro o que houve,
          depois a regra</strong>.
        </P>
        <Bloco lang="jsx">{`// O que o leitor de tela anuncia ao focar o campo:
// "Senha, campo de edição protegido, inválido — Senha muito curta, mínimo de 8 caracteres"`}</Bloco>
        <H3>O erro é montado, não escondido</H3>
        <P>
          O parágrafo do erro tem <code>role="alert"</code> e <strong>só existe no DOM quando há
          erro</strong>. Não é detalhe: um <code>&lt;p role="alert"&gt;</code> que fica sempre no
          DOM e só troca de texto passa despercebido em parte dos leitores de tela. Ele precisa
          ser <em>montado</em> junto com a mensagem para ser falado no instante em que aparece —
          e sem roubar o foco de onde a pessoa está.
        </P>
      </Secao>

      <Secao titulo="Obrigatório">
        <Demo
          codigo={`<CampoForm label="Nome" obrigatorio>
  <Campo />
</CampoForm>`}
        >
          <CampoForm label="Nome" obrigatorio>
            <Campo placeholder="Como no RG" />
          </CampoForm>
        </Demo>
        <P>
          <strong>O asterisco é decorativo</strong> (<code>aria-hidden</code>). Símbolo sozinho
          não informa: quem usa leitor de tela ouviria "asterisco" — ou nada —, e quem não
          conhece a convenção não sabe o que ele quer dizer. Quem carrega o sentido é a palavra
          "(obrigatório)", invisível na tela e lida junto com o rótulo, mais o
          <code> aria-required</code> no controle. Três avisos, nenhum dependendo de cor.
        </P>
        <Aviso>
          <strong>Efeito colateral consciente:</strong> o nome acessível do campo passa a ser
          "Nome (obrigatório)". Em teste, use <code>getByLabelText(/nome/i)</code> em vez de
          string exata.
        </Aviso>

        <H3>Por que <code>aria-required</code> e não <code>required</code></H3>
        <FacaNaoFaca
          faca={{
            titulo: 'aria-required — anuncia sem interferir',
            texto: 'O leitor de tela diz "obrigatório" e a validação continua sendo a sua, com a sua mensagem, no seu idioma.',
          }}
          naoFaca={{
            titulo: 'required — liga a validação nativa',
            texto: 'O navegador abre o balãozinho dele ("Preencha este campo"), no idioma do sistema, por cima da nossa mensagem. Duas mensagens diferentes para o mesmo erro.',
          }}
        />
        <P>
          Quem quiser a validação nativa passa <code>required</code> no próprio controle, de
          propósito — <code>&lt;Campo required /&gt;</code>. É uma escolha, não um acidente do
          wrapper.
        </P>
      </Secao>

      <Secao titulo="O id: uma variável só">
        <P>
          A ordem é: <code>id</code> do wrapper &gt; id que o controle já trazia &gt; gerado por
          <code> useId</code>.
        </P>
        <Bloco lang="jsx">{`<CampoForm label="Nome">
  <Campo id="meu-id" />     {/* o htmlFor do label segue ESTE id */}
</CampoForm>`}</Bloco>
        <P>
          Ler o id do filho parece paranoia até você ver o bug que ele evita — e que um teste
          pegou. O <code>CampoForm</code> gerava um id, punha no <code>htmlFor</code> do label, e
          o clone respeitava o id que o controle já tinha. <strong>Resultado: o label apontando
          para um id que não existe.</strong> Rótulo mudo — exatamente o que este componente
          existe para impedir. Label e controle nunca podem discordar sobre o id, então há uma
          variável só, decidida antes de qualquer render.
        </P>
        <Aviso>
          O id vem de <code>useId</code>, não de um contador global. Em SSR (Astro, Next) dois
          contadores independentes — servidor e cliente — geram ids diferentes, o React reclama
          de hidratação e o <code>htmlFor</code> aponta para o nada.
        </Aviso>
      </Secao>

      <Secao titulo="Quem vence o quê">
        <P>
          O <code>CampoForm</code> injeta a fiação clonando o filho. As regras de conflito não são
          arbitrárias:
        </P>
        <TabelaProps
          props={[
            { nome: 'id', tipo: '—', padrao: 'o wrapper decide', descricao: 'Já resolvido levando o id do filho em conta. Reaproveitá-lo no clone reabriria a porta para label e controle discordarem.' },
            { nome: 'aria-invalid', tipo: '—', padrao: 'o controle vence', descricao: <>Quem escreveu <code>aria-invalid</code> à mão está tratando um caso que o wrapper não conhece.</> },
            { nome: 'aria-required', tipo: '—', padrao: 'o controle vence', descricao: 'Mesma lógica.' },
            { nome: 'aria-describedby', tipo: '—', padrao: 'os dois SOMAM', descricao: <>É a exceção. O atributo aceita vários ids justamente para isso: o controle pode ter descrição própria, e trocá-la pela nossa perderia informação.</> },
          ]}
        />
      </Secao>

      <Secao titulo="children como função">
        <P>
          O clone precisa de <strong>um</strong> elemento. Quando o controle precisa estar
          envolvido em outra coisa — um grid, um botão ao lado —, passe uma função e ligue a
          fiação à mão.
        </P>
        <Demo
          codigo={`<CampoForm label="Valor" ajuda="em reais">
  {({ id, ...aria }) => (
    <div className="linha">
      <Campo id={id} {...aria} prefixo="R$" />
      <Campo aria-label="Parcelas" sufixo="x" />
    </div>
  )}
</CampoForm>`}
        >
          <CampoForm label="Valor" ajuda="em reais">
            {({ id, ...aria }) => (
              <div style={{ display: 'flex', gap: 8 }}>
                <Campo id={id} {...aria} prefixo="R$" placeholder="0,00" />
                <Campo aria-label="Parcelas" sufixo="x" placeholder="12" />
              </div>
            )}
          </CampoForm>
        </Demo>
        <Aviso tipo="warn">
          Com texto solto, fragmento ou dois controles como filho, não há onde pendurar o id e o
          <code> htmlFor</code> aponta para o nada. A biblioteca <strong>avisa no console em
          desenvolvimento</strong>: é uma falha silenciosa na tela, que só apareceria numa
          auditoria de acessibilidade meses depois.
        </Aviso>
      </Secao>

      <Secao titulo="Funciona com qualquer controle">
        <Demo
          codigo={`<CampoForm label="Observação" ajuda="máximo de 500 caracteres">
  <AreaTexto maxLength={500} contador autoResize />
</CampoForm>`}
        >
          <CampoForm label="Observação" ajuda="máximo de 500 caracteres">
            <AreaTexto maxLength={500} contador autoResize />
          </CampoForm>
        </Demo>
        <P>
          <code>Campo</code>, <code>AreaTexto</code> ou o seu componente — o contrato é só aceitar
          <code> id</code> e os <code>aria-*</code> e repassá-los ao elemento nativo. É por isso
          que <code>Campo</code> e <code>AreaTexto</code> leem <code>aria-invalid</code> e se
          pintam sozinhos: o erro é declarado uma vez, aqui.
        </P>
      </Secao>

      <Secao titulo="Teclado">
        <P>
          O <code>CampoForm</code> <strong>não tem teclado</strong>, e não deveria mesmo ter: quem
          responde às teclas é o controle que está dentro dele. Ele não acrescenta nenhuma parada
          na ordem de foco — rótulo, ajuda e erro são texto, e texto não se tabula. O que ele muda
          é o que a pessoa <em>ouve</em> quando o foco chega no controle.
        </P>
        <Teclado
          atalhos={[
            { tecla: 'Tab', faz: <>Vai direto ao controle — o wrapper é invisível para o foco. Ao chegar, o leitor de tela anuncia o rótulo (pelo <code>htmlFor</code>), depois o erro e a ajuda (pelo <code>aria-describedby</code>), e "obrigatório" quando for o caso.</> },
          ]}
        />
        <P>
          A tabela é curta porque o trabalho é outro: o <code>CampoForm</code> existe para que o
          controle <strong>não seja mudo</strong> quando o Tab parar nele. Um{' '}
          <code>&lt;label&gt;</code> solto ao lado de um <code>&lt;input&gt;</code> tem o mesmo
          teclado que este aqui — e anuncia "campo de edição", nada mais.
        </P>
        <Aviso>
          O rótulo não é atalho de teclado, mas é área de clique: clicar no texto do{' '}
          <code>label</code> manda o foco para o controle. Sai de graça do{' '}
          <code>htmlFor</code> — e some se o id do label e o do controle divergirem, que é o bug
          que a seção "O id: uma variável só" existe para impedir.
        </Aviso>
      </Secao>

      <Secao titulo="Props">
        <TabelaProps
          props={[
            { nome: 'label', tipo: 'ReactNode', descricao: <><strong>Obrigatório.</strong> Campo sem rótulo é campo que o leitor de tela chama de "editar".</> },
            { nome: 'ajuda', tipo: 'ReactNode', descricao: 'Formato esperado, unidade, limite ("máximo de 500 caracteres"). Continua na tela durante o erro.' },
            { nome: 'erro', tipo: 'string', descricao: <>Presente = campo inválido. <code>undefined</code> = válido. Montado com <code>role="alert"</code>.</> },
            { nome: 'obrigatorio', tipo: 'boolean', padrao: 'false', descricao: <>Asterisco decorativo + a palavra + <code>aria-required</code>. Não liga a validação nativa.</> },
            { nome: 'id', tipo: 'string', descricao: 'Force um id fixo (âncora, teste E2E). Do contrário um é gerado.' },
            { nome: 'children', tipo: 'ReactNode | (fiacao: FiacaoCampo) => ReactNode', descricao: 'Um elemento (clonado) ou uma função que recebe a fiação.' },
          ]}
        />
        <H3>FiacaoCampo</H3>
        <P>O que a função recebe — e o que o clone injeta:</P>
        <Bloco lang="ts">{`interface FiacaoCampo {
  id: string
  'aria-describedby': string | undefined  // erro e ajuda, nessa ordem
  'aria-invalid': true | undefined        // nunca "false": ruído
  'aria-required': true | undefined
}`}</Bloco>
        <P>
          Nenhum deles vira <code>"false"</code> quando não se aplica — vira
          <code> undefined</code>. Um <code>aria-invalid="false"</code> em todo campo faz alguns
          leitores anunciarem "válido" num campo que a pessoa nem tocou ainda.
        </P>
      </Secao>
    </>
  )
}
