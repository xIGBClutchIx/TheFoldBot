import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import typescript from "typescript";

const targetPaths = ["src", "vite.config.ts"];
const targetFilePattern = /\.[cm]?ts$/;
const violations = [];

for (const targetPath of targetPaths) {
    const files = await collectTargetFiles(targetPath);

    for (const filePath of files) {
        const fileContents = await readFile(filePath, "utf8");
        const sourceFile = typescript.createSourceFile(filePath, fileContents, typescript.ScriptTarget.Latest, true);

        collectViolations(sourceFile, filePath);
    }
}

if (violations.length > 0) {
    console.error("Explicit 'any' and 'unknown' are not allowed.");

    for (const violation of violations) {
        console.error(`${violation.filePath}:${violation.lineNumber}: ${violation.line.trim()}`);
    }

    process.exitCode = 1;
}

async function collectTargetFiles(targetPath) {
    const directoryEntries = await readdir(targetPath, { withFileTypes: true }).catch(() => []);
    const files = [];

    if (directoryEntries.length === 0) {
        if (targetFilePattern.test(targetPath)) {
            return [targetPath];
        }

        return [];
    }

    for (const entry of directoryEntries) {
        const entryPath = join(targetPath, entry.name);

        if (entry.isDirectory()) {
            files.push(...(await collectTargetFiles(entryPath)));
            continue;
        }

        if (entry.isFile() && targetFilePattern.test(entryPath)) {
            files.push(entryPath);
        }
    }

    return files;
}

function collectViolations(sourceFile, filePath) {
    visitNode(sourceFile);

    function visitNode(node) {
        if (node.kind === typescript.SyntaxKind.AnyKeyword || node.kind === typescript.SyntaxKind.UnknownKeyword) {
            const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
            const line = sourceFile.text.split("\n")[start.line] ?? "";

            violations.push({
                filePath,
                lineNumber: start.line + 1,
                line,
            });
        }

        typescript.forEachChild(node, visitNode);
    }
}
