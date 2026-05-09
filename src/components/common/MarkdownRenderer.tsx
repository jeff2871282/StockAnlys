import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

interface Props {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: Props) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className={cn('markdown-body text-sm text-foreground/90', className)}
      components={{
        h1: ({ children }) => (
          <h1 className="text-xl font-bold text-foreground mt-5 mb-2 first:mt-0">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-base font-semibold text-foreground mt-4 mb-1.5 pb-1 border-b border-border">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-semibold text-foreground mt-3 mb-1">{children}</h3>
        ),
        p: ({ children }) => (
          <p className="text-sm text-foreground/90 leading-relaxed mb-2">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="space-y-1 mb-3 pl-4">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="space-y-1 mb-3 pl-4 list-decimal">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="text-sm text-foreground/90 leading-relaxed list-disc">{children}</li>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-foreground">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-muted-foreground">{children}</em>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-primary pl-3 my-2 text-muted-foreground">{children}</blockquote>
        ),
        code: ({ children, className: cls }) => {
          const isBlock = cls?.includes('language-')
          return isBlock ? (
            <code className="block bg-muted rounded p-3 text-xs font-mono overflow-x-auto mb-2">{children}</code>
          ) : (
            <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono text-foreground">{children}</code>
          )
        },
        table: ({ children }) => (
          <div className="overflow-x-auto mb-3">
            <table className="w-full text-sm border-collapse">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="text-left px-3 py-2 bg-muted font-medium text-foreground border border-border">{children}</th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2 border border-border text-foreground/90">{children}</td>
        ),
        hr: () => <hr className="border-border my-4" />,
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
