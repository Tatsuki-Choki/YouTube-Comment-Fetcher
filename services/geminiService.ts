
import type { YouTubeInfo, Comment } from '../types';

const API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

// Helper to extract video ID from various YouTube URL formats
const extractVideoId = (url: string): string | null => {
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
};


export const fetchYouTubeInfo = async (videoUrl: string, apiKey: string, pageToken?: string): Promise<YouTubeInfo> => {
  if (!apiKey) {
    throw new Error("APIキーが提供されていません。");
  }

  const videoId = extractVideoId(videoUrl);
  if (!videoId) {
    throw new Error("無効なYouTube URLです。");
  }

  try {
    // 1. Fetch Video Details (Title, Thumbnail)
    const videoDetailsUrl = `${API_BASE_URL}/videos?part=snippet&id=${videoId}&key=${apiKey}`;
    const videoResponse = await fetch(videoDetailsUrl);
    if (!videoResponse.ok) {
        const errorData = await videoResponse.json();
        console.error("YouTube Data API Error (videos):", errorData);
        throw new Error(`ビデオ詳細の取得に失敗しました: ${errorData.error.message}`);
    }
    const videoData = await videoResponse.json();

    if (!videoData.items || videoData.items.length === 0) {
      throw new Error("ビデオが見つかりません。");
    }

    const videoSnippet = videoData.items[0].snippet;
    const videoTitle = videoSnippet.title;
    const thumbnailUrl = videoSnippet.thumbnails.high?.url || videoSnippet.thumbnails.default.url;

    // 2. Fetch Comment Threads
    let commentsUrl = `${API_BASE_URL}/commentThreads?part=snippet&videoId=${videoId}&order=relevance&maxResults=100&key=${apiKey}`;
    if (pageToken) {
      commentsUrl += `&pageToken=${pageToken}`;
    }
    const commentsResponse = await fetch(commentsUrl);
     if (!commentsResponse.ok) {
        const errorData = await commentsResponse.json();
        console.error("YouTube Data API Error (commentThreads):", errorData);
        // Comments might be disabled, treat this as a non-fatal error for the user
        if (errorData.error.errors[0].reason === 'commentsDisabled') {
             return { videoTitle, thumbnailUrl, comments: [], nextPageToken: undefined };
        }
        throw new Error(`コメントの取得に失敗しました: ${errorData.error.message}`);
    }
    const commentsData = await commentsResponse.json();

    const comments: Comment[] = commentsData.items.map((item: any): Comment => {
      const commentSnippet = item.snippet.topLevelComment.snippet;
      return {
        author: commentSnippet.authorDisplayName,
        authorThumbnail: commentSnippet.authorProfileImageUrl,
        text: commentSnippet.textDisplay,
        likes: commentSnippet.likeCount,
        publishedAt: commentSnippet.publishedAt,
      };
    });

    return { 
      videoTitle, 
      thumbnailUrl, 
      comments, 
      nextPageToken: commentsData.nextPageToken,
      totalComments: commentsData.pageInfo?.totalResults
    };

  } catch (error) {
    console.error("YouTube API Fetch Error:", error);
    if (error instanceof Error) {
        // Re-throw specific, user-friendly messages
        if (error.message.includes('API key not valid')) {
            throw new Error('APIキーが無効です。正しいYouTube Data APIキーを設定してください。');
        }
        throw new Error(error.message);
    }
    throw new Error("YouTube APIからのデータ取得中に不明なエラーが発生しました。");
  }
};

// Function to fetch additional comments (for pagination)
export const fetchMoreComments = async (videoUrl: string, apiKey: string, pageToken: string): Promise<YouTubeInfo> => {
  if (!apiKey) {
    throw new Error("APIキーが提供されていません。");
  }

  const videoId = extractVideoId(videoUrl);
  if (!videoId) {
    throw new Error("無効なYouTube URLです。");
  }

  try {
    // Fetch additional comments with page token
    const commentsUrl = `${API_BASE_URL}/commentThreads?part=snippet&videoId=${videoId}&order=relevance&maxResults=100&pageToken=${pageToken}&key=${apiKey}`;
    const commentsResponse = await fetch(commentsUrl);
    
    if (!commentsResponse.ok) {
      const errorData = await commentsResponse.json();
      console.error("YouTube Data API Error (commentThreads):", errorData);
      throw new Error(`コメントの取得に失敗しました: ${errorData.error.message}`);
    }
    
    const commentsData = await commentsResponse.json();

    const comments: Comment[] = commentsData.items.map((item: any): Comment => {
      const commentSnippet = item.snippet.topLevelComment.snippet;
      return {
        author: commentSnippet.authorDisplayName,
        authorThumbnail: commentSnippet.authorProfileImageUrl,
        text: commentSnippet.textDisplay,
        likes: commentSnippet.likeCount,
        publishedAt: commentSnippet.publishedAt,
      };
    });

    return { 
      videoTitle: '', // Not needed for additional comments
      thumbnailUrl: '', // Not needed for additional comments
      comments, 
      nextPageToken: commentsData.nextPageToken,
      totalComments: commentsData.pageInfo?.totalResults
    };

  } catch (error) {
    console.error("YouTube API Fetch Error:", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("YouTube APIからのデータ取得中に不明なエラーが発生しました。");
  }
};
