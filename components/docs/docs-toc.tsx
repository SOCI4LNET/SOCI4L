"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TocItem {
    title: string
    url: string
    items?: TocItem[]
}

export function DocsTOC() {
    const [items, setItems] = React.useState<TocItem[]>([])
    const [activeId, setActiveId] = React.useState<string>("")

    React.useEffect(() => {
        // Select headings with IDs, but exclude those explicitly marked to ignore
        const headings = Array.from(document.querySelectorAll("h2[id]:not([data-toc-ignore]), h3[id]:not([data-toc-ignore])"))
        const tocItems: TocItem[] = headings.map((heading) => ({
            title: heading.textContent || "",
            url: `#${heading.id}`,
        }))
        setItems(tocItems)

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id)
                    }
                })
            },
            { rootMargin: "0% 0% -80% 0%" }
        )

        headings.forEach((heading) => observer.observe(heading))

        return () => {
            headings.forEach((heading) => observer.unobserve(heading))
        }
    }, [])

    if (!items?.length) {
        return null
    }

    return (
        <div className="space-y-2">
            <p className="font-semibold text-sm text-foreground">On This Page</p>
            <div className="relative">
                {/* Vertical line for TOC */}
                <div className="absolute left-0 h-full w-[1px] bg-border" />
                <ul className="m-0 list-none space-y-2.5 pl-4 border-l border-transparent">
                    {items.map((item) => (
                        <li key={item.url}>
                            <a
                                href={item.url}
                                className={cn(
                                    "block text-sm transition-colors hover:text-foreground",
                                    item.url === `#${activeId}`
                                        ? "font-medium text-foreground"
                                        : "text-muted-foreground"
                                )}
                            >
                                {item.title}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}
