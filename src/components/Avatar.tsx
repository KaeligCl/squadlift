const COLORS = ['#ccff00', '#00e5ff', '#ff8a5c', '#b69cff', '#6ee7a8']

export function Avatar({ name, size }: { name: string; size: number }) {
  return (
    <div
      className="av"
      style={{ width: size, height: size, fontSize: size / 2.4, background: COLORS[name.length % COLORS.length] }}
    >
      {name[0]}
    </div>
  )
}
