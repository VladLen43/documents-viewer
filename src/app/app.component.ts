import { TuiRoot } from '@taiga-ui/core';
import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ZoomComponent } from './zoom/zoom.component';

@Component({
  imports: [RouterOutlet, TuiRoot, TuiRoot, ZoomComponent],
  selector: 'app-root',
  styleUrl: './app.component.scss',
  templateUrl: './app.component.html',
})
export class AppComponent {
  protected readonly title = signal('documents-editor');
}
