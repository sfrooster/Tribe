interface ILogger {
    addTag(tag: string): void;
    logLine(line: string): void;
}

class NullLogger implements ILogger {
    addTag(tag: string) { }
    logLine(line: string) { }
}