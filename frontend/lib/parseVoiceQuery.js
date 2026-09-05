/**
 * Parse voice search query into structured search params.
 * Handles Hindi + English mixed queries like:
 *   - "mango under 500"
 *   - "आम 500 ke niche"
 *   - "cashew below 1000"
 *   - "spices above 200"
 *   - "seafood under 300"
 *
 * Returns: { keywords, minPrice, maxPrice, category }
 *
 * NOTE: `category` values are REAL top-level category slugs from the live
 * catalog (kokan-cashew-kaju, mango-aamba-products, ...). The /api/search
 * endpoint resolves the slug and includes the category's child
 * subcategories, so a parent slug lists the whole category.
 */

// Price patterns — Hindi + English
const PRICE_PATTERNS = [
  // "under 500", "below 500", "less than 500", " beneath 500"
  { regex: /(?:under|below|less than|beneath|kam|saste?|kam se kam|ghate?)\s*(\d[\d,]*)/i, type: 'max' },
  // "above 200", "over 200", "more than 200", "se zyada"
  { regex: /(?:above|over|more than|greater than|se zyada|zyada|bade?|upto?|tak)\s*(\d[\d,]*)/i, type: 'min' },
  // "500 ke niche" / "500 se kam" / "500 ke upar" / "500 se zyada"
  // Hindi (Devanagari): 500 के नीचे / 500 से कम / 500 के ऊपर / 500 से ज्यादा
  { regex: /(\d[\d,]*)\s*(?:के?\s*(?:नीचे|कम)|से\s*(?:कम|नीचे|सस्ते)|ke?\s*(?:niche|neeche|kam)|se\s*(?:kam|neeche|saste?))/i, type: 'max' },
  { regex: /(\d[\d,]*)\s*(?:के?\s*(?:ऊपर|ज्यादा)|से\s*(?:ज्यादा|ऊपर|बड़े|महंगे)|ke?\s*(?:upar|ooper)|se\s*(?:zyada|bade?|upar|mehnge?))/i, type: 'min' },
  // "between 200 and 500" / "200 se 500 tak" / "200 से 500 तक"
  { regex: /(?:between|from)\s*(\d[\d,]*)\s*(?:to|and|-)\s*(\d[\d,]*)/i, type: 'range' },
  { regex: /(\d[\d,]*)\s*(?:se|से)\s*(\d[\d,]*)\s*(?:tak|तक)/i, type: 'range' },
  // Standalone number that looks like a price (₹ prefix or near price words)
  { regex: /(?:₹|rs\.?|inr)?\s*(\d[\d,]*)\s*(?:tak|तक|tak ka|ka|ke)/i, type: 'max' },
];

