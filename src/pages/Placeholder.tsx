type PlaceholderProps = {
  title: string
}

export function Placeholder({ title }: PlaceholderProps) {
  return (
    <section className="card placeholder">
      <h2 className="card-title">{title}</h2>
      <p className="card-sub">This section is next on the build list.</p>
    </section>
  )
}
