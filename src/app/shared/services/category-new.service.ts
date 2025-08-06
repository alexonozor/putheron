import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  is_active: boolean;
}

export interface Subcategory {
  _id: string;
  name: string;
  slug: string;
  category_id: string;
  description?: string;
  is_active: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private http = inject(HttpClient);
  private apiUrl = environment.api.baseUrl;

  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  public categories$ = this.categoriesSubject.asObservable();

  getCategories(): Observable<ApiResponse<Category[]>> {
    return this.http.get<ApiResponse<Category[]>>(`${this.apiUrl}/categories`);
  }

  getSubcategories(categoryId?: string): Observable<ApiResponse<Subcategory[]>> {
    const url = categoryId 
      ? `${this.apiUrl}/subcategories?categoryId=${categoryId}`
      : `${this.apiUrl}/subcategories`;
    return this.http.get<ApiResponse<Subcategory[]>>(url);
  }

  async loadCategories(): Promise<Category[]> {
    try {
      const response = await this.getCategories().toPromise();
      if (response?.success && response.data) {
        this.categoriesSubject.next(response.data);
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Error loading categories:', error);
      return [];
    }
  }
}
