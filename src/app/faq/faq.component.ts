import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { HeaderComponent } from '../shared/components/header/header.component';
import { FooterComponent } from '../shared/components/footer/footer.component';
import { MatDrawer, MatDrawerContainer, MatDrawerContent } from "@angular/material/sidenav";
import { UserSidenavComponent } from "../shared/components/user-sidenav/user-sidenav.component";
import { GuestSidenavComponent } from "../shared/components/guest-sidenav/guest-sidenav.component";
import { AuthService } from '../shared/services';

interface FaqItem {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [
    CommonModule,
    MatExpansionModule,
    MatIconModule,
    MatButtonModule,
    HeaderComponent,
    FooterComponent,
    MatDrawer,
    MatDrawerContainer,
    UserSidenavComponent,
    GuestSidenavComponent,
    MatDrawerContent
],
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.scss']
})
export class FaqComponent {

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  faqs: FaqItem[] = [
    {
      question: 'What is VouchHer?',
      answer: 'VouchHer is a trusted platform connecting women freelancers with clients and businesses looking for trusted remote talent.'
    },
    {
      question: 'Who can join VouchHer?',
      answer: 'VouchHer is open to women freelancers from all backgrounds and skill levels. Whether you\'re a designer, developer, writer, marketer, or offer any professional service, you can create a profile and start showcasing your skills to potential clients.'
    },
    {
      question: 'Is VouchHer only for women?',
      answer: 'Yes, VouchHer is a platform specifically designed to empower and support women freelancers. We focus on creating opportunities for women professionals to connect with clients seeking their expertise.'
    },
    {
      question: 'What type of jobs or services are available?',
      answer: 'VouchHer offers a wide range of services including graphic design, web development, content writing, digital marketing, consulting, virtual assistance, and many more. Freelancers can offer both service-based and product-based offerings.'
    },
    {
      question: 'How does VouchHer work?',
      answer: 'Freelancers create a profile showcasing their skills, services, and portfolio. Clients browse through profiles, search for specific services, and can directly contact freelancers to discuss projects. The platform facilitates secure communication and payment processing.'
    },
    {
      question: 'How do I create a freelancer profile?',
      answer: 'Sign up for a VouchHer account, complete your profile with your professional information, add your services with pricing, upload portfolio samples, and start receiving inquiries from potential clients. Make sure to provide detailed information to attract the right clients.'
    },
    {
      question: 'Do I set my own rate?',
      answer: 'Yes! As a freelancer on VouchHer, you have complete control over your pricing. You can set your rates based on your experience, skills, and the value you provide. You can offer fixed-price services, hourly rates, or project-based pricing.'
    },
    {
      question: 'Do I pay a commission or service fee?',
      answer: 'VouchHer charges a small service fee on completed transactions to maintain the platform and provide secure payment processing. The fee structure is transparent and will be clearly displayed before you complete any transaction.'
    },
    {
      question: 'Can I work with international clients?',
      answer: 'Absolutely! VouchHer is a global platform that connects freelancers with clients worldwide. You can work with clients from any country, and the platform supports international payments to make cross-border transactions seamless.'
    },
    {
      question: 'How do I hire a VouchHer woman?',
      answer: 'Browse through freelancer profiles, use the search and filter options to find professionals with the skills you need, review their portfolios and ratings, and reach out directly to discuss your project requirements. You can compare multiple freelancers before making your decision.'
    },
    {
      question: 'How do I make payment?',
      answer: 'VouchHer provides secure payment processing through integrated payment gateways including PayPal and Stripe. You can pay using credit cards, debit cards, or other supported payment methods. All transactions are encrypted and secure.'
    },
    {
      question: 'Is there a guarantee on project delivery?',
      answer: 'While VouchHer provides a platform for connecting freelancers and clients, project delivery terms are agreed upon between you and the freelancer. We recommend clear communication about timelines, deliverables, and milestones. Review ratings and reviews from other clients to help you choose reliable freelancers.'
    }
  ];

  currentUser = computed(() => {
    return this.authService.user();
  });

  navigateToContact() {
    this.router.navigate(['/contact']);
  }
}
