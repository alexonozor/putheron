import { Directive, ElementRef, HostListener, OnInit } from '@angular/core';
import { PhoneValidators } from '../validators/phone.validator';

@Directive({
  selector: '[appPhoneFormat]',
  standalone: true
})
export class PhoneFormatDirective implements OnInit {
  private readonly element: HTMLInputElement;

  constructor(private el: ElementRef) {
    this.element = this.el.nativeElement;
  }

  ngOnInit() {
    // Set input type to tel for better mobile experience
    this.element.type = 'tel';
    this.element.setAttribute('autocomplete', 'tel');
  }

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const cursorPosition = input.selectionStart || 0;
    const value = input.value;
    
    // Format the phone number
    const formatted = this.formatPhoneNumber(value);
    
    if (formatted !== value) {
      input.value = formatted;
      
      // Restore cursor position (approximately)
      const newPosition = this.calculateNewCursorPosition(
        value, 
        formatted, 
        cursorPosition
      );
      
      // Use setTimeout to ensure the value is set before setting cursor position
      setTimeout(() => {
        input.setSelectionRange(newPosition, newPosition);
      }, 0);
    }
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;
    
    // Allow: backspace, delete, tab, escape, enter
    if ([8, 9, 27, 13, 46].includes(event.keyCode) ||
        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
        (event.ctrlKey && [65, 67, 86, 88, 90].includes(event.keyCode)) ||
        // Allow: home, end, left, right
        (event.keyCode >= 35 && event.keyCode <= 39)) {
      return;
    }
    
    // Ensure that it is a number or +
    if ((event.shiftKey || (event.keyCode < 48 || event.keyCode > 57)) && 
        (event.keyCode < 96 || event.keyCode > 105) &&
        event.keyCode !== 107 && // + key
        event.keyCode !== 187) { // + key (Chrome)
      event.preventDefault();
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const paste = event.clipboardData?.getData('text') || '';
    const formatted = this.formatPhoneNumber(paste);
    
    const input = event.target as HTMLInputElement;
    input.value = formatted;
    
    // Trigger input event to ensure form validation runs
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  private formatPhoneNumber(value: string): string {
    // Remove all non-digit characters except +
    const cleaned = value.replace(/[^\d+]/g, '');
    
    // Handle international format (+1)
    if (cleaned.startsWith('+1')) {
      const digits = cleaned.substring(2);
      if (digits.length === 0) return '+1';
      if (digits.length <= 3) return `+1 (${digits}`;
      if (digits.length <= 6) return `+1 (${digits.substring(0, 3)}) ${digits.substring(3)}`;
      return `+1 (${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6, 10)}`;
    }
    
    // Handle regular 10-digit format
    if (cleaned.startsWith('+')) {
      return cleaned; // Let other international formats pass through
    }
    
    // Remove leading 1 if it exists and we have 11 digits
    let digits = cleaned;
    if (digits.length === 11 && digits.startsWith('1')) {
      digits = digits.substring(1);
    }
    
    // Format based on length
    if (digits.length === 0) return '';
    if (digits.length <= 3) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.substring(0, 3)}) ${digits.substring(3)}`;
    if (digits.length <= 10) {
      return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
    }
    
    // If more than 10 digits, truncate
    return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6, 10)}`;
  }

  private calculateNewCursorPosition(
    oldValue: string, 
    newValue: string, 
    oldPosition: number
  ): number {
    // Count the number of digits before the cursor in the old value
    const digitsBeforeCursor = oldValue.substring(0, oldPosition).replace(/\D/g, '').length;
    
    // Find the position after the same number of digits in the new value
    let newPosition = 0;
    let digitCount = 0;
    
    for (let i = 0; i < newValue.length && digitCount < digitsBeforeCursor; i++) {
      if (/\d/.test(newValue[i])) {
        digitCount++;
      }
      newPosition = i + 1;
    }
    
    return Math.min(newPosition, newValue.length);
  }
}
