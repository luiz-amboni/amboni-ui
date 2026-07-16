import { espaco, raio, sombra, alturaControle } from '@amboni/tokens'
import { Secao, P, Demo, Titulo, H3, Aviso } from '../lib/blocos'

export default function Espacamento() {
  return (
    <>
      <Titulo eyebrow="Fundamentos" lead="Grade de 4px, cantos com propósito e sombra usada com parcimônia.">
        Espaço e forma
      </Titulo>

      <Secao titulo="A grade de 4px">
        <P>
          Todo espaçamento é múltiplo de 4. Não é superstição: telas alinham em pixel inteiro, e
          um <code>padding: 13px</code> no meio de vizinhos de 12 e 16 é <strong>invisível
          sozinho e visível no conjunto</strong> — a tela fica "levemente torta" sem que ninguém
          saiba dizer por quê.
        </P>
        <Demo variante="plain">
          <div style={{ display: 'grid', gap: 6, width: '100%' }}>
            {(Object.entries(espaco) as [string, string][]).map(([n, v]) => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <code className="doc-mono-brand" style={{ minWidth: 110, fontSize: 12 }}>espaco-{n}</code>
                <code style={{ minWidth: 56, fontSize: 12, opacity: 0.6 }}>{v}</code>
                <div style={{ height: 14, width: v, background: 'var(--amb-color-brand-solid)', borderRadius: 3 }} />
              </div>
            ))}
          </div>
        </Demo>
        <Aviso>
          <strong>Como escolher:</strong> 2 e 3 separam coisas dentro de um componente (ícone e
          rótulo). 4 e 6 separam componentes. 8 e acima separam seções.
        </Aviso>
      </Secao>

      <Secao titulo="Cantos">
        <Demo variante="plain">
          {(Object.entries(raio) as [string, string][]).filter(([n]) => n !== 'full').map(([n, v]) => (
            <div key={n} style={{ textAlign: 'center' }}>
              <div style={{
                width: 68, height: 68, borderRadius: v,
                background: 'var(--amb-color-brand-subtle)',
                border: '1px solid var(--amb-color-brand-solid)',
              }} />
              <code style={{ fontSize: 11, opacity: 0.7 }}>{n} · {v}</code>
            </div>
          ))}
        </Demo>
        <P>
          <strong>O canto acompanha o tamanho.</strong> Um raio de 14px num selo de 20px de
          altura vira uma pílula sem querer; num card de 400px, quase não se nota. Peça pequena,
          raio pequeno.
        </P>
        <Aviso>
          <strong>Esta escala foi medida, não escolhida.</strong> Abrimos um CRM de mercado que
          nos pareceu bonito e medimos: controles de 48px com 9,6px de raio. Os 8px que estavam
          aqui antes, na mesma altura, liam como "quadrado com o canto lixado" — o bastante para
          a interface parecer datada sem ninguém saber apontar o motivo. É o upgrade de aparência
          mais barato que existe.
        </Aviso>
      </Secao>

      <Secao titulo="Altura dos controles">
        <P>
          Botão, campo, select e combo compartilham <strong>um token de altura</strong>. Não é
          organização: é a única forma de eles baterem no milímetro num formulário.
        </P>
        <Demo variante="plain">
          <div style={{ display: 'grid', gap: 10, width: '100%' }}>
            {(Object.entries(alturaControle) as [string, string][]).map(([n, v]) => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <code className="doc-mono-brand" style={{ minWidth: 130, fontSize: 12 }}>altura-{n}</code>
                <code style={{ minWidth: 56, fontSize: 12, opacity: 0.6 }}>{v}</code>
                <div style={{
                  height: v, width: 150, borderRadius: raio.md,
                  background: 'var(--amb-color-brand-subtle)',
                  border: '1px solid var(--amb-color-brand-solid)',
                }} />
              </div>
            ))}
          </div>
        </Demo>
        <P>
          Quando cada componente decide a própria altura, eles divergem por 2px na primeira vez
          que alguém mexe em um só. <strong>Ninguém abre chamado para isso</strong> — todo mundo
          só acha o formulário meio torto e não sabe dizer por quê.
        </P>
        <P>
          Os 44px do padrão saem da referência (48px lá) puxados para o alvo de toque de 44px do
          iOS: o menor tamanho que ainda se acerta com o dedo em movimento.
        </P>
      </Secao>

      <Secao titulo="Sombras">
        <Demo variante="plain">
          {(Object.entries(sombra) as [string, string][]).map(([n, v]) => (
            <div key={n} style={{ textAlign: 'center' }}>
              <div style={{
                width: 84, height: 60, borderRadius: 10, boxShadow: v,
                background: 'var(--amb-color-surface)',
                border: '1px solid var(--amb-color-border-default)',
              }} />
              <code style={{ fontSize: 11, opacity: 0.7 }}>{n}</code>
            </div>
          ))}
        </Demo>
        <H3>Sombra é hierarquia, não enfeite</H3>
        <P>
          A sombra diz "isto está acima daquilo". Num painel de CRM, onde tudo é card, sombra em
          tudo vira ruído: <strong>quando tudo está elevado, nada está</strong>. É por isso que o
          padrão do <code>Card</code> é <code>flat</code> — sombra fica reservada para o que
          realmente flutua sobre o resto (menu, modal).
        </P>
      </Secao>
    </>
  )
}
