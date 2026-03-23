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
  currentPage = signal(1);
  totalPages = signal(1);

  constructor(private postService: PostService) {}

  ngOnInit(): void {
    this.loadPosts();
  }

  loadPosts(): void {
    this.loading.set(true);
    this.error.set('');
    const term = this.searchTerm().trim() || undefined;
    this.postService.getPosts(this.currentPage(), 6, term).subscribe({
      next: (res) => {
        this.posts.set(res.posts);
        this.totalPages.set(res.totalPages);
        this.currentPage.set(res.page);
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
    this.currentPage.set(1);
    this.loadPosts();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) return;
    this.currentPage.set(page);
    this.loadPosts();
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }
}
