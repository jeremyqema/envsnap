import * as fs from "fs";

export interface Annotation {
  label: string;
  note: string;
  author?: string;
  createdAt: string;
}

export interface AnnotationStore {
  [label: string]: Annotation;
}

export function loadAnnotations(filePath: string): AnnotationStore {
  if (!fs.existsSync(filePath)) return {};
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as AnnotationStore;
}

export function saveAnnotations(filePath: string, store: AnnotationStore): void {
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), "utf-8");
}

export function addAnnotation(
  store: AnnotationStore,
  label: string,
  note: string,
  author?: string
): AnnotationStore {
  const entry: Annotation = {
    label,
    note,
    author,
    createdAt: new Date().toISOString(),
  };
  return { ...store, [label]: entry };
}

export function removeAnnotation(
  store: AnnotationStore,
  label: string
): AnnotationStore {
  const updated = { ...store };
  delete updated[label];
  return updated;
}

export function getAnnotation(
  store: AnnotationStore,
  label: string
): Annotation | undefined {
  return store[label];
}

export function listAnnotations(store: AnnotationStore): Annotation[] {
  return Object.values(store).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}