// Category keywords → REAL top-level category slug (verify against the live
// catalog before editing — slugs change when database/kokan-catalog-data.js
// is restructured).
const CATEGORY_MAP = {
  // Mangoes (MANGO / AAMBA PRODUCTS)
  'mango': 'mango-aamba-products',
  'aam': 'mango-aamba-products',
  'aamba': 'mango-aamba-products',
  'alphonso': 'mango-aamba-products',
  'hapus': 'mango-aamba-products',
  'आम': 'mango-aamba-products',
  'आंबा': 'mango-aamba-products',

  // Fresh fruit (KOKAN MEVA / FRESH FRUITS)
  'fruit': 'kokan-meva-fresh-fruits',
  'fruits': 'kokan-meva-fresh-fruits',
  'phal': 'kokan-meva-fresh-fruits',

  // Vegetables (FARM FRESH VEGETABLES)
  'sabji': 'farm-fresh-vegetables',
  'sabzi': 'farm-fresh-vegetables',
  'vegetable': 'farm-fresh-vegetables',
  'vegetables': 'farm-fresh-vegetables',
  'भाजी': 'farm-fresh-vegetables',
  'सब्ज़ी': 'farm-fresh-vegetables',

  // Cashew (KOKAN CASHEW / KAJU)
  'cashew': 'kokan-cashew-kaju',
  'kaju': 'kokan-cashew-kaju',
  'काजू': 'kokan-cashew-kaju',

  // Dried fruit
  'dry fruit': 'dried-fruits',
  'dry fruits': 'dried-fruits',
  'sukhe meve': 'dried-fruits',

  // Seafood (DRY FISH / SEAFOOD)
  'seafood': 'dry-fish-seafood',
  'fish': 'dry-fish-seafood',
  'machhi': 'dry-fish-seafood',
  'prawn': 'dry-fish-seafood',
  'kolambi': 'dry-fish-seafood',
  'kurlya': 'dry-fish-seafood',
  'bombil': 'dry-fish-seafood',
  'surmai': 'dry-fish-seafood',

  // Spices (WHOLE SPICES / KHADA MASALA)
  'spice': 'whole-spices-khada-masala',
  'spices': 'whole-spices-khada-masala',
  'masala': 'whole-spices-khada-masala',
  'masalas': 'whole-spices-khada-masala',
  'mirchi': 'whole-spices-khada-masala',
  'haldi': 'whole-spices-khada-masala',
  'jeera': 'whole-spices-khada-masala',
  'मसाला': 'whole-spices-khada-masala',
  'हल्दी': 'whole-spices-khada-masala',
  'मिर्ची': 'whole-spices-khada-masala',
  'जीरा': 'whole-spices-khada-masala',

  // Rice (KOKAN RICE / TANDUL)
  'rice': 'kokan-rice-tandul',
  'chawal': 'kokan-rice-tandul',
  'चावल': 'kokan-rice-tandul',
  'तांदूळ': 'kokan-rice-tandul',

  // Poha / chivda
  'poha': 'poha-chivda-products',
  'chivda': 'poha-chivda-products',
  'chakli': 'poha-chivda-products',

  // Pickles (LONCHE / PICKLES) & chutney
  'pickle': 'lonche-pickles',
  'pickles': 'lonche-pickles',
  'achar': 'lonche-pickles',
  'loncha': 'lonche-pickles',
  'chutney': 'chutney',

  // Coconut (COCONUT PRODUCTS)
  'coconut': 'coconut-products',
  'nariyal': 'coconut-products',
  'nariyal tel': 'coconut-products',
  'नारियल': 'coconut-products',

  // Snacks
  'snack': 'traditional-kokan-snacks',
  'snacks': 'traditional-kokan-snacks',
  'chips': 'kokan-chips',

  // Kokum (KOKUM / AAMSUL PRODUCTS)
  'kokum': 'kokum-aamsul-products',
  'कोकम': 'kokum-aamsul-products',
};

// Stopwords to remove from keywords (Hindi + English)
const STOPWORDS = new Set([
  // English
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
  'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
  'up', 'about', 'into', 'through', 'during', 'before', 'after',
  'and', 'but', 'or', 'nor', 'not', 'so', 'yet', 'both', 'either',
  'neither', 'each', 'every', 'all', 'any', 'few', 'more', 'most',
  'other', 'some', 'such', 'no', 'only', 'own', 'same', 'than',
  'too', 'very', 'just', 'because', 'as', 'until', 'while', 'if',
  'find', 'search', 'show', 'get', 'give', 'me', 'i', 'want', 'like',
  'looking', 'searching', 'dhoondho', 'dhundho', 'dhund', 'dikhao',
  // Hindi
  'hai', 'ho', 'hain', 'tha', 'thi', 'the', 'hoga', 'hogi', 'honge',
  'kya', 'kaun', 'kab', 'kahan', 'kaise', 'kyun', 'kitna', 'kitne',
  'ka', 'ki', 'ke', 'ko', 'se', 'me', 'par', 'pe', 'ne', 'ye', 'wo',
  'aur', 'ya', 'main', 'mai', 'mera', 'meri', 'mere', 'hum', 'tum',
  'aap', 'us', 'un', 'iska', 'iski', 'iske', 'uska', 'uski', 'uske',
  'ye', 'wo', 'jo', 'jo', 'ki', 'ka', 'ke', 'vala', 'vali', 'vale',
  'chahiye', 'chahie', 'do', 'de', 'dijiye', 'batao', 'bolo', 'wali',
  'nikaal', 'nikalo', 'karo', 'karna', 'kare', 'kijiye',
  // Devanagari postpositions / helpers / comparison words
  'से', 'के', 'की', 'का', 'को', 'में', 'मे', 'पर', 'पे', 'नीचे', 'ऊपर',
  'कम', 'ज्यादा', 'बड़े', 'बड़ा', 'तक', 'वाली', 'वाले', 'वाला',
  'दिखाओ', 'बताओ', 'चाहिए', 'ढूंढो', 'लाओ', 'खोजो', 'है', 'हैं',
  'हो', 'था', 'थी', 'थे', 'और', 'या', 'क्या', 'कौन', 'कहाँ', 'कैसे',
  'मैं', 'मुझे', 'हम', 'आप', 'ये', 'वो', 'जो',
]);

/**
 * Parse a voice transcript into structured search params.
 *
 * @param {string} transcript - Raw voice transcript
 * @returns {{ keywords: string, minPrice: string, maxPrice: string, category: string }}
 */
export default function parseVoiceQuery(transcript) {
  if (!transcript || typeof transcript !== 'string') {
    return { keywords: '', minPrice: '', maxPrice: '', category: '' };
  }

  const text = transcript.trim();
  let minPrice = '';
  let maxPrice = '';
  let category = '';

  // 1. Extract prices
  for (const pattern of PRICE_PATTERNS) {
    const match = text.match(pattern.regex);
    if (match) {
      if (pattern.type === 'max') {
        const val = parseInt(match[1].replace(/,/g, ''), 10);
        if (val > 0 && val < 100000) maxPrice = String(val);
      } else if (pattern.type === 'min') {
        const val = parseInt(match[1].replace(/,/g, ''), 10);
        if (val > 0 && val < 100000) minPrice = String(val);
      } else if (pattern.type === 'range') {
        const v1 = parseInt(match[1].replace(/,/g, ''), 10);
        const v2 = parseInt(match[2].replace(/,/g, ''), 10);
        if (v1 > 0 && v2 > 0) {
          minPrice = String(Math.min(v1, v2));
          maxPrice = String(Math.max(v1, v2));
        }
      }
    }
  }

  // 2. Detect category
  const lowerText = text.toLowerCase();
  for (const [keyword, slug] of Object.entries(CATEGORY_MAP)) {
    if (lowerText.includes(keyword)) {
      category = slug;
      break; // Take first match
    }
  }

  // 3. Extract keywords — remove prices, category words, stopwords
  let keywords = text
    .replace(/₹|rs\.?|inr/gi, '')          // Remove currency symbols
    .replace(/\d[\d,]*/g, '')                // Remove numbers
    .replace(/under|below|less than|above|over|more than|between/gi, '') // English price words
    .replace(/के?\s+(?:नीचे|कम|ऊपर|ज्यादा)/gi, '') // Hindi (Devanagari) price words
    .replace(/से\s+(?:कम|नीचे|ऊपर|ज्यादा)/gi, '')
    .replace(/ke?\s+(?:niche|neeche|upar|ooper)/gi, '') // Hindi (Latin) price words
    .replace(/se\s+(?:kam|zyada|neeche|upar)/gi, '')
    .replace(/tak|तक/gi, '') // Hindi limit word
    .replace(/\s+/g, ' ')                   // Normalize spaces
    .trim();

  // Remove category keywords from the search text
  if (category) {
    for (const keyword of Object.keys(CATEGORY_MAP)) {
      keywords = keywords.replace(new RegExp(keyword, 'gi'), '');
    }
  }

  // Remove stopwords
  const words = keywords.split(/\s+/).filter(w => {
    const lower = w.toLowerCase();
    return w.length > 1 && !STOPWORDS.has(lower);
  });

  keywords = words.join(' ').trim();

  // 4. Nothing parseable at all (no category, no price, no leftover words) —
  //    only then keep the cleaned phrase so the caller still has a query.
  if (!keywords && !minPrice && !maxPrice && !category) {
    keywords = text.replace(/[₹]|rs\.?/gi, '').replace(/\d[\d,]*/g, '').trim();
  }

  return {
    keywords,
    minPrice,
    maxPrice,
    category,
  };
}
