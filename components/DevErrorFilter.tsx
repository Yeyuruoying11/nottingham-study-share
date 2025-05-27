'use client';

import { useEffect } from 'react';

export default function DevErrorFilter() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // 过滤掉开发环境中的常见404错误
      const originalError = console.error;
      console.error = (...args) => {
        const message = args.join(' ');
        
        // 忽略这些常见的开发环境错误
        const ignoredErrors = [
          'microfronten',
          'Failed to load resource',
          'net::ERR_FAILED',
          'vercel.com/api/v1',
          'translate_http',
          'gstatic.com'
        ];
        
        const shouldIgnore = ignoredErrors.some(error => 
          message.toLowerCase().includes(error.toLowerCase())
        );
        
        if (!shouldIgnore) {
          originalError.apply(console, args);
        }
      };
      
      // 过滤网络错误
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        try {
          return await originalFetch(...args);
        } catch (error) {
          // 静默处理某些404错误
          const url = args[0]?.toString() || '';
          if (url.includes('microfronten') || url.includes('translate_http')) {
            return new Response('', { status: 404 });
          }
          throw error;
        }
      };
    }
  }, []);

  return null;
} 