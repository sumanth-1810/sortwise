import type { IconId } from '../types'

interface ItemArtProps {
  icon: IconId
  title: string
}

/** Real photo for each waste card (files in /public/items). */
export function ItemArt({ icon, title }: ItemArtProps) {
  const src = `/items/${icon}.jpg`
  return (
    <div className="item-art" role="img" aria-label={title}>
      <img src={src} alt={title} className="item-art-img" loading="lazy" />
      <span className="item-art-caption">{title}</span>
    </div>
  )
}
