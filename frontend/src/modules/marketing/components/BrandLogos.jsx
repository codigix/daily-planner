import React from 'react';

// 1. Meta Infinity Loop Logo
export const MetaLogo = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="6" fill="#0064E0" />
    <path
      d="M16.5 7.5C14.6 7.5 13.1 9.6 12 11.2C10.9 9.6 9.4 7.5 7.5 7.5C5.3 7.5 3.5 9.3 3.5 12C3.5 14.7 5.3 16.5 7.5 16.5C9.4 16.5 10.9 14.4 12 12.8C13.1 14.4 14.6 16.5 16.5 16.5C18.7 16.5 20.5 14.7 20.5 12C20.5 9.3 18.7 7.5 16.5 7.5ZM7.5 14.5C6.4 14.5 5.5 13.4 5.5 12C5.5 10.6 6.4 9.5 7.5 9.5C8.7 9.5 9.9 11.1 10.8 12C9.9 12.9 8.7 14.5 7.5 14.5ZM16.5 14.5C15.3 14.5 14.1 12.9 13.2 12C14.1 11.1 15.3 9.5 16.5 9.5C17.6 9.5 18.5 10.6 18.5 12C18.5 13.4 17.6 14.5 16.5 14.5Z"
      fill="white"
    />
  </svg>
);

// 2. Facebook Brand Logo
export const FacebookLogo = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="6" fill="#1877F2" />
    <path
      d="M15.5 12.5H13V22H9.5V12.5H8V9.5H9.5V7.8C9.5 6.3 10.4 4.5 13.2 4.5H15.5V7.5H14C13.2 7.5 13 7.9 13 8.5V9.5H15.6L15.5 12.5Z"
      fill="white"
    />
  </svg>
);

// 3. Instagram Brand Logo
export const InstagramLogo = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="igGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FFDC80" />
        <stop offset="25%" stopColor="#F77737" />
        <stop offset="50%" stopColor="#F1356D" />
        <stop offset="75%" stopColor="#C13584" />
        <stop offset="100%" stopColor="#833AB4" />
      </linearGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill="url(#igGrad)" />
    <rect x="5" y="5" width="14" height="14" rx="4" stroke="white" strokeWidth="1.8" fill="none" />
    <circle cx="12" cy="12" r="3.5" stroke="white" strokeWidth="1.8" fill="none" />
    <circle cx="15.5" cy="8.5" r="1" fill="white" />
  </svg>
);

// 4. WhatsApp Brand Logo
export const WhatsAppLogo = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="6" fill="#25D366" />
    <path
      d="M17.5 14.3C17.2 14.2 15.6 13.4 15.3 13.3C15 13.2 14.8 13.1 14.6 13.4C14.4 13.7 13.8 14.4 13.6 14.6C13.4 14.8 13.2 14.8 12.9 14.6C12.6 14.4 11.6 14.1 10.5 13.1C9.6 12.3 9 11.3 8.8 11C8.6 10.7 8.8 10.5 8.9 10.4C9.1 10.2 9.2 10 9.4 9.8C9.6 9.6 9.6 9.4 9.7 9.2C9.8 9 9.8 8.8 9.7 8.6C9.6 8.4 9 7 8.7 6.4C8.4 5.8 8.2 5.9 8 5.9H7.4C7.2 5.9 6.8 6 6.5 6.3C6.2 6.6 5.4 7.4 5.4 8.9C5.4 10.4 6.5 11.9 6.7 12.1C6.9 12.3 8.9 15.4 11.9 16.7C12.6 17 13.2 17.2 13.6 17.4C14.3 17.6 15 17.5 15.5 17.4C16.1 17.3 17.3 16.7 17.6 15.9C17.9 15.1 17.9 14.4 17.8 14.3C17.7 14.4 17.7 14.4 17.5 14.3Z"
      fill="white"
    />
  </svg>
);

// 5. LinkedIn Official Logo
export const LinkedInLogo = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="6" fill="#0A66C2" />
    <path
      d="M6.5 9H9V17H6.5V9ZM7.8 5.8C6.9 5.8 6.2 6.5 6.2 7.4C6.2 8.3 6.9 9 7.8 9C8.7 9 9.4 8.3 9.4 7.4C9.4 6.5 8.7 5.8 7.8 5.8ZM10.5 9H12.9V10.1C13.2 9.5 14.1 8.8 15.5 8.8C18.3 8.8 18.8 10.6 18.8 13V17H16.3V13.1C16.3 11.6 15.8 10.7 14.5 10.7C13.5 10.7 12.9 11.4 12.9 12.6V17H10.4V9H10.5Z"
      fill="white"
    />
  </svg>
);

// 6. Google 4-Color Brand Logo
export const GoogleGmbLogo = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

// 7. Google Analytics 4 (GA4) Brand Logo
export const GA4TrafficLogo = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="6" fill="#FFF8F0" />
    <rect x="4" y="13" width="4" height="7" rx="1.5" fill="#E37400" />
    <rect x="10" y="8" width="4" height="12" rx="1.5" fill="#F9AB00" />
    <rect x="16" y="4" width="4" height="16" rx="1.5" fill="#EA4335" />
    <circle cx="18" cy="6" r="2" fill="#4285F4" />
  </svg>
);

// 8. Meta Ads Brand Bullseye Logo
export const MetaAdsLogo = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="6" fill="#0064E0" />
    <circle cx="12" cy="12" r="7" stroke="white" strokeWidth="2" />
    <circle cx="12" cy="12" r="3.5" fill="white" />
    <path d="M17.5 6.5L20 4" stroke="white" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
