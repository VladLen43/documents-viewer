import { computed, Service, signal } from '@angular/core';

@Service()
export class ZoomService {
  zoom = signal(1.0);

  private readonly maxZoom = 2;
  private readonly minZoom = 0.5;
  private readonly zoomStep = 0.1;

  readonly zoomPercent = computed(() => Math.round(this.zoom() * 100));

  zoomPlus() {
    this.zoom.update((zoom) => +Math.min(zoom + this.zoomStep, this.maxZoom).toFixed(1));
  }

  zoomMinus() {
    this.zoom.update((zoom) => +Math.max(zoom - this.zoomStep, this.minZoom).toFixed(1));
  }
}
