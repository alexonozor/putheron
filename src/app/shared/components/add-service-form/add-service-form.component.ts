import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SupabaseService } from '../../services/supabase.service';
import { Tables } from '../../types/database.types';

interface DialogData {
  businessId: string;
  businessName: string;
}

interface ServiceFormData {
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  image_url?: string;
  is_active: boolean;
}

@Component({
  selector: 'app-add-service-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatCheckboxModule
  ],
  template: `
    <div class="p-6">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">Add New Service</h2>
      <p class="text-gray-600 mb-6">Add a service to {{ data.businessName }}</p>
      
      <form [formGroup]="serviceForm" (ngSubmit)="submitService()">
        <!-- Service Name -->
        <mat-form-field appearance="outline" class="w-full mb-4">
          <mat-label>Service Name</mat-label>
          <input 
            matInput 
            formControlName="name" 
            placeholder="e.g., Hair Styling, Web Design, Photography"
            required>
          <mat-error *ngIf="serviceForm.get('name')?.hasError('required')">
            Service name is required
          </mat-error>
        </mat-form-field>

        <!-- Description -->
        <mat-form-field appearance="outline" class="w-full mb-4">
          <mat-label>Description</mat-label>
          <textarea 
            matInput 
            formControlName="description" 
            rows="4" 
            placeholder="Describe your service in detail...">
          </textarea>
        </mat-form-field>

        <!-- Price and Duration -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <mat-form-field appearance="outline">
            <mat-label>Price ($)</mat-label>
            <input 
              matInput 
              type="number" 
              formControlName="price" 
              placeholder="0.00"
              min="0"
              step="0.01">
            <span matSuffix>USD</span>
            <mat-hint>Leave empty if price varies</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Duration (minutes)</mat-label>
            <input 
              matInput 
              type="number" 
              formControlName="duration_minutes" 
              placeholder="60"
              min="0"
              step="15">
            <mat-hint>Estimated service duration</mat-hint>
          </mat-form-field>
        </div>

        <!-- Image URL -->
        <mat-form-field appearance="outline" class="w-full mb-4">
          <mat-label>Image URL (Optional)</mat-label>
          <input 
            matInput 
            type="url" 
            formControlName="image_url" 
            placeholder="https://example.com/image.jpg">
          <mat-hint>Add a representative image for your service</mat-hint>
        </mat-form-field>

        <!-- Service Status -->
        <div class="mb-6">
          <mat-checkbox formControlName="is_active" class="text-gray-700">
            Make this service active immediately
          </mat-checkbox>
          <p class="text-sm text-gray-500 mt-1">
            Active services will be visible to customers
          </p>
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end space-x-3">
          <button 
            type="button" 
            mat-button 
            (click)="dialogRef.close()">
            Cancel
          </button>
          <button 
            type="submit" 
            mat-raised-button 
            color="primary"
            [disabled]="serviceForm.invalid || submitting()">
            {{ submitting() ? 'Creating...' : 'Create Service' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .mat-mdc-form-field {
      width: 100%;
    }
  `]
})
export class AddServiceFormComponent {
  private fb = inject(FormBuilder);
  private supabaseService = inject(SupabaseService);
  public dialogRef = inject(MatDialogRef<AddServiceFormComponent>);
  public data = inject<DialogData>(MAT_DIALOG_DATA);

  public submitting = signal(false);
  public serviceForm: FormGroup;

  constructor() {
    this.serviceForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      price: [null],
      duration_minutes: [60],
      image_url: [''],
      is_active: [true]
    });
  }

  async submitService() {
    if (this.serviceForm.invalid) return;

    try {
      this.submitting.set(true);
      
      const formValue = this.serviceForm.value as ServiceFormData;
      
      const serviceData = {
        business_id: this.data.businessId,
        name: formValue.name,
        description: formValue.description || null,
        price: formValue.price || null,
        duration_minutes: formValue.duration_minutes || null,
        image_url: formValue.image_url || null,
        is_active: formValue.is_active
      };

      const { data, error } = await this.supabaseService.getClient()
        .from('services')
        .insert(serviceData)
        .select()
        .single();

      if (error) {
        console.error('Error creating service:', error);
        throw error;
      }

      console.log('Service created successfully:', data);
      this.dialogRef.close(data);
    } catch (error) {
      console.error('Error submitting service:', error);
      // You might want to show a toast or error message here
    } finally {
      this.submitting.set(false);
    }
  }
}
