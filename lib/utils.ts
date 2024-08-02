import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { parse as parseDate, subWeeks, subHours } from 'date-fns';
import { WebSearchResult } from "@/types";
import { createHash } from "crypto";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function extractDateFromSnippet(snippet: string): Date | null {
  // Updated regex to include weeks ago and hours ago
  const dateRegex = /(\d{1,2} (?:days|weeks|hours) ago|[A-Z][a-z]{2} \d{1,2}, \d{4}|[A-Z][a-z]{2} \d{1,2})/;
  const match = snippet.match(dateRegex);

  if (match) {
    const dateString = match[1];
    try {
      if (dateString.includes('ago')) {
        const [amount, unit] = dateString.split(' ');
        const value = parseInt(amount);
        const now = new Date();

        switch (unit) {
          case 'days':
            return new Date(now.setDate(now.getDate() - value));
          case 'weeks':
            return subWeeks(now, value);
          case 'hours':
            return subHours(now, value);
          default:
            return null;
        }
      } else if (dateString.includes(',')) {
        // Format: "Jul 5, 2024"
        return parseDate(dateString, 'MMM d, yyyy', new Date());
      } else {
        // Format: "Jul 5"
        const currentYear = new Date().getFullYear();
        return parseDate(`${dateString} ${currentYear}`, 'MMM d yyyy', new Date());
      }
    } catch (error) {
      console.error("Failed to parse date:", dateString);
      return null;
    }
  }
  return null;
}

function chopText(largetext: string, chunkSize: number = 3, overlap: number = 1): string[] {
  // Improved regex to better handle URLs and company names
  const sentenceRegex = /[.!?]+[\s\]\)"']*(?=\s*[A-Z0-9])|$/g;
  const sentences = largetext.split(sentenceRegex).filter(s => s.trim().length > 0);

  // Initialize an array to hold the chunks
  const chunks: string[] = [];

  // Iterate over the sentences and create chunks
  for (let i = 0; i < sentences.length; i += chunkSize - overlap) {
    const chunk = sentences.slice(i, i + chunkSize).join(' ');
    chunks.push(chunk);
  }

  return chunks;
}

function createId(data: WebSearchResult): string {
  const { title, source, url, description } = data;

  // Concatenate the properties into a single string
  const input = `${title}-${source}-${url}-${description}`;

  // Create a SHA-256 hash of the concatenated string
  const hash = createHash('sha256').update(input).digest('hex');

  // Return the first 16 characters of the hash as the unique ID
  return hash.substring(0, 16);
}

function removeUrl(largeText: string): string {
  // Regular expression to match http:// or https:// URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  // Replace all occurrences of URLs with '[URL]'
  return largeText.replace(urlRegex, '[URL]');
}

function cleanText(largeText: string): string {
  // Step 1: Remove URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  let cleanedText = largeText.replace(urlRegex, '[URL]');

  // Step 2: Remove extra whitespace and line breaks
  cleanedText = cleanedText
    .replace(/\s+/g, ' ')  // Replace multiple whitespace characters with a single space
    .replace(/\n+/g, ' ')  // Replace line breaks with a space
    .trim();               // Remove leading and trailing whitespace

  return cleanedText;
}

function removePath(largeText: string): string {
  // This regular expression matches:
  // 1. Either '/' or './' at the start
  // 2. Followed by any characters except whitespace
  // 3. Until it reaches a space or the end of the string
  const pathRegex = /(?:\/|\.\/)(?:\S+?(?=\s|$))/g;

  // Replace all matches with an empty string
  return largeText.replace(pathRegex, '[PATH]');
}



function generateUniqueKey(url: string): string {
  return createHash('sha256').update(url).digest('hex');

}

export { extractDateFromSnippet, chopText, createId, removeUrl, cleanText, removePath, generateUniqueKey };