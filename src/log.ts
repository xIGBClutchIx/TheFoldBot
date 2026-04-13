type LogLevel = "error" | "info" | "warn";
type LogValue = boolean | number | string | null;
type LogFields = Record<string, LogValue>;

function writeLog(level: LogLevel, scope: string, message: string, fields: LogFields = {}): void {
    const timestamp = colorize("dim", formatTimestamp());
    const levelLabel = colorize(getLevelColor(level), level.toUpperCase().padEnd(5, " "));
    const scopeLabel = colorize("cyan", scope);
    const payload = `${timestamp} ${levelLabel} ${scopeLabel} ${message}${formatFields(fields)}`;

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

function formatTimestamp(): string {
    return new Intl.DateTimeFormat("en-US", {
        fractionalSecondDigits: 3,
        hour: "2-digit",
        hour12: false,
        minute: "2-digit",
        second: "2-digit",
    }).format(new Date());
}

function formatFields(fields: LogFields): string {
    const entries = Object.entries(fields);

    if (entries.length === 0) {
        return "";
    }

    return ` ${entries.map(([key, value]) => `${colorize("dim", `${key}=`)}${formatLogValue(value)}`).join(" ")}`;
}

function formatLogValue(value: LogValue): string {
    if (typeof value === "string") {
        return isSimpleString(value) ? value : JSON.stringify(value);
    }

    if (value === null) {
        return "null";
    }

    return String(value);
}

function isSimpleString(value: string): boolean {
    return /^[A-Za-z0-9_./:@#-]+$/.test(value);
}

function getLevelColor(level: LogLevel): ColorName {
    if (level === "error") {
        return "red";
    }

    if (level === "warn") {
        return "yellow";
    }

    return "green";
}

type ColorName = "cyan" | "dim" | "green" | "red" | "yellow";

function colorize(color: ColorName, value: string): string {
    if (!supportsColor()) {
        return value;
    }

    return `${getColorCode(color)}${value}\u001B[0m`;
}

function getColorCode(color: ColorName): string {
    if (color === "dim") {
        return "\u001B[2m";
    }

    if (color === "green") {
        return "\u001B[32m";
    }

    if (color === "yellow") {
        return "\u001B[33m";
    }

    if (color === "red") {
        return "\u001B[31m";
    }

    return "\u001B[36m";
}

function supportsColor(): boolean {
    if (process.env.FORCE_COLOR === "0") {
        return false;
    }

    if (process.env.FORCE_COLOR !== undefined) {
        return true;
    }

    return process.env.NO_COLOR === undefined && Boolean(process.stdout.isTTY);
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
