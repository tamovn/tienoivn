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
  slug: string;
  imageURL: string;
  content: string;
}

export interface Comment {
  product_type: string;
  author: string;
  text: string;
  date: string;
}

// --- Environment and Fetch Configuration ---
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const baseURL = import.meta.env.VITE_API_URL || window.location.origin;


const FETCH_RETRIES = 3;
const RETRY_DELAY = 500; // ms

// --- Data Validation ---
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

function isValidArticle(item: any): item is Article {
  const isValid =
    item &&
    typeof item.title === 'string' && item.title.trim() !== '' &&
    typeof item.slug === 'string' && item.slug.trim() !== '' &&
    typeof item.imageURL === 'string' &&
    typeof item.content === 'string';
  if (!isValid) {
    console.warn('Invalid article data filtered out:', item);
  }
  return isValid;
}

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

// --- Fetch Logic ---
async function fetchData<T>(url: string, validator: (item: any) => item is T): Promise<T[]> {
  const fullURL = `${baseURL}${url}`;
  const cacheOption: RequestCache = isProduction ? 'force-cache' : 'no-cache';
  console.log(`[API] Fetching from: ${fullURL} (Production: ${isProduction}, Cache: ${cacheOption})`);
  
  for (let i = 0; i < FETCH_RETRIES; i++) {
    try {
      const response = await fetch(fullURL, { cache: cacheOption });
      
      if (!response.ok) {
        throw new Error(`Network response was not ok. Status: ${response.status}`);
      }
      
      const rawData = await response.json();

      if (!Array.isArray(rawData)) {
        throw new Error('Fetched data is not an array.');
      }
      
      const validatedData = rawData.filter(validator);
      console.log(`[API] ✅ Success for ${url}. Fetched: ${rawData.length}, Validated: ${validatedData.length}`);
      return validatedData;

    } catch (error) {
      console.error(`[API] ❌ Attempt ${i + 1}/${FETCH_RETRIES} failed for ${url}:`, error);
      if (i < FETCH_RETRIES - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (i + 1)));
      } else {
        console.error(`[API] ❌ All retry attempts failed for ${url}. Returning empty array.`);
        return [];
      }
    }
  }
  return [];
}

// --- Public API ---
export const getProducts = (): Promise<Product[]> => {
  return fetchData<Product>('/products.json', isValidProduct);
}

export const getArticles = (): Promise<Article[]> => {
  return fetchData<Article>('/blog.json', isValidArticle);
}

export const getComments = (): Promise<Comment[]> => {
  return fetchData<Comment>('/comments.json', isValidComment);
}