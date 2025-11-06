import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Project } from '../../../shared/services/project.service';
import { PortfolioCardComponent } from '../portfolio-card/portfolio-card.component';

@Component({
  selector: 'app-business-portfolio-section',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    PortfolioCardComponent
  ],
  templateUrl: './business-portfolio-section.component.html',
  styleUrls: ['./business-portfolio-section.component.scss']
})
export class BusinessPortfolioSectionComponent {
  completedProjects = input.required<Project[]>();
  portfolioLoading = input.required<boolean>();
  
  viewProjectClick = output<Project>();

  currentIndex = signal(0);

  onViewProject(project: Project): void {
    this.viewProjectClick.emit(project);
  }

  // Calculate slide width based on how many cards to show
  getSlideWidth(): number {
    return 80; // Move 80% to show 2 full cards and half of the next
  }

  nextSlide(): void {
    const projects = this.completedProjects();
    const maxIndex = Math.max(0, projects.length - 3);
    if (this.currentIndex() < projects.length - 3) {
      this.currentIndex.update(i => Math.min(i + 2, maxIndex));
    }
  }

  prevSlide(): void {
    if (this.currentIndex() > 0) {
      this.currentIndex.update(i => Math.max(i - 2, 0));
    }
  }

  goToSlide(index: number): void {
    this.currentIndex.set(index * 2);
  }

  getTotalPages(): number {
    return Math.ceil(this.completedProjects().length / 2);
  }

  getPageArray(): number[] {
    return Array.from({ length: this.getTotalPages() }, (_, i) => i);
  }

  getCurrentPage(): number {
    return Math.floor(this.currentIndex() / 2);
  }
}
