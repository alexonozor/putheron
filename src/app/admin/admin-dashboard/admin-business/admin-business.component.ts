import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin-business',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './admin-business.component.html',
  styleUrl: './admin-business.component.scss'
})
export class AdminBusinessComponent {

}
