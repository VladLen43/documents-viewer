import { Component, inject } from '@angular/core';
import { ZoomService } from '../zoom.service';
import { DocumentLoggerService } from '../document-logger.service';

@Component({
  imports: [],
  selector: 'app-zoom',
  styleUrl: './zoom.component.scss',
  templateUrl: './zoom.component.html',
})
export class ZoomComponent {
  public zoomService = inject(ZoomService);
  private readonly documentLoggerService = inject(DocumentLoggerService);

  public zoomPercent = this.zoomService.zoomPercent;

  public zoomPlus() {
    this.zoomService.zoomPlus();
  }
  public zoomMinus() {
    this.zoomService.zoomMinus();
  }

  saveDocument() {
    this.documentLoggerService.saveDocument();
  }
}
