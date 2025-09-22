import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { ConfigService } from './config.service';

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  is_active: boolean;
  sort_order?: number;
  meta_title?: string;
  meta_description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subcategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image_url?: string;
  category_id: string | Category;
  is_active: boolean;
  sort_order?: number;
  meta_title?: string;
  meta_description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCategoryDto {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  is_active?: boolean;
  sort_order?: number;
  meta_title?: string;
  meta_description?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  slug?: string;
  description?: string;
  icon?: string;
  is_active?: boolean;
  sort_order?: number;
  meta_title?: string;
  meta_description?: string;
}

export interface CreateSubcategoryDto {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image_url?: string;
  category_id: string;
  is_active?: boolean;
  sort_order?: number;
  meta_title?: string;
  meta_description?: string;
}

export interface UpdateSubcategoryDto {
  name?: string;
  slug?: string;
  description?: string;
  icon?: string;
  image_url?: string;
  category_id?: string;
  is_active?: boolean;
  sort_order?: number;
  meta_title?: string;
  meta_description?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoriesService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);
  private readonly categoriesUrl = `${this.config.apiBaseUrl}/categories`;
  private readonly subcategoriesUrl = `${this.config.apiBaseUrl}/subcategories`;

  // Categories CRUD Operations
  getCategories(isActive?: boolean): Observable<ApiResponse<Category[]>> {
    const url = isActive !== undefined ? `${this.categoriesUrl}?active=${isActive}` : this.categoriesUrl;
    return this.http.get<ApiResponse<Category[]>>(url);
  }

  async getCategoriesAsync(isActive?: boolean): Promise<Category[]> {
    try {
      const response = await firstValueFrom(this.getCategories(isActive));
      return response.data || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  getCategory(id: string): Observable<ApiResponse<Category>> {
    return this.http.get<ApiResponse<Category>>(`${this.categoriesUrl}/${id}`);
  }

  async getCategoryAsync(id: string): Promise<Category> {
    try {
      const response = await firstValueFrom(this.getCategory(id));
      return response.data;
    } catch (error) {
      console.error('Error fetching category:', error);
      throw error;
    }
  }

  createCategory(categoryData: CreateCategoryDto): Observable<ApiResponse<Category>> {
    return this.http.post<ApiResponse<Category>>(this.categoriesUrl, categoryData);
  }

  async createCategoryAsync(categoryData: CreateCategoryDto): Promise<Category> {
    try {
      const response = await firstValueFrom(this.createCategory(categoryData));
      return response.data;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  updateCategory(id: string, categoryData: UpdateCategoryDto): Observable<ApiResponse<Category>> {
    return this.http.patch<ApiResponse<Category>>(`${this.categoriesUrl}/${id}`, categoryData);
  }

  async updateCategoryAsync(id: string, categoryData: UpdateCategoryDto): Promise<Category> {
    try {
      const response = await firstValueFrom(this.updateCategory(id, categoryData));
      return response.data;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  deleteCategory(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.categoriesUrl}/${id}`);
  }

  async deleteCategoryAsync(id: string): Promise<void> {
    try {
      await firstValueFrom(this.deleteCategory(id));
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  // Subcategories CRUD Operations
  getSubcategories(isActive?: boolean, categoryId?: string): Observable<ApiResponse<Subcategory[]>> {
    let url = this.subcategoriesUrl;
    const params = new URLSearchParams();
    
    if (isActive !== undefined) params.append('active', isActive.toString());
    if (categoryId) params.append('category', categoryId);
    
    if (params.toString()) url += `?${params.toString()}`;
    return this.http.get<ApiResponse<Subcategory[]>>(url);
  }

  async getSubcategoriesAsync(isActive?: boolean, categoryId?: string): Promise<Subcategory[]> {
    try {
      const response = await firstValueFrom(this.getSubcategories(isActive, categoryId));
      return response.data || [];
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      throw error;
    }
  }

  getSubcategoriesByCategory(categoryId: string, isActive?: boolean): Observable<ApiResponse<Subcategory[]>> {
    const url = isActive !== undefined 
      ? `${this.subcategoriesUrl}/category/${categoryId}?active=${isActive}`
      : `${this.subcategoriesUrl}/category/${categoryId}`;
    return this.http.get<ApiResponse<Subcategory[]>>(url);
  }

  async getSubcategoriesByCategoryAsync(categoryId: string, isActive?: boolean): Promise<Subcategory[]> {
    try {
      const response = await firstValueFrom(this.getSubcategoriesByCategory(categoryId, isActive));
      return response.data || [];
    } catch (error) {
      console.error('Error fetching subcategories by category:', error);
      throw error;
    }
  }

  getSubcategory(id: string): Observable<ApiResponse<Subcategory>> {
    return this.http.get<ApiResponse<Subcategory>>(`${this.subcategoriesUrl}/${id}`);
  }

  async getSubcategoryAsync(id: string): Promise<Subcategory> {
    try {
      const response = await firstValueFrom(this.getSubcategory(id));
      return response.data;
    } catch (error) {
      console.error('Error fetching subcategory:', error);
      throw error;
    }
  }

  createSubcategory(subcategoryData: CreateSubcategoryDto): Observable<ApiResponse<Subcategory>> {
    return this.http.post<ApiResponse<Subcategory>>(this.subcategoriesUrl, subcategoryData);
  }

  async createSubcategoryAsync(subcategoryData: CreateSubcategoryDto): Promise<Subcategory> {
    try {
      const response = await firstValueFrom(this.createSubcategory(subcategoryData));
      return response.data;
    } catch (error) {
      console.error('Error creating subcategory:', error);
      throw error;
    }
  }

  updateSubcategory(id: string, subcategoryData: UpdateSubcategoryDto): Observable<ApiResponse<Subcategory>> {
    return this.http.patch<ApiResponse<Subcategory>>(`${this.subcategoriesUrl}/${id}`, subcategoryData);
  }

  async updateSubcategoryAsync(id: string, subcategoryData: UpdateSubcategoryDto): Promise<Subcategory> {
    try {
      const response = await firstValueFrom(this.updateSubcategory(id, subcategoryData));
      return response.data;
    } catch (error) {
      console.error('Error updating subcategory:', error);
      throw error;
    }
  }

  deleteSubcategory(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.subcategoriesUrl}/${id}`);
  }

  async deleteSubcategoryAsync(id: string): Promise<void> {
    try {
      await firstValueFrom(this.deleteSubcategory(id));
    } catch (error) {
      console.error('Error deleting subcategory:', error);
      throw error;
    }
  }

  // Combined operations
  async getCategoriesWithSubcategories(): Promise<(Category & { subcategories?: Subcategory[] })[]> {
    try {
      const [categories, subcategories] = await Promise.all([
        this.getCategoriesAsync(),
        this.getSubcategoriesAsync()
      ]);

      // Handle null/undefined arrays
      const safeCategories = categories || [];
      const safeSubcategories = subcategories || [];

      return safeCategories
        .filter(category => category && category._id) // Filter out null/invalid categories
        .map(category => ({
          ...category,
          subcategories: safeSubcategories.filter(sub => {
            // Handle null/undefined subcategory
            if (!sub || !sub.category_id) {
              if (!sub) {
                console.warn('Found null subcategory in data');
              } else if (!sub.category_id) {
                console.warn('Found subcategory with null category_id:', sub);
              }
              return false;
            }
            
            // Handle both string and object types for category_id
            if (typeof sub.category_id === 'string') {
              return sub.category_id === category._id;
            } else if (sub.category_id && typeof sub.category_id === 'object' && sub.category_id._id) {
              return sub.category_id._id === category._id;
            }
            
            console.warn('Unexpected category_id format:', sub.category_id);
            return false;
          })
        }));
    } catch (error) {
      console.error('Error fetching categories with subcategories:', error);
      throw error;
    }
  }

  // Utility methods
  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
