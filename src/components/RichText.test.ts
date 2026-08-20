import { describe, expect, it } from 'vitest'
import { parseRichText } from './RichText'

describe('parseRichText', () => {
  it('passes plain text through', () => {
    expect(parseRichText('une décision simple')).toEqual([
      { kind: 'text', text: 'une décision simple' },
    ])
  })

  it('parses bold, italic and links between plain segments', () => {
    expect(
      parseRichText(
        'Relève **62 à 64 ans** via *49.3* ([texte](https://legifrance.gouv.fr/jorf/id/X))',
      ),
    ).toEqual([
      { kind: 'text', text: 'Relève ' },
      { kind: 'bold', text: '62 à 64 ans' },
      { kind: 'text', text: ' via ' },
      { kind: 'italic', text: '49.3' },
      { kind: 'text', text: ' (' },
      { kind: 'link', label: 'texte', url: 'https://legifrance.gouv.fr/jorf/id/X' },
      { kind: 'text', text: ')' },
    ])
  })

  it('treats unclosed markers as plain text', () => {
    expect(parseRichText('un **gras jamais fermé')).toEqual([
      { kind: 'text', text: 'un **gras jamais fermé' },
    ])
  })

  it('rejects non-http link targets as plain text', () => {
    const javascriptLink = '[x](javascript:alert(1))'
    expect(parseRichText(javascriptLink)).toEqual([{ kind: 'text', text: javascriptLink }])
  })
})
