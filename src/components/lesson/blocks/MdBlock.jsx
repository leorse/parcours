import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

export default function MdBlock({ text }) {
  return (
    <div className="md-block">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {text}
      </ReactMarkdown>
    </div>
  )
}
