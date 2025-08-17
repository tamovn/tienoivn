

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { getProducts, getArticles, getComments, Product, Article, Comment } from './api.js';


// --- Type Interfaces ---
// Interfaces are now also in api.ts, but kept here for clarity in this file.
// In a larger setup, these would be in a shared types definition file.

interface ExpertAdvice {
    advantages: string[];
    considerations: string[];
    summary: string;
}

// --- DATA: Is now loaded dynamically. These are the variables that will hold the data. ---
let allProducts: Product[] = [];
let allComments: Comment[] = [];
let allArticles: Article[] = [];


// --- Global Constants & Variables ---
const RECENT_SEARCHES_KEY = 'thegioixedien_recent_searches';
const MAX_RECENT_SEARCHES = 5;
const RECENTLY_VIEWED_KEY = 'thegioixedien_recently_viewed';
const MAX_RECENTLY_VIEWED = 5;
const PRODUCT_CLICKS_KEY = 'thegioixedien_product_clicks';
const MANAGED_PRODUCTS_KEY = 'thegioixedien_managed_products';
const API_PROXY_URL = 'https://api.tienoivn.one';

let currentModalProduct: Product | null = null;
const DEFAULT_PAGE_TITLE = "Tienoi.one - Khám phá Sản phẩm & Dịch vụ";
let featuredProductsCurrentPage = 1;


// --- DOM Element Selection ---
// Main Page
const resultsContainer = document.getElementById('results') as HTMLElement;
const blogGrid = document.getElementById('blog-grid') as HTMLElement;
const recentlyViewedSection = document.getElementById('recently-viewed-section') as HTMLElement;
const recentlyViewedContainer = document.getElementById('recently-viewed-container') as HTMLElement;
const contactForm = document.getElementById('contact-form') as HTMLFormElement;

// Navigation
const navToggle = document.getElementById('nav-toggle') as HTMLButtonElement;
const navMenu = document.getElementById('nav-menu') as HTMLElement;

// On-Page Search
const searchForm = document.getElementById('search-form') as HTMLFormElement;
const searchInput = document.getElementById('search-input') as HTMLInputElement;
const suggestionsContainer = document.getElementById('suggestions-container') as HTMLElement;
const recentSearchesSection = document.getElementById('recent-searches-section') as HTMLElement;
const recentSearchesContainer = document.getElementById('recent-searches-container') as HTMLElement;

// Product Modal
const productModal = document.getElementById('product-modal') as HTMLElement;
const modalCloseButton = document.getElementById('modal-close-button') as HTMLButtonElement;
const modalProductName = document.getElementById('modal-product-name') as HTMLElement;
const modalProductImage = document.getElementById('modal-product-image') as HTMLImageElement;
const modalProductPrice = document.getElementById('modal-product-price') as HTMLElement;
const modalProductDescription = document.getElementById('modal-product-description') as HTMLElement;
const modalProductLink = document.getElementById('modal-product-link') as HTMLAnchorElement;
const modalProductType = document.getElementById('modal-product-type') as HTMLElement;
const modalProductStatus = document.getElementById('modal-product-status') as HTMLElement;
const modalProductRatingStars = document.getElementById('modal-product-rating-stars') as HTMLElement;
const shareFacebook = document.getElementById('share-facebook') as HTMLAnchorElement;
const shareZalo = document.getElementById('share-zalo') as HTMLAnchorElement;
const shareLinkedin = document.getElementById('share-linkedin') as HTMLAnchorElement;
const shareThreads = document.getElementById('share-threads') as HTMLAnchorElement;

// Admin Page Elements
const adminProductListContainer = document.getElementById('admin-product-list-container') as HTMLElement;
const addNewProductBtn = document.getElementById('add-new-product-btn') as HTMLButtonElement;
const adminFormModal = document.getElementById('admin-form-modal') as HTMLElement;
const adminModalCloseButton = document.getElementById('admin-modal-close-button') as HTMLButtonElement;
const adminProductForm = document.getElementById('admin-product-form') as HTMLFormElement;
const adminFormTitle = document.getElementById('admin-form-title') as HTMLElement;
const adminFormProductNameOriginal = document.getElementById('admin-form-product-name-original') as HTMLInputElement;


// --- Helper Functions ---
/**
 * Updates the page title for SEO and user experience.
 * @param title The new title. If empty, resets to default.
 */
function updatePageTitle(title?: string) {
    document.title = title || DEFAULT_PAGE_TITLE;
}

/**
 * Shuffles an array in place using the Fisher-Yates algorithm.
 * @param array The array to shuffle.
 * @returns A new shuffled array.
 */
function shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array]; // Create a copy to avoid mutating the original
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}


// --- Navigation Menu Logic ---
if (navToggle && navMenu) {
  const navLinks = navMenu.querySelectorAll('a');
  
  /** Toggles the mobile navigation menu. */
  const toggleMenu = () => {
    const isActive = navMenu.classList.toggle('is-active');
    navToggle.classList.toggle('is-active');
    navToggle.setAttribute('aria-expanded', String(isActive));
    document.body.classList.toggle('no-scroll', isActive);
  };

  navToggle.addEventListener('click', toggleMenu);

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      // The router handles all navigation, but we need to prevent the default anchor jump
      // to allow our smooth scroll logic to take over.
      e.preventDefault();
      const href = link.getAttribute('href');

      // If the hash is the same, hashchange won't fire, so we must manually trigger the router.
      // Otherwise, setting the hash will correctly trigger the hashchange event listener.
      if (href && href === window.location.hash) {
          router();
      } else if (href) {
          window.location.hash = href;
      }
      
      // Close mobile menu after any link click
      if (navMenu.classList.contains('is-active')) {
        toggleMenu();
      }
    });
  });
}

// --- Swipe to Round Nav ---
function initNavSwipe() {
    const navContainer = document.querySelector('.nav-container') as HTMLElement;
    if (!navContainer) return;

    let startX = 0;
    const swipeThreshold = 50; // Minimum distance for a swipe in pixels

    const handleSwipeEnd = (endX: number) => {
        const deltaX = endX - startX;
        // Check for a horizontal swipe (left or right)
        if (Math.abs(deltaX) > swipeThreshold) {
            navContainer.classList.toggle('is-rounded');
        }
    };

    // Touch events for mobile
    navContainer.addEventListener('touchstart', (e: TouchEvent) => {
        startX = e.changedTouches[0].clientX;
    }, { passive: true });

    navContainer.addEventListener('touchend', (e: TouchEvent) => {
        const endX = e.changedTouches[0].clientX;
        handleSwipeEnd(endX);
    });

    // Mouse events for desktop
    navContainer.addEventListener('mousedown', (e: MouseEvent) => {
        startX = e.clientX;
    });

    navContainer.addEventListener('mouseup', (e: MouseEvent) => {
        const endX = e.clientX;
        handleSwipeEnd(endX);
    });
}


