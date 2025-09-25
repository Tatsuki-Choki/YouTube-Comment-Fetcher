import React from 'react';

interface IconProps {
  className?: string;
}

export const SpeechBubbleIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 28 20"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M27.3246 3.12059C26.9946 1.89882 26.046 0.948824 24.8259 0.618824C22.6517 0 14 0 14 0C14 0 5.34829 0 3.17412 0.618824C1.95353 0.948824 1.00588 1.89882 0.675294 3.12059C0 5.35059 0 10 0 10C0 10 0 14.6494 0.675294 16.8794C1.00588 18.1012 1.95353 19.0512 3.17412 19.3812C5.34829 20 14 20 14 20C14 20 22.6517 20 24.8259 19.3812C26.046 19.0512 26.9946 18.1012 27.3246 16.8794C28 14.6494 28 10 28 10C28 10 28 5.35059 27.3246 3.12059Z" />
    <path d="M11.2 14.2188L18.4437 10L11.2 5.78125V14.2188Z" fill="white" />
  </svg>
);

export const SearchIcon: React.FC<IconProps> = ({ className }) => (
    <svg 
        className={className}
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor" 
        strokeWidth={2}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

export const ThumbsUpIcon: React.FC<IconProps> = ({ className }) => (
    <svg 
        className={className}
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
        strokeWidth={2}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.085a2 2 0 00-1.724 1.058L5 10m7 0a2 2 0 002 2h2.764a2 2 0 011.789 2.894l-3.5 7a2 2 0 01-1.789.894h-4.017c-.163 0-.326-.02-.485-.06L7 20" />
    </svg>
);

export const CopyIcon: React.FC<IconProps> = ({ className }) => (
    <svg 
        className={className}
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor" 
        strokeWidth={2}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

export const CheckIcon: React.FC<IconProps> = ({ className }) => (
    <svg 
        className={className}
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor" 
        strokeWidth={2}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);

export const DownloadIcon: React.FC<IconProps> = ({ className }) => (
    <svg 
        className={className}
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor" 
        strokeWidth={2}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);
