import { Callout } from '@/components/docs/ui/callout'
import { DocsTabs, DocsTab } from '@/components/docs/ui/docs-tabs'
import { DocsCard } from '@/components/docs/ui/card'
import {
    DocsTitle,
    DocsHeading,
    DocsSubHeading,
    DocsParagraph,
    DocsList,
    DocsListItem,
    DocsCode
} from '@/components/docs/ui/typography'
import { DocImage } from '@/components/docs/ui/doc-image' // We might need this, or standard img
import { cn } from '@/lib/utils'

export const components = {
    h1: DocsTitle,
    h2: DocsHeading,
    h3: DocsSubHeading,
    h4: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
        <h4 className={cn("scroll-m-20 text-xl font-semibold tracking-tight mt-2 mb-0", className)} {...props} />
    ),
    p: DocsParagraph,
    ul: DocsList,
    ol: ({ className, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
        <ol className={cn("my-2 ml-6 list-decimal [&>li]:mt-1", className)} {...props} />
    ),
    li: DocsListItem,
    code: DocsCode,
    pre: ({ className, ...props }: React.HTMLAttributes<HTMLPreElement>) => (
        <pre
            className={cn("mb-2 mt-3 overflow-x-auto rounded-lg border bg-zinc-950 py-3 dark:bg-zinc-900", className)}
            {...props}
        />
    ),
    hr: ({ ...props }: React.HTMLAttributes<HTMLHRElement>) => <hr className="my-3 md:my-4" {...props} />,
    table: ({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
        <div className="my-3 w-full overflow-y-auto">
            <table className={cn("w-full", className)} {...props} />
        </div>
    ),
    tr: ({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
        <tr className={cn("m-0 border-t p-0 even:bg-muted", className)} {...props} />
    ),
    th: ({ className, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
        <th
            className={cn(
                "border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right",
                className
            )}
            {...props}
        />
    ),
    td: ({ className, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
        <td
            className={cn(
                "border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right",
                className
            )}
            {...props}
        />
    ),
    blockquote: ({ className, ...props }: React.HTMLAttributes<HTMLQuoteElement>) => (
        <blockquote
            className={cn(
                "mt-2 border-l-2 pl-6 italic [&>*]:text-muted-foreground",
                className
            )}
            {...props}
        />
    ),
    // Custom Components
    Callout,
    Tabs: DocsTabs,
    Tab: DocsTab,
    Card: DocsCard,
    Step: ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
        <div className={cn("step ml-4 mb-4 border-l pl-8 relative before:content-[''] before:absolute before:w-3 before:h-3 before:bg-background before:border-2 before:border-primary before:rounded-full before:-left-[6.5px] before:top-1", className)} {...props} />
    )
}
