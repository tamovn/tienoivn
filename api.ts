/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Import data directly from JSON files
import productsData from './public/products.json';
import blogData from './public/blog.json';
import commentsData from './public/comments.json';

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

export interface blog {
  title: string;
  description: string;
  imageURL: string;
  slug: string;
  content:  string;
}

export interface Comments {
}

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
function isValidArticle(item: any): item is blog {
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
 * Gets all products directly from the imported JSON module.
 * @returns A promise that resolves to an array of valid Product objects.
 */
export const getProducts = async (): Promise<Product[]> => {
  try {
    if (!Array.isArray(productsData)) {
      throw new Error('Imported product data is not an array.');
    }
    const validatedData = productsData.filter(isValidProduct);
    console.log(`[API] ✅ Loaded products.json. Imported: ${productsData.length}, Validated: ${validatedData.length}`);
    return validatedData;
  } catch (error) {
    console.error('[API] ❌ Failed to load products:', error);
    return []; // Return empty array on failure
  }
};

/**
 * Gets all articles directly from the imported JSON module.
 * @returns A promise that resolves to an array of valid Article objects.
 */
export const getblog = async (): Promise<blog[]> => {
    try {
        if (!Array.isArray(blogData)) {
          throw new Error('Imported article data is not an array.');
        }
        const validatedData = blogData.filter(isValidArticle);
        console.log(`[API] ✅ Loaded articles.json. Imported: ${blogData.length}, Validated: ${validatedData.length}`);
        return validatedData;
    } catch (error) {
        console.error('[API] ❌ Failed to load articles:', error);
        return [];
    }
};

/**
 * Gets all comments directly from the imported JSON module.
 * @returns A promise that resolves to an array of valid Comment objects.
 */
export const getComments = async (): Promise<Comments[]> => {
    try {
        if (!Array.isArray(commentsData)) {
          throw new Error('Imported comment data is not an array.');
        }
        const validatedData = commentsData.filter(isValidComment);
        console.log(`[API] ✅ Loaded comments.json. Imported: ${commentsData.length}, Validated: ${validatedData.length}`);
        return validatedData;
    } catch (error) {
        console.error('[API] ❌ Failed to load comments:', error);
        return [];
    }
};