import { useEffect } from 'react';

/**
 * Custom hook to set dynamic page titles
 * @param title - The page title (will be appended with " | Upul Tailors")
 * @param description - Optional page description for meta tags
 * 
 * @example
 * usePageTitle('Shop', 'Browse our collection of tailored clothing');
 * usePageTitle(`Product - ${productName}`);
 */
export const usePageTitle = (title: string, description?: string) => {
  useEffect(() => {
    // Update document title
    const appName = 'Upul Tailors';
    document.title = title ? `${title} | ${appName}` : appName;

    // Update meta description if provided
    if (description) {
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', description);
      }
    }

    // Cleanup: restore original title if component unmounts
    return () => {
      document.title = appName;
    };
  }, [title, description]);
};
