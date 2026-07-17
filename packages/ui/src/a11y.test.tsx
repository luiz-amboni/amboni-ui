import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import * as matchers from 'vitest-axe/matchers'

import {
  Button, Menu, ItemMenu, SeparadorMenu,
  CampoForm, Campo, AreaTexto, Selecao, Caixa, Radio, GrupoRadio, Interruptor,
  Card, CardHeader, CardBody, CardFooter, StatCard, Tabela, EstadoVazio,
  Selo, Etiqueta, Avatar, GrupoAvatar,
  Alerta, ProvedorAvisos, Giro, Progresso, Esqueleto,
  Dica,
  Abas, ListaAbas, Aba, PainelAba, Acordeao, ItemAcordeao,
  Trilha, ItemTrilha, Paginacao,
} from './index'
// Direto do arquivo, e não do `./index`: estes três ainda não estão exportados na porta de
// entrada da biblioteca. A auditoria não espera o export — um componente sem `index` já é
// usado pelas telas e já pode ter rótulo faltando.
import { Popover } from './components/Popover'
import { Autocomplete } from './components/Autocomplete'
import { Deslizador } from './components/Deslizador'

// Do `index`, e não do arquivo: importar por caminho aqui esconderia o dia em que alguém
// criasse um componente e esquecesse de exportá-lo — o axe passaria, e quem instalasse a
// biblioteca não teria o componente. A auditoria tem que ver o que o PACOTE entrega.
import {
  CampoArquivo, LinhaDoTempo, Passos, Divisor, Tecla,
  Calendario, CampoData, CampoPeriodo,
} from './index'

expect.extend(matchers)

/**
 * O axe — a auditoria que a biblioteca deveria ter desde o primeiro dia.
 *
 * Nós dizíamos "acessível por prova" e provávamos exatamente UMA coisa: contraste de
 * token. Contraste é a parte fácil, porque é aritmética. O resto da acessibilidade — o
 * rótulo que não existe, o `aria-controls` apontando para um id que sumiu, o papel ARIA
 * exigindo um filho que não veio, o id duplicado quando o componente aparece duas vezes
 * na tela — nada disso era verificado. Era palavra.
 *
 * O axe-core é o mesmo motor do Lighthouse e das extensões de auditoria. Ele não pega
 * tudo (nenhuma ferramenta pega: julgamento continua sendo humano, e é por isso que os
 * testes de comportamento ao lado deste arquivo existem), mas o que ele pega é
 * indiscutível e some do código antes de chegar em produção.
 *
 * Cada componente entra aqui na configuração REAL de uso, não numa vitrine: campo dentro
 * do CampoForm, aba dentro da lista de abas. Testar um `<Aba>` solto passaria e não
 * significaria nada — ninguém usa aba solta.
 */

/** jsdom não faz layout, então regra que depende de pixel não roda. Fora essas, tudo. */
const conferir = async (ui: React.ReactElement) => {
  const { container } = render(ui)
  expect(await axe(container)).toHaveNoViolations()
}

describe('axe — ação', () => {
  test('Button, todas as variantes', async () => {
    await conferir(
      <>
        <Button variant="primary">Salvar</Button>
        <Button variant="secondary">Cancelar</Button>
        <Button variant="ghost">Ver</Button>
        <Button variant="danger">Excluir</Button>
        <Button loading>Salvando</Button>
        <Button disabled>Indisponível</Button>
        {/* Só ícone: é aqui que quase toda biblioteca falha — botão sem nome acessível. */}
        <Button iconLeft={<span>✕</span>} aria-label="Fechar" />
      </>,
    )
  })

  test('Menu aberto, com item de perigo e separador', async () => {
    await conferir(
      <Menu gatilho={<Button>Ações</Button>}>
        <ItemMenu onClick={() => {}}>Editar</ItemMenu>
        <SeparadorMenu />
        <ItemMenu perigo onClick={() => {}}>Excluir</ItemMenu>
      </Menu>,
    )
  })
})

