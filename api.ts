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

// --- Environment Configuration ---
const isProduction =
  window.location.hostname !== 'localhost' &&
  window.location.hostname !== '127.0.0.1';

const baseURL =
  import.meta.env.VITE_API_URL?.trim() || window.location.origin;

const FETCH_RETRIES = 3;
const RETRY_DELAY = 500; // milliseconds

// --- Data Validators ---
function isValidProduct(item: any): item is Product {
  const isValid =
    item &&
    typeof item.name === 'string' && item.name.trim() !== '' &&
    typeof item.description === 'string' &&
    typeof item.price === 'string' &&
    typeof item.link === 'string' &&
    typeof item.image === 'string' &&
    typeof item.type === 'string' &&
    typeof item.status === 'string' &&
    typeof item.description_detail === 'string' &&
    typeof item.button_text === 'string';

  if (!isValid) console.warn('[Validation] Invalid Product:', item);
  return isValid;
}

function isValidArticle(item: any): item is Article {
  const isValid =
    item &&
    typeof item.title === 'string' && item.title.trim() !== '' &&
    typeof item.slug === 'string' && item.slug.trim() !== '' &&
    typeof item.imageURL === 'string' &&
    typeof item.content === 'string';

  try {
    new URL(item.imageURL);
  } catch {
    console.warn('[Validation] Invalid imageURL in Article:', item.imageURL);
    return false;
  }

  if (!isValid) console.warn('[Validation] Invalid Article:', item);
  return isValid;
}

function isValidComment(item: any): item is Comment {
  const isValid =
    item &&
    typeof item.product_type === 'string' && item.product_type.trim() !== '' &&
    typeof item.author === 'string' &&
    typeof item.text === 'string' &&
    typeof item.date === 'string';

  if (!isValid) console.warn('[Validation] Invalid Comment:', item);
  return isValid;
}

// --- Generic Fetch Logic ---
async function fetchData<T>(
  endpoint: string,
  validator: (item: any) => item is T
): Promise<T[]> {
  const fullURL = `${baseURL}${endpoint}`;
  const cacheOption: RequestCache = isProduction ? 'force-cache' : 'no-cache';

  console.log(`[API] Fetching: ${fullURL} | Cache: ${cacheOption}`);

  for (let attempt = 1; attempt <= FETCH_RETRIES; attempt++) {
    try {
      const response = await fetch(fullURL, { cache: cacheOption });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const rawData = await response.json();

      if (!Array.isArray(rawData)) {
        throw new Error('Response is not an array');
      }

      const validData = rawData.filter(validator);
      console.log(`[API] ✅ ${endpoint}: ${validData.length}/${rawData.length} items validated`);
      return validData;

    } catch (error) {
      console.error(`[API] ❌ Attempt ${attempt} failed:`, error);
      if (attempt < FETCH_RETRIES) {
        await new Promise(res => setTimeout(res, RETRY_DELAY * attempt));
      } else {
        console.error(`[API] ❌ All attempts failed for ${endpoint}`);
        return [];
      }
    }
  }

  return [];
}

// --- Public API ---
export const getProducts = (): Promise<Product[]> =>
  fetchData<Product>('/products.json', isValidProduct);

export const getArticles = (): Promise<Article[]> =>
  fetchData<Article>('/blog.json', isValidArticle);

export const getComments = (): Promise<Comment[]> =>
  fetchData<Comment>('/comments.json', isValidComment);
