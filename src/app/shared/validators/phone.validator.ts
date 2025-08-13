import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class PhoneValidators {
  /**
   * Validates USA phone numbers in various formats:
   * - (123) 456-7890
   * - 123-456-7890
   * - 123.456.7890
   * - 123 456 7890
   * - 1234567890
   * - +1 (123) 456-7890
   * - +1-123-456-7890
   * - +1 123 456 7890
   * - +11234567890
   */
  static usaPhone(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // Don't validate empty values (use Validators.required for that)
      }

      const phoneStr = control.value.toString().trim();
      
      // USA phone number regex patterns
      const patterns = [
        /^\(\d{3}\)\s?\d{3}-\d{4}$/,           // (123) 456-7890 or (123)456-7890
        /^\d{3}-\d{3}-\d{4}$/,                 // 123-456-7890
        /^\d{3}\.\d{3}\.\d{4}$/,               // 123.456.7890
        /^\d{3}\s\d{3}\s\d{4}$/,               // 123 456 7890
        /^\d{10}$/,                            // 1234567890
        /^\+1\s?\(\d{3}\)\s?\d{3}-\d{4}$/,     // +1 (123) 456-7890 or +1(123)456-7890
        /^\+1-\d{3}-\d{3}-\d{4}$/,             // +1-123-456-7890
        /^\+1\s\d{3}\s\d{3}\s\d{4}$/,          // +1 123 456 7890
        /^\+1\d{10}$/,                         // +11234567890
      ];

      const isValid = patterns.some(pattern => pattern.test(phoneStr));

      if (!isValid) {
        return {
          usaPhone: {
            message: 'Please enter a valid USA phone number (e.g., (123) 456-7890, 123-456-7890, or +1 123 456 7890)',
            actualValue: phoneStr
          }
        };
      }

      return null;
    };
  }

  /**
   * Formats a phone number to USA standard format: (123) 456-7890
   */
  static formatUsaPhone(phone: string): string {
    if (!phone) return '';

    // Remove all non-digit characters except +
    const cleaned = phone.replace(/[^\d+]/g, '');
    
    // Remove +1 country code if present
    let digits = cleaned;
    if (digits.startsWith('+1')) {
      digits = digits.substring(2);
    } else if (digits.startsWith('1') && digits.length === 11) {
      digits = digits.substring(1);
    }

    // Check if we have exactly 10 digits
    if (digits.length === 10) {
      const areaCode = digits.substring(0, 3);
      const exchange = digits.substring(3, 6);
      const number = digits.substring(6, 10);
      return `(${areaCode}) ${exchange}-${number}`;
    }

    // If not 10 digits, return original
    return phone;
  }

  /**
   * Strips formatting from phone number, keeping only digits and +1 if present
   */
  static stripPhoneFormatting(phone: string): string {
    if (!phone) return '';

    // Remove all characters except digits and +
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // Ensure we have +1 prefix for USA numbers
    if (cleaned.length === 10) {
      cleaned = '+1' + cleaned;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      cleaned = '+' + cleaned;
    }

    return cleaned;
  }

  /**
   * Custom directive for auto-formatting phone input as user types
   */
  static autoFormatPhone(input: HTMLInputElement): void {
    input.addEventListener('input', (event) => {
      const target = event.target as HTMLInputElement;
      const value = target.value;
      const formatted = PhoneValidators.formatUsaPhone(value);
      
      if (formatted !== value) {
        const cursorPosition = target.selectionStart || 0;
        target.value = formatted;
        
        // Restore cursor position (approximately)
        const newPosition = Math.min(cursorPosition + (formatted.length - value.length), formatted.length);
        target.setSelectionRange(newPosition, newPosition);
      }
    });
  }
}