// --- Recently Searched Functions ---
function getRecentSearches(): string[] {
  try {
    const searches = localStorage.getItem(RECENT_SEARCHES_KEY);
    return searches ? JSON.parse(searches) : [];
  } catch (e) {
    console.warn("Could not parse recent searches from localStorage.", e);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
    return [];
  }
}

function saveRecentSearch(query: string) {
  if (!query) return;
  let searches = getRecentSearches();
  searches = searches.filter(s => s.toLowerCase() !== query.toLowerCase());
  searches.unshift(query);
  if (searches.length > MAX_RECENT_SEARCHES) {
    searches = searches.slice(0, MAX_RECENT_SEARCHES);
  }
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
}

function displayRecentSearches() {
  if (!recentSearchesContainer || !recentSearchesSection) return;
  const searches = getRecentSearches();
  if (searches.length === 0) {
    recentSearchesSection.style.display = 'none';
    return;
  }
  
  recentSearchesContainer.innerHTML = '';
  searches.forEach(query => {
    const tag = document.createElement('button');
    tag.className = 'recent-search-tag';
    tag.textContent = query;
    tag.type = 'button';
    tag.addEventListener('click', () => {
      triggerSearch(query);
    });
    recentSearchesContainer.appendChild(tag);
  });
  recentSearchesSection.style.display = 'block';
}

// --- Recently Viewed Functions ---
function getRecentlyViewed(): Product[] {
  try {
    const items = localStorage.getItem(RECENTLY_VIEWED_KEY);
    return items ? JSON.parse(items) : [];
  } catch (e) {
    console.warn("Could not parse recently viewed items from localStorage.", e);
    localStorage.removeItem(RECENTLY_VIEWED_KEY);
    return [];
  }
}

function saveToRecentlyViewed(product: Product) {
  if (!product || !product.name) return;
  let viewedItems = getRecentlyViewed();
  viewedItems = viewedItems.filter(p => p.name !== product.name);
  viewedItems.unshift(product);
  if (viewedItems.length > MAX_RECENTLY_VIEWED) {
    viewedItems = viewedItems.slice(0, MAX_RECENTLY_VIEWED);
  }
  localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(viewedItems));
}

function displayRecentlyViewed() {
    if (!recentlyViewedSection || !recentlyViewedContainer) return;
    const viewedItems = getRecentlyViewed();
    if (viewedItems.length === 0) {
        recentlyViewedSection.style.display = 'none';
        return;
    }

    recentlyViewedContainer.innerHTML = '';
    viewedItems.forEach(product => {
        const card = createRecentlyViewedCard(product);
        recentlyViewedContainer.appendChild(card);
    });
    recentlyViewedSection.style.display = 'block';
}

// --- Product Click & Rating Functions ---
/**
 * Retrieves the click count for a specific product from localStorage.
 * @param productName The name of the product.
 * @returns The number of clicks.
 */
function getProductClickCount(productName: string): number {
    try {
        const clicksStr = localStorage.getItem(PRODUCT_CLICKS_KEY);
        const allClicks = clicksStr ? JSON.parse(clicksStr) : {};
        return allClicks[productName] || 0;
    } catch (e) {
        console.warn("Could not read product clicks from localStorage.", e);
        return 0;
    }
}

/**
 * Increments the click count for a product and saves it to localStorage.
 * @param productName The name of the product to increment.
 */
function incrementProductClick(productName: string) {
    try {
        const clicksStr = localStorage.getItem(PRODUCT_CLICKS_KEY);
        const allClicks = clicksStr ? JSON.parse(clicksStr) : {};
        const newCount = (allClicks[productName] || 0) + 1;
        allClicks[productName] = newCount;
        localStorage.setItem(PRODUCT_CLICKS_KEY, JSON.stringify(allClicks));
    } catch (e) {
        console.warn("Could not save product clicks to localStorage.", e);
    }
}

/**
 * Updates the DOM of a product card to reflect the latest click count and rating.
 * @param productName The name of the product whose card needs updating.
 */
function updateProductCardDOM(productName: string) {
    const card = document.querySelector(`.product-card[data-product-name="${productName}"]`);
    if (!card) return;

    const statsContainer = card.querySelector('.product-stats');
    if (!statsContainer) return;

    const clicks = getProductClickCount(productName);
    const ratingHTML = clicks >= 10 ? '<div class="product-rating">★★★★★</div>' : '';
    const eyeIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/><path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/></svg>`;
    const clicksHTML = `<div class="product-clicks">${eyeIconSVG} <span>${clicks}</span></div>`;

    statsContainer.innerHTML = ratingHTML + clicksHTML;
}


// --- Modal Functions ---
/**
 * Opens the product detail modal with the given product's information.
 * @param product The product to display.
 */
function openProductModal(product: Product) {
    if (!productModal || !modalProductName || !modalProductImage || !modalProductPrice || !modalProductDescription || !modalProductLink || !modalProductType || !modalProductStatus || !modalProductRatingStars || !shareFacebook || !shareZalo || !shareLinkedin || !shareThreads) return;
    
    currentModalProduct = product;
    updatePageTitle(`${product.name} | Tienoi.one`);

    // --- Reset Tabs to Default ---
    const tabs = productModal.querySelectorAll('.modal-tab-button');
    const panels = productModal.querySelectorAll('.modal-tab-panel');
    tabs.forEach(tab => tab.classList.remove('is-active'));
    panels.forEach(panel => panel.classList.remove('is-active'));
    productModal.querySelector('.modal-tab-button[data-tab-target="#tab-panel-details"]')?.classList.add('is-active');
    productModal.querySelector('#tab-panel-details')?.classList.add('is-active');
    
    // --- Populate Basic Info ---
    modalProductName.textContent = product.name;
    modalProductImage.src = product.image;
    modalProductImage.alt = product.name;
    modalProductPrice.textContent = product.price;
    modalProductDescription.textContent = product.description_detail || product.description;
    modalProductLink.href = product.link;
    modalProductLink.textContent = product.button_text || 'Xem chi tiết';

    // Handle Type Label
    if (product.type) {
        modalProductType.textContent = product.type;
        modalProductType.style.display = 'inline-block';
    } else {
        modalProductType.style.display = 'none';
    }

    // Handle Status Label
    if (product.status) {
        modalProductStatus.textContent = product.status;
        modalProductStatus.dataset.status = product.status.toLowerCase().replace(/\s+/g, '-');
        modalProductStatus.style.display = 'inline-block';
    } else {
        modalProductStatus.style.display = 'none';
        modalProductStatus.textContent = '';
        delete modalProductStatus.dataset.status;
    }

    // Handle 5-Star Rating
    const clicks = getProductClickCount(product.name);
    if (clicks >= 10) {
        modalProductRatingStars.innerHTML = '★★★★★';
        modalProductRatingStars.setAttribute('aria-label', '5 out of 5 stars');
        modalProductRatingStars.style.display = 'block';
    } else {
        modalProductRatingStars.innerHTML = '';
        modalProductRatingStars.style.display = 'none';
    }
    
    // Handle Social Sharing Links
    const shareUrl = encodeURIComponent(product.link);
    const shareText = encodeURIComponent(`Khám phá sản phẩm này: ${product.name}`);
    shareFacebook.href = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
    shareZalo.href = `https://sp.zalo.me/share_inline?url=${shareUrl}&type=1`; // Zalo requires specific handling
    shareLinkedin.href = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`;
    shareThreads.href = `https://www.threads.net/share?url=${shareUrl}&text=${shareText}`;

    // --- Reset and setup AI Consultant Tab ---
    const consultantInitialMessage = document.querySelector('#tab-panel-consultant .consultant-initial-message') as HTMLElement;
    const consultantResultContainer = document.getElementById('consultant-result-container') as HTMLElement;
    if (consultantInitialMessage) consultantInitialMessage.style.display = 'block';
    if (consultantResultContainer) consultantResultContainer.innerHTML = '';
    
    // --- Handle Comments Tab with Pagination ---
    const commentsListContainer = document.getElementById('comments-list') as HTMLElement;
    const paginationContainer = document.getElementById('comments-pagination') as HTMLElement;

    if (commentsListContainer && paginationContainer) {
        const productTypeLower = product.type ? product.type.trim().toLowerCase() : '';
        const productNameKeywords = product.name.trim().toLowerCase().split(/\s+/);

        // Filter comments to be highly relevant: must match BOTH type AND contain a keyword from the title.
        const relevantComments = allComments.filter(comment => {
            // Condition 1: The comment's type must match the product's type.
            const typeMatch = comment.product_type && comment.product_type.trim().toLowerCase() === productTypeLower;
            if (!typeMatch) {
                return false;
            }

            const commentTextLower = (comment.text || '').toLowerCase();
            
            // If the product name is empty or just whitespace, it can't match any keywords.
            if (productNameKeywords.length === 0 || productNameKeywords[0] === '') {
                return false;
            }

            // Condition 2: The comment text must contain at least one keyword from the product's title.
            return productNameKeywords.some(keyword => commentTextLower.includes(keyword));
        });
        
        const shuffledComments = shuffleArray(relevantComments);
        const COMMENTS_PER_PAGE = 5;
        const totalPages = Math.ceil(shuffledComments.length / COMMENTS_PER_PAGE);

        const displayCommentsPage = (page: number) => {
            commentsListContainer.innerHTML = '';
            paginationContainer.innerHTML = '';

            if (shuffledComments.length === 0) {
                commentsListContainer.innerHTML = `<p class="no-comments-message">Chưa có nhận xét nào phù hợp cho sản phẩm này.</p>`;
                return;
            }

            const currentPage = Math.max(1, Math.min(page, totalPages));
            const startIndex = (currentPage - 1) * COMMENTS_PER_PAGE;
            const pageComments = shuffledComments.slice(startIndex, startIndex + COMMENTS_PER_PAGE);

            pageComments.forEach(comment => {
                const commentCard = createCommentCard(comment);
                commentsListContainer.appendChild(commentCard);
            });

            if (totalPages > 1) {
                for (let i = 1; i <= totalPages; i++) {
                    const pageButton = document.createElement('button');
                    pageButton.className = 'pagination-button';
                    pageButton.textContent = String(i);
                    pageButton.setAttribute('aria-label', `Go to page ${i}`);
                    if (i === currentPage) {
                        pageButton.classList.add('is-active');
                        pageButton.setAttribute('aria-current', 'page');
                    }
                    pageButton.addEventListener('click', () => displayCommentsPage(i));
                    paginationContainer.appendChild(pageButton);
                }
            }
        };

        displayCommentsPage(1);
    }


    // Handle Related Products
    const relatedProductsContainer = document.getElementById('modal-related-container') as HTMLElement;
    const relatedProductsSection = productModal.querySelector('.modal-related-products') as HTMLElement;

    if (relatedProductsContainer && relatedProductsSection) {
        relatedProductsContainer.innerHTML = ''; // Clear previous

        const relatedProducts = allProducts
            .filter(p => p.type === product.type && p.name !== product.name)
            .slice(0, 4); // Show up to 4 related products

        if (relatedProducts.length > 0) {
            relatedProducts.forEach(relatedProduct => {
                const card = createRelatedProductCard(relatedProduct);
                relatedProductsContainer.appendChild(card);
            });
            relatedProductsSection.style.display = 'block';
        } else {
            relatedProductsSection.style.display = 'none';
        }
    }
    
    productModal.classList.add('is-visible');
    document.body.classList.add('no-scroll');
    // Scroll modal body to top when content changes
    productModal.querySelector('.modal-body')?.scrollTo(0, 0);
}

/**
 * Closes the product detail modal.
 */
function closeProductModal() {
    if (!productModal) return;
    productModal.classList.remove('is-visible');
    document.body.classList.remove('no-scroll');
    currentModalProduct = null;
    updatePageTitle(); // Reset title to default
}

// --- Display & Skeleton Functions ---
/**
 * Creates an HTML string for a single skeleton loader card.
 * @returns {string} The HTML string for the skeleton card.
 */
function createSkeletonCardHTML(): string {
    return `
        <div class="skeleton-card">
            <div class="skeleton-element skeleton-image"></div>
            <div class="skeleton-content">
                <div class="skeleton-element skeleton-text"></div>
                <div class="skeleton-element skeleton-text short"></div>
                <div class="skeleton-element skeleton-text" style="margin-top: 1rem;"></div>
                <div class="skeleton-element skeleton-text"></div>
                <div class="skeleton-footer">
                    <div class="skeleton-element skeleton-price"></div>
                    <div class="skeleton-element skeleton-button"></div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Renders a specified number of skeleton loaders into a container.
 * @param {HTMLElement} container - The container to render skeletons into.
 * @param {number} count - The number of skeletons to render.
 */
function renderSkeletons(container: HTMLElement, count: number) {
    if (!container) return;
    
    const grid = document.createElement('div');
    // Use the same class as the real content for consistent layout
    grid.className = container.id === 'results' ? 'product-grid-inner' : 'article-grid';
    
    let skeletonsHTML = '';
    for (let i = 0; i < count; i++) {
        skeletonsHTML += createSkeletonCardHTML();
    }
    grid.innerHTML = skeletonsHTML;

    container.innerHTML = ''; // Clear previous content
    container.appendChild(grid);
}

function createProductCard(product: Product): HTMLElement {
  const productCard = document.createElement('div');
  productCard.className = 'product-card';
  productCard.dataset.productName = product.name;

  const clicks = getProductClickCount(product.name);
  const ratingHTML = clicks >= 10 ? '<div class="product-rating" aria-label="5 out of 5 stars">★★★★★</div>' : '';
  const eyeIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/><path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/></svg>`;
  const clicksHTML = `<div class="product-clicks" aria-label="${clicks} views">${eyeIconSVG} <span>${clicks}</span></div>`;

  // --- SEO: JSON-LD Structured Data ---
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.image,
    "description": product.description,
    "url": product.link,
    "offers": {
      "@type": "Offer",
      "priceCurrency": "VND",
      "price": product.price.replace(/[^0-9]/g, ''), // Extract numbers from price string
      "availability": product.status.toLowerCase().includes('hết hàng') ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      "url": product.link
    },
    ...(clicks >= 10 && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "5",
        "reviewCount": clicks.toString()
      }
    })
  };
  
  const schemaScript = `<script type="application/ld+json">${JSON.stringify(productSchema)}</script>`;

  productCard.innerHTML = `
    ${schemaScript}
    <div class="product-image-container">
      <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy">
      ${product.type ? `<span class="product-type">${product.type}</span>` : ''}
      ${product.status ? `<span class="product-status" data-status="${product.status.toLowerCase().replace(/\s+/g, '-')}">${product.status}</span>` : ''}
    </div>
    <div class="product-content">
      <h3>${product.name}</h3>
      <p>${product.description}</p>
      <div class="product-footer">
        <div class="product-meta">
            <div class="product-price">${product.price}</div>
            <div class="product-stats">
                ${ratingHTML}
                ${clicksHTML}
            </div>
        </div>
        <a href="${product.link}" target="_blank" rel="noopener noreferrer" class="product-link">Xem chi tiết</a>
      </div>
    </div>
  `;
  return productCard;
}

