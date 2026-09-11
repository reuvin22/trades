import { CARD, CARD_SUB, CARD_TITLE } from '../components/ui'

type PlaceholderProps = {
  title: string
}

export function Placeholder({ title }: PlaceholderProps) {
  return (
    <section className={`${CARD} grid min-h-340 content-center justify-items-center gap-6 text-center`}>
      <h2 className={CARD_TITLE}>{title}</h2>
      <p className={CARD_SUB}>This section is next on the build list.</p>
    </section>
  )
}
