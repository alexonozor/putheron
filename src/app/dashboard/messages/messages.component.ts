import { Component} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet
],
 templateUrl: './messages.component.html',
})
export class MessagesComponent  {
 

}
