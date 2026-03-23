import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Post, PostApiResponse, mapPost } from '../models/post.model';

@Injectable({ providedIn: 'root' })
export class PostService {
  private readonly apiUrl = 'http://localhost:3000/posts';

  constructor(private http: HttpClient) {}

  getPosts(term?: string): Observable<Post[]> {
    let params = new HttpParams();
    if (term) {
      params = params.set('term', term);
    }
    return this.http
      .get<PostApiResponse[]>(this.apiUrl, { params })
      .pipe(map((posts) => posts.map(mapPost)));
  }

  getPost(id: number): Observable<Post> {
    return this.http
      .get<PostApiResponse>(`${this.apiUrl}/${id}`)
      .pipe(map(mapPost));
  }

  createPost(post: Partial<Post>): Observable<Post> {
    return this.http
      .post<PostApiResponse>(this.apiUrl, this.toApiBody(post))
      .pipe(map(mapPost));
  }

  updatePost(id: number, post: Partial<Post>): Observable<Post> {
    return this.http
      .put<PostApiResponse>(`${this.apiUrl}/${id}`, this.toApiBody(post))
      .pipe(map(mapPost));
  }

  deletePost(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  private toApiBody(post: Partial<Post>): Partial<PostApiResponse> {
    const { imageUrl, ...rest } = post;
    return { ...rest, image_url: imageUrl };
  }
}
