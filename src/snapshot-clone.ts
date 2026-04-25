import * as fs from "fs";
import * as path from "path";

export interface CloneResult {
  source: string;
  destination: string;
  success: boolean;
  error?: string;
}

export interface CloneOptions {
  overwrite?: boolean;
  suffix?: string;
}

export function cloneSnapshot(
  sourceFile: string,
  destFile: string,
  options: CloneOptions = {}
): CloneResult {
  const { overwrite = false, suffix } = options;

  if (!fs.existsSync(sourceFile)) {
    return { source: sourceFile, destination: destFile, success: false, error: `Source file not found: ${sourceFile}` };
  }

  let target = destFile;
  if (suffix) {
    const ext = path.extname(destFile);
    const base = destFile.slice(0, destFile.length - ext.length);
    target = `${base}${suffix}${ext}`;
  }

  if (!overwrite && fs.existsSync(target)) {
    return { source: sourceFile, destination: target, success: false, error: `Destination already exists: ${target}` };
  }

  try {
    const content = fs.readFileSync(sourceFile, "utf-8");
    const snapshot = JSON.parse(content);
    const cloned = {
      ...snapshot,
      clonedFrom: sourceFile,
      clonedAt: new Date().toISOString(),
    };
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, JSON.stringify(cloned, null, 2), "utf-8");
    return { source: sourceFile, destination: target, success: true };
  } catch (err: any) {
    return { source: sourceFile, destination: target, success: false, error: err.message };
  }
}

export function formatCloneResult(result: CloneResult): string {
  if (result.success) {
    return `Cloned: ${result.source} → ${result.destination}`;
  }
  return `Clone failed: ${result.error}`;
}