/**
 * Creates a compact card for the "Recently Viewed" section.
 * @param product The product data.
 * @returns An HTML element representing the compact card.
 */
function createRecentlyViewedCard(product: Product): HTMLElement {
    const recentCard = document.createElement('div');
    recentCard.className = 'recent-product-card';
    recentCard.dataset.productName = product.name;
    recentCard.setAttribute('role', 'button');
    recentCard.tabIndex = 0;
    
    recentCard.innerHTML = `
        <img src="${product.image}" alt="${product.name}" class="recent-product-logo">
        <span class="recent-product-name">${product.name}</span>
    `;
    return recentCard;
}

/**
 * Creates a card for a related product to be shown in the modal.
 * @param product The product data.
 * @returns An HTML element representing the related product card.
 */
function createRelatedProductCard(product: Product): HTMLElement {
    const card = document.createElement('div');
    card.className = 'related-product-card';
    card.dataset.productName = product.name;
    card.setAttribute('role', 'button');
    card.tabIndex = 0;

    card.innerHTML = `
        <img src="${product.image}" alt="${product.name}" loading="lazy">
        <div class="related-product-details">
            <div class="related-product-name">${product.name}</div>
            <div class="related-product-price">${product.price}</div>
        </div>
    `;
    return card;
}

/**
 * Creates a card for a comment to be shown in the modal's comment tab.
 * @param comment The comment data.
 * @returns An HTML element representing the comment card.
 */
function createCommentCard(comment: Comment): HTMLElement {
    const card = document.createElement('div');
    card.className = 'comment-card';
    const avatarText = comment.author ? comment.author.substring(0, 1).toUpperCase() : '?';
    
    card.innerHTML = `
        <div class="comment-avatar" aria-hidden="true">${avatarText}</div>
        <div class="comment-content">
            <div class="comment-header">
                <span class="comment-author">${comment.author || 'Anonymous'}</span>
                ${comment.date ? `<span class="comment-date">${comment.date}</span>` : ''}
            </div>
            <p class="comment-text">${comment.text || ''}</p>
        </div>
    `;
    return card;
}


function displayProducts(products: Product[], preambleHtml: string = '') {
  if (!resultsContainer) return;
  resultsContainer.innerHTML = preambleHtml;

  if ((!products || products.length === 0)) {
    if (!preambleHtml) { // Only show this if no other message is present
      resultsContainer.innerHTML += '<p class="initial-message">Không tìm thấy sản phẩm nào phù hợp với tìm kiếm của bạn.</p>';
    }
    return;
  }
  
  const grid = document.createElement('div');
  grid.className = 'product-grid-inner';

  for (const product of products) {
    const productCard = createProductCard(product);
    grid.appendChild(productCard);
  }
  resultsContainer.appendChild(grid);
}

