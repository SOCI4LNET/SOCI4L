import { cn } from "@/lib/utils"

interface DocsTypographyProps extends React.HTMLAttributes<HTMLElement> { }

export function DocsTitle({ className, ...props }: DocsTypographyProps) {
    return (
        <h1
            className={cn(
                "scroll-m-20 text-3xl font-semibold tracking-tight lg:text-4xl mb-2 font-display",
                className
            )}
            {...props}
        />
    )
}

export function DocsHeading({ className, ...props }: DocsTypographyProps) {
    return (
        <h2
            className={cn(
                "scroll-m-20 border-b pb-1 text-2xl font-medium tracking-tight first:mt-0 mt-3 mb-0",
                className
            )}
            {...props}
        />
    )
}

export function DocsSubHeading({ className, ...props }: DocsTypographyProps) {
    return (
        <h3
            className={cn(
                "scroll-m-20 text-xl font-medium tracking-tight mt-2 mb-0",
                className
            )}
            {...props}
        />
    )
}

export function DocsParagraph({ className, ...props }: DocsTypographyProps) {
    return (
        <p
            className={cn("leading-6 [&:not(:first-child)]:mt-1 text-muted-foreground", className)}
            {...props}
        />
    )
}

export function DocsList({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) {
    return <ul className={cn("my-2 ml-6 list-disc [&>li]:mt-1", className)} {...props} />
}

export function DocsListItem({ className, ...props }: React.HTMLAttributes<HTMLLIElement>) {
    return <li className={cn("text-muted-foreground", className)} {...props} />
}

export function DocsCode({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
    return (
        <code
            className={cn(
                "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold text-foreground",
                className
            )}
            {...props}
        />
    )
}
