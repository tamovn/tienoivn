/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// --- Type Interfaces ---
// These are duplicated here and in index.tsx to keep this module self-contained.
// In a larger project with a build system, they would be in a shared types file.
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

/**
 * Fetches data from a given JSON file.
 * Includes caching to prevent re-fetching the same data.
 * @param url The URL of the JSON file to fetch.
 * @returns A promise that resolves with the parsed JSON data.
 */
async function fetchData<T>(url: string): Promise<T> {
    console.log(`🔍 Fetching data from: ${url}`);
    try {
        const response = await fetch(url, { cache: 'no-store' });
        console.log(`📡 Response for ${url} - Status: ${response.status}`);

        if (!response.ok) {
            console.error(`❌ Network response was not ok for ${url}. Status: ${response.status}, Text: ${response.statusText}`);
            throw new Error(`Network response was not ok for ${url}: ${response.statusText}`);
        }
        
        const data = await response.json() as T;
        console.log(`✅ Data loaded successfully from ${url}.`);
        return data;

    } catch (error) {
        console.error(`❌ Failed to fetch or parse JSON from ${url}:`, error);
        // Return an empty array or object as a fallback to prevent app crashes
        return [] as T; 
    }
}

/**
 * Fetches all products from the products.json file.
 * @returns A promise that resolves to an array of Product objects.
 */
export const getProducts = (): Promise<Product[]> => {
    return fetchData<Product[]>('/products.json');
}

/**
 * Fetches all articles from the articles.json file.
 * @returns A promise that resolves to an array of Article objects.
 */
export const getArticles = (): Promise<Article[]> => {
    return fetchData<Article[]>('/articles.json');
}

/**
 * Fetches all comments from the comments.json file.
 * @returns A promise that resolves to an array of Comment objects.
 */
export const getComments = (): Promise<Comment[]> => {
    return fetchData<Comment[]>('/comments.json');
}
