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
        const headings = Array.from(document.querySelectorAll("h2[id]:not([data-toc-ignore]), h3[id]:not([data-toc-ignore])"))
        const tocItems: TocItem[] = headings.map((heading) => ({
            title: heading.textContent || "",
            url: `#${heading.id}`,
        }))
        setItems(tocItems)

        const scrollContainer = document.querySelector('.flex-1.overflow-y-auto') as HTMLElement | null

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id)
                    }
                })
            },
            { root: scrollContainer, rootMargin: "0% 0% -65% 0%" }
        )

        headings.forEach((heading) => observer.observe(heading))

        const handleScroll = () => {
            if (!scrollContainer) return
            const { scrollTop, scrollHeight, clientHeight } = scrollContainer
            if (scrollHeight - scrollTop - clientHeight < 50 && headings.length > 0) {
                setActiveId(headings[headings.length - 1].id)
            }
        }
        scrollContainer?.addEventListener('scroll', handleScroll)

        return () => {
            headings.forEach((heading) => observer.unobserve(heading))
            scrollContainer?.removeEventListener('scroll', handleScroll)
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
                                        ? "font-medium text-primary -ml-[17px] pl-[16px] border-l-2 border-primary"
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
