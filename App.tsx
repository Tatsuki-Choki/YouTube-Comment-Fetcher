import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { fetchYouTubeInfo, fetchMoreComments } from './services/geminiService';
import type { YouTubeInfo, Comment } from './types';
import { CommentCard } from './components/CommentCard';
import { Loader } from './components/Loader';
import { SpeechBubbleIcon, SearchIcon, DownloadIcon } from './components/IconComponents';

const App: React.FC = () => {
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [youtubeInfo, setYoutubeInfo] = useState<YouTubeInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showLongCommentsOnly, setShowLongCommentsOnly] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  // Load API key from localStorage on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('youtube_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  // Save API key to localStorage whenever it changes
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('youtube_api_key', apiKey);
    } else {
      localStorage.removeItem('youtube_api_key');
    }
  }, [apiKey]);

  // Refs for auto-scrolling
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollAnimationRef = useRef<number | null>(null);
  const userHasScrolledRef = useRef<boolean>(false);


  const extractVideoId = (url: string): string | null => {
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const handleFetchComments = useCallback(async () => {
    setError(null);
    if (!apiKey) {
      setError('YouTube Data APIキーを入力してください。');
      return;
    }
    if (!videoUrl) {
      setError('YouTubeの動画URLを入力してください。');
      return;
    }

    if (!extractVideoId(videoUrl)) {
      setError('無効なYouTube URLです。正しい形式のURLを入力してください。');
      return;
    }

    setIsLoading(true);
    setYoutubeInfo(null);
    setSearchTerm('');
    setShowLongCommentsOnly(false);

    try {
      const data = await fetchYouTubeInfo(videoUrl, apiKey);
      if (data && data.videoTitle) {
        setYoutubeInfo(data);
      } else {
        setError('コメントを取得できませんでした。動画にコメントがないか、非公開の可能性があります。');
        setYoutubeInfo(null);
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'コメントの取得中に不明なエラーが発生しました。';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [videoUrl, apiKey]);

  const handleLoadMoreComments = useCallback(async () => {
    if (!youtubeInfo?.nextPageToken || !apiKey || !videoUrl || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);
    setError(null);

    try {
      const additionalData = await fetchMoreComments(videoUrl, apiKey, youtubeInfo.nextPageToken);
      if (additionalData && additionalData.comments.length > 0) {
        setYoutubeInfo(prevInfo => {
          if (!prevInfo) return additionalData;
          return {
            ...prevInfo,
            comments: [...prevInfo.comments, ...additionalData.comments],
            nextPageToken: additionalData.nextPageToken,
            totalComments: additionalData.totalComments
          };
        });
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : '追加のコメントの取得中にエラーが発生しました。';
      setError(errorMessage);
    } finally {
      setIsLoadingMore(false);
    }
  }, [youtubeInfo?.nextPageToken, apiKey, videoUrl, isLoadingMore]);

  const plainTextFromHTML = (html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  }

  const filteredComments = useMemo(() => {
    if (!youtubeInfo?.comments) return [];
    
    return youtubeInfo.comments
      .filter(comment => {
        if (!showLongCommentsOnly) return true;
        return plainTextFromHTML(comment.text).length >= 30;
      })
      .filter(comment => {
        const term = searchTerm.toLowerCase();
        if (!term) return true;
        return (
          comment.text.toLowerCase().includes(term) ||
          comment.author.toLowerCase().includes(term)
        );
      });
  }, [youtubeInfo?.comments, searchTerm, showLongCommentsOnly]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || filteredComments.length === 0) {
      return;
    }

    // Cancel any previous animation
    if (scrollAnimationRef.current) {
      cancelAnimationFrame(scrollAnimationRef.current);
    }
    
    // Reset state for new comments/filters
    container.scrollTop = 0;
    userHasScrolledRef.current = false;

    const autoScroll = () => {
      if (userHasScrolledRef.current || !container) return;

      // Stop if reached the bottom
      if (container.scrollTop >= container.scrollHeight - container.clientHeight) {
        return;
      }

      // Adjust speed here (e.g., 0.5 pixels per frame)
      container.scrollTop += 0.5;
      scrollAnimationRef.current = requestAnimationFrame(autoScroll);
    };
    
    // Delay start slightly to allow content to render
    const startTimeout = setTimeout(() => {
        scrollAnimationRef.current = requestAnimationFrame(autoScroll);
    }, 100);


    const handleUserInteraction = () => {
      userHasScrolledRef.current = true;
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current);
      }
    };
    
    // Listen for user scroll events
    container.addEventListener('wheel', handleUserInteraction, { passive: true });
    container.addEventListener('touchstart', handleUserInteraction, { passive: true });

    // Cleanup function
    return () => {
      clearTimeout(startTimeout);
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current);
      }
      if (container) {
        container.removeEventListener('wheel', handleUserInteraction);
        container.removeEventListener('touchstart', handleUserInteraction);
      }
    };
  }, [filteredComments]);
  
  const handleCsvExport = () => {
    if (filteredComments.length === 0 || !youtubeInfo) return;

    const headers = ['投稿者名', 'コメント', 'いいね数', '投稿日時'];
    
    const escapeCsvField = (field: string | number): string => {
        const str = String(field);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const csvRows = [
        headers.join(','),
        ...filteredComments.map(comment => [
            escapeCsvField(comment.author),
            escapeCsvField(plainTextFromHTML(comment.text)),
            comment.likes,
            comment.publishedAt,
        ].join(','))
    ];
    
    const csvString = csvRows.join('\n');
    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const safeFilename = youtubeInfo.videoTitle.replace(/[^a-z0-9\u3040-\u30ff\u4e00-\u9faf_-]/gi, '_');
    link.setAttribute('download', `${safeFilename}_comments.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };


  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <header className="bg-white shadow-sm sticky top-0 z-10 border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <SpeechBubbleIcon className="h-8 w-auto text-red-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                YTコメント取得ツール
              </h1>
              <p className="text-xs text-gray-500">動画のコメントを素早く取得</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <a
              href="https://www.youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              YouTube
            </a>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-3xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
            <div>
              <label htmlFor="api-key-input" className="block text-sm font-medium text-gray-700 mb-2">
                YouTube Data APIキー
                {apiKey && (
                  <span className="ml-2 text-xs text-green-600 font-normal">
                    ✓ 保存済み
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  id="api-key-input"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="ここにAPIキーを貼り付け"
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-shadow duration-200"
                  disabled={isLoading}
                />
                {apiKey && (
                  <button
                    type="button"
                    onClick={() => setApiKey('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
                    disabled={isLoading}
                    title="APIキーをクリア"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                ブラウザに安全に保存されます。再読み込み時に入力がスキップされます。
              </p>
            </div>

            <div>
              <label htmlFor="video-url-input" className="block text-sm font-medium text-gray-700 mb-2">
                YouTube動画URL
              </label>
              <input
                id="video-url-input"
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-shadow duration-200"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="mt-6">
             <button
                onClick={handleFetchComments}
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 disabled:bg-red-300 disabled:cursor-not-allowed transform hover:scale-105 whitespace-nowrap"
              >
                {isLoading ? (
                  <>
                    <Loader />
                    <span>取得中...</span>
                  </>
                ) : (
                  <>
                    <SearchIcon className="h-5 w-5 mr-2" />
                    <span>コメントを取得</span>
                  </>
                )}
              </button>
          </div>
          
           {error && <p className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
        </div>

        <div className="max-w-3xl mx-auto mt-8">
          {isLoading && !youtubeInfo && (
            <div className="text-center py-10">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
              <p className="mt-4 text-gray-600">コメントを取得しています...</p>
            </div>
          )}

          {youtubeInfo && (
            <div className="space-y-6">
               <div className="bg-white p-4 rounded-xl shadow-lg animate-fade-in flex items-center space-x-4">
                  <img 
                      src={youtubeInfo.thumbnailUrl} 
                      alt="Video thumbnail" 
                      className="w-24 h-14 object-cover rounded-md flex-shrink-0"
                  />
                  <h3 className="text-md font-semibold text-gray-900 line-clamp-2">{youtubeInfo.videoTitle}</h3>
              </div>
              
              <div className="bg-white p-5 rounded-xl shadow-lg animate-fade-in animation-delay-200">
                <div className="border-b pb-3 mb-4">
                   <h4 className="text-lg font-semibold text-gray-800 mb-4">
                     コメント ({filteredComments.length} / {youtubeInfo.comments.length})
                     {youtubeInfo.totalComments && (
                       <span className="text-sm text-gray-500 ml-2">
                         (全 {youtubeInfo.totalComments} 件中)
                       </span>
                     )}
                   </h4>
                   <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full flex-grow">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="コメントを検索..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                        </div>
                        <div className="flex items-center space-x-4 flex-shrink-0">
                            <div className="flex items-center space-x-2">
                                <button
                                    id="long-comment-toggle"
                                    onClick={() => setShowLongCommentsOnly(!showLongCommentsOnly)}
                                    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${showLongCommentsOnly ? 'bg-red-600' : 'bg-gray-200'}`}
                                    role="switch"
                                    aria-checked={showLongCommentsOnly}
                                >
                                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${showLongCommentsOnly ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                                 <label htmlFor="long-comment-toggle" className="text-sm text-gray-600 cursor-pointer whitespace-nowrap">30文字以上</label>
                            </div>
                            <button
                                onClick={handleCsvExport}
                                disabled={filteredComments.length === 0}
                                className="inline-flex items-center justify-center px-3 py-2 bg-gray-600 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                                <DownloadIcon className="h-4 w-4 mr-2" />
                                <span>CSV出力</span>
                            </button>
                        </div>
                   </div>
                </div>
                <div ref={scrollContainerRef} className="space-y-5 max-h-[60vh] overflow-y-auto pr-2">
                  {filteredComments.length > 0 ? (
                    filteredComments.map((comment, index) => (
                      <CommentCard key={`${comment.author}-${index}`} comment={comment} />
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-5">
                      {youtubeInfo.comments.length > 0 ? '該当するコメントはありません。' : 'コメントは見つかりませんでした。'}
                    </p>
                  )}
                </div>
                
                {/* Load More Button */}
                {youtubeInfo.nextPageToken && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={handleLoadMoreComments}
                      disabled={isLoadingMore}
                      className="inline-flex items-center px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 disabled:bg-red-300 disabled:cursor-not-allowed"
                    >
                      {isLoadingMore ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                          <span>読み込み中...</span>
                        </>
                      ) : (
                        <>
                          <span>もっと読み込む</span>
                          {youtubeInfo.totalComments && (
                            <span className="ml-2 text-sm opacity-75">
                              (残り {youtubeInfo.totalComments - youtubeInfo.comments.length} 件)
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;