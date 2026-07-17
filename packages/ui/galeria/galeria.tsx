import { useEffect, type ReactNode } from 'react'

import {
  Button, Menu, ItemMenu, SeparadorMenu, RotuloMenu,
  CampoForm, Campo, AreaTexto, Selecao, Caixa, Radio, GrupoRadio, Interruptor,
  Card, CardHeader, CardBody, CardFooter, StatCard, Tabela, EstadoVazio,
  Selo, Etiqueta, Avatar, GrupoAvatar,
  Alerta, ProvedorAvisos, useAviso, Giro, Progresso, Esqueleto,
  Dialogo, Gaveta, Dica,
  Abas, ListaAbas, Aba, PainelAba, Acordeao, ItemAcordeao,
  Trilha, ItemTrilha, Paginacao,
} from '@amboni/ui'

/**
 * A galeria — os 28 componentes, todos os estados que valem um pixel, num só lugar.
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * REGRA DESTE ARQUIVO: nada aqui pode mudar de um dia para o outro sozinho.
 *
 * É a diferença entre um teste visual que dura e um que é abandonado em três semanas.
 * Um `Math.random()`, um `new Date()` ou uma animação em curso fazem o print sair
 * diferente a cada rodada; o teste reprova sem culpado, e a primeira reação de quem chega
 * é rodar `--update-snapshots` sem olhar o diff — momento em que a suíte inteira deixa de
 * proteger qualquer coisa e vira ritual.
 *
 * Então, por construção:
 *
 *  · DADOS FIXOS. Nome, valor, data, contagem: tudo literal, escrito à mão abaixo. As
 *    datas são strings ("12/03/2026"), nunca `Date`. Nenhuma delas é "hoje" — se fosse,
 *    a baseline venceria à meia-noite.
 *  · SEM ANIMAÇÃO EM CURSO. O Playwright abre o contexto com `reducedMotion: 'reduce'`
 *    (ver playwright.config.ts) e todo componente da biblioteca já honra
 *    `prefers-reduced-motion` — o Giro para de girar, o Esqueleto para de pulsar, o modal
 *    entra sem deslizar. Sorte nenhuma: é contrato do CSS, e este teste passa a ser a
 *    prova de que ele continua valendo.
 *  · SEM HOVER. Estado de mouse não entra na galeria: depende de a seta estar sobre o
 *    elemento no instante do print, tem transição própria e é a origem clássica do print
 *    intermitente. Hover é coberto pelos testes de comportamento.
 *  · SEM IMAGEM DE FORA. O Avatar com `src` apontaria para a rede — mesmo problema da
 *    fonte. Aqui ele aparece só com iniciais, que é como 90% dos casos reais rodam.
 *
 * ESTADOS QUE ENTRAM: normal, foco (`:focus-visible`, forçado via `.focus()` pelo spec),
 * desabilitado, erro, carregando e vazio. São os cinco onde a cor sai do lugar comum —
 * exatamente onde uma troca de token quebra sem ninguém ver.
 */

/* ── Dados congelados ──────────────────────────────────────────────────────── */

const CLIENTES = [
  { id: 1, nome: 'Ana Souza', cidade: 'Criciúma', data: '12/03/2026', valor: 'R$ 8.888,00', status: 'Entregue' },
  { id: 2, nome: 'Bruno Lima', cidade: 'Florianópolis', data: '09/03/2026', valor: 'R$ 1.111,00', status: 'Enviado' },
  { id: 3, nome: 'Carla Dias', cidade: 'Tubarão', data: '02/03/2026', valor: 'R$ 4.250,00', status: 'Falhou' },
]

const OPCOES = [
  { valor: 'bling', rotulo: 'Bling' },
  { valor: 'omie', rotulo: 'Omie' },
  { valor: 'tiny', rotulo: 'Tiny' },
]

/* ── Peças do palco ───────────────────────────────────────────────────────── */

function Secao({ id, titulo, children }: { id: string; titulo: string; children: ReactNode }) {
  return (
    <section className="gal-secao" id={id} data-secao={id}>
      <h2>{titulo}</h2>
      {children}
    </section>
  )
}

function Item({ nome, children }: { nome: string; children: ReactNode }) {
  return (
    <div className="gal-item">
      <span className="gal-nome">{nome}</span>
      {children}
    </div>
  )
}

/** Ícone desenhado à mão: a biblioteca não depende de pacote de ícone, a galeria também não. */
function IconeBusca() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5 14 14" strokeLinecap="round" />
    </svg>
  )
}

/* ── Seções ───────────────────────────────────────────────────────────────── */

function Acao() {
  return (
    <Secao id="acao" titulo="Ação — Button, Menu">
      {/* `variant` explícito em todos, inclusive nos "primary": o padrão do Button é
          SECONDARY, não primary. A primeira versão desta galeria escrevia `<Button>` sob o
          rótulo "primary/sm" e pintava um botão secundário — o print entregou na hora, ao
          mostrar um botão branco onde o teal da marca deveria estar. Cena que mente é pior
          que cena que falta: ela vira baseline e passa a defender o errado. */}
      <div className="gal-fila gal-fila--fim">
        <Item nome="primary/sm"><Button variant="primary" size="sm">Salvar</Button></Item>
        <Item nome="primary/md"><Button variant="primary">Salvar</Button></Item>
        <Item nome="primary/lg"><Button variant="primary" size="lg">Salvar</Button></Item>
        <Item nome="secondary"><Button variant="secondary">Cancelar</Button></Item>
        <Item nome="ghost"><Button variant="ghost">Ver</Button></Item>
        <Item nome="danger"><Button variant="danger">Excluir</Button></Item>
      </div>
      <div className="gal-fila gal-fila--fim">
        <Item nome="loading"><Button variant="primary" loading>Salvando</Button></Item>
        <Item nome="disabled"><Button variant="primary" disabled>Indisponível</Button></Item>
        <Item nome="iconLeft"><Button variant="secondary" iconLeft={<IconeBusca />}>Buscar</Button></Item>
        <Item nome="só ícone"><Button variant="ghost" iconLeft={<IconeBusca />} aria-label="Buscar" /></Item>
        {/* O foco é aplicado pelo spec com .focus(): o anel só existe em :focus-visible,
            e CSS não consegue forçá-lo de fora. Por isso o id. */}
        <Item nome="foco"><Button variant="primary" id="alvo-foco-botao">Com foco</Button></Item>
      </div>
      <div className="gal-fila">
        <Item nome="block"><div style={{ width: 300 }}><Button variant="primary" block>Confirmar envio</Button></div></Item>
      </div>
      <div className="gal-fila">
        <Item nome="Menu (fechado)">
          <Menu gatilho={<Button variant="secondary">Ações</Button>}>
            <RotuloMenu>Pedido 4821</RotuloMenu>
            <ItemMenu onClick={() => {}}>Editar</ItemMenu>
            <ItemMenu onClick={() => {}}>Duplicar</ItemMenu>
            <SeparadorMenu />
            <ItemMenu perigo onClick={() => {}}>Excluir</ItemMenu>
          </Menu>
        </Item>
      </div>
    </Secao>
  )
}

function Formulario() {
  return (
    <Secao id="formulario" titulo="Formulário — CampoForm, Campo, AreaTexto, Selecao, Caixa, Radio, Interruptor">
      <div className="gal-grade">
        <CampoForm label="Nome" ajuda="Como aparece na nota">
          <Campo defaultValue="Ana Souza" />
        </CampoForm>
        <CampoForm label="E-mail" erro="E-mail inválido" obrigatorio>
          <Campo type="email" defaultValue="ana@" erro />
        </CampoForm>
        <CampoForm label="Bloqueado">
          <Campo defaultValue="Não editável" disabled />
        </CampoForm>
        <CampoForm label="Busca">
          <Campo iconeEsq={<IconeBusca />} defaultValue="iphone" placeholder="Buscar" />
        </CampoForm>
        <CampoForm label="Valor">
          <Campo prefixo="R$" sufixo=",00" defaultValue="1.250" />
        </CampoForm>
        <CampoForm label="Campo com foco">
          <Campo id="alvo-foco-campo" defaultValue="Focado" />
        </CampoForm>
      </div>

      <div className="gal-fila gal-fila--fim">
        <Item nome="sm"><Campo size="sm" aria-label="sm" defaultValue="sm" /></Item>
        <Item nome="md"><Campo size="md" aria-label="md" defaultValue="md" /></Item>
        <Item nome="lg"><Campo size="lg" aria-label="lg" defaultValue="lg" /></Item>
      </div>

      <div className="gal-grade gal-grade--2">
        <CampoForm label="Observações">
          <AreaTexto contador maxLength={280} defaultValue="Cliente pediu entrega após as 14h." rows={3} />
        </CampoForm>
        <CampoForm label="Integração">
          <Selecao opcoes={OPCOES} valor="bling" onChange={() => {}} />
        </CampoForm>
      </div>

      <div className="gal-fila">
        <Item nome="Selecao/erro">
          <Selecao aria-label="Com erro" opcoes={OPCOES} valor="" placeholder="Escolha" onChange={() => {}} erro="Obrigatório" />
        </Item>
        <Item nome="Selecao/disabled">
          <Selecao aria-label="Desabilitada" opcoes={OPCOES} valor="omie" onChange={() => {}} disabled />
        </Item>
      </div>

      <div className="gal-grade">
        <div className="gal-item">
          <span className="gal-nome">Caixa</span>
          <Caixa label="Lembrar de mim" descricao="Neste computador" defaultChecked />
          <Caixa label="Parcial" indeterminado />
          <Caixa label="Desabilitada" disabled />
          <Caixa label="Com erro" erro="Aceite para continuar" />
        </div>
        <div className="gal-item">
          <span className="gal-nome">Radio</span>
          <GrupoRadio label="Canal" name="canal" value="wa" onChange={() => {}}>
            <Radio value="wa" label="WhatsApp" descricao="Template aprovado" />
            <Radio value="sms" label="SMS" />
            <Radio value="voz" label="Ligação" disabled />
          </GrupoRadio>
        </div>
        <div className="gal-item">
          <span className="gal-nome">Interruptor</span>
          <Interruptor label="Enviar automaticamente" descricao="Vale na hora" defaultChecked />
          <Interruptor label="Desligado" />
          <Interruptor label="Desabilitado" disabled />
          <Interruptor size="sm" label="Pequeno" defaultChecked />
        </div>
      </div>
    </Secao>
  )
}

function Dados() {
  return (
    <Secao id="dados" titulo="Superfície e dados — Card, StatCard, Tabela, EstadoVazio">
      <div className="gal-grade">
        {(['flat', 'raised', 'floating'] as const).map(e => (
          <Card key={e} elevation={e}>
            <CardHeader title="Campanhas" subtitle={`elevation ${e}`} action={<Button size="sm" variant="ghost">Ver</Button>} />
            <CardBody>Três campanhas ativas, 195 clientes na fila.</CardBody>
            <CardFooter><Button size="sm">Abrir</Button></CardFooter>
          </Card>
        ))}
      </div>

      {/**
        * Texto longo demais para a caixa — o caso que o Card.css trata com `min-width: 0`
        * no `.amb-card__header-txt` e chama, no próprio comentário, de "a regra menos
        * óbvia deste arquivo".
        *
        * É o contrato: quando o título não cabe, quem CEDE é o título; a ação continua
        * dentro do card. Sem aquele `min-width: 0`, o item de grid/flex se recusa a ficar
        * menor que o próprio texto (o `min-width: auto` que todo item traz de fábrica) e
        * empurra o botão para fora — a mesma família de defeito da busca do docs presa em
        * 108px, e da tabela que estoura a página.
        *
        * A regra é uma linha de CSS que qualquer refactor apaga sem querer, e nada a
        * defendia: em jsdom todo mundo mede zero. O container de 320px força o aperto sem
        * depender do tamanho da janela.
        */}
      <div className="gal-fila">
        <div style={{ width: 320 }}>
          <Card elevation="raised" id="card-texto-longo">
            <CardHeader
              title="Relatório consolidado de reativação de clientes inativos do último trimestre"
              subtitle="supercalifragilisticoexpialidoso-e-mais-um-tanto-para-nao-ter-onde-quebrar"
              action={<Button size="sm" id="acao-do-card">Ver</Button>}
            />
            <CardBody>Conteúdo curto.</CardBody>
          </Card>
        </div>
      </div>

      <div className="gal-grade">
        <StatCard label="Investido" value="R$ 1.994,31" sub="159.111 exibições" />
        <StatCard label="Conversas" value="140" tone="success" delta={{ percent: 12, betterWhenUp: true }} />
        <StatCard label="Custo por conversa" value="R$ 14,25" tone="warning" delta={{ percent: 46, betterWhenUp: false }} />
        <StatCard label="Carregando" value={null} />
        <StatCard label="Vazio" value="—" emptyReason="precisa de vendas atribuídas" />
        <StatCard label="Falhas" value="3" tone="danger" />
      </div>

      <Tabela
        rotulo="Clientes"
        colunas={[
          { chave: 'nome', titulo: 'Cliente', ordenavel: true },
          { chave: 'cidade', titulo: 'Cidade' },
          { chave: 'data', titulo: 'Compra' },
          { chave: 'status', titulo: 'Status', render: l => <Selo tom={l.status === 'Falhou' ? 'perigo' : l.status === 'Entregue' ? 'sucesso' : 'info'}>{l.status}</Selo> },
          { chave: 'valor', titulo: 'Valor', numerico: true, largura: '120px' },
        ]}
        linhas={CLIENTES}
        chaveLinha={l => l.id}
        ordem={{ coluna: 'nome', direcao: 'asc' }}
        onOrdenar={() => {}}
        selecionaveis
        selecionadas={[1]}
        onSelecionar={() => {}}
      />

      {/**
        * Coluna fixa, dentro de um container ESTREITO (420px) de propósito.
        *
        * A tabela é `width: 100%` com `table-layout: auto`: dar larguras grandes às
        * colunas não faz ela transbordar, porque o navegador trata `<col width>` como
        * sugestão e comprime tudo para caber. Descobri isso aqui — a primeira versão
        * deste teste reprovou na própria guarda ("a tabela cabe na tela"), que é
        * exatamente o trabalho dela: avisar que o cenário não estava exercendo o sticky.
        *
        * O transbordo de verdade vem do conteúdo não caber no CONTAINER — que é como
        * acontece no produto (tabela de 7 colunas num painel lateral, ou num celular).
        * 420px força o caso real, e o `position: sticky` da coluna fixa passa a ter o que
        * fazer.
        */}
      <div id="tabela-fixa" style={{ width: 420 }}>
        <Tabela
          rotulo="Pedidos (coluna fixa)"
          colunaFixa
          colunas={[
            { chave: 'nome', titulo: 'Cliente', largura: '160px' },
            { chave: 'cidade', titulo: 'Cidade', largura: '140px' },
            { chave: 'data', titulo: 'Compra', largura: '120px' },
            { chave: 'status', titulo: 'Status', largura: '120px' },
            { chave: 'valor', titulo: 'Valor', numerico: true, largura: '140px' },
          ]}
          linhas={CLIENTES}
          chaveLinha={l => l.id}
        />
      </div>

      {/* Carregando e vazia usam o MESMO tipo de linha da tabela cheia (o `chave` da
          coluna tem que ser um campo real de Cliente — o TypeScript exige `render` se não
          for). Repetir o tipo aqui em vez de inventar um `{ id }` mantém a cena honesta:
          é a mesma tabela, sem linha. */}
      <div className="gal-grade gal-grade--2">
        <Tabela<(typeof CLIENTES)[number]>
          rotulo="Carregando"
          colunas={[{ chave: 'nome', titulo: 'Cliente' }, { chave: 'valor', titulo: 'Valor', numerico: true }]}
          linhas={[]}
          chaveLinha={l => l.id}
          carregando
          linhasEsqueleto={3}
        />
        <Tabela<(typeof CLIENTES)[number]>
          rotulo="Vazia"
          colunas={[{ chave: 'nome', titulo: 'Cliente' }, { chave: 'valor', titulo: 'Valor', numerico: true }]}
          linhas={[]}
          chaveLinha={l => l.id}
          vazio={<EstadoVazio titulo="Nenhum cliente" descricao="Limpe o filtro para ver todos" acao={<Button size="sm">Limpar filtro</Button>} />}
        />
      </div>
    </Secao>
  )
}

function Identidade() {
  return (
    <Secao id="identidade" titulo="Identidade e status — Selo, Etiqueta, Avatar">
      {(['suave', 'solido', 'contorno'] as const).map(v => (
        <div className="gal-fila" key={v}>
          <Item nome={v}>
            <div className="gal-fila">
              <Selo variante={v} tom="neutro">Rascunho</Selo>
              <Selo variante={v} tom="marca">Ativo</Selo>
              <Selo variante={v} tom="sucesso">Entregue</Selo>
              <Selo variante={v} tom="aviso">Pendente</Selo>
              <Selo variante={v} tom="perigo">Falhou</Selo>
              <Selo variante={v} tom="info">Enviado</Selo>
              <Selo variante={v} tom="sucesso" pontinho>Com pontinho</Selo>
              <Selo variante={v} tom="marca" size="sm">sm</Selo>
            </div>
          </Item>
        </div>
      ))}

      <div className="gal-fila">
        <Etiqueta>Simples</Etiqueta>
        <Etiqueta tom="marca" icone={<IconeBusca />}>Com ícone</Etiqueta>
        <Etiqueta tom="info" removivel onRemover={() => {}} rotuloRemover="Remover filtro Ativos">Ativos</Etiqueta>
        <Etiqueta tom="sucesso" size="sm" removivel onRemover={() => {}} rotuloRemover="Remover">SC</Etiqueta>
        <Etiqueta tom="perigo" onClick={() => {}}>Clicável</Etiqueta>
      </div>

      <div className="gal-fila gal-fila--fim">
        {(['xs', 'sm', 'md', 'lg'] as const).map(s => <Avatar key={s} nome="Maria Silva Santos" size={s} />)}
        <Avatar nome="João Pedro" status="online" />
        <Avatar nome="Ana Souza" status="ausente" />
        <Avatar nome="Bruno Lima" status="offline" />
        <Avatar nome="Carla Dias" formato="quadrado" />
        <GrupoAvatar max={3}>
          <Avatar nome="Ana Souza" />
          <Avatar nome="Bruno Lima" />
          <Avatar nome="Carla Dias" />
          <Avatar nome="Diego Alves" />
          <Avatar nome="Elena Rocha" />
        </GrupoAvatar>
      </div>
    </Secao>
  )
}

function Retorno() {
  return (
    <Secao id="retorno" titulo="Retorno — Alerta, Giro, Progresso, Esqueleto">
      <Alerta tom="info" titulo="Sincronização agendada">Roda todo dia às 6h.</Alerta>
      <Alerta tom="sucesso" titulo="Salvo">As alterações já valem para os próximos envios.</Alerta>
      <Alerta tom="aviso" titulo="Token expira em 3 dias" acao={<Button size="sm" variant="secondary">Renovar</Button>}>
        Renove antes para não interromper a fila.
      </Alerta>
      <Alerta tom="perigo" titulo="Falha no envio" dispensavel onDispensar={() => {}}>
        3 mensagens não foram entregues.
      </Alerta>

      <div className="gal-fila gal-fila--fim">
        {/* Parado no print por reducedMotion: 'reduce'. É contrato, não sorte — Giro.css
            tem @media (prefers-reduced-motion: reduce). */}
        <Item nome="Giro/sm"><Giro size="sm" /></Item>
        <Item nome="Giro/md"><Giro /></Item>
        <Item nome="Giro/lg"><Giro size="lg" /></Item>
      </div>

      <div className="gal-grade gal-grade--2">
        <Progresso valor={42} rotulo="Enviando" mostrarValor />
        <Progresso valor={100} tom="success" rotulo="Concluído" mostrarValor />
        <Progresso valor={70} tom="warning" size="sm" rotulo="Cota" />
        <Progresso valor={15} tom="danger" size="lg" rotulo="Falhas" mostrarValor />
        <Progresso indeterminado rotulo="Sincronizando" />
        <Esqueleto linhas={3} />
      </div>
      <div className="gal-fila">
        <Esqueleto variante="circulo" largura={40} altura={40} />
        <Esqueleto variante="retangulo" largura={200} altura={40} />
      </div>
    </Secao>
  )
}

