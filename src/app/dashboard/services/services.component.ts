import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './services.component.html',
  styles: []
})
export class ServicesComponent {}
