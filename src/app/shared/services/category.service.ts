import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Category, CategoryInsert, CategoryUpdate, Subcategory, SubcategoryInsert, SubcategoryUpdate } from '../../models/category.model';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  constructor(private supabase: SupabaseService) {}

  // Category methods
  async getCategories(): Promise<Category[]> {
    const { data, error } = await this.supabase.getClient()
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }

    return data || [];
  }

  async getCategoryById(id: string): Promise<Category | null> {
    const { data, error } = await this.supabase.getClient()
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching category:', error);
      throw error;
    }

    return data;
  }

  async createCategory(category: CategoryInsert): Promise<Category> {
    const { data, error } = await this.supabase.getClient()
      .from('categories')
      .insert(category)
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      throw error;
    }

    return data;
  }

  async updateCategory(id: string, updates: CategoryUpdate): Promise<Category> {
    const { data, error } = await this.supabase.getClient()
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating category:', error);
      throw error;
    }

    return data;
  }

  async deleteCategory(id: string): Promise<void> {
    const { error } = await this.supabase.getClient()
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  // Subcategory methods
  async getSubcategories(categoryId?: string): Promise<Subcategory[]> {
    let query = this.supabase.getClient()
      .from('subcategories')
      .select('*')
      .order('name', { ascending: true });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching subcategories:', error);
      throw error;
    }

    return data || [];
  }

  async getSubcategoryById(id: string): Promise<Subcategory | null> {
    const { data, error } = await this.supabase.getClient()
      .from('subcategories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching subcategory:', error);
      throw error;
    }

    return data;
  }

  async createSubcategory(subcategory: SubcategoryInsert): Promise<Subcategory> {
    const { data, error } = await this.supabase.getClient()
      .from('subcategories')
      .insert(subcategory)
      .select()
      .single();

    if (error) {
      console.error('Error creating subcategory:', error);
      throw error;
    }

    return data;
  }

  async updateSubcategory(id: string, updates: SubcategoryUpdate): Promise<Subcategory> {
    const { data, error } = await this.supabase.getClient()
      .from('subcategories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating subcategory:', error);
      throw error;
    }

    return data;
  }

  async deleteSubcategory(id: string): Promise<void> {
    const { error } = await this.supabase.getClient()
      .from('subcategories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting subcategory:', error);
      throw error;
    }
  }

  // Combined methods
  async getCategoriesWithSubcategories(): Promise<any[]> {
    const { data, error } = await this.supabase.getClient()
      .from('categories')
      .select(`
        *,
        subcategories (*)
      `)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching categories with subcategories:', error);
      throw error;
    }

    return data || [];
  }
}
