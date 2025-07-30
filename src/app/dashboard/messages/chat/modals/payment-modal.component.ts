import { Component, inject, Inject, OnInit, AfterViewInit, ViewChild, ElementRef, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StripeService } from '../../../../shared/services/stripe.service';
import { ChatService } from '../../../../shared/services/chat.service';

export interface PaymentData {
  amount: string;
  description: string;
  paymentMethod: string;
  paymentIntentId?: string;
}

export interface PaymentModalData {
  amount: string;
  description: string;
  businessName: string;
  chatId: string;
  messageId: string;
}

@Component({
  selector: 'app-payment-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h1 mat-dialog-title class="dialog-title">
      <mat-icon class="title-icon">payment</mat-icon>
      Make Payment
    </h1>
    
    <div mat-dialog-content class="dialog-content">
      <div class="payment-details">
        <div class="amount-section">
          <h3>Payment Amount</h3>
          <div class="amount-display">
            \${{data.amount}}
          </div>
        </div>
        
        <div class="description-section">
          <h3>Payment For</h3>
          <p>{{data.description}}</p>
          <p class="business-name">To: {{data.businessName}}</p>
        </div>
      </div>

      @if (!showStripeForm()) {
        <form [formGroup]="paymentForm" class="payment-form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Payment Method</mat-label>
            <mat-select formControlName="paymentMethod">
              <mat-option value="card">Credit/Debit Card</mat-option>
            </mat-select>
            <mat-error *ngIf="paymentForm.get('paymentMethod')?.hasError('required')">
              Please select a payment method
            </mat-error>
          </mat-form-field>

          <div class="payment-note">
            <mat-icon>info</mat-icon>
            <p>This payment will be processed securely via Stripe.</p>
          </div>
        </form>
      } @else {
        <div class="stripe-form">
          <div #stripeElements class="stripe-elements"></div>
          
          @if (stripeError()) {
            <div class="error-message">
              <mat-icon>error</mat-icon>
              <span>{{ stripeError() }}</span>
            </div>
          }
        </div>
      }

      @if (processing()) {
        <div class="loading-overlay">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Processing payment...</p>
        </div>
      }
    </div>
    
    <div mat-dialog-actions align="end">
      <button 
        mat-button 
        (click)="onCancel()"
        [disabled]="processing()">
        Cancel
      </button>
      
      @if (!showStripeForm()) {
        <button 
          mat-raised-button 
          color="primary"
          (click)="setupStripePayment()"
          [disabled]="paymentForm.invalid || processing()">
          <mat-icon>credit_card</mat-icon>
          Proceed to Payment
        </button>
      } @else {
        <button 
          mat-raised-button 
          color="primary"
          (click)="processPayment()"
          [disabled]="processing()">
          <mat-icon>lock</mat-icon>
          Complete Payment
        </button>
      }
    </div>
  `,
  styles: [`
    .dialog-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 0;
    }

    .title-icon {
      color: #10b981;
      font-size: 24px;
    }

    .dialog-content {
      min-width: 400px;
      max-width: 500px;
    }

    .payment-details {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
    }

    .amount-section {
      text-align: center;
      margin-bottom: 16px;
    }

    .amount-section h3 {
      font-size: 14px;
      font-weight: 600;
      color: #64748b;
      margin: 0 0 8px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .amount-display {
      font-size: 32px;
      font-weight: 700;
      color: #10b981;
      margin-bottom: 16px;
    }

    .description-section h3 {
      font-size: 14px;
      font-weight: 600;
      color: #64748b;
      margin: 0 0 8px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .description-section p {
      margin: 0 0 8px 0;
      color: #374151;
      line-height: 1.5;
    }

    .business-name {
      font-weight: 600;
      color: #1f2937;
    }

    .payment-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .full-width {
      width: 100%;
    }

    .payment-note {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 12px;
      background: #dbeafe;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      margin-top: 16px;
    }

    .payment-note mat-icon {
      color: #3b82f6;
      font-size: 20px;
      margin-top: 2px;
    }

    .payment-note p {
      margin: 0;
      font-size: 14px;
      color: #1e40af;
      line-height: 1.4;
    }

    mat-dialog-actions {
      padding-top: 16px;
    }

    mat-dialog-actions button {
      margin-left: 8px;
    }

    mat-dialog-actions button mat-icon {
      margin-right: 8px;
      font-size: 18px;
    }

    .stripe-form {
      margin: 20px 0;
    }

    .stripe-elements {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      background: white;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #ef4444;
      margin-top: 12px;
      font-size: 14px;
    }

    .error-message mat-icon {
      font-size: 18px;
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      border-radius: 12px;
    }

    .loading-overlay p {
      margin: 0;
      font-weight: 500;
      color: #64748b;
    }
  `]
})
export class PaymentModalComponent implements OnInit, AfterViewInit {
  @ViewChild('stripeElements', { static: false, read: ElementRef }) stripeElementsRef!: ElementRef;

  private readonly dialogRef = inject(MatDialogRef<PaymentModalComponent>);
  private readonly formBuilder = inject(FormBuilder);
  private readonly stripeService = inject(StripeService);
  private readonly chatService = inject(ChatService);
  private readonly cdr = inject(ChangeDetectorRef);

  paymentForm: FormGroup;
  
  // Reactive signals
  readonly showStripeForm = signal(false);
  readonly processing = signal(false);
  readonly stripeError = signal<string | null>(null);

  private elements: any = null;
  private paymentElement: any = null;
  private clientSecret: string | null = null;

  constructor(@Inject(MAT_DIALOG_DATA) public data: PaymentModalData) {
    this.paymentForm = this.formBuilder.group({
      paymentMethod: ['card', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // Component initialization
  }

  ngAfterViewInit(): void {
    // View initialization
  }

  async setupStripePayment(): Promise<void> {
    if (this.paymentForm.invalid) return;

    this.processing.set(true);
    this.stripeError.set(null);

    try {
      // Create payment intent on backend
      const paymentData = await this.chatService.createAdditionalPaymentIntentAsync(
        this.data.chatId, 
        this.data.messageId
      );
      
      this.clientSecret = paymentData.clientSecret;

      // Setup Stripe elements
      const { elements, paymentElement } = await this.stripeService.createElement(this.clientSecret);
      this.elements = elements;
      this.paymentElement = paymentElement;

      // Show Stripe form first
      this.showStripeForm.set(true);

      // Trigger change detection and wait for DOM to update
      this.cdr.detectChanges();
      
      // Wait for DOM to update, then mount the payment element
      setTimeout(() => {
        if (this.stripeElementsRef?.nativeElement) {
          this.paymentElement.mount(this.stripeElementsRef.nativeElement);
        } else {
          this.stripeError.set('Unable to initialize payment form');
        }
      }, 100);

    } catch (error: any) {
      console.error('Error setting up payment:', error);
      this.stripeError.set(error.message || 'Failed to setup payment');
    } finally {
      this.processing.set(false);
    }
  }

  async processPayment(): Promise<void> {
    if (!this.elements || !this.clientSecret) {
      this.stripeError.set('Payment not properly initialized');
      return;
    }

    this.processing.set(true);
    this.stripeError.set(null);

    try {
      // Confirm payment with Stripe
      const { error, paymentIntent } = await this.stripeService.confirmPaymentWithoutRedirect(
        this.clientSecret,
        this.elements
      );

      if (error) {
        this.stripeError.set(error.message || 'Payment failed');
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        // Confirm payment on backend
        await this.chatService.confirmAdditionalPaymentAsync(
          this.data.chatId,
          this.data.messageId,
          paymentIntent.id
        );

        // Close modal with success
        const result: PaymentData = {
          amount: this.data.amount,
          description: this.data.description,
          paymentMethod: this.paymentForm.value.paymentMethod,
          paymentIntentId: paymentIntent.id
        };
        this.dialogRef.close(result);
      } else {
        this.stripeError.set('Payment was not completed successfully');
      }
    } catch (error: any) {
      console.error('Error processing payment:', error);
      this.stripeError.set(error.message || 'Payment processing failed');
    } finally {
      this.processing.set(false);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