function displayFeaturedProducts(products: Product[]) {
    if (!resultsContainer) return;
    if (!products || products.length === 0) {
        resultsContainer.innerHTML = '<h2>Sản phẩm nổi bật</h2><p class="initial-message">Hiện chưa có sản phẩm nào để hiển thị.</p>';
        return;
    }

    // Get all clicks and sort products by popularity
    let allClicks = {};
    try {
        const clicksStr = localStorage.getItem(PRODUCT_CLICKS_KEY);
        if (clicksStr) {
            allClicks = JSON.parse(clicksStr);
        }
    } catch (e) {
        console.warn("Could not parse product clicks from localStorage.", e);
        localStorage.removeItem(PRODUCT_CLICKS_KEY); // Clear corrupted data
        allClicks = {};
    }


    const productsWithClicks = products.map(p => ({
        ...p,
        clicks: (allClicks as any)[p.name] || 0
    }));

    productsWithClicks.sort((a, b) => b.clicks - a.clicks);

    // Take top 12, or all if less than 12
    const featured = productsWithClicks.slice(0, 12);
    
    // --- Pagination Logic for both Mobile and Desktop ---
    const isMobile = window.innerWidth < 769;
    const itemsPerPage = isMobile ? 4 : 6;
    const needsPagination = featured.length > itemsPerPage;

    resultsContainer.innerHTML = '<h2>Sản phẩm nổi bật</h2>';
    
    let productsToDisplay = featured;
    let totalPages = 1;

    if (needsPagination) {
        totalPages = Math.ceil(featured.length / itemsPerPage);
        featuredProductsCurrentPage = Math.max(1, Math.min(featuredProductsCurrentPage, totalPages));
        const startIndex = (featuredProductsCurrentPage - 1) * itemsPerPage;
        productsToDisplay = featured.slice(startIndex, startIndex + itemsPerPage);
    }

    // Display products
    const grid = document.createElement('div');
    grid.className = 'product-grid-inner';
    productsToDisplay.forEach(product => {
        grid.appendChild(createProductCard(product));
    });
    resultsContainer.appendChild(grid);

    // Display pagination controls if needed
    if (needsPagination) {
        const paginationContainer = document.createElement('div');
        paginationContainer.className = 'featured-pagination-container';

        const prevButton = document.createElement('button');
        prevButton.textContent = 'Trước';
        prevButton.className = 'pagination-button';
        prevButton.disabled = featuredProductsCurrentPage === 1;
        prevButton.addEventListener('click', () => {
            if (featuredProductsCurrentPage > 1) {
                featuredProductsCurrentPage--;
                displayFeaturedProducts(allProducts);
                resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });

        const pageInfo = document.createElement('span');
        pageInfo.className = 'pagination-info';
        pageInfo.textContent = `Trang ${featuredProductsCurrentPage} / ${totalPages}`;

        const nextButton = document.createElement('button');
        nextButton.textContent = 'Sau';
        nextButton.className = 'pagination-button';
        nextButton.disabled = featuredProductsCurrentPage === totalPages;
        nextButton.addEventListener('click', () => {
            if (featuredProductsCurrentPage < totalPages) {
                featuredProductsCurrentPage++;
                displayFeaturedProducts(allProducts);
                resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });

        paginationContainer.appendChild(prevButton);
        paginationContainer.appendChild(pageInfo);
        paginationContainer.appendChild(nextButton);
        resultsContainer.appendChild(paginationContainer);
    }
}


function getProductTypeClickCount(type: string): number {
    return allProducts
        .filter(p => p.type === type)
        .reduce((sum, p) => sum + getProductClickCount(p.name), 0);
}

function displaySmartSuggestions(products: Product[]) {
    if (!suggestionsContainer) return;

    // Get unique, non-empty types and their trend scores
    const typesWithScores = [...new Set(products.map(p => p.type).filter(p => p && p.trim() !== ''))]
        .map(type => ({
            type,
            score: getProductTypeClickCount(type)
        }))
        .sort((a, b) => b.score - a.score); // Sort by score descending

    suggestionsContainer.innerHTML = '';

    typesWithScores.forEach(({ type, score }) => {
        const item = document.createElement('div');
        item.className = 'smart-suggestion-item';
        item.setAttribute('role', 'button');
        item.tabIndex = 0;
        item.dataset.query = type;

        const fomoScore = Math.round(score * 1.6);
        const scoreHtml = score > 0 ? `<span class="trend-score">${fomoScore.toLocaleString()}</span>` : '';

        item.innerHTML = `
            <span class="suggestion-text">${type}</span>
            <div class="suggestion-trend">
                ${scoreHtml}
                <div class="trend-icon" aria-label="Trending">
                    <svg viewBox="0 0 24 10" preserveAspectRatio="none">
                        <polyline points="0 8, 4 4, 8 6, 12 2, 16 5, 20 3, 24 6" />
                    </svg>
                </div>
            </div>
        `;
        suggestionsContainer.appendChild(item);
    });
}

function displayBlogPosts(articles: Article[]) {
  if (!blogGrid) return;
  
  if (!articles || articles.length === 0) {
    blogGrid.innerHTML = '<p class="initial-message">Hiện chưa có bài viết nào.</p>';
    return;
  }

  blogGrid.innerHTML = '';
  for (const article of articles) {
    const articleCard = document.createElement('a');
    articleCard.className = 'article-card';
    articleCard.href = `#/blog/${article.slug}`;
    articleCard.innerHTML = `
      <img src="${article.imageURL}" alt="${article.title}" class="article-image" loading="lazy">
      <div class="article-content">
        <h3>${article.title}</h3>
        <p>${article.description}</p>
        <div class="article-link">Đọc thêm</div>
      </div>
    `;
    blogGrid.appendChild(articleCard);
  }
}

// --- Search Logic ---
/**
 * Generates expert advice for a given product by calling the backend proxy.
 * This function is self-contained and handles its own errors gracefully.
 * @param product The product to analyze.
 * @returns A string containing the formatted HTML advice or an error message.
 */
async function generateExpertAdvice(product: Product): Promise<string> {
    try {
        const response = await fetch(API_PROXY_URL + "/api/generate", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ product: product }),
        });

        if (!response.ok) {
            let serverErrorMessage;
            // The server might return a JSON error object, or it might return an HTML error page.
            // We try to parse it as JSON first.
            try {
                const errorData = await response.json();
                serverErrorMessage = errorData.error;
            } catch (e) {
                // If parsing fails, it's not a JSON response. We can log this for debugging.
                console.error("Could not parse error response as JSON. The server may be down or returning HTML.", await response.text());
            }
            // Throw an error with the server message if available, otherwise use the status text.
            throw new Error(serverErrorMessage || `Lỗi từ máy chủ: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        // The backend returns the advice as a stringified JSON, so we need to parse it.
        const advice: ExpertAdvice = JSON.parse(data);

        return formatAdviceToHtml(advice);

    } catch (error) {
        console.error("Lỗi khi gọi API proxy để lấy tư vấn:", error);
        // This catch block handles both network errors and errors from the server,
        // returning a user-facing error message directly.
        return `<p class="initial-message">Rất tiếc, tính năng tư vấn chuyên gia đang tạm thời gián đoạn. Vui lòng thử lại sau. (Hãy chắc chắn rằng máy chủ proxy đang chạy!)</p>`;
    }
}

/**
 * Formats the AI-generated advice into an HTML string.
 * @param advice The advice object from the API.
 * @returns An HTML string.
 */
function formatAdviceToHtml(advice: ExpertAdvice): string {
    const advantagesHtml = advice.advantages.length > 0
        ? `<ul>${advice.advantages.map(item => `<li>${item}</li>`).join('')}</ul>`
        : '<p>Không có ưu điểm đặc biệt nào được ghi nhận.</p>';

    const considerationsHtml = advice.considerations.length > 0
        ? `<ul>${advice.considerations.map(item => `<li>${item}</li>`).join('')}</ul>`
        : '<p>Không có điểm cần cân nhắc đặc biệt.</p>';
        
    return `
        <h4>Ưu điểm nổi bật</h4>
        ${advantagesHtml}
        <h4>Điểm cần cân nhắc</h4>
        ${considerationsHtml}
        <h4>Kết luận của chuyên gia</h4>
        <p class="summary">${advice.summary}</p>
    `;
}

function triggerSearch(query: string) {
    if (query) {
        if(searchInput) searchInput.value = query;
        performSearch(query);
        // Scroll to results after search is performed.
        resultsContainer?.scrollIntoView({ behavior: 'smooth' });
    }
}

function performSearch(query: string) {
  const trimmedQuery = query.trim();

  const currentUrl = new URL(window.location.href);
  if (trimmedQuery) {
    currentUrl.searchParams.set('q', trimmedQuery);
    updatePageTitle(`Tìm kiếm '${trimmedQuery}' | Tienoi.one`);
  } else {
    currentUrl.searchParams.delete('q');
    updatePageTitle();
  }

  try {
    const path = currentUrl.pathname + currentUrl.search;
    window.history.pushState({ query: trimmedQuery }, '', path);
  } catch (error) {
    console.warn("Could not update URL history.", error);
  }

  if (!trimmedQuery) {
    featuredProductsCurrentPage = 1; // Reset page on new search
    displayFeaturedProducts(allProducts); // Show featured instead of empty message
    return;
  }

  saveRecentSearch(trimmedQuery);
  displayRecentSearches();

  const lowerCaseQuery = trimmedQuery.toLowerCase();

  // Step 1: Exact match on product type
  let filteredProducts = allProducts.filter(product => {
    const productTypeLower = product.type ? product.type.toLowerCase().trim() : '';
    return productTypeLower === lowerCaseQuery;
  });

  if (filteredProducts.length > 0) {
      // Found results by type, display them
      displayProducts(filteredProducts, `<h2>Kết quả cho loại sản phẩm: ${trimmedQuery}</h2>`);
  } else {
      // Step 2: If no type match, search within the product name (title)
      filteredProducts = allProducts.filter(product => 
          product.name.toLowerCase().includes(lowerCaseQuery)
      );
      
      if (filteredProducts.length > 0) {
          // Found results by name, display them with a helper message
          const message = `<p class="search-assist-message">Không tìm thấy kết quả chính xác cho loại sản phẩm. Hiển thị kết quả chứa <strong>"${trimmedQuery}"</strong> trong tên:</p>`;
          displayProducts(filteredProducts, message);
      } else {
          // Step 3: If still no results, show the final "not found" message
          const message = `<h2>Không tìm thấy sản phẩm nào</h2><p class="initial-message">Rất tiếc, không có sản phẩm nào phù hợp với tìm kiếm của bạn. Hãy thử một trong các gợi ý phổ biến bên dưới.</p>`;
          displayProducts([], message);
      }
  }
}

/**
 * Loads initial products, prioritizing managed products from localStorage
 * over the default JSON file. This ensures admin changes are persistent.
 * @returns A promise that resolves to an array of Product objects.
 */
async function loadInitialProducts(): Promise<Product[]> {
    try {
        const managedProductsStr = localStorage.getItem(MANAGED_PRODUCTS_KEY);
        if (managedProductsStr) {
            const managedProducts = JSON.parse(managedProductsStr);
            if (Array.isArray(managedProducts) && managedProducts.length > 0) {
                console.log("Loaded products from localStorage (Admin).");
                return managedProducts;
            }
        }
    } catch (e) {
        console.warn("Could not parse managed products from localStorage.", e);
        // Clear corrupted data
        localStorage.removeItem(MANAGED_PRODUCTS_KEY);
    }
    
    // Fallback to fetching from JSON if localStorage is empty or corrupted
    console.log("Fetching default products from products.json.");
    return getProducts();
}

/**
 * Initializes the application with a progressive loading strategy.
 * It loads and displays critical content (products) first,
 * then loads non-critical content (articles, comments) in the background.
 */
async function initializeApp() {
    if (!resultsContainer || !blogGrid) {
        console.error("Essential DOM elements are missing. App cannot initialize.");
        return;
    }

    // --- Initial UI State ---
    updatePageTitle();
    displayRecentSearches();
    displayRecentlyViewed();
    
    // Render skeleton loaders immediately for better perceived performance
    renderSkeletons(resultsContainer, 6);
    renderSkeletons(blogGrid, 3);

    try {
        // --- Stage 1: Load and render CRITICAL content (Products) ---
        const products = await loadInitialProducts();
        allProducts = products;
        
        // Populate UI with product data as soon as it's available
        displaySmartSuggestions(allProducts);
        
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('q');
        if (query) {
            triggerSearch(query);
        } else {
             featuredProductsCurrentPage = 1;
             displayFeaturedProducts(allProducts);
        }

        // --- Stage 2: Load NON-CRITICAL content in the background ---
        // We don't `await` these. They will populate when ready.
        getArticles().then(articles => {
            allArticles = articles;
            displayBlogPosts(allArticles);
            populateFooter(allArticles, allProducts); // Repopulate footer with all data
            router(); // Call router again to handle article routes if hash is already set
        });

        getComments().then(comments => {
            allComments = comments;
        });

    } catch (error) {
        console.error('Error during critical app initialization:', error);
        resultsContainer.innerHTML = '<h2>Đã có lỗi xảy ra</h2><p class="initial-message">Không thể tải dữ liệu sản phẩm. Vui lòng thử lại sau.</p>';
        blogGrid.innerHTML = '<p class="initial-message">Không thể tải các bài viết. Vui lòng thử lại sau.</p>';
    }
}

// --- Particle Animation Logic ---
function initParticleAnimation() {
    const canvas = document.getElementById('particle-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    let particles: Particle[] = [];
    const headerElement = canvas.parentElement!;
    
    const setCanvasSize = () => {
        canvas.width = headerElement.offsetWidth;
        canvas.height = headerElement.offsetHeight;
    };
    
    setCanvasSize();

    class Particle {
        x: number; y: number; directionX: number; directionY: number; size: number;
        constructor(x: number, y: number, dX: number, dY: number, size: number) {
            this.x = x; this.y = y; this.directionX = dX; this.directionY = dY; this.size = size;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
            ctx.fillStyle = 'rgba(0, 191, 255, 0.5)';
            ctx.fill();
        }
        update() {
            if (this.x > canvas.width || this.x < 0) this.directionX = -this.directionX;
            if (this.y > canvas.height || this.y < 0) this.directionY = -this.directionY;
            this.x += this.directionX;
            this.y += this.directionY;
            this.draw();
        }
    }

    function init() {
        particles = [];
        let numberOfParticles = (canvas.height * canvas.width) / 12000;
        for (let i = 0; i < numberOfParticles; i++) {
            let size = (Math.random() * 2) + 1;
            let x = (Math.random() * ((canvas.width - size * 2) - (size * 2)) + size * 2);
            let y = (Math.random() * ((canvas.height - size * 2) - (size * 2)) + size * 2);
            let dX = (Math.random() * .4) - .2;
            let dY = (Math.random() * .4) - .2;
            particles.push(new Particle(x, y, dX, dY, size));
        }
    }

    function connect() {
        let opacityValue = 1;
        for (let a = 0; a < particles.length; a++) {
            for (let b = a; b < particles.length; b++) {
                let distance = ((particles[a].x - particles[b].x) * (particles[a].x - particles[b].x))
                    + ((particles[a].y - particles[b].y) * (particles[a].y - particles[b].y));
                if (distance < (canvas.width / 7) * (canvas.height / 7)) {
                    opacityValue = 1 - (distance / 20000);
                    ctx.strokeStyle = `rgba(0, 191, 255, ${opacityValue})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particles[a].x, particles[a].y);
                    ctx.lineTo(particles[b].x, particles[b].y);
                    ctx.stroke();
                }
            }
        }
    }
    
    function animate() {
        requestAnimationFrame(animate);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < particles.length; i++) particles[i].update();
        connect();
    }

    const resizeObserver = new ResizeObserver(() => {
        setCanvasSize();
        init();
    });
    resizeObserver.observe(headerElement);

    init();
    animate();
}

// --- Footer Population ---
function populateFooter(articles: Article[], products: Product[]) {
    // Populate Tags
    const tagsContainer = document.getElementById('footer-tags-container');
    if (tagsContainer && products) {
        tagsContainer.innerHTML = '';
        const types = [...new Set(products.map(p => p.type).filter(Boolean))];
        types.slice(0, 8).forEach(type => { // Limit to 8 tags
            const link = document.createElement('a');
            link.href = '#'; // Changed href to avoid page jump
            link.className = 'footer-tag';
            link.textContent = type;
            link.addEventListener('click', (e) => {
                e.preventDefault();
                if (type) {
                    triggerSearch(type);
                }
            });
            tagsContainer.appendChild(link);
        });
    }

    // Populate Recent Blog Posts
    const blogContainer = document.getElementById('footer-blog-container');
    if (blogContainer) {
        blogContainer.innerHTML = '';
        articles.slice(0, 4).forEach(article => {
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            link.href = `#/blog/${article.slug}`;
            link.textContent = article.title;
            listItem.appendChild(link);
            blogContainer.appendChild(listItem);
        });
    }
}

// --- Admin Page Functions ---
/** Saves the entire `allProducts` array to localStorage. */
function saveAllProducts() {
    try {
        localStorage.setItem(MANAGED_PRODUCTS_KEY, JSON.stringify(allProducts));
    } catch(e) {
        console.error("Failed to save products to localStorage.", e);
        alert("Lỗi: Không thể lưu sản phẩm. Bộ nhớ của trình duyệt có thể đã đầy.");
    }
}

