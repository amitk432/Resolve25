// Browser window optimization utility
export const optimizeBrowserWindow = () => {
  if (typeof window !== 'undefined') {
    try {
      // Try to maximize the window
      if (window.screen && window.screen.availWidth && window.screen.availHeight) {
        window.resizeTo(window.screen.availWidth, window.screen.availHeight);
        window.moveTo(0, 0);
      }
      
      // Request fullscreen if supported
      if (document.documentElement.requestFullscreen) {
        // Only request fullscreen on user interaction due to browser security
        document.addEventListener('click', () => {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {
              console.log('Fullscreen request failed - this is normal for security reasons');
            });
          }
        }, { once: true });
      }
      
      // Focus the window
      window.focus();
      
    } catch (error) {
      console.log('Window optimization failed:', error);
    }
  }
};

export default optimizeBrowserWindow;
