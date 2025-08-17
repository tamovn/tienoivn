/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// --- Type Interfaces ---
export interface Product {
  name: string;
  description: string;
  price: string;
  link: string;
  image: string;
  type: string;
  status: string;
  description_detail: string;
  button_text: string;
}

export interface Article {
  title: string;
  description: string;
  link: string;
  imageURL: string;
}

export interface Comment {
  product_type: string;
  author: string;
  text: string;
  date: string;
}

// --- Environment and Fetch Configuration ---
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const cacheOption: RequestCache = isProduction ? 'force-cache' : 'no-cache';


// --- Data Validation ---

/**
 * Validates a single Product object.
 * @param item The object to validate.
 * @returns True if the object is a valid Product, false otherwise.
 */
function isValidProduct(item: any): item is Product {
  const isValid = 
    item &&
    typeof item.name === 'string' && item.name.trim() !== '' &&
    typeof item.description === 'string' &&
    typeof item.price === 'string' &&
    typeof item.link === 'string' &&
    typeof item.image === 'string' &&
    typeof item.type === 'string';
  if (!isValid) {
    console.warn('Invalid product data filtered out:', item);
  }
  return isValid;
}

/**
 * Validates a single Article object.
 * @param item The object to validate.
 * @returns True if the object is a valid Article, false otherwise.
 */
function isValidArticle(item: any): item is Article {
  const isValid =
    item &&
    typeof item.title === 'string' && item.title.trim() !== '' &&
    typeof item.link === 'string' &&
    typeof item.imageURL === 'string';
  if (!isValid) {
    console.warn('Invalid article data filtered out:', item);
  }
  return isValid;
}

/**
 * Validates a single Comment object.
 * @param item The object to validate.
 * @returns True if the object is a valid Comment, false otherwise.
 */
function isValidComment(item: any): item is Comment {
  const isValid = 
    item &&
    typeof item.product_type === 'string' && item.product_type.trim() !== '' &&
    typeof item.author === 'string' &&
    typeof item.text === 'string';
  if (!isValid) {
    console.warn('Invalid comment data filtered out:', item);
  }
  return isValid;
}


/**
 * Fetches all products from the products.json file.
 * @returns A promise that resolves to an array of valid Product objects.
 */
export const getProducts = async (): Promise<Product[]> => {
  try {
    const response = await fetch('public/products.json', { cache: cacheOption });
    if (!response.ok) {
      throw new Error(`Network response was not ok for products.json. Status: ${response.status}`);
    }
    const rawData = await response.json();
    if (!Array.isArray(rawData)) {
      throw new Error('Fetched product data is not an array.');
    }
    const validatedData = rawData.filter(isValidProduct);
    console.log(`[API] ✅ Success for products.json. Fetched: ${rawData.length}, Validated: ${validatedData.length}`);
    return validatedData;
  } catch (error) {
    console.error('[API] ❌ Failed to fetch products:', error);
    return []; // Return empty array on failure
  }
};

/**
 * Fetches all articles from the articles.json file.
 * @returns A promise that resolves to an array of valid Article objects.
 */
export const getArticles = async (): Promise<Article[]> => {
    try {
        const response = await fetch('/articles.json', { cache: cacheOption });
        if (!response.ok) {
          throw new Error(`Network response was not ok for articles.json. Status: ${response.status}`);
        }
        const rawData = await response.json();
        if (!Array.isArray(rawData)) {
          throw new Error('Fetched article data is not an array.');
        }
        const validatedData = rawData.filter(isValidArticle);
        console.log(`[API] ✅ Success for articles.json. Fetched: ${rawData.length}, Validated: ${validatedData.length}`);
        return validatedData;
    } catch (error) {
        console.error('[API] ❌ Failed to fetch articles:', error);
        return [];
    }
};

/**
 * Fetches all comments from the comments.json file.
 * @returns A promise that resolves to an array of valid Comment objects.
 */
export const getComments = async (): Promise<Comment[]> => {
    try {
        const response = await fetch('/comments.json', { cache: cacheOption });
        if (!response.ok) {
          throw new Error(`Network response was not ok for comments.json. Status: ${response.status}`);
        }
        const rawData = await response.json();
        if (!Array.isArray(rawData)) {
          throw new Error('Fetched comment data is not an array.');
        }
        const validatedData = rawData.filter(isValidComment);
        console.log(`[API] ✅ Success for comments.json. Fetched: ${rawData.length}, Validated: ${validatedData.length}`);
        return validatedData;
    } catch (error) {
        console.error('[API] ❌ Failed to fetch comments:', error);
        return [];
    }
};