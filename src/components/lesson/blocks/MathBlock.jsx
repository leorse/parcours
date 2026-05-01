import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

export default function MathBlock({ tex, caption }) {
  return (
    <div className="math-block">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {`$$${tex}$$`}
      </ReactMarkdown>
      {caption && <p className="math-caption">{caption}</p>}
    </div>
  )
}
