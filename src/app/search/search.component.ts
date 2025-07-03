import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-search',
  imports: [CommonModule],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss'
})
export class SearchComponent implements OnInit {
  private route = inject(ActivatedRoute);
  
  searchQuery: string = '';
  selectedCountries: string[] = [];

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.searchQuery = params['q'] || '';
      this.selectedCountries = params['countries'] ? params['countries'].split(',') : [];
      
      console.log('Search Query:', this.searchQuery);
      console.log('Selected Countries:', this.selectedCountries);
    });
  }
}
