export default function ImageBlock({ src, caption, alt }) {
  return (
    <figure className="image-block">
      {src
        ? <img src={src} alt={alt ?? caption ?? ''} />
        : <div className="image-placeholder">{alt ?? 'Image'}</div>
      }
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  )
}
