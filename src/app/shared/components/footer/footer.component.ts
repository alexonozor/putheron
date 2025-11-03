import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'footer-component',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
  expandedSection: string | null = null;

  toggleSection(section: string): void {
    this.expandedSection = this.expandedSection === section ? null : section;
  }

  isExpanded(section: string): boolean {
    return this.expandedSection === section;
  }
}