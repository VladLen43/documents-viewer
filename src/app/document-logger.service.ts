import { Service, signal } from '@angular/core';
import { DocPage } from './docs-api.service';
import { Annotation } from './annotations.service';

export interface Document {
  documentId?: string;
  pages: DocPage[];
  annotations: Annotation[];
}

@Service()
export class DocumentLoggerService {
  readonly document = signal<Document | null>(null);

  saveDocument() {
    console.table(this.document());
  }
}
