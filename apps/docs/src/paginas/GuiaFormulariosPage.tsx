import { useState, type FormEvent } from 'react'
import { Button, Campo, CampoForm, Caixa, Selecao, AreaTexto, Interruptor } from '@amboni/ui'
import { Secao, P, H3, Bloco, Aviso, Titulo, Demo, FacaNaoFaca } from '../lib/blocos'

/* O formulário do exemplo, de verdade — é ele que roda na demo abaixo. Se algum exemplo
   desta página não compilasse, esta página não carregaria. */
function FormularioCliente() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [origem, setOrigem] = useState('')
  const [aceita, setAceita] = useState(false)
  const [erros, setErros] = useState<{ nome?: string; email?: string; origem?: string }>({})
  const [salvando, setSalvando] = useState(false)

  function enviar(e: FormEvent) {
    e.preventDefault()
    const novos: typeof erros = {}
    if (!nome.trim()) novos.nome = 'Diga o nome de quem comprou.'
    if (!email.includes('@')) novos.email = 'Falta o @ — confira o endereço.'
    if (!origem) novos.origem = 'Escolha por onde este cliente chegou.'
    setErros(novos)
    if (Object.keys(novos).length > 0) return

    setSalvando(true)
    setTimeout(() => setSalvando(false), 1200)
  }

  return (
    <form onSubmit={enviar} style={{ display: 'grid', gap: 'var(--amb-espaco-4)', width: '100%', maxWidth: 460 }}>
      <CampoForm label="Nome do cliente" erro={erros.nome} obrigatorio>
        <Campo placeholder="Ana Souza" value={nome} onChange={e => setNome(e.target.value)} />
      </CampoForm>

      <CampoForm label="E-mail" ajuda="usamos só para o recibo da compra" erro={erros.email} obrigatorio>
        <Campo type="email" inputMode="email" value={email} onChange={e => setEmail(e.target.value)} />
      </CampoForm>

      <CampoForm label="Origem" ajuda="por onde este cliente chegou até a loja" erro={erros.origem} obrigatorio>
        <Selecao
          opcoes={[
            { valor: 'loja', rotulo: 'Loja física' },
            { valor: 'instagram', rotulo: 'Instagram' },
            { valor: 'indicacao', rotulo: 'Indicação' },
            { valor: 'anuncio', rotulo: 'Anúncio' },
          ]}
          valor={origem}
          onChange={setOrigem}
          placeholder="Escolha a origem"
        />
      </CampoForm>

      <CampoForm label="Observação" ajuda="máximo de 300 caracteres">
        <AreaTexto maxLength={300} contador autoResize placeholder="Comprou o iPhone para a filha…" />
      </CampoForm>

      <Caixa
        label="Receber dicas de uso no WhatsApp"
        descricao="no máximo uma por semana, dá para sair quando quiser"
        checked={aceita}
        onChange={e => setAceita(e.target.checked)}
      />

      <div style={{ display: 'flex', gap: 'var(--amb-espaco-2)' }}>
        <Button type="submit" variant="primary" loading={salvando}>
          Salvar cliente
        </Button>
        <Button type="button">Cancelar</Button>
      </div>
    </form>
  )
}

export default function GuiaFormulariosPage() {
  return (
    <>
      <Titulo
        eyebrow="Guias"
        lead="Um formulário de CRM inteiro, com a regra que sustenta todos: o erro é declarado uma vez só."
      >
        Formulários
      </Titulo>

      <Secao titulo="O formulário completo">
        <P>
          Envie vazio para ver os erros. É o mesmo código do bloco abaixo — nada foi simplificado
          para a demonstração.
        </P>
        <Demo variante="plain">
          <FormularioCliente />
        </Demo>

        <Bloco lang="jsx">{`function FormularioCliente() {
  const [nome, setNome] = useState('')
  const [origem, setOrigem] = useState('')
  const [erros, setErros] = useState<{ nome?: string; origem?: string }>({})
  const [salvando, setSalvando] = useState(false)

  function enviar(e: React.FormEvent) {
    e.preventDefault()
    const novos = {}
    if (!nome.trim()) novos.nome = 'Diga o nome de quem comprou.'
    if (!origem) novos.origem = 'Escolha por onde este cliente chegou.'
    setErros(novos)
    if (Object.keys(novos).length > 0) return
    salvar()
  }

  return (
    <form onSubmit={enviar}>
      <CampoForm label="Nome do cliente" erro={erros.nome} obrigatorio>
        <Campo value={nome} onChange={e => setNome(e.target.value)} />
      </CampoForm>

      <CampoForm label="Origem" ajuda="por onde este cliente chegou" erro={erros.origem} obrigatorio>
        <Selecao opcoes={origens} valor={origem} onChange={setOrigem} placeholder="Escolha a origem" />
      </CampoForm>

      <CampoForm label="Observação" ajuda="máximo de 300 caracteres">
        <AreaTexto maxLength={300} contador autoResize />
      </CampoForm>

      <Caixa
        label="Receber dicas de uso no WhatsApp"
        descricao="no máximo uma por semana, dá para sair quando quiser"
        checked={aceita}
        onChange={e => setAceita(e.target.checked)}
      />

      {/* type="submit" é obrigatório aqui — veja abaixo o porquê da inversão */}
      <Button type="submit" variant="primary" loading={salvando}>Salvar cliente</Button>
      <Button>Cancelar</Button>
    </form>
  )
}`}</Bloco>
        <P>
          Repare no que <strong>não</strong> está no código: nenhum <code>id</code>, nenhum{' '}
          <code>htmlFor</code>, nenhum <code>aria-invalid</code>, nenhum{' '}
          <code>aria-describedby</code>, e nenhuma prop <code>erro</code> repetida no{' '}
          <code>&lt;Campo&gt;</code>. Tudo isso existe no HTML final — só não foi você quem escreveu.
        </P>
      </Secao>

      <Secao titulo="A regra: o erro é declarado UMA vez">
        <P>
          O erro mora no <code>CampoForm</code>. Ponto. O <code>Campo</code> e a{' '}
          <code>AreaTexto</code> leem o <code>aria-invalid</code> que o wrapper injeta e se pintam
          sozinhos.
        </P>
        <FacaNaoFaca
          faca={{
            titulo: '<CampoForm erro={erros.email}><Campo /></CampoForm>',
            texto: 'Uma fonte de verdade. A mensagem aparece, o campo fica vermelho, o aria-invalid liga e o leitor de tela anuncia — tudo do mesmo dado.',
          }}
          naoFaca={{
            titulo: '<CampoForm erro={e}><Campo erro /></CampoForm>',
            texto: 'Duas fontes de verdade. Funciona hoje; amanhã alguém limpa o erro em um lugar só e o campo fica vermelho sem mensagem — ou pior, com mensagem e sem moldura.',
          }}
        />
        <P>Por dentro, o <code>CampoForm</code> clona o filho e injeta a fiação:</P>
        <Bloco lang="ts">{`export interface FiacaoCampo {
  id: string
  'aria-describedby': string | undefined
  'aria-invalid': true | undefined
  'aria-required': true | undefined
}`}</Bloco>
        <P>
          E cada controle da família <strong>lê</strong> esse <code>aria-invalid</code> para decidir
          a própria moldura — <code>Campo</code>, <code>AreaTexto</code> e as duas metades da{' '}
          <code>Selecao</code>. Um controle que ignorasse o wrapper seria pior que um wrapper que
          não existe: você declara o erro, metade da tela obedece.
        </P>

        <H3>Quando o erro é local, sem wrapper</H3>
        <P>
          A prop <code>erro</code> do <code>Campo</code> continua existindo — para validação solta,
          sem <code>CampoForm</code>. Aí ela é um <code>boolean</code>, porque quem mostra o texto é
          você. Já a <code>Selecao</code> e a <code>Caixa</code> têm <code>erro?: string</code>: elas
          desenham a mensagem sozinhas. <strong>É texto e não booleano de propósito</strong> —
          pintar a borda de vermelho sem dizer o que está errado não conserta nada, e quem não
          distingue vermelho nem vê o aviso.
        </P>

        <H3>Um controle envolvido em outra coisa</H3>
        <P>
          O clone precisa de <strong>um</strong> elemento filho. Se você precisa envolver o controle
          (uma grade, um botão colado), passe <code>children</code> como função e ligue à mão:
        </P>
        <Bloco lang="jsx">{`<CampoForm label="Valor da compra" erro={erros.valor}>
  {({ id, ...aria }) => (
    <div style={{ display: 'flex', gap: 8 }}>
      <Campo id={id} {...aria} prefixo="R$" inputMode="decimal" />
      <Button onClick={calcular}>Calcular</Button>
    </div>
  )}
</CampoForm>`}</Bloco>
        <P>
          Passar dois elementos soltos (ou texto puro) faz o CampoForm{' '}
          <strong>avisar no console em desenvolvimento</strong>: não há onde pendurar o id, e o{' '}
          <code>htmlFor</code> do label apontaria para o nada. Falha silenciosa na tela, que só
          apareceria numa auditoria meses depois.
        </P>
      </Secao>

      <Secao titulo="Com react-hook-form">
        <P>
          Todos os controles têm <code>forwardRef</code> apontando para o{' '}
          <strong>elemento nativo</strong> — não para a <code>&lt;div&gt;</code> da moldura. Isso é
          deliberado e está comentado no código do <code>Campo</code>: o{' '}
          <code>register</code> chama <code>ref.current.focus()</code> e lê{' '}
          <code>ref.current.value</code>. Se o ref pegasse a div, ele quebraria em silêncio.
        </P>
        <Bloco lang="jsx">{`import { useForm } from 'react-hook-form'
import { Campo, CampoForm, AreaTexto, Caixa, Button } from '@amboni/ui'

function Formulario() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()

  return (
    <form onSubmit={handleSubmit(salvar)}>
      <CampoForm label="Nome" erro={errors.nome?.message} obrigatorio>
        <Campo {...register('nome', { required: 'Diga o nome de quem comprou.' })} />
      </CampoForm>

      <CampoForm label="Observação" ajuda="máximo de 500 caracteres">
        <AreaTexto maxLength={500} contador {...register('obs')} />
      </CampoForm>

      <Caixa label="Receber dicas no WhatsApp" {...register('aceitaDicas')} />

      <Button type="submit" variant="primary" loading={isSubmitting}>Salvar</Button>
    </form>
  )
}`}</Bloco>
        <P>
          O <code>{'{...register(\'nome\')}\''}</code> espalha <code>name</code>, <code>onChange</code>,{' '}
          <code>onBlur</code> e <code>ref</code> — e todos os quatro chegam no elemento nativo. O{' '}
          <code>CampoForm</code> clona por cima para injetar <code>id</code> e ARIA; os dois não
          brigam, porque o <code>register</code> não mexe em <code>id</code>.
        </P>

        <Aviso tipo="warn">
          <strong>A Selecao não funciona com <code>register</code> — use <code>Controller</code>.</strong>
          {' '}Não é bug: o <code>onChange</code> dela devolve o <em>valor</em>{' '}
          (<code>(valor: string) =&gt; void</code>), não o evento, e o <code>valor</code> é
          obrigatório — ela é controlada, sempre. O <code>register</code> espera um{' '}
          <code>onChange(evento)</code>. Vale o mesmo para qualquer controle nosso de API
          controlada.
        </Aviso>
        <Bloco lang="jsx">{`import { Controller } from 'react-hook-form'

<CampoForm label="Origem" erro={errors.origem?.message} obrigatorio>
  <Controller
    name="origem"
    control={control}
    rules={{ required: 'Escolha a origem.' }}
    render={({ field }) => (
      <Selecao opcoes={origens} valor={field.value ?? ''} onChange={field.onChange} placeholder="Escolha a origem" />
    )}
  />
</CampoForm>`}</Bloco>
        <Aviso>
          <strong>Honestidade sobre este trecho:</strong> o react-hook-form não é dependência deste
          repositório e estes dois exemplos não rodam em nenhum teste nosso. O que está{' '}
          <em>verificado</em> é o mecanismo de que eles dependem: <code>Campo</code>,{' '}
          <code>AreaTexto</code>, <code>Caixa</code>, <code>Interruptor</code> e <code>Selecao</code>{' '}
          encaminham o ref para o elemento nativo, e há teste para isso em cada um. Se você integrar
          e encontrar atrito, é um relato que queremos ouvir.
        </Aviso>
      </Secao>

      <Secao titulo="Interruptor ou Caixa? A pergunta é quando vale">
        <P>
          É a confusão mais comum do design system, e a diferença não é de aparência — é de{' '}
          <strong>momento</strong>.
        </P>
        <FacaNaoFaca
          faca={{
            titulo: 'Interruptor = vale AGORA',
            texto: 'Não existe "Salvar" depois dele. Ao acionar, o robô liga, o envio começa. Se a ação é lenta ou pode falhar, mostre o resultado e reverta o estado no erro — a pessoa já foi embora achando que ficou feito.',
          }}
          naoFaca={{
            titulo: 'Caixa = espera o Salvar',
            texto: 'É campo de formulário: a escolha só vale no envio e dá para desistir antes. Usar caixa para algo que já ligou faz a pessoa clicar em "Salvar" que não existe — ou nem clicar.',
          }}
        />
        <Demo variante="plain">
          <div style={{ display: 'grid', gap: 'var(--amb-espaco-4)', width: '100%', maxWidth: 460 }}>
            <Interruptor
              label="Enviar dicas automáticas"
              descricao="começa no próximo ciclo, às 9h — vale a partir deste clique"
              defaultChecked
            />
            <Caixa
              label="Receber dicas de uso no WhatsApp"
              descricao="só vale quando você salvar o formulário"
            />
          </div>
        </Demo>
        <P>
          O leitor de tela trata os dois de forma diferente, e é aí que o erro fica caro:{' '}
          <code>role="switch"</code> é anunciado como <strong>"ligado/desligado"</strong>, checkbox
          como <strong>"marcado/desmarcado"</strong>. Usar o errado <em>mente</em> sobre o que vai
          acontecer.
        </P>
        <P>
          Detalhe do rótulo: escreva o <strong>estado ligado</strong> ("Enviar dicas automáticas"),
          nunca a ação ("Ligar envio"). O rótulo não muda quando o interruptor muda — se ele
          descrever a ação, fica mentindo metade do tempo.
        </P>
      </Secao>

      <Secao titulo="aria-required, não required">
        <P>
          O <code>obrigatorio</code> do <code>CampoForm</code> liga <code>aria-required</code>, e{' '}
          <strong>não</strong> o <code>required</code> do HTML. A diferença tem consequência:
        </P>
        <Bloco lang="ts">{`'aria-required': obrigatorio ? true : undefined,`}</Bloco>
        <P>
          O <code>required</code> nativo liga a validação do navegador, que abre{' '}
          <strong>o balãozinho dele</strong> ("Preencha este campo") — no idioma do sistema
          operacional, com o visual do Chrome, e <strong>por cima da nossa mensagem</strong>. Duas
          mensagens diferentes, para o mesmo erro, ao mesmo tempo. A nossa fica escondida atrás de
          uma tarja que some sozinha e que ninguém consegue estilizar.
        </P>
        <P>
          Então o <code>aria-required</code> anuncia a obrigatoriedade para quem usa leitor de tela,
          o asterisco avisa quem enxerga, a palavra "(obrigatório)" cobre quem não conhece a
          convenção do asterisco — e a validação continua sendo sua, com a sua mensagem, no seu
          idioma.
        </P>
        <Aviso>
          Quer a validação nativa mesmo assim? Passe <code>required</code> no próprio controle:{' '}
          <code>&lt;Campo required /&gt;</code>. É uma decisão consciente, e é exatamente por isso que
          ela exige uma linha a mais.
        </Aviso>
        <P>
          <strong>Efeito colateral que morde em teste:</strong> com <code>obrigatorio</code>, o nome
          acessível do campo passa a ser "Nome (obrigatório)" — o "(obrigatório)" é texto de
          verdade, só invisível. Em teste, use <code>getByLabelText(/nome/i)</code>, nunca a string
          exata.
        </P>
      </Secao>

      <Secao titulo="O botão de enviar: type=&quot;submit&quot; é obrigatório">
        <P>
          O padrão do nosso <code>Button</code> é <code>type="button"</code>. É o inverso do HTML, e
          é deliberado:
        </P>
        <Bloco lang="jsx">{`<Button type="submit" variant="primary">Salvar cliente</Button>  // ✅ envia
<Button>Cancelar</Button>                                        // não envia`}</Bloco>
        <P>
          <strong>Por que inverter.</strong> No HTML, um <code>&lt;button&gt;</code> dentro de{' '}
          <code>&lt;form&gt;</code> é <code>submit</code> por padrão. Resultado clássico: o botão
          "Adicionar item", "Cancelar" ou "Calcular frete" envia o formulário inteiro e recarrega a
          página. O bug é silencioso, parece "o site bugou", e sempre demora para alguém ligar a
          causa ao efeito.
        </P>
        <P>
          A conta é simples: num formulário, <strong>um</strong> botão envia e{' '}
          <strong>vários</strong> não. O padrão certo é o do caso comum — e o caso comum é não
          enviar. Esqueceu o <code>type="submit"</code>? O formulário não envia, você percebe em dez
          segundos. Com o padrão do HTML, o esquecimento vai para produção.
        </P>
        <P>É um contrato testado, não uma promessa de documentação:</P>
        <Bloco lang="jsx">{`test('NÃO envia o formulário sem querer', async () => {
  const aoEnviar = vi.fn(e => e.preventDefault())
  render(<form onSubmit={aoEnviar}><Button>Cancelar</Button></form>)

  await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
  expect(aoEnviar).not.toHaveBeenCalled()
})`}</Bloco>
      </Secao>

      <Secao titulo="Carregando não é desabilitado">
        <P>
          Enquanto salva, o botão fica <code>loading</code> — não <code>disabled</code>. São coisas
          diferentes e a pessoa lê a diferença:
        </P>
        <Demo variante="plain">
          <div style={{ display: 'flex', gap: 'var(--amb-espaco-3)', flexWrap: 'wrap' }}>
            <Button variant="primary" loading>
              Salvando
            </Button>
            <Button variant="primary" disabled>
              Indisponível
            </Button>
          </div>
        </Demo>
        <P>
          Por baixo, o <code>loading</code> usa <code>disabled</code> para bloquear o duplo clique —
          mas <strong>mantém a aparência ativa</strong> e liga <code>aria-busy</code>. Lavado a 50%,
          o botão pareceria indisponível, e ele não está: está ocupado. "Indisponível" convida a
          pessoa a procurar o que falta preencher; "ocupado" convida a esperar. A diferença entre as
          duas leituras é a diferença entre um chamado aberto e nenhum.
        </P>
        <P>
          O rótulo também continua no DOM (<code>visibility: hidden</code>, não{' '}
          <code>display: none</code>): o botão não encolhe no meio do clique e o layout não pula. E
          quem pediu menos movimento no sistema não vê o giro — o estado continua sendo anunciado
          por <code>aria-busy</code>.
        </P>
        <FacaNaoFaca
          faca={{
            titulo: '<Button type="submit" loading={salvando}>Salvar</Button>',
            texto: 'Um estado, uma prop. O duplo clique é bloqueado, o leitor de tela sabe que está ocupado e a largura não muda.',
          }}
          naoFaca={{
            titulo: '<Button disabled={salvando}>{salvando ? <Giro /> : "Salvar"}</Button>',
            texto: 'O botão encolhe, o rótulo some (quem usa leitor de tela perde o contexto), e "desabilitado" mente: não está indisponível, está trabalhando.',
          }}
        />
      </Secao>
    </>
  )
}
