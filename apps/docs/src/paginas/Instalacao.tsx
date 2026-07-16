import { Secao, P, Bloco, Aviso, Titulo, H3 } from '../lib/blocos'

export default function Instalacao() {
  return (
    <>
      <Titulo eyebrow="Começar" lead="Três passos. O terceiro é o que quase todo mundo esquece.">
        Instalação
      </Titulo>

      <Secao titulo="1. Instale">
        <Bloco lang="jsx">{`npm install @amboni/ui @amboni/tokens`}</Bloco>
      </Secao>

      <Secao titulo="2. Importe o CSS uma vez">
        <P>
          No ponto de entrada da aplicação (<code>main.tsx</code>), não em cada componente:
        </P>
        <Bloco lang="jsx">{`import '@amboni/tokens/tokens.css'  // as variáveis de cor, espaço, fonte
import '@amboni/ui/styles.css'      // o estilo dos componentes`}</Bloco>
        <Aviso tipo="warn">
          A ordem importa. O <code>ui/styles.css</code> lê as variáveis que o
          <code> tokens.css</code> define. Invertido, os componentes carregam sem cor.
        </Aviso>
      </Secao>

      <Secao titulo="3. Declare a marca e o tema no <html>">
        <P>
          <strong>Este é o passo esquecido.</strong> Sem os dois atributos, nenhuma variável é
          definida e a tela aparece sem cor nenhuma — parecendo que a biblioteca quebrou.
        </P>
        <Bloco lang="jsx">{`<html lang="pt-BR" data-amb-brand="isafe" data-amb-theme="light">`}</Bloco>
        <P>
          <code>data-amb-brand</code> aceita <code>isafe</code> ou <code>vear</code>.
          <code> data-amb-theme</code> aceita <code>light</code> ou <code>dark</code>.
        </P>

        <H3>Trocando o tema em tempo de execução</H3>
        <Bloco lang="jsx">{`document.documentElement.setAttribute('data-amb-theme', 'dark')`}</Bloco>
        <P>
          Não precisa recarregar, nem re-renderizar, nem avisar o React. As variáveis CSS
          cascateiam sozinhas — é o navegador fazendo o trabalho.
        </P>
      </Secao>

      <Secao titulo="Usando junto com o que você já tem">
        <P>
          A biblioteca é <strong>CSS puro com variáveis</strong>. Não traz runtime de estilo,
          não exige provider, não briga com o que já está na página.
        </P>
        <H3>Com MUI</H3>
        <P>
          Alimente o tema do MUI com os mesmos tokens — assim os componentes do MUI e os
          daqui compartilham a mesma paleta em vez de divergirem:
        </P>
        <Bloco lang="jsx">{`import { construirTema } from '@amboni/tokens'
import { createTheme } from '@mui/material/styles'

const t = construirTema('isafe', 'light')

const tema = createTheme({
  palette: {
    mode: 'light',
    primary: { main: t.color.brand.solid, contrastText: t.color.text.onBrand },
    background: { default: t.color.bg, paper: t.color.surface },
  },
})`}</Bloco>

        <H3>Com Tailwind</H3>
        <Bloco lang="css">{`@theme {
  --color-brand: var(--amb-color-brand-solid);
  --color-surface: var(--amb-color-surface);
}`}</Bloco>

        <H3>Com CSS puro</H3>
        <P>As variáveis estão disponíveis em qualquer lugar da página:</P>
        <Bloco lang="css">{`.minha-coisa {
  background: var(--amb-color-surface);
  border: 1px solid var(--amb-color-border-default);
  border-radius: var(--amb-raio-md);
  padding: var(--amb-espaco-4);
}`}</Bloco>
      </Secao>
    </>
  )
}
