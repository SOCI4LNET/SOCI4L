import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDistanceToNow } from 'date-fns'

interface LogEntry {
    id: string
    action: string
    metadata: string | null
    createdAt: Date
}

interface AdminUserLogsProps {
    logs: LogEntry[]
}

export function AdminUserLogs({ logs }: AdminUserLogsProps) {
    return (
        <Card className="transition-all duration-200 hover:shadow-md hover:border-border/80">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Activity Logs</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border border-border/60 overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30">
                                <TableHead className="w-[140px] text-xs">Action</TableHead>
                                <TableHead className="text-xs">Details</TableHead>
                                <TableHead className="w-[120px] text-right text-xs">Time</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-xs text-muted-foreground py-6">
                                        No activity recorded
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log) => (
                                    <TableRow key={log.id} className="text-xs">
                                        <TableCell className="font-medium font-mono">{log.action}</TableCell>
                                        <TableCell className="text-muted-foreground break-all">
                                            {log.metadata || '-'}
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground">
                                            {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
