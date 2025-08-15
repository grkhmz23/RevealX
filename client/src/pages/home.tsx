// Legacy home page - redirects to casino hub
import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    // Redirect to casino hub
    window.location.href = '/';
  }, []);

  return null;
}