import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'posts/create',
    loadComponent: () => import('./pages/create-post/create-post.component').then(m => m.CreatePostComponent),
  },
  {
    path: 'posts/edit/:id',
    loadComponent: () => import('./pages/edit-post/edit-post.component').then(m => m.EditPostComponent),
  },
  {
    path: 'posts/:id',
    loadComponent: () => import('./pages/post-detail/post-detail.component').then(m => m.PostDetailComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