function Navegacao() {
  return (
    <Secao id="navegacao" titulo="Navegação — Abas, Acordeao, Trilha, Paginacao">
      {(['linha', 'pilula'] as const).map(v => (
        <Abas key={v} valor="a" onChange={() => {}} variante={v}>
          <ListaAbas aria-label={`Períodos ${v}`}>
            <Aba valor="a">7 dias</Aba>
            <Aba valor="b" contador={3}>30 dias</Aba>
            <Aba valor="c" disabled>90 dias</Aba>
          </ListaAbas>
          <PainelAba valor="a">Conteúdo da aba de 7 dias.</PainelAba>
        </Abas>
      ))}

      <Acordeao tipo="multiplo" valorPadrao={['a']}>
        <ItemAcordeao valor="a" titulo="Dados pessoais">Nome, telefone e cidade.</ItemAcordeao>
        <ItemAcordeao valor="b" titulo="Endereço">Rua, número e CEP.</ItemAcordeao>
        <ItemAcordeao valor="c" titulo="Pagamento">Forma e parcelas.</ItemAcordeao>
      </Acordeao>

      <Trilha>
        <ItemTrilha href="/">Início</ItemTrilha>
        <ItemTrilha href="/clientes">Clientes</ItemTrilha>
        <ItemTrilha>Maria Silva</ItemTrilha>
      </Trilha>

      <Paginacao pagina={3} totalPaginas={10} onChange={() => {}} totalItens={195} porPagina={20} onPorPaginaChange={() => {}} />
      <Paginacao pagina={1} totalPaginas={1} onChange={() => {}} totalItens={4} porPagina={20} />
    </Secao>
  )
}

/* ── Cenas de sobreposição ────────────────────────────────────────────────── */
/**
 * Modal, gaveta, dica e menu saem em cena PRÓPRIA, e a foto é da janela inteira.
 *
 * Dois motivos. Eles renderizam em portal, fora da seção — fotografar a seção não pegaria
 * nada. E o que interessa neles é justamente a relação com a JANELA: o fundo escurecido
 * cobrindo tudo, o modal centralizado, a gaveta colada na borda. Foi aí que o `<dialog>`
 * esticou para 802px numa tela de 800 (content-box) e ninguém viu por meses.
 */

function CenaDialogo({ size }: { size: 'sm' | 'md' | 'lg' | 'full' }) {
  return (
    <div className="gal-cena">
      <p>Conteúdo do fundo, para o escurecimento ter o que cobrir.</p>
      <Dialogo
        aberto
        onFechar={() => {}}
        size={size}
        titulo="Excluir campanha?"
        descricao="Os 195 clientes na fila param de receber. Não dá para desfazer."
        rodape={
          <>
            <Button variant="secondary">Cancelar</Button>
            <Button variant="danger">Excluir</Button>
          </>
        }
      >
        <p style={{ marginTop: 0 }}>A campanha "Win-back 90 dias" está ativa desde 12/03/2026.</p>
        <Alerta tom="aviso" titulo="3 mensagens já saíram">Essas não voltam atrás.</Alerta>
      </Dialogo>
    </div>
  )
}

function CenaGaveta({ lado }: { lado: 'esquerda' | 'direita' | 'baixo' }) {
  return (
    <div className="gal-cena">
      <p>Conteúdo do fundo.</p>
      <Gaveta
        aberto
        onFechar={() => {}}
        lado={lado}
        titulo="Filtros"
        descricao="Valem para a lista inteira."
        rodape={<><Button variant="ghost">Limpar</Button><Button>Aplicar</Button></>}
      >
        <CampoForm label="Cidade"><Campo defaultValue="Criciúma" /></CampoForm>
        <CampoForm label="Integração"><Selecao opcoes={OPCOES} valor="bling" onChange={() => {}} /></CampoForm>
        <Caixa label="Somente com telefone" defaultChecked />
      </Gaveta>
    </div>
  )
}

