import { describe, test, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Avatar, GrupoAvatar, iniciaisDoNome, tomDoNome } from './Avatar'

describe('Avatar — iniciais', () => {
  test('"Maria Silva Santos" → "MS" (primeira + ÚLTIMA)', () => {
    expect(iniciaisDoNome('Maria Silva Santos')).toBe('MS')
  })

  test('partícula no meio não vira inicial: "Maria da Silva" → "MS", não "MD"', () => {
    // A regra ingênua (duas primeiras palavras) devolveria "MD". Metade dos nomes
    // brasileiros tem "da"/"de"/"dos" no meio — é por isso que a regra é primeira+última.
    expect(iniciaisDoNome('Maria da Silva')).toBe('MS')
    expect(iniciaisDoNome('José dos Santos Oliveira')).toBe('JO')
  })

  test('nome de uma palavra só: duas letras dela mesma', () => {
    // Uma letra sozinha num círculo de 56px fica com cara de bug.
    expect(iniciaisDoNome('Madonna')).toBe('MA')
  })

  test('nome de uma letra só não quebra', () => {
    expect(iniciaisDoNome('X')).toBe('X')
  })

  test('nome vazio devolve vazio (e o componente cai na silhueta)', () => {
    expect(iniciaisDoNome('')).toBe('')
    expect(iniciaisDoNome('   ')).toBe('')
  })

  test('acento é preservado: "Ángela Óscar" → "ÁÓ"', () => {
    // Jogar o acento fora deixaria o avatar escrevendo o nome errado — e a pessoa nota.
    expect(iniciaisDoNome('Ángela Óscar')).toBe('ÁÓ')
    expect(iniciaisDoNome('ângela')).toBe('ÂN')
  })

  test('espaço extra e quebra de linha não viram inicial fantasma', () => {
    // Nome vindo do banco costuma ter espaço duplo. Sem o filtro, a "inicial" seria "".
    expect(iniciaisDoNome('  Maria   Silva  ')).toBe('MS')
  })

  test('nome vazio mostra a silhueta, não um círculo em branco', () => {
    const { container } = render(<Avatar nome="" />)
    // Círculo vazio parece falha de carregamento.
    expect(container.querySelector('svg')).toBeTruthy()
    expect(container.querySelector('.amb-avatar__iniciais')).toBeNull()
  })
})

describe('Avatar — a cor é determinística', () => {
  test('a mesma pessoa recebe sempre a mesma cor', () => {
    // Se a cor sorteasse a cada render, a lista de clientes piscaria a cada atualização
    // e o olho perderia a única pista rápida de quem é quem.
    const primeira = tomDoNome('Maria Silva Santos')
    for (let i = 0; i < 50; i++) {
      expect(tomDoNome('Maria Silva Santos')).toBe(primeira)
    }
  })

  test('a cor sobrevive a caixa e acento — é a mesma pessoa vinda de outro lugar do banco', () => {
    const base = tomDoNome('José Silva')
    expect(tomDoNome('JOSÉ SILVA')).toBe(base)
    expect(tomDoNome('jose silva')).toBe(base)
    expect(tomDoNome('  José Silva  ')).toBe(base)
  })

  test('a mesma pessoa renderiza a mesma classe de tom em dois lugares da tela', () => {
    const a = render(<Avatar nome="Maria Silva Santos" />)
    const b = render(<Avatar nome="Maria Silva Santos" />)
    const classeDe = (c: HTMLElement) =>
      [...c.querySelector('.amb-avatar')!.classList].find(x => x.startsWith('amb-avatar--tom-'))

    expect(classeDe(a.container)).toBe(classeDe(b.container))
    expect(classeDe(a.container)).toMatch(/^amb-avatar--tom-/)
  })

  test('nomes diferentes se espalham pelos tons (não é tudo a mesma cor)', () => {
    // Um hash quebrado que devolve sempre o mesmo tom passaria em todos os testes de
    // determinismo acima e deixaria a lista inteira monocromática.
    const nomes = ['Ana Souza', 'Bruno Lima', 'Carla Dias', 'Diego Melo', 'Elisa Rocha', 'Fábio Nunes']
    expect(new Set(nomes.map(tomDoNome)).size).toBeGreaterThan(1)
  })

  test('o tom só pinta as iniciais — com foto, a foto manda', () => {
    const { container } = render(<Avatar nome="Maria Silva" src="/foto.jpg" />)
    // Fundo colorido apareceria nos cantos de uma imagem transparente e sujaria a foto.
    expect(container.querySelector('[class*="amb-avatar--tom-"]')).toBeNull()
  })
})

describe('Avatar — imagem que falha', () => {
  test('link quebrado cai nas iniciais, nunca em ícone de imagem quebrada', () => {
    // Link expirado de Google/Gravatar/S3 é rotina em produção.
    render(<Avatar nome="Maria Silva Santos" src="https://exemplo.invalido/foto.jpg" />)

    const img = screen.getByRole('img', { name: 'Maria Silva Santos' })
    fireEvent.error(img)

    expect(screen.getByText('MS')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  test('trocar a foto depois de uma falha volta a tentar carregar', () => {
    // O `if (erro)` booleano trava nas iniciais para sempre depois da primeira falha —
    // a foto nova nunca aparece, nem depois de o usuário subir outra.
    const { rerender, container } = render(<Avatar nome="Maria Silva" src="/quebrada.jpg" />)
    fireEvent.error(screen.getByRole('img'))
    expect(container.querySelector('img')).toBeNull()

    rerender(<Avatar nome="Maria Silva" src="/nova.jpg" />)
    expect(container.querySelector('img')).toHaveAttribute('src', '/nova.jpg')
  })

  test('sem foto e sem falha: iniciais direto', () => {
    render(<Avatar nome="Bruno Lima" />)
    expect(screen.getByText('BL')).toBeInTheDocument()
  })
})

describe('Avatar — o que o leitor de tela ouve', () => {
  test('com foto: o alt é o nome, não "avatar"', () => {
    render(<Avatar nome="Maria Silva Santos" src="/foto.jpg" />)
    expect(screen.getByRole('img', { name: 'Maria Silva Santos' })).toBeInTheDocument()
  })

  test('sem foto: as iniciais são mudas e quem fala é o nome por extenso', () => {
    // "MS" seria lido "ême-esse" — não é o nome de ninguém.
    const { container } = render(<Avatar nome="Maria Silva Santos" />)
    expect(container.querySelector('.amb-avatar__iniciais')).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('.amb-sr-only')).toHaveTextContent('Maria Silva Santos')
  })

  test('decorativo: cala a boca — o nome já está escrito na tela ao lado', () => {
    // Sem isto a pessoa ouve "Maria Silva, Maria Silva" em cada uma das 40 linhas.
    const { container } = render(<Avatar nome="Maria Silva" decorativo />)
    expect(container.querySelector('.amb-sr-only')).toBeNull()
  })

  test('decorativo com foto: alt vazio, a imagem some do leitor de tela', () => {
    const { container } = render(<Avatar nome="Maria Silva" src="/foto.jpg" decorativo />)
    expect(container.querySelector('img')).toHaveAttribute('alt', '')
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  test('status não é só uma bolinha colorida: vem com texto', () => {
    // Verde e âmbar são o mesmo ponto cinza para quem não distingue — e nada para quem ouve.
    const { container } = render(<Avatar nome="Ana Souza" status="ausente" />)
    expect(container.querySelector('.amb-avatar__status')).toHaveAttribute('aria-hidden', 'true')
    expect(container.textContent).toContain('ausente')
  })

  test.each(['online', 'ausente', 'offline'] as const)('status %s tem forma própria, não só cor', s => {
    const { container } = render(<Avatar nome="Ana Souza" status={s} />)
    expect(container.querySelector(`.amb-avatar__status--${s}`)).toBeTruthy()
  })
})

describe('Avatar — tamanhos e formatos', () => {
  test.each(['xs', 'sm', 'md', 'lg'] as const)('tamanho %s', s => {
    const { container } = render(<Avatar nome="Ana Souza" size={s} />)
    expect(container.querySelector(`.amb-avatar--${s}`)).toBeTruthy()
  })

  test('o padrão é md + círculo', () => {
    const { container } = render(<Avatar nome="Ana Souza" />)
    expect(container.querySelector('.amb-avatar--md')).toBeTruthy()
    expect(container.querySelector('.amb-avatar--circulo')).toBeTruthy()
  })

  test.each(['circulo', 'quadrado'] as const)('formato %s', f => {
    const { container } = render(<Avatar nome="Ana Souza" formato={f} />)
    expect(container.querySelector(`.amb-avatar--${f}`)).toBeTruthy()
  })
})

describe('GrupoAvatar', () => {
  const pessoas = ['Ana Souza', 'Bruno Lima', 'Carla Dias', 'Diego Melo', 'Elisa Rocha']
  const pilha = (max?: number) => (
    <GrupoAvatar max={max}>
      {pessoas.map(n => (
        <Avatar key={n} nome={n} />
      ))}
    </GrupoAvatar>
  )

  test('mostra até `max` e resume o resto', () => {
    render(pilha(3))
    expect(screen.getByText('AS')).toBeInTheDocument()
    expect(screen.getByText('+2')).toBeInTheDocument()
    // Quem passou do limite não aparece — senão o "+N" não teria sentido.
    expect(screen.queryByText('ER')).not.toBeInTheDocument()
  })

  test('o "+N" é anunciável: "mais 2 pessoas", não "sinal de mais dois"', () => {
    // O leitor de tela lê "+2" de um jeito diferente em cada navegador, e nenhum diz
    // o que aquilo é.
    render(pilha(3))
    expect(screen.getByText('mais 2 pessoas')).toBeInTheDocument()
  })

  test('excedente de 1 fala no singular ("mais 1 pessoa")', () => {
    render(pilha(4))
    expect(screen.getByText('mais 1 pessoa')).toBeInTheDocument()
  })

  test('sem `max`: todo mundo aparece e não há "+N"', () => {
    const { container } = render(pilha())
    expect(container.querySelectorAll('.amb-avatar')).toHaveLength(5)
    expect(container.querySelector('.amb-grupo-avatar__mais')).toBeNull()
  })

  test('`max` maior que o número de pessoas não inventa um "+0"', () => {
    const { container } = render(pilha(10))
    expect(container.querySelector('.amb-grupo-avatar__mais')).toBeNull()
  })

  test('filho condicional falso não conta como pessoa', () => {
    // `{podeVer && <Avatar/>}` vira `false` na lista: sem o toArray, o "+N" mentiria.
    const podeVer = false
    const { container } = render(
      <GrupoAvatar max={2}>
        <Avatar nome="Ana Souza" />
        <Avatar nome="Bruno Lima" />
        {podeVer && <Avatar nome="Carla Dias" />}
      </GrupoAvatar>,
    )
    expect(container.querySelector('.amb-grupo-avatar__mais')).toBeNull()
  })
})
