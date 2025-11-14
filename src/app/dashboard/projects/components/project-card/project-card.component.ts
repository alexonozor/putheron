import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { Project } from '../../../../shared/services/project.service';

@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule],
  templateUrl: './project-card.component.html',
  styleUrl: './project-card.component.scss'
})
export class ProjectCardComponent {
  @Input() project!: Project;
  @Input() clientName: string = '';
  @Input() businessName: string = '';
  @Input() statusColorClass: string = '';
  @Input() statusText: string = '';

  @Output() view = new EventEmitter<Project>();
  @Output() accept = new EventEmitter<Project>();
  @Output() reject = new EventEmitter<Project>();

  onView() {
    this.view.emit(this.project);
  }

  onAccept() {
    this.accept.emit(this.project);
  }

  onReject() {
    this.reject.emit(this.project);
  }
}