/** Renders the list of products in the admin page table. */
function renderAdminPage() {
    if (!adminProductListContainer) return;

    // Admin page should reflect the live state of `allProducts`, which might
    // have been modified during the session.
    const productsToRender = allProducts;

    if (productsToRender.length === 0) {
        adminProductListContainer.innerHTML = `<p class="initial-message">Chưa có sản phẩm nào. Hãy thêm một sản phẩm!</p>`;
        return;
    }
    
    const tableHTML = `
        <table class="admin-product-table">
            <thead>
                <tr>
                    <th>Hình ảnh</th>
                    <th>Tên sản phẩm</th>
                    <th>Loại</th>
                    <th>Giá</th>
                    <th>Hành động</th>
                </tr>
            </thead>
            <tbody>
                ${productsToRender.map(p => `
                    <tr data-product-name="${p.name}">
                        <td class="product-image-cell"><img src="${p.image}" alt="${p.name}"></td>
                        <td>${p.name}</td>
                        <td>${p.type}</td>
                        <td>${p.price}</td>
                        <td class="product-actions-cell">
                            <button class="action-btn edit" data-product-name="${p.name}">Sửa</button>
                            <button class="action-btn delete" data-product-name="${p.name}">Xóa</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    adminProductListContainer.innerHTML = tableHTML;
}

/** Opens the admin form modal, optionally pre-filling it for editing. */
function openAdminForm(product?: Product) {
    if (!adminFormModal || !adminFormTitle || !adminProductForm || !adminFormProductNameOriginal) return;
    
    adminProductForm.reset();
    if (product) {
        adminFormTitle.textContent = "Sửa Sản Phẩm";
        adminFormProductNameOriginal.value = product.name; // Keep track of original name for editing
        (document.getElementById('admin-product-name') as HTMLInputElement).value = product.name;
        (document.getElementById('admin-product-type') as HTMLInputElement).value = product.type;
        (document.getElementById('admin-product-price') as HTMLInputElement).value = product.price;
        (document.getElementById('admin-product-status') as HTMLInputElement).value = product.status;
        (document.getElementById('admin-product-image') as HTMLInputElement).value = product.image;
        (document.getElementById('admin-product-link') as HTMLInputElement).value = product.link;
        (document.getElementById('admin-product-description') as HTMLTextAreaElement).value = product.description;
        (document.getElementById('admin-product-description-detail') as HTMLTextAreaElement).value = product.description_detail;
        (document.getElementById('admin-product-button-text') as HTMLInputElement).value = product.button_text;
    } else {
        adminFormTitle.textContent = "Thêm Sản Phẩm Mới";
        adminFormProductNameOriginal.value = '';
    }

    adminFormModal.classList.add('is-visible');
    document.body.classList.add('no-scroll');
}

/** Closes the admin form modal. */
function closeAdminForm() {
    if (!adminFormModal) return;
    adminFormModal.classList.remove('is-visible');
    document.body.classList.remove('no-scroll');
}

/** Handles the submission of the admin product form for both create and update. */
function handleAdminFormSubmit(e: Event) {
    e.preventDefault();
    if (!adminFormProductNameOriginal) return;
    
    const originalName = adminFormProductNameOriginal.value;
    const newProduct: Product = {
        name: (document.getElementById('admin-product-name') as HTMLInputElement).value,
        type: (document.getElementById('admin-product-type') as HTMLInputElement).value,
        price: (document.getElementById('admin-product-price') as HTMLInputElement).value,
        status: (document.getElementById('admin-product-status') as HTMLInputElement).value,
        image: (document.getElementById('admin-product-image') as HTMLInputElement).value,
        link: (document.getElementById('admin-product-link') as HTMLInputElement).value,
        description: (document.getElementById('admin-product-description') as HTMLTextAreaElement).value,
        description_detail: (document.getElementById('admin-product-description-detail') as HTMLTextAreaElement).value,
        button_text: (document.getElementById('admin-product-button-text') as HTMLInputElement).value,
    };

    if (originalName) { // Editing existing product
        const productIndex = allProducts.findIndex(p => p.name === originalName);
        if (productIndex > -1) {
            allProducts[productIndex] = newProduct;
        }
    } else { // Adding new product
        allProducts.unshift(newProduct);
    }

    saveAllProducts();
    renderAdminPage();
    // Also refresh main page views if necessary
    displaySmartSuggestions(allProducts);
    displayFeaturedProducts(allProducts);
    closeAdminForm();
}

/** Handles the deletion of a product. */
function handleProductDelete(productName: string) {
    if (confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${productName}" không?`)) {
        allProducts = allProducts.filter(p => p.name !== productName);
        saveAllProducts();
        renderAdminPage();
        // Also refresh main page views if necessary
        displaySmartSuggestions(allProducts);
        displayFeaturedProducts(allProducts);
    }
}


/**
 * Handles routing for the single-page application.
 * This is the central hub for navigation. It shows/hides content and manages
 * smooth scrolling based on the URL hash.
 */
