import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, SlicePipe } from '@angular/common';
import { Post } from '../../models/post.model';

@Component({
  selector: 'app-post-card',
  imports: [RouterLink, DatePipe, SlicePipe],
  templateUrl: './post-card.component.html',
  styleUrl: './post-card.component.scss',
})
export class PostCardComponent {
  post = input.required<Post>();
}
