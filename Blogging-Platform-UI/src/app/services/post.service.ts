import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Post, PostApiResponse, PaginatedPosts, PaginatedPostsApiResponse, mapPost } from '../models/post.model';

@Injectable({ providedIn: 'root' })
export class PostService {
  private readonly apiUrl = 'http://localhost:3000/posts';

  constructor(private http: HttpClient) {}

  getPosts(page = 1, limit = 6, term?: string): Observable<PaginatedPosts> {
    let params = new HttpParams()
      .set('page', page)
      .set('limit', limit);
    if (term) {
      params = params.set('term', term);
    }
    return this.http
      .get<PaginatedPostsApiResponse>(this.apiUrl, { params })
      .pipe(
        map((res) => ({
          posts: res.posts.map(mapPost),
          total: res.total,
          page: res.page,
          limit: res.limit,
          totalPages: res.totalPages,
        })),
      );
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
