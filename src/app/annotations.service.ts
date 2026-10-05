import { Service, signal } from '@angular/core';

export type Annotation = {
  id: string;
  text: string | null;
  imageUrl: string | null;
  x: number;
  y: number;
  pageId: string;
};

@Service()
export class AnnotationsService {
  readonly annotations = signal<Annotation[]>([]);

  addAnnotation(annotation: Annotation) {
    const current = [...this.annotations(), annotation];
    current.sort((a, b) => a.y - b.y || a.x - b.x);
    this.annotations.set(current);
  }

  removeAnnotation(uuid: string) {
    const current = this.annotations().filter((item) => item.id !== uuid);
    this.annotations.set(current);
  }

  updateAnnotation(index: number, changes: Partial<Annotation>): void {
    const current = this.annotations();
    const updated = current.map((a, i) => (i === index ? { ...a, ...changes } : a));
    this.annotations.set(updated);
  }
}
