import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PostCardComponent } from '../../components/post-card/post-card.component';
import { PostService } from '../../services/post.service';
import { Post } from '../../models/post.model';

@Component({
  selector: 'app-home',
  imports: [FormsModule, PostCardComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  posts = signal<Post[]>([]);
  loading = signal(true);
  error = signal('');
  searchTerm = signal('');

  constructor(private postService: PostService) {}

  ngOnInit(): void {
    this.loadPosts();
  }

  loadPosts(): void {
    this.loading.set(true);
    this.error.set('');
    const term = this.searchTerm().trim() || undefined;
    this.postService.getPosts(term).subscribe({
      next: (posts) => {
        this.posts.set(posts);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load posts. Make sure the API server is running.');
        this.loading.set(false);
        console.error(err);
      },
    });
  }

  onSearch(): void {
    this.loadPosts();
  }
}
