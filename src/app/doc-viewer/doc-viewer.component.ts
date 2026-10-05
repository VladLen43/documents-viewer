import {
  AfterViewInit,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ZoomService } from '../zoom.service';
import { DocsApiService } from '../docs-api.service';
import { fromEvent } from 'rxjs';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiIcon, TuiInput, TuiTextfieldComponent } from '@taiga-ui/core';
import { Annotation, AnnotationsService } from '../annotations.service';
import { TuiChevron, TuiDataListWrapper, TuiFiles, TuiSelect } from '@taiga-ui/kit';
import { TuiStringHandler } from '@taiga-ui/cdk/types';
import { DocumentLoggerService } from '../document-logger.service';

type AnnotationType = 'image' | 'text';
type AnnotationPosition = { x: number; y: number; pageId: string };
type AnnotationDict = { label: string; type: AnnotationType };

@Component({
  imports: [
    FormsModule,
    TuiInput,
    TuiTextfieldComponent,
    TuiIcon,
    ReactiveFormsModule,
    TuiFiles,
    TuiChevron,
    TuiDataListWrapper,
    TuiIcon,
    TuiSelect,
  ],
  selector: 'app-doc-viewer',
  styleUrl: './doc-viewer.component.scss',
  templateUrl: './doc-viewer.component.html',
  host: {
    '[style.--zoom]': 'zoomScale()',
    '(document:keydown.escape)': 'closeEditor()',
  },
})
export class DocViewerComponent implements OnInit, AfterViewInit {
  private readonly zoomService = inject(ZoomService);
  private readonly docsApiService = inject(DocsApiService);
  private readonly annotationsService = inject(AnnotationsService);
  private readonly documentLoggerService = inject(DocumentLoggerService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly viewPort = viewChild.required<ElementRef<HTMLDivElement>>('viewport');

  id = input<string>();

  readonly pages = toSignal(this.docsApiService.getDocs(), { initialValue: [] });

  private dragging: {
    index: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    maxX: number;
    maxY: number;
  } | null = null;

  readonly annotationPosition = signal<AnnotationPosition | null>(null);
  readonly annotations = this.annotationsService.annotations;

  textControl = new FormControl('', Validators.required);
  fileControl = new FormControl<File | null>(null);
  typeControl = new FormControl<null | AnnotationDict>(null);

  readonly file = signal<string | null>(null);

  annotationTypes: AnnotationDict[] = [
    { label: 'Текст', type: 'text' },
    { label: 'Картинка', type: 'image' },
  ];

  protected stringify: TuiStringHandler<(typeof this.annotationTypes)[number]> = (x) => x.label;

  readonly zoomScale = computed(() => String(this.zoomService.zoom()));
  readonly zoom = computed(() => this.zoomService.zoom());

  constructor() {
    effect(() => {
      if (!!this.pages().length) {
        this.documentLoggerService.document.set({
          pages: this.pages(),
          annotations: this.annotations(),
          documentId: this.id(),
        });
      }
    });
  }

  ngOnInit() {
    this.fileControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((file) => {
      if (!file) {
        this.file.set(null);
        return;
      }
      this.file.set(URL.createObjectURL(file));
    });
  }

  ngAfterViewInit() {
    fromEvent(this.viewPort().nativeElement, 'scroll')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.annotationPosition.set(null);
      });
  }

  openAnnotationWindow(e: PointerEvent, pageId: string) {
    this.textControl.reset(null);
    this.fileControl.reset(null);
    this.typeControl.reset(null);

    const img = e.currentTarget as HTMLImageElement;
    const rect = img.getBoundingClientRect();
    const zoom = this.zoomService.zoom();

    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    this.annotationPosition.set({ x, y, pageId });
  }

  confirmAnnotation() {
    if (
      ((this.typeControl.value as AnnotationDict).type === 'text' && !this.textControl.value) ||
      ((this.typeControl.value as AnnotationDict)?.type === 'image' && !this.fileControl.value)
    ) {
      this.annotationPosition.set(null);
      return;
    }
    const pos = this.annotationPosition();
    if (!pos) {
      return;
    }

    this.annotationsService.addAnnotation({
      id: crypto.randomUUID(),
      text: this.textControl.value,
      imageUrl: this.file(),
      x: pos.x,
      y: pos.y,
      pageId: pos.pageId,
    });

    this.documentLoggerService.document.set({
      pages: this.pages(),
      annotations: this.annotations(),
      documentId: this.id(),
    });
    this.closeEditor();
  }

  deleteAnnotation(uuid: string) {
    this.annotationsService.removeAnnotation(uuid);
  }

  closeEditor() {
    this.annotationPosition.set(null);
    this.textControl.reset();
    this.fileControl.reset();
    this.typeControl.reset();
  }

  removeFile() {
    this.fileControl.setValue(null);
    this.file.set(null);
  }

  startDrag(event: PointerEvent, index: number, annotation: Annotation): void {
    if ((event.target as HTMLElement).closest('.annotation-close')) return;

    event.preventDefault();
    event.stopPropagation();

    const el = event.currentTarget as HTMLElement;
    const page = el.closest('.page') as HTMLElement;
    const zoom = this.zoomService.zoom();

    this.dragging = {
      index,
      startX: event.clientX,
      startY: event.clientY,
      originX: annotation.x,
      originY: annotation.y,
      maxX: Math.max(0, (page.clientWidth - el.offsetWidth) / zoom),
      maxY: Math.max(0, (page.clientHeight - el.offsetHeight) / zoom),
    };

    el.setPointerCapture(event.pointerId);
  }

  onDrag(event: PointerEvent): void {
    if (!this.dragging) return;
    const zoom = this.zoomService.zoom();
    const { startX, startY, originX, originY, maxX, maxY, index } = this.dragging;

    const x = originX + (event.clientX - startX) / zoom;
    const y = originY + (event.clientY - startY) / zoom;

    this.annotationsService.updateAnnotation(index, {
      x: Math.min(Math.max(x, 0), maxX),
      y: Math.min(Math.max(y, 0), maxY),
    });
  }

  endDrag(event: PointerEvent): void {
    if (!this.dragging) return;
    (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
    this.dragging = null;
  }

  ngOnDestroy() {
    URL.revokeObjectURL(this.file()!);
  }
}