/**
 * Dica e Menu abrem por INTERAÇÃO, e quem interage é o spec — não a cena.
 *
 * A primeira versão tentava abrir os dois aqui, num `useEffect`. As duas falharam, cada
 * uma do seu jeito, e as duas em silêncio: a Dica porque um `FocusEvent` fabricado à mão
 * não borbulha (o React ouve `focusin`, não `focus`), e o Menu porque o efeito rodou duas
 * vezes sob StrictMode — abriu e fechou. Os prints saíram com a tela vazia e teriam virado
 * baseline: o teste passaria a exigir que o menu NÃO abrisse.
 *
 * A lição vale além daqui: evento sintético imita o usuário e erra nos detalhes que
 * importam. `locator.focus()` e `locator.click()` do Playwright acionam o navegador de
 * verdade. A cena entrega o palco pronto; quem age é o teste.
 *
 * O gatilho de cada dica tem id próprio para o spec focar um por vez — com foco, só um
 * lado pode estar aberto por print, e são justamente os quatro lados que valem verificar.
 */
function CenaDica() {
  return (
    <div className="gal-cena" style={{ display: 'flex', gap: 80, padding: 120, flexWrap: 'wrap' }}>
      {(['cima', 'baixo', 'esq', 'dir'] as const).map(l => (
        // `atraso={0}`: o meio segundo de espera do hover existe para o mouse atravessar a
        // tela sem acender dicas pelo caminho. Num teste, é meio segundo de corrida contra
        // o print — e no foco por teclado o componente já ignora o atraso.
        <Dica key={l} conteudo="Enviado pelo robô em 12/03/2026" lado={l} atraso={0}>
          <Button id={`gatilho-dica-${l}`} variant="secondary">{`lado ${l}`}</Button>
        </Dica>
      ))}
    </div>
  )
}

function CenaMenu() {
  return (
    <div className="gal-cena" style={{ padding: 40 }}>
      <Menu gatilho={<Button id="gatilho-menu" variant="secondary">Ações</Button>}>
        <RotuloMenu>Pedido 4821</RotuloMenu>
        <ItemMenu onClick={() => {}}>Editar</ItemMenu>
        <ItemMenu onClick={() => {}}>Duplicar</ItemMenu>
        <SeparadorMenu />
        <ItemMenu perigo onClick={() => {}}>Excluir</ItemMenu>
      </Menu>
    </div>
  )
}

function DispararAvisos() {
  const aviso = useAviso()
  useEffect(() => {
    // `fixo` para não sumirem no meio do print — o timer é o inimigo do teste estável
    aviso.sucesso('Campanha salva', { descricao: '195 clientes na fila', fixo: true })
    aviso.erro('Falha ao sincronizar', { descricao: 'O Bling não respondeu', fixo: true, acao: { rotulo: 'Tentar de novo', onClick: () => {} } })
    aviso.aviso('Token expira em 3 dias', { fixo: true })
    aviso.info('Sincronização agendada para as 6h', { fixo: true })
  }, [aviso])
  return <p>Conteúdo do fundo.</p>
}

function CenaAviso() {
  return (
    <div className="gal-cena">
      <ProvedorAvisos limite={4}>
        <DispararAvisos />
      </ProvedorAvisos>
    </div>
  )
}

/* ── Roteador burro ───────────────────────────────────────────────────────── */

const CENAS: Record<string, () => ReactNode> = {
  'dialogo-sm': () => <CenaDialogo size="sm" />,
  'dialogo-md': () => <CenaDialogo size="md" />,
  'dialogo-lg': () => <CenaDialogo size="lg" />,
  'dialogo-full': () => <CenaDialogo size="full" />,
  'gaveta-direita': () => <CenaGaveta lado="direita" />,
  'gaveta-esquerda': () => <CenaGaveta lado="esquerda" />,
  'gaveta-baixo': () => <CenaGaveta lado="baixo" />,
  dica: () => <CenaDica />,
  menu: () => <CenaMenu />,
  aviso: () => <CenaAviso />,
}

export function Galeria({ cena }: { cena: string }) {
  const especial = CENAS[cena]
  if (especial) return <>{especial()}</>

  return (
    <div className="gal">
      <Acao />
      <Formulario />
      <Dados />
      <Identidade />
      <Retorno />
      <Navegacao />
    </div>
  )
}
