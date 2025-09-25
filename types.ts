export interface Comment {
  author: string;
  authorThumbnail: string;
  text: string;
  likes: number; 
  publishedAt: string; // ISO 8601 date string from API
}

export interface YouTubeInfo {
  videoTitle: string;
  thumbnailUrl: string;
  comments: Comment[];
  nextPageToken?: string;
  totalComments?: number;
}