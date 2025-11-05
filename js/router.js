/**
 * Client-side router for SPA navigation
 * Prevents full page reloads and handles navigation between pages
 */

class Router {
  constructor() {
    this.currentPath = window.location.pathname;
    this.contentContainer = null;
    this.init();
  }

  init() {
    // Find the main content container (skip header and footer)
    this.contentContainer = document.querySelector('main') ||
                           document.querySelector('.container') ||
                           document.body;

    // Intercept all link clicks
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href]');
      if (link && this.shouldIntercept(link)) {
        e.preventDefault();
        this.navigateTo(link.href);
      }
    });

    // Handle browser back/forward buttons
    window.addEventListener('popstate', (e) => {
      this.loadPage(window.location.pathname, false);
    });
  }

  shouldIntercept(link) {
    const href = link.getAttribute('href');
    // Don't intercept on pagination buttons and filter buttons
    if (link.id === 'prevBtn' || link.id === 'nextBtn' || link.id === 'applyFiltersBtn') return false;
    // Intercept internal links that are not external or anchors
    return href &&
           !href.startsWith('http') &&
           !href.startsWith('mailto:') &&
           !href.startsWith('tel:') &&
           !href.startsWith('#') &&
           !href.includes('script.google.com');
  }

  navigateTo(url) {
    const urlObj = new URL(url, window.location.origin);
    const path = urlObj.pathname;

    if (path !== this.currentPath) {
      this.loadPage(path, true);
    }
  }

  async loadPage(path, updateHistory = true) {
    try {
      // Show loading indicator if available
      const loadingIndicator = document.getElementById('loadingIndicator');
      if (loadingIndicator) {
        loadingIndicator.style.display = 'block';
      }

      // Fetch the new page content
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();

      // Extract the main content (everything after the header)
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Remove the header from the new page (since we already have it)
      const newHeader = doc.querySelector('nav, header');
      if (newHeader) {
        newHeader.remove();
      }

      // Find the main content area
      const newContent = doc.querySelector('main') ||
                        doc.querySelector('.container') ||
                        doc.body;

      if (newContent) {
        // Update the page content
        this.contentContainer.innerHTML = newContent.innerHTML;

        // Update the page title
        const newTitle = doc.querySelector('title');
        if (newTitle) {
          document.title = newTitle.textContent;
        }

        // Update meta description if present
        const newMeta = doc.querySelector('meta[name="description"]');
        const currentMeta = document.querySelector('meta[name="description"]');
        if (newMeta && currentMeta) {
          currentMeta.setAttribute('content', newMeta.getAttribute('content'));
        }

        // Re-initialize components that need it
        this.reinitializeComponents();

        // Update URL and history
        if (updateHistory) {
          window.history.pushState(null, '', path);
        }

        this.currentPath = path;

        // Scroll to top
        window.scrollTo(0, 0);
      }

    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback to regular navigation
      window.location.href = path;
    } finally {
      // Hide loading indicator
      const loadingIndicator = document.getElementById('loadingIndicator');
      if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
      }
    }
  }

  reinitializeComponents() {
    // Re-initialize AOS if present
    if (typeof AOS !== 'undefined') {
      AOS.init({ duration: 1000, once: true });
    }

    // Re-initialize Bootstrap components
    const dropdowns = document.querySelectorAll('[data-bs-toggle="dropdown"]');
    dropdowns.forEach(dropdown => {
      new bootstrap.Dropdown(dropdown);
    });

    const modals = document.querySelectorAll('[data-bs-toggle="modal"]');
    modals.forEach(modal => {
      new bootstrap.Modal(modal);
    });

    // Re-load header and footer components after navigation
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (headerPlaceholder && !headerPlaceholder.innerHTML.trim()) {
      fetch('/includes/header.html')
        .then(response => {
          if (!response.ok) {
            throw new Error('Ошибка загрузки навигации');
          }
          return response.text();
        })
        .then(html => {
          headerPlaceholder.innerHTML = html;
          // Re-initialize form handlers for header
          initializeFormHandlers();
        })
        .catch(error => {
          console.error('Ошибка при загрузке навигации:', error);
        });
    }

    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (footerPlaceholder && !footerPlaceholder.innerHTML.trim()) {
      fetch('/includes/footer.html')
        .then(response => {
          if (!response.ok) {
            throw new Error('Ошибка загрузки футера');
          }
          return response.text();
        })
        .then(html => {
          footerPlaceholder.innerHTML = html;
          // Re-initialize modal handlers for footer
          initializeModalHandlers();
        })
        .catch(error => {
          console.error('Ошибка при загрузке футера:', error);
        });
    }

    // Re-initialize any page-specific scripts
    // This would need to be expanded based on specific page requirements
  }
}

// Initialize router when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new Router();
});
