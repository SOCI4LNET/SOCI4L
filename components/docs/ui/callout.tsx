import { AlertTriangle, Info, AlertCircle, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface CalloutProps {
    icon?: string
    title?: string
    children?: React.ReactNode
    type?: "default" | "info" | "warning" | "danger" | "success"
    className?: string
}

export function Callout({
    children,
    title,
    type = "default",
    className,
    ...props
}: CalloutProps) {

    const getIcon = () => {
        switch (type) {
            case "danger":
                return <AlertCircle className="h-4 w-4" />
            case "warning":
                return <AlertTriangle className="h-4 w-4" />
            case "success":
                return <CheckCircle className="h-4 w-4" />
            default:
                return <Info className="h-4 w-4" />
        }
    }

    const getStyles = () => {
        switch (type) {
            case "danger":
                return "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive"
            case "warning":
                return "border-amber-500/50 text-amber-600 dark:text-amber-500 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-500 bg-amber-50 dark:bg-amber-950/10"
            case "success":
                return "border-emerald-500/50 text-emerald-600 dark:text-emerald-500 [&>svg]:text-emerald-600 dark:[&>svg]:text-emerald-500 bg-emerald-50 dark:bg-emerald-950/10"
            default:
                return "border-blue-500/50 text-blue-600 dark:text-blue-500 [&>svg]:text-blue-600 dark:[&>svg]:text-blue-500 bg-blue-50 dark:bg-blue-950/10"
        }
    }

    return (
        <div
            className={cn(
                "relative w-full rounded-lg border p-4 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg+div]:translate-y-[-3px] [&:has(svg)]:pl-11 mt-6 mb-6",
                getStyles(),
                className
            )}
            {...props}
        >
            {getIcon()}
            <div className="text-sm [&_p]:leading-relaxed">
                {title && <h5 className="font-medium leading-none tracking-tight mb-2">{title}</h5>}
                <div className="text-sm opacity-90">{children}</div>
            </div>
        </div>
    )
}
