import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { PostService } from '../../services/post.service';
import { Post } from '../../models/post.model';

@Component({
  selector: 'app-post-detail',
  imports: [RouterLink, DatePipe],
  templateUrl: './post-detail.component.html',
  styleUrl: './post-detail.component.scss',
})
export class PostDetailComponent implements OnInit {
  post = signal<Post | null>(null);
  loading = signal(true);
  error = signal('');
  showDeleteConfirm = signal(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private postService: PostService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.postService.getPost(id).subscribe({
      next: (post) => {
        this.post.set(post);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load post.');
        this.loading.set(false);
      },
    });
  }

  confirmDelete(): void {
    this.showDeleteConfirm.set(true);
  }

  cancelDelete(): void {
    this.showDeleteConfirm.set(false);
  }

  deletePost(): void {
    const post = this.post();
    if (!post) return;
    this.postService.deletePost(post.id).subscribe({
      next: () => this.router.navigate(['/']),
      error: () => this.error.set('Failed to delete post.'),
    });
  }
}