describe('axe — formulário', () => {
  test('CampoForm + Campo, com erro e ajuda', async () => {
    await conferir(
      <CampoForm label="E-mail" ajuda="Usamos para o aviso de entrega" erro="E-mail inválido" obrigatorio>
        <Campo type="email" defaultValue="joao@" />
      </CampoForm>,
    )
  })

  test('AreaTexto com contador', async () => {
    await conferir(
      <CampoForm label="Observações">
        <AreaTexto contador maxLength={500} />
      </CampoForm>,
    )
  })

  test('Autocomplete: fechado, aberto, múltiplo e com erro', async () => {
    const opcoes = [{ valor: '1', rotulo: 'Ana Souza' }, { valor: '2', rotulo: 'Bruno Lima' }]
    await conferir(
      <>
        <CampoForm label="Cliente">
          <Autocomplete opcoes={opcoes} valor={null} onChange={() => {}} />
        </CampoForm>
        {/* Múltiplo: é aqui que moram as etiquetas dentro do campo — dois botões "Remover"
            sem nome próprio passariam batido numa vitrine de um item só. */}
        <Autocomplete aria-label="Clientes" multiplo opcoes={opcoes} valor={['1', '2']} onChange={() => {}} />
        <Autocomplete aria-label="Com erro" opcoes={opcoes} valor={null} onChange={() => {}} erro="Escolha um cliente" />
      </>,
    )
  })

  test('Autocomplete com a LISTA ABERTA — é o estado que o axe nunca vê', async () => {
    // Testar o campo fechado é testar um <input>. O contrato ARIA inteiro (listbox, option,
    // activedescendant apontando para um id que existe) só existe com a lista aberta.
    const { container } = render(
      <Autocomplete
        aria-label="Cliente"
        opcoes={[{ valor: '1', rotulo: 'Ana Souza' }, { valor: '2', rotulo: 'Bruno Lima', desabilitada: true }]}
        valor={null}
        onChange={() => {}}
        criarNovo={() => {}}
      />,
    )
    await userEvent.click(screen.getByRole('combobox'))
    expect(await axe(container)).toHaveNoViolations()
  })

  test('Deslizador nos dois modos', async () => {
    await conferir(
      <>
        <CampoForm label="Preço máximo">
          <Deslizador valor={50} onChange={() => {}} formatarRotulo={v => `R$ ${v}`} mostrarValor />
        </CampoForm>
        {/* Duas pontas: dois role="slider" irmãos. Nome repetido nos dois é exatamente o que
            uma vitrine de um slider só nunca pegaria. */}
        <Deslizador
          intervalo aria-label="Faixa de preço" valor={[20, 80]} onChange={() => {}}
          marcas={[{ valor: 0 }, { valor: 50 }, { valor: 100 }]}
        />
        <Deslizador aria-label="Indisponível" disabled valor={10} onChange={() => {}} />
      </>,
    )
  })

  test('Selecao nos dois modos', async () => {
    const opcoes = [{ valor: 'a', rotulo: 'Bling' }, { valor: 'b', rotulo: 'Omie' }]
    await conferir(
      <>
        <CampoForm label="Integração">
          <Selecao opcoes={opcoes} valor="a" onChange={() => {}} />
        </CampoForm>
        <Selecao aria-label="Integração buscável" buscavel opcoes={opcoes} valor="a" onChange={() => {}} />
      </>,
    )
  })

  test('CampoArquivo: vazio, com anexos e enviando', async () => {
    const anexo = new File(['x'], 'contrato.pdf', { type: 'application/pdf' })
    await conferir(
      <>
        {/* Vazio. É aqui que a técnica do input escondido aparece: com `display: none` o
            axe reprovaria o <label> apontando para um elemento fora da árvore. */}
        <CampoArquivo onArquivos={() => {}} aceita=".pdf" tamanhoMax={5 * 1024 * 1024} ajuda="PDF" />
        <CampoArquivo
          onArquivos={() => {}}
          onRemover={() => {}}
          arquivos={[anexo]}
          progresso={42}
          rotulo="Anexar contrato"
        />
        <CampoArquivo onArquivos={() => {}} disabled />
      </>,
    )
  })

  test('Caixa, Radio e Interruptor', async () => {
    await conferir(
      <>
        <Caixa label="Lembrar de mim" descricao="Neste computador" />
        <Caixa label="Parcial" indeterminado />
        <GrupoRadio label="Canal" name="canal" value="wa" onChange={() => {}}>
          <Radio value="wa" label="WhatsApp" />
          <Radio value="sms" label="SMS" />
        </GrupoRadio>
        <Interruptor label="Enviar automaticamente" descricao="Vale na hora" />
      </>,
    )
  })

  test('Calendario: dia escolhido, hoje, min/max e dias bloqueados', async () => {
    // A grade é uma <table role="grid"> com célula focável, aria-selected e aria-current
    // convivendo — é o tipo de coisa que o axe reprova na hora se o papel exigir um filho
    // que não veio, ou se um gridcell aparecer fora de uma linha.
    await conferir(
      <Calendario
        valor={new Date(2026, 5, 15)}
        onChange={() => {}}
        min={new Date(2026, 5, 1)}
        max={new Date(2026, 5, 30)}
        desabilitar={d => d.getDay() === 0}
      />,
    )
  })

  test('CampoData: com máscara dentro do CampoForm, nativo, e com erro', async () => {
    await conferir(
      <>
        <CampoForm label="Data da venda" ajuda="dd/mm/aaaa">
          <CampoData valor={new Date(2026, 5, 15)} onChange={() => {}} />
        </CampoForm>
        {/* O modo nativo é um <input type="date">: sem rótulo, é um campo mudo. */}
        <CampoData aria-label="Data de nascimento" nativo valor={null} onChange={() => {}} />
        <CampoData aria-label="Data com erro" valor={null} onChange={() => {}} erro="Data inválida" />
      </>,
    )
  })

  test('CampoData com o CALENDÁRIO ABERTO — o diálogo só existe aberto', async () => {
    // Fechado, isto é um <input> com um botão. O contrato inteiro (role=dialog com nome,
    // a grade, o aria-expanded apontando para algo que existe) só nasce no clique.
    const { container } = render(
      <CampoData aria-label="Data da venda" valor={new Date(2026, 5, 15)} onChange={() => {}} />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Abrir calendário' }))
    expect(await axe(container)).toHaveNoViolations()
  })

  test('CampoPeriodo: fechado, com valor, e com o PAINEL ABERTO', async () => {
    await conferir(
      <CampoPeriodo
        aria-label="Período"
        valor={{ inicio: new Date(2026, 5, 15), fim: new Date(2026, 5, 30) }}
        onChange={() => {}}
      />,
    )

    // Aberto: o painel junta atalhos, grade e o intervalo marcado de ponta a ponta — seis
    // gridcells com aria-selected numa grade que precisa se declarar multiselecionável.
    const { container } = render(
      <CampoPeriodo aria-label="Período do relatório" valor={{ inicio: null, fim: null }} onChange={() => {}} />,
    )
    await userEvent.click(screen.getByRole('button', { name: /Período do relatório/ }))
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('axe — dados', () => {
  test('Card completo', async () => {
    await conferir(
      <Card>
        <CardHeader title="Campanhas" subtitle="ativas primeiro" action={<Button size="sm">Ver</Button>} />
        <CardBody>Conteúdo</CardBody>
        <CardFooter>Rodapé</CardFooter>
      </Card>,
    )
  })

  test('StatCard nos três estados', async () => {
    await conferir(
      <>
        <StatCard label="Investido" value="R$ 1.994,31" sub="159.111 exibições" />
        <StatCard label="Carregando" value={null} />
        <StatCard label="Vazio" value="—" emptyReason="precisa de vendas atribuídas" />
        <StatCard label="Custo" value="R$ 14,25" delta={{ percent: 46, betterWhenUp: false }} />
      </>,
    )
  })

  test('Tabela com ordenação e seleção', async () => {
    const linhas = [{ id: 1, nome: 'Ana Souza', valor: 8888 }, { id: 2, nome: 'Bruno Lima', valor: 1111 }]
    await conferir(
      <Tabela
        rotulo="Clientes"
        colunas={[
          { chave: 'nome', titulo: 'Cliente', ordenavel: true },
          { chave: 'valor', titulo: 'Valor', numerico: true, largura: '110px' },
        ]}
        linhas={linhas}
        chaveLinha={l => l.id}
        ordem={{ coluna: 'valor', direcao: 'desc' }}
        onOrdenar={() => {}}
        selecionaveis
        selecionadas={[1]}
        onSelecionar={() => {}}
      />,
    )
  })

  test('Tabela carregando e vazia', async () => {
    await conferir(
      <>
        <Tabela rotulo="A" colunas={[{ chave: 'x', titulo: 'X', render: () => null }]} linhas={[]} chaveLinha={() => 1} carregando />
        <Tabela
          rotulo="B"
          colunas={[{ chave: 'x', titulo: 'X', render: () => null }]}
          linhas={[]}
          chaveLinha={() => 1}
          vazio={<EstadoVazio titulo="Nenhum cliente" descricao="Limpe o filtro" acao={<Button>Limpar</Button>} />}
        />
      </>,
    )
  })
})

describe('axe — identidade', () => {
  test('Selo, Etiqueta e Avatar', async () => {
    await conferir(
      <>
        <Selo tom="sucesso">Entregue</Selo>
        <Selo tom="perigo" variante="solido">Falhou</Selo>
        <Etiqueta removivel onRemover={() => {}} rotuloRemover="Remover filtro Ativos">Ativos</Etiqueta>
        <Avatar nome="Maria Silva Santos" />
        <Avatar nome="João Pedro" status="online" />
        <GrupoAvatar max={2}>
          <Avatar nome="Ana Souza" />
          <Avatar nome="Bruno Lima" />
          <Avatar nome="Carla Dias" />
        </GrupoAvatar>
      </>,
    )
  })
})

describe('axe — retorno', () => {
  test('Alerta nos quatro tons', async () => {
    await conferir(
      <>
        <Alerta tom="info" titulo="Aviso">Texto</Alerta>
        <Alerta tom="sucesso" titulo="Salvo">Texto</Alerta>
        <Alerta tom="aviso" titulo="Atenção">Texto</Alerta>
        <Alerta tom="perigo" titulo="Erro" dispensavel onDispensar={() => {}}>Texto</Alerta>
      </>,
    )
  })

  test('Giro, Progresso e Esqueleto', async () => {
    await conferir(
      <>
        <Giro />
        <Progresso valor={42} rotulo="Enviando" mostrarValor />
        <Progresso indeterminado rotulo="Sincronizando" />
        <Esqueleto linhas={3} />
      </>,
    )
  })

  test('ProvedorAvisos com a região viva vazia', async () => {
    await conferir(<ProvedorAvisos><p>app</p></ProvedorAvisos>)
  })
})

describe('axe — navegação', () => {
  test('Abas nas duas variantes', async () => {
    await conferir(
      <Abas valor="a" onChange={() => {}}>
        <ListaAbas aria-label="Períodos">
          <Aba valor="a">7 dias</Aba>
          <Aba valor="b" contador={3}>30 dias</Aba>
          <Aba valor="c" disabled>90 dias</Aba>
        </ListaAbas>
        <PainelAba valor="a">Conteúdo</PainelAba>
      </Abas>,
    )
  })

  test('Acordeao', async () => {
    await conferir(
      <Acordeao tipo="multiplo" valorPadrao={['a']}>
        <ItemAcordeao valor="a" titulo="Dados pessoais">Conteúdo</ItemAcordeao>
        <ItemAcordeao valor="b" titulo="Endereço">Conteúdo</ItemAcordeao>
      </Acordeao>,
    )
  })

  test('Trilha e Paginacao', async () => {
    await conferir(
      <>
        <Trilha>
          <ItemTrilha href="/">Início</ItemTrilha>
          <ItemTrilha href="/clientes">Clientes</ItemTrilha>
          <ItemTrilha>Maria Silva</ItemTrilha>
        </Trilha>
        <Paginacao pagina={3} totalPaginas={10} onChange={() => {}} totalItens={195} porPagina={20} onPorPaginaChange={() => {}} />
      </>,
    )
  })

  test('Dica', async () => {
    await conferir(
      <Dica conteudo="Enviado pelo robô">
        <Button>Passe o mouse</Button>
      </Dica>,
    )
  })

  test('Popover ABERTO, com conteúdo interativo', async () => {
    // Fechado, o Popover é um botão — e auditar um botão aqui não significaria nada. O que
    // este componente promete (role="dialog" COM NOME, aria-modal="false", controles
    // alcançáveis dentro) só existe depois do clique. É por isso que este teste não usa o
    // `conferir`: precisa interagir antes de auditar.
    const { container } = render(
      <Popover rotulo="Filtros" gatilho={<Button>Filtrar</Button>}>
        <CampoForm label="Nome do cliente">
          <Campo />
        </CampoForm>
        <Button size="sm">Aplicar</Button>
      </Popover>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Filtrar' }))
    expect(await axe(container)).toHaveNoViolations()
  })

  test('Passos: só indicação e navegável, com erro no meio', async () => {
    const passos = [
      { id: 'dados', titulo: 'Dados' },
      { id: 'end', titulo: 'Endereço', descricao: 'CEP e número', estado: 'erro' as const },
      { id: 'pag', titulo: 'Pagamento' },
    ]
    await conferir(
      <>
        <Passos passos={passos} atual={2} />
        {/* Navegável: aqui existem <button> e um marco <nav>, e o axe confere os nomes. */}
        <Passos passos={passos} atual={2} onIrPara={() => {}} orientacao="vertical" aria-label="Etapas do cadastro" />
      </>,
    )
  })
})

describe('axe — estrutura', () => {
  test('LinhaDoTempo nos seis tons e nas duas orientações', async () => {
    const itens = [
      { id: 1, titulo: 'Pedido criado', data: '2026-07-14T09:00:00-03:00', tom: 'marca' as const },
      { id: 2, titulo: 'Mensagem entregue', descricao: 'D+3', data: '2026-07-16T14:33:00-03:00', tom: 'sucesso' as const },
      { id: 3, titulo: 'Envio falhou', data: '2026-07-16T14:35:00-03:00', tom: 'perigo' as const },
      { id: 4, titulo: 'Aguardando resposta', data: '2026-07-16', tom: 'aviso' as const },
      { id: 5, titulo: 'Observação', data: '2026-07-16', tom: 'info' as const },
      { id: 6, titulo: 'Sem classificação', data: '2026-07-16', dataTexto: 'hoje' },
    ]
    await conferir(
      <>
        <LinhaDoTempo itens={itens} />
        <LinhaDoTempo itens={itens} orientacao="horizontal" compacta />
      </>,
    )
  })

  test('Divisor e Tecla', async () => {
    await conferir(
      <>
        <Divisor />
        <Divisor orientacao="vertical" espessura="grossa" />
        {/* Com rótulo o wrapper NÃO é role="separator" — se fosse, o axe passaria e o
            leitor de tela é que descartaria o "ou". Ver o componente. */}
        <Divisor rotulo="ou" />
        <p>
          <Tecla>Ctrl</Tecla> + <Tecla>K</Tecla> · <Tecla aria-label="Command">⌘</Tecla>
        </p>
      </>,
    )
  })
})
