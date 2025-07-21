import { Routes } from '@angular/router';
import { MessagesComponent } from './messages.component';
import { ChatListComponent } from './chat/chat-list.component';
import { ChatRoomComponent } from './chat/chat-room.component';

export const MESSAGES_ROUTES: Routes = [ 
  {
    path: '',
    component: MessagesComponent,
    children: [
      { path: 'chats', component: ChatListComponent },
      { path: 'chat/:chatId', component: ChatRoomComponent },
      {
        path: '',
        redirectTo: 'chats',
        pathMatch: 'full'
      }
    ],
  }
];
