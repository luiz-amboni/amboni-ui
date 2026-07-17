import { describe, test, expect } from 'vitest'
import { render } from '@testing-library/react'
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
})
