import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PostService } from '../../services/post.service';

@Component({
  selector: 'app-create-post',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './create-post.component.html',
  styleUrl: './create-post.component.scss',
})
export class CreatePostComponent {
  form: FormGroup;
  submitting = signal(false);
  error = signal('');

  constructor(
    private fb: FormBuilder,
    private postService: PostService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      content: ['', Validators.required],
      category: ['', Validators.required],
      tags: [''],
      imageUrl: [''],
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

    this.postService.createPost({ title, content, category, tags: tagsArray, imageUrl: imageUrl || undefined }).subscribe({
      next: () => this.router.navigate(['/']),
      error: () => {
        this.error.set('Failed to create post.');
        this.submitting.set(false);
      },
    });
  }
}
