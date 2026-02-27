const IS_DEV = process.env.NODE_ENV === 'development'
const DEBUG_ENABLED = typeof window !== 'undefined' && localStorage.getItem('DEBUG_MODE') === 'true'

export const Logger = {
    info: (message: string, ...args: any[]) => {
        if (IS_DEV || DEBUG_ENABLED) {
            console.log(message, ...args)
        }
    },
    warn: (message: string, ...args: any[]) => {
        if (IS_DEV || DEBUG_ENABLED) {
            console.warn(message, ...args)
        }
    },
    error: (message: string, ...args: any[]) => {
        // Errors should generally always be logged, or at least sent to monitoring
        console.error(message, ...args)
    },
    debug: (message: string, ...args: any[]) => {
        if (IS_DEV || DEBUG_ENABLED) {
            console.debug(message, ...args)
        }
    }
}
