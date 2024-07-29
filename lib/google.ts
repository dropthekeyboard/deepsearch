import axios from 'axios';
import * as cheerio from 'cheerio';

// Assuming we have a function to get user agent
import { getUserAgent } from '@/lib/userAgents';
import { WebSearchResult } from '@/types';
interface Url {
  type: string;
  template: string;
}

interface Query {
  title: string;
  totalResults: string;
  searchTerms: string;
  count: number;
  startIndex: number;
  startPage: number;
  language: string;
  inputEncoding: string;
  outputEncoding: string;
  safe: string;
  cx: string;
  sort?: string;
  filter?: string;
  gl?: string;
  cr?: string;
  googleHost?: string;
  disableCnTwTranslation?: string;
  hq?: string;
  hl?: string;
  siteSearch?: string;
  siteSearchFilter?: string;
  exactTerms?: string;
  excludeTerms?: string;
  linkSite?: string;
  orTerms?: string;
  relatedSite?: string;
  dateRestrict?: string;
  lowRange?: string;
  highRange?: string;
  fileType?: string;
  rights?: string;
  searchType?: string;
  imgSize?: string;
  imgType?: string;
  imgColorType?: string;
  imgDominantColor?: string;
}

interface Queries {
  previousPage?: Query[];
  request: Query[];
  nextPage?: Query[];
}

interface Promotion {
  // Define the structure of the Promotion object if available
}

interface Context {
  // Define the structure of the Context object if available
}

interface SearchInformation {
  searchTime: number;
  formattedSearchTime: string;
  totalResults: string;
  formattedTotalResults: string;
}

interface Spelling {
  correctedQuery: string;
  htmlCorrectedQuery: string;
}

interface Image {
  contextLink: string;
  height: number;
  width: number;
  byteSize: number;
  thumbnailLink: string;
  thumbnailHeight: number;
  thumbnailWidth: number;
}

interface Label {
  name: string;
  displayName: string;
  label_with_op: string;
}

interface Result {
  kind: string;
  title: string;
  htmlTitle: string;
  link: string;
  displayLink: string;
  snippet: string;
  htmlSnippet: string;
  cacheId: string;
  formattedUrl: string;
  htmlFormattedUrl: string;
  pagemap?: {
      [key: string]: any; // Define specific structure if needed
  };
  mime?: string;
  fileFormat?: string;
  image?: Image;
  labels?: Label[];
}

interface CustomSearchAPIResponse {
  kind: string;
  url: Url;
  queries: Queries;
  promotions?: Promotion[];
  context?: Context;
  searchInformation: SearchInformation;
  spelling?: Spelling;
  items: Result[];
}
async function _req(
  term: string,
  results: number,
  lang: string,
  start: number,
  timeout: number,
  safe: string
): Promise<string> {
  const response = await axios.get('https://www.google.com/search', {
    headers: {
      'User-Agent': getUserAgent()
    },
    params: {
      q: term,
      num: results + 2,
      hl: lang,
      start: start,
      safe: safe,
    },
    timeout: timeout,
  });

  if (response.status !== 200) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.data;
}

interface GoogleSearchParam {
  term: string;
  numResults?: number;
  lang?: string;
  advanced?: boolean;
  sleepInterval?: number;
  timeout?: number;
  safe?: string;
}

async function* search({
  term,
  numResults = 10,
  lang = "en",
  advanced = false,
  sleepInterval = 10,
  timeout = 5000,
  safe = "active"
}:GoogleSearchParam): AsyncGenerator<string | WebSearchResult, void, unknown> {
  const escapedTerm = term.replace(" ", "+");

  let start = 0;
  let fetchedResults = 0;

  while (fetchedResults < numResults) {
    // Send request
    const resp = await _req(escapedTerm, numResults - start, lang, start, timeout, safe);

    // Parse
    const $ = cheerio.load(resp);
    const resultBlock = $('div.g');
    let newResults = 0;

    for (const result in resultBlock) {
      const link = $(result).find('a[href]');
      const title = $(result).find('h3');
      const descriptionBox = $(result).find('div[style="-webkit-line-clamp:2"]');

      if (link.length && title.length && descriptionBox.length) {
        const description = descriptionBox.text();
        fetchedResults++;
        newResults++;

        if (advanced) {
          yield {
            url: link.attr('href') as string,
            title: title.text(),
            description: description,
            isIndexed: false,
            query: term,
            source:'google',
            contentDate: new Date(),
            searchDate: new Date(),
          };
        } else {
          yield link.attr('href') as string;
        }
        if (fetchedResults >= numResults) {
          break;
        }
      }
    }

    if (newResults === 0) {
      break;
    }

    start += 10;
    await new Promise(resolve => setTimeout(resolve, sleepInterval));
  }
}

interface CustomSearchQueryParams {
  c2coff?: string; // Disable Simplified and Traditional Chinese Search
  cr?: string; // Country restriction
  dateRestrict?: string; // Restrict results by date
  exactTerms?: string; // Identify phrases that must be in the results
  excludeTerms?: string; // Identify words/phrases that must not be in the results
  fileType?: string; // Restrict results to files of a specified type
  filter?: string; // Enable or disable duplicate content filter
  gl?: string; // Geolocation of the end user
  googlehost?: string; // Local Google domain to use
  highRange?: string; // High end of search range
  hl?: string; // Interface language
  hq?: string; // Appends the specified query terms to the query
  imgColorType?: 'color' | 'gray' | 'mono' | 'trans'; // Return images of a specific color type
  imgDominantColor?: 'black' | 'blue' | 'brown' | 'gray' | 'green' | 'orange' | 'pink' | 'purple' | 'red' | 'teal' | 'white' | 'yellow'; // Return images of a specific dominant color
  imgSize?: 'huge' | 'icon' | 'large' | 'medium' | 'small' | 'xlarge' | 'xxlarge'; // Return images of a specific size
  imgType?: 'clipart' | 'face' | 'lineart' | 'stock' | 'photo' | 'animated'; // Return images of a specific type
  linkSite?: string; // Include results linking to a specific URL
  lowRange?: string; // Low end of search range
  lr?: string; // Restrict results to a specific language
  num?: number; // Number of results to return (1 to 10)
  orTerms?: string; // Additional query terms to check in results
  q: string; // Query
  relatedSite?: string; // Restrict results to related sites (deprecated)
  rights?: string; // Filter results by licensing rights
  safe?: 'active' | 'off'; // Safe search level
  searchType?: 'image'; // Search type (e.g., image)
  siteSearch?: string; // Restrict results to a specific site
  siteSearchFilter?: 'e' | 'i'; // Include or exclude siteSearch results
  sort?: string; // Sort results by expression (e.g., date)
  start?: number; // Index of the first result to return
}


function convertParamsToRecord(params: any): Record<string, string> {
  const record: Record<string, string> = {};
  Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
          record[key] = String(value);
      }
  });
  return record;
}

async function fetchSearchResults(params: CustomSearchQueryParams): Promise<CustomSearchAPIResponse> {
  const apiKey = process.env.GSEARCH_API_KEY; // 실제 API 키로 대체
  const cx = process.env.GSEARCH_CSX; // 실제 검색 엔진 ID로 대체
  const queryParams = convertParamsToRecord({...params, key:apiKey, cx});
  const baseUrl = 'https://customsearch.googleapis.com/customsearch/v1';
  const queryString = new URLSearchParams(queryParams).toString();
  const response = await axios.get(`${baseUrl}?${queryString}`);
  return response.data;
}


export type {CustomSearchQueryParams};
export { search, fetchSearchResults };