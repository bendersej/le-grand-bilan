// Renders the limited markdown allowed in registry text fields (docs/data-model.md):
// **bold**, *italic*, [label](https://…). Parsed into React elements — never raw
// HTML — because this content arrives from public pull requests.

type RichTextNode =
  | { kind: 'bold' | 'italic' | 'text'; text: string }
  | { kind: 'link'; label: string; url: string }

const richTextPattern = /\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g

export const parseRichText = (text: string): RichTextNode[] => {
  const matches = [...text.matchAll(richTextPattern)]

  const { nodes, cursor } = matches.reduce<{ nodes: RichTextNode[]; cursor: number }>(
    (accumulator, match) => {
      const [matchedText, boldText, italicText, linkLabel, linkUrl] = match
      const precedingText = text.slice(accumulator.cursor, match.index)
      const precedingNodes: RichTextNode[] =
        precedingText === '' ? [] : [{ kind: 'text', text: precedingText }]

      const matchedNode = ((): RichTextNode => {
        if (boldText !== undefined) {
          return { kind: 'bold', text: boldText }
        }
        if (italicText !== undefined) {
          return { kind: 'italic', text: italicText }
        }
        if (linkLabel !== undefined && linkUrl !== undefined) {
          return { kind: 'link', label: linkLabel, url: linkUrl }
        }
        return { kind: 'text', text: matchedText }
      })()

      return {
        nodes: [...accumulator.nodes, ...precedingNodes, matchedNode],
        cursor: match.index + matchedText.length,
      }
    },
    { nodes: [], cursor: 0 },
  )

  const trailingText = text.slice(cursor)
  return trailingText === '' ? nodes : [...nodes, { kind: 'text', text: trailingText }]
}

export default function RichText({ text }: { text: string }) {
  return (
    <>
      {parseRichText(text).map((node, nodeIndex) => {
        switch (node.kind) {
          case 'bold':
            return (
              <strong key={nodeIndex} className="font-semibold text-[var(--sea-ink)]">
                {node.text}
              </strong>
            )
          case 'italic':
            return <em key={nodeIndex}>{node.text}</em>
          case 'link':
            return (
              <a key={nodeIndex} href={node.url} target="_blank" rel="noreferrer">
                {node.label}
              </a>
            )
          case 'text':
            return <span key={nodeIndex}>{node.text}</span>
          default: {
            node satisfies never
            return null
          }
        }
      })}
    </>
  )
}