const router = () => {
    const hash = window.location.hash;

    // Page containers
    const mainHeader = document.querySelector('header');
    const mainContent = document.querySelector('main');
    const mainFooter = document.querySelector('footer');
    const privacyPage = document.getElementById('privacy-policy-page');
    const termsPage = document.getElementById('terms-of-service-page');
    const adminPage = document.getElementById('admin-page');
    const articleDetailPage = document.getElementById('article-detail-page');

    const allPages = [mainHeader, mainContent, mainFooter, privacyPage, termsPage, adminPage, articleDetailPage].filter(Boolean) as HTMLElement[];
    
    // --- Hide all page-level containers first ---
    allPages.forEach(el => el.style.display = 'none');

    // --- Determine which page to show based on the hash ---
    if (hash.startsWith('#/blog/')) {
        const slug = hash.substring(7); // remove '#/blog/'
        const article = allArticles.find(a => a.slug === slug);
        
        if (article && articleDetailPage) {
            // Populate and show the article detail page
            const titleEl = document.getElementById('article-detail-title') as HTMLElement;
            const imageEl = document.getElementById('article-detail-image') as HTMLImageElement;
            const contentEl = document.getElementById('article-detail-content') as HTMLElement;
            
            if (titleEl) titleEl.textContent = article.title;
            if (imageEl) {
                imageEl.src = article.imageURL;
                imageEl.alt = article.title;
            }
            if (contentEl) contentEl.innerHTML = article.content;
            
            updatePageTitle(`${article.title} | Tienoi.one Blog`);
            articleDetailPage.style.display = 'block';
            window.scrollTo(0, 0);
        } else {
            // Article not found, redirect to blog list
            window.location.hash = '#blog';
        }
    } else if (hash === '#/privacy-policy' || hash === '#/terms-of-service' || hash === '#/admin') {
        let pageToShow: HTMLElement | null = null;
        if (hash === '#/privacy-policy') {
            pageToShow = privacyPage;
            updatePageTitle('Chính sách Bảo mật | Tienoi.one');
        } else if (hash === '#/terms-of-service') {
            pageToShow = termsPage;
             updatePageTitle('Điều khoản Dịch vụ | Tienoi.one');
        } else if (hash === '#/admin') {
            pageToShow = adminPage;
            updatePageTitle('Quản trị | Tienoi.one');
            renderAdminPage();
        }
        
        if (pageToShow) {
            pageToShow.style.display = 'block';
            window.scrollTo(0, 0);
        }
    } else {
        // --- This is a main page route (#home, #about, etc. or empty) ---
        [mainHeader, mainContent, mainFooter].forEach(el => el!.style.display = '');

        // If user explicitly navigates to #home, reset the view to featured products.
        if (hash === '#home' || !hash) {
            featuredProductsCurrentPage = 1;
            displayFeaturedProducts(allProducts);

            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('q')) {
                const newUrl = window.location.pathname + (hash || '#home');
                history.pushState({}, '', newUrl);
            }
             updatePageTitle(); // Reset to default
        }
       
        // Smooth scroll to the target section
        setTimeout(() => {
            const selector = (hash && hash.length > 1) ? hash : '#home';
            try {
                const targetElement = document.querySelector(selector);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            } catch (e) {
                console.warn(`Could not scroll to selector: ${selector}`, e);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }, 50); 
    }
};


// --- Initializer ---
document.addEventListener('DOMContentLoaded', () => {
    // Initialize visual effects and fetch initial data
    initNavSwipe();
    initParticleAnimation();
    initializeApp();

    // --- Event Listeners ---
    
    /**
     * Handles opening the product modal for a given product name.
     * It centralizes the logic for finding a product, saving it, and showing the modal.
     * @param productName The name of the product to show.
     */
    const handleProductSelection = (productName: string) => {
        const product = allProducts.find(p => p.name === productName);
        if (product) {
            incrementProductClick(product.name);
            updateProductCardDOM(product.name);
            saveToRecentlyViewed(product);
            displayRecentlyViewed();
            openProductModal(product);
        }
    };

    // --- On-Page Search Listeners ---
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (searchInput) {
                triggerSearch(searchInput.value);
            }
        });
    }

    // Handle clicks on suggestion tags
    if (suggestionsContainer) {
        suggestionsContainer.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const suggestionItem = target.closest('.smart-suggestion-item') as HTMLElement;
            if (suggestionItem) {
                const query = suggestionItem.dataset.query;
                if (query) {
                    triggerSearch(query);
                }
            }
        });
    }

    // Handle clicks on product cards to save them and open the modal
    document.body.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;

        // Find the closest product card (main, recent, or related)
        const cardElement = target.closest('.product-card, .recent-product-card, .related-product-card') as HTMLElement;

        if (cardElement?.dataset.productName) {
            // Prevent default action if an 'a' tag was clicked inside the card.
            // This ensures the modal opens instead of navigating away.
            const linkClicked = target.closest('a');
            if (linkClicked && linkClicked.classList.contains('product-link')) {
                 e.preventDefault();
            }
            handleProductSelection(cardElement.dataset.productName);
        }
    });

    // Add modal close listeners and keyboard accessibility
    document.addEventListener('keydown', (e) => {
        // Close modal with Escape key
        if (e.key === 'Escape') {
            if (productModal?.classList.contains('is-visible')) {
                closeProductModal();
            }
            if (adminFormModal?.classList.contains('is-visible')) {
                closeAdminForm();
            }
        }
    });

    if (modalCloseButton) modalCloseButton.addEventListener('click', closeProductModal);
    if (productModal) {
        productModal.addEventListener('click', (e) => {
            if (e.target === productModal) {
                closeProductModal();
            }
        });

        // Tab functionality within the modal
        const tabs = productModal.querySelectorAll('.modal-tab-button');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetPanelId = tab.getAttribute('data-tab-target');
                if (!targetPanelId) return;

                // Deactivate all tabs and panels
                productModal.querySelectorAll('.modal-tab-button').forEach(t => t.classList.remove('is-active'));
                productModal.querySelectorAll('.modal-tab-panel').forEach(p => p.classList.remove('is-active'));

                // Activate the clicked tab and corresponding panel
                tab.classList.add('is-active');
                const targetPanel = document.querySelector(targetPanelId);
                targetPanel?.classList.add('is-active');
            });
        });

        // AI Consultant Tab listener
        const generateAdviceButton = document.getElementById('generate-advice-button') as HTMLButtonElement;
        if (generateAdviceButton) {
            generateAdviceButton.addEventListener('click', async () => {
                if (!currentModalProduct) return;

                const consultantInitialMessage = document.querySelector('#tab-panel-consultant .consultant-initial-message') as HTMLElement;
                const consultantResultContainer = document.getElementById('consultant-result-container') as HTMLElement;
                
                if (consultantInitialMessage) consultantInitialMessage.style.display = 'none';
                if (consultantResultContainer) {
                    consultantResultContainer.innerHTML = `<div class="loading-spinner" style="display: block;"></div>`;
                    const adviceHtml = await generateExpertAdvice(currentModalProduct);
                    consultantResultContainer.innerHTML = adviceHtml;
                }
            });
        }
    }


    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formStatus = document.getElementById('form-status');
            if (formStatus) {
                formStatus.textContent = 'Gửi thành công! Cảm ơn bạn đã liên hệ.';
                formStatus.style.color = '#28a745';
                contactForm.reset();
                setTimeout(() => {
                    formStatus.textContent = '';
                }, 4000);
            }
        });
    }
    
    // --- Admin Page Listeners ---
    if (addNewProductBtn) {
        addNewProductBtn.addEventListener('click', () => openAdminForm());
    }
    if (adminModalCloseButton) {
        adminModalCloseButton.addEventListener('click', closeAdminForm);
    }
    if (adminFormModal) {
        adminFormModal.addEventListener('click', (e) => {
            if (e.target === adminFormModal) closeAdminForm();
        });
    }
    if (adminProductForm) {
        adminProductForm.addEventListener('submit', handleAdminFormSubmit);
    }
    if(adminProductListContainer) {
        adminProductListContainer.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const productName = target.dataset.productName;

            if (!productName) return;

            if (target.classList.contains('edit')) {
                const productToEdit = allProducts.find(p => p.name === productName);
                if (productToEdit) openAdminForm(productToEdit);
            } else if (target.classList.contains('delete')) {
                handleProductDelete(productName);
            }
        });
    }


    // --- Router setup ---
    window.addEventListener('hashchange', router);
    // Initial call on page load is now handled inside initializeApp after data is fetched
});