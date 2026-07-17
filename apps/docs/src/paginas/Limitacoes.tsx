import { Secao, P, H3, Aviso, Titulo, FacaNaoFaca } from '../lib/blocos'

/**
 * Esta página existe porque um levantamento honesto nos pegou.
 *
 * Nós nos gabávamos de "documentar as próprias limitações" — e documentávamos, em
 * COMENTÁRIO DE CÓDIGO. Quem está decidindo se adota a biblioteca não lê o `Menu.css`.
 * Uma limitação escondida no fonte é uma limitação que a pessoa descobre em produção,
 * que é o único lugar onde ela custa caro.
 *
 * O MUI tem seções "Limitations" nas páginas de componente. Nós não tínhamos nenhuma —
 * enquanto o README dizia que isso era o nosso diferencial.
 */
export default function Limitacoes() {
  return (
    <>
      <Titulo
        eyebrow="Comece aqui"
        lead="O que esta biblioteca não faz, o que ela faz mal, e onde ela vai te decepcionar. Leia antes de adotar — é mais barato descobrir agora."
      >
        Limitações
      </Titulo>

      <Secao titulo="Por que esta página existe">
        <P>
          Toda biblioteca tem limitação. A diferença é se você descobre no dia da escolha
          ou na véspera de entregar. Documentação que só lista virtude não está te
          poupando de nada — <strong>está adiando a conta</strong>.
        </P>
        <Aviso>
          Se você bater numa limitação que <strong>não está aqui</strong>, isso é um bug
          desta página. Abra uma issue: a lista incompleta é pior que a lista ruim.
        </Aviso>
      </Secao>

      <Secao titulo="O que não existe">
        <P>
          Faltam componentes que MUI, Ant, Chakra e Mantine todos têm. Os que doem num
          CRM, em ordem:
        </P>
        <div className="doc-table-wrap">
          <table className="doc-table">
            <thead>
              <tr><th>Falta</th><th>Por que dói</th><th>O que fazer hoje</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Combobox com busca</strong></td>
                <td>Escolher um cliente entre 5.000. A <code>Selecao</code> tem modo buscável, mas é lista fechada e curta — não serve para dado que vem do servidor.</td>
                <td>Use a <code>Selecao buscavel</code> se a lista couber na memória; senão, ainda não temos.</td>
              </tr>
              <tr>
                <td><strong>Seletor de data e período</strong></td>
                <td>Todo filtro de CRM é "últimos 30 dias". É o buraco mais citado.</td>
                <td><code>&lt;input type="date"&gt;</code> nativo cobre a data simples com zero risco. Intervalo, não.</td>
              </tr>
              <tr>
                <td><strong>Gráficos</strong></td>
                <td>Painel, custo, anúncios.</td>
                <td>Use recharts direto e passe os tokens (<code>var(--amb-color-brand-solid)</code>) como cor. Nenhuma das grandes escreveu gráfico do zero — todas embrulham.</td>
              </tr>
              <tr>
                <td><strong>Máscara de telefone, CNPJ, moeda</strong></td>
                <td>CRM brasileiro.</td>
                <td>Formate na borda (ao sair do campo) e guarde cru. Só o Mantine tem máscara pronta entre as quatro grandes.</td>
              </tr>
              <tr>
                <td><strong>i18n e RTL</strong></td>
                <td>A biblioteca é em português, ponto. MUI tem ~100 idiomas; nós temos um.</td>
                <td>Se o seu produto é multi-idioma, esta biblioteca não serve.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Secao>

      <Secao titulo="O que existe e tem defeito conhecido">
        <H3>Menu e Dica não medem a janela</H3>
        <P>
          Nenhum dos dois detecta a borda da tela. Perto do canto direito, o
          <code> Menu</code> vaza — use <code>alinhamento="fim"</code>. A <code>Dica</code>
          não faz <em>flip</em>: num canto ela empurra e pode cobrir o próprio gatilho.
        </P>
        <P>
          A causa é a decisão de não ter dependência: colisão resolvida direito exige algo
          como o Floating UI (~10 kB). Escolhemos o peso menor e o defeito conhecido, em
          vez do peso maior e o defeito nenhum. <strong>É uma troca, não um esquecimento</strong> —
          e se ela te atrapalhar, é sinal de que a conta mudou.
        </P>

        <H3>A Dica é inacessível no celular, por natureza</H3>
        <P>
          Não existe <em>hover</em> em tela de toque. Isso não é defeito nosso, é do
          padrão: <strong>nunca ponha informação essencial só na Dica.</strong> Se a
          informação é necessária, ela vai na tela.
        </P>

        <H3>O fundo escuro do modal não funciona em navegador antigo</H3>
        <P>
          O <code>::backdrop</code> só herda variável CSS a partir de Chrome 122, Safari
          17.4 e Firefox 121. Em navegador mais velho <strong>o modal funciona</strong>,
          mas a tela atrás não escurece.
        </P>

        <H3>A Seleção buscável esbarra num bug do VoiceOver</H3>
        <P>
          O <code>aria-activedescendant</code> tem um problema conhecido no WebKit. É
          limitação da plataforma, não do nosso código — e é mais um motivo para o modo
          nativo ser o padrão.
        </P>

        <H3>O Provedor de Avisos não convive com o useAviso no mesmo componente</H3>
        <P>
          Limitação de contexto do React, não bug: quem chama o hook precisa estar
          <em> dentro</em> do provedor. Na prática, um componente-casca no topo da app.
        </P>
      </Secao>

      <Secao titulo="O que a gente testa — e o que não">
        <FacaNaoFaca
          faca={{
            titulo: 'Contraste, comportamento e axe: verificados',
            texto: 'A fórmula da WCAG roda contra todo par de todo tema e reprova o build. Os 28 componentes passam pelo axe-core. Teclado e foco têm teste próprio. São 739 testes.',
          }}
          naoFaca={{
            titulo: 'Não confunda com "acessível"',
            texto: 'Ferramenta automática pega talvez 30% dos problemas de acessibilidade. Julgamento continua sendo humano — e a acessibilidade do componente não garante a do seu produto.',
          }}
        />
        <Aviso tipo="warn">
          <strong>Até hoje, nada no nosso CI olhava para um pixel.</strong> Os testes rodam
          em jsdom, que não faz layout: <code>getBoundingClientRect</code> devolve zero e
          o CSS não é avaliado. Isso já nos custou dois bugs que só apareceram num
          navegador de verdade — um modal que esticava 2px além da tela, e a busca desta
          documentação, que ficava presa em 108px e engolia todo clique. Estamos
          corrigindo com regressão visual; até lá, saiba que os testes provam
          comportamento, não aparência.
        </Aviso>
      </Secao>

      <Secao titulo="Onde as grandes ganham de nós, sem discussão">
        <P>
          Este projeto tem <strong>um dia de vida e um contribuidor</strong>. MUI tem doze
          anos e milhares. Não é falsa modéstia — é o que você precisa saber antes de
          apostar um produto nisto:
        </P>
        <div className="doc-table-wrap">
          <table className="doc-table">
            <thead><tr><th>Eles têm</th><th>Nós</th></tr></thead>
            <tbody>
              <tr><td>113 a 142 componentes</td><td>28</td></tr>
              <tr><td>Kit de Figma, Storybook público, docs versionadas, CDN</td><td>nada disso</td></tr>
              <tr><td>1.100 a 6.000 screenshots comparados por build</td><td>começando agora</td></tr>
              <tr><td>~100 idiomas, RTL</td><td>português</td></tr>
              <tr><td>Anos de bug encontrado por milhares de pessoas</td><td>um dia</td></tr>
            </tbody>
          </table>
        </div>
        <P>
          <strong>Use isto se</strong> você quer poucos componentes, leves, em português, com a
          legibilidade garantida por máquina, e topa que falte coisa.
          <strong> Não use se</strong> você precisa de catálogo completo, vários idiomas, ou
          da segurança de uma comunidade grande atrás.
        </P>
      </Secao>
    </>
  )
}
