import { Injectable, inject } from '@angular/core';
import { loadStripe, Stripe, StripeElements, StripePaymentElement } from '@stripe/stripe-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StripeService {
  private stripePromise: Promise<Stripe | null>;
  private stripe: Stripe | null = null;

  constructor() {
    this.stripePromise = loadStripe(environment.stripe.publishableKey);
  }

  async getStripe(): Promise<Stripe | null> {
    if (!this.stripe) {
      this.stripe = await this.stripePromise;
    }
    return this.stripe;
  }

  async createElement(clientSecret: string): Promise<{ elements: StripeElements; paymentElement: StripePaymentElement }> {
    const stripe = await this.getStripe();
    if (!stripe) {
      throw new Error('Stripe failed to load');
    }

    const elements = stripe.elements({
      clientSecret,
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#3b82f6',
          colorBackground: '#ffffff',
          colorText: '#1f2937',
          colorDanger: '#ef4444',
          fontFamily: '"Inter", "Segoe UI", sans-serif',
          spacingUnit: '4px',
          borderRadius: '8px',
        },
        rules: {
          '.Tab': {
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          },
          '.Tab:hover': {
            color: '#1f2937',
            backgroundColor: '#f9fafb',
          },
          '.Tab--selected': {
            backgroundColor: '#3b82f6',
            color: '#ffffff',
          },
        },
      },
    });

    const paymentElement = elements.create('payment', {
      layout: 'tabs',
    });

    return { elements, paymentElement };
  }

  async confirmPayment(clientSecret: string, elements: StripeElements, returnUrl: string) {
    const stripe = await this.getStripe();
    if (!stripe) {
      throw new Error('Stripe failed to load');
    }

    return await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
      },
    });
  }

  async confirmPaymentWithoutRedirect(clientSecret: string, elements: StripeElements) {
    const stripe = await this.getStripe();
    if (!stripe) {
      throw new Error('Stripe failed to load');
    }

    // Submit the form to Stripe to get payment method
    const { error: submitError } = await elements.submit();
    if (submitError) {
      throw submitError;
    }

    // Confirm payment without redirect
    return await stripe.confirmPayment({
      elements,
      confirmParams: {},
      redirect: 'if_required'
    });
  }

  async retrievePaymentIntent(clientSecret: string) {
    const stripe = await this.getStripe();
    if (!stripe) {
      throw new Error('Stripe failed to load');
    }

    return await stripe.retrievePaymentIntent(clientSecret);
  }
}
