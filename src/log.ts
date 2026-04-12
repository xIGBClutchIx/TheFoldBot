type LogLevel = "error" | "info" | "warn";
type LogValue = boolean | number | string | null;
type LogFields = Record<string, LogValue>;

function writeLog(level: LogLevel, scope: string, message: string, fields: LogFields = {}): void {
    const entry = {
        timestamp: new Date().toISOString(),
        level,
        scope,
        message,
        ...fields,
    };

    const payload = JSON.stringify(entry);

    if (level === "error") {
        console.error(payload);
        return;
    }

    if (level === "warn") {
        console.warn(payload);
        return;
    }

    console.info(payload);
}

export function logError(scope: string, message: string, fields?: LogFields): void {
    writeLog("error", scope, message, fields);
}

export function logInfo(scope: string, message: string, fields?: LogFields): void {
    writeLog("info", scope, message, fields);
}

export function logWarn(scope: string, message: string, fields?: LogFields): void {
    writeLog("warn", scope, message, fields);
}
