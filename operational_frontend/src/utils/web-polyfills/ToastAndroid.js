// Web polyfill for ToastAndroid
const ToastAndroid = {
  SHORT: 2000,
  LONG: 4000,

  show: (message, duration) => {
    // Create a simple toast notification for web
    if (typeof window !== 'undefined') {
      const toast = document.createElement('div');
      toast.textContent = message;
      toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 10000;
        font-size: 14px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        transition: opacity 0.3s ease;
      `;

      document.body.appendChild(toast);

      const displayTime = duration || ToastAndroid.SHORT;
      setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
          if (document.body.contains(toast)) {
            document.body.removeChild(toast);
          }
        }, 300);
      }, displayTime);
    } else {
      // Fallback for server-side rendering
      console.log('Toast:', message);
    }
  },

  showWithGravity: (message, duration, gravity) => {
    // For web, we'll ignore gravity and just show the toast
    ToastAndroid.show(message, duration);
  },

  showWithGravityAndOffset: (message, duration, gravity, xOffset, yOffset) => {
    // For web, we'll ignore gravity and offsets and just show the toast
    ToastAndroid.show(message, duration);
  },
};

export default ToastAndroid;
