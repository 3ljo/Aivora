import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PostService } from '../../services/post.service';

@Component({
  selector: 'app-edit-post',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './edit-post.component.html',
  styleUrl: './edit-post.component.scss',
})
export class EditPostComponent implements OnInit {
  form: FormGroup;
  postId = 0;
  loading = signal(true);
  submitting = signal(false);
  error = signal('');

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private postService: PostService,
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      content: ['', Validators.required],
      category: ['', Validators.required],
      tags: [''],
      imageUrl: [''],
    });
  }

  ngOnInit(): void {
    this.postId = Number(this.route.snapshot.paramMap.get('id'));
    this.postService.getPost(this.postId).subscribe({
      next: (post) => {
        this.form.patchValue({
          title: post.title,
          content: post.content,
          category: post.category,
          tags: post.tags.join(', '),
          imageUrl: post.imageUrl || '',
        });
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load post.');
        this.loading.set(false);
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.submitting.set(true);
    this.error.set('');

    const { title, content, category, tags, imageUrl } = this.form.value;
    const tagsArray = tags
      ? tags.split(',').map((t: string) => t.trim()).filter((t: string) => t)
      : [];

    this.postService.updatePost(this.postId, { title, content, category, tags: tagsArray, imageUrl: imageUrl || undefined }).subscribe({
      next: () => this.router.navigate(['/posts', this.postId]),
      error: () => {
        this.error.set('Failed to update post.');
        this.submitting.set(false);
      },
    });
  }
}
