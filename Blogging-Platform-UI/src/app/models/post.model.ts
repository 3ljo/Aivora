export interface PostApiResponse {
  id: number;
  title: string;
  content: string;
  category: string;
  tags: string[];
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  category: string;
  tags: string[];
  imageUrl?: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedPostsApiResponse {
  posts: PostApiResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedPosts {
  posts: Post[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function mapPost(raw: PostApiResponse): Post {
  return {
    id: raw.id,
    title: raw.title,
    content: raw.content,
    category: raw.category,
    tags: raw.tags,
    imageUrl: raw.image_url,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}
