import React, { useState } from 'react';
import type { Comment } from '../types';
import { ThumbsUpIcon, CopyIcon, CheckIcon } from './IconComponents';

interface CommentCardProps {
  comment: Comment;
}

// Helper to format large numbers (e.g., 1234 -> "1.2K")
const formatLikes = (likes: number): string => {
  if (likes < 1000) return likes.toString();
  if (likes < 1000000) return `${(likes / 1000).toFixed(1)}K`;
  return `${(likes / 1000000).toFixed(1)}M`;
};

// Helper to format ISO date string to relative time
const formatRelativeTime = (isoDate: string): string => {
  const date = new Date(isoDate);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return `${Math.floor(interval)}年前`;
  interval = seconds / 2592000;
  if (interval > 1) return `${Math.floor(interval)}ヶ月前`;
  interval = seconds / 86400;
  if (interval > 1) return `${Math.floor(interval)}日前`;
  interval = seconds / 3600;
  if (interval > 1) return `${Math.floor(interval)}時間前`;
  interval = seconds / 60;
  if (interval > 1) return `${Math.floor(interval)}分前`;
  return `${Math.floor(seconds)}秒前`;
};

export const CommentCard: React.FC<CommentCardProps> = ({ comment }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = comment.text;
    const plainText = tempDiv.textContent || tempDiv.innerText || "";

    navigator.clipboard.writeText(plainText).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  return (
    <div className="flex items-start space-x-4 p-1 animate-fade-in relative group">
      <img
        src={comment.authorThumbnail || `https://i.pravatar.cc/40?u=${comment.author}`}
        alt={`${comment.author}'s thumbnail`}
        className="w-10 h-10 rounded-full bg-gray-200 object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).src = `https://i.pravatar.cc/40?u=${comment.author}`;
        }}
      />
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <p className="font-semibold text-sm text-gray-800">{comment.author}</p>
          <p className="text-xs text-gray-500">{formatRelativeTime(comment.publishedAt)}</p>
        </div>
        <div 
          className="text-gray-700 mt-1 whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: comment.text }} 
        />
        <div className="flex items-center space-x-1 text-gray-500 mt-2">
          <ThumbsUpIcon className="h-4 w-4" />
          <span className="text-xs font-medium">{formatLikes(comment.likes)}</span>
        </div>
      </div>
      <div className="absolute top-0 right-0">
          <button
            onClick={handleCopy}
            title="コメントをコピー"
            className="p-1.5 rounded-full text-gray-400 bg-white bg-opacity-50 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-gray-100 hover:text-gray-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {isCopied ? (
              <CheckIcon className="h-5 w-5 text-green-500" />
            ) : (
              <CopyIcon className="h-5 w-5" />
            )}
          </button>
      </div>
    </div>
  );
};