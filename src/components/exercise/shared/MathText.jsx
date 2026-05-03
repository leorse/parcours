import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

export default function MathText({ text, inline = false }) {
  if (!text) return null
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={inline ? { p: ({ children }) => <span>{children}</span> } : {}}
    >
      {text}
    </ReactMarkdown>
  )
}
