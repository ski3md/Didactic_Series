#!/usr/bin/env node

// AI Enrichment Module for Image Metadata (ES Module Version)
// Usage: node ai_enrichment.js '{"metadata": "..."}'

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory path in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if OpenAI is available
let openai;
try {
  const { OpenAI } = await import('openai');
  openai = new OpenAI();
} catch (error) {
  console.error('OpenAI package not installed. Run: npm install openai');
  process.exit(1);
}

async function enrichMetadata(metadataJson) {
  try {
    const metadata = JSON.parse(metadataJson);
    
    // Create prompt for AI enrichment
    const prompt = `
    Enhance this pathology image metadata with additional diagnostic insights:
    
    ${JSON.stringify(metadata, null, 2)}
    
    Please add:
    1. A more detailed teaching point (2-3 sentences)
    2. Additional relevant diagnostic tags (3-5 tags)
    3. Key histologic features to look for (3-5 features)
    4. Differential diagnosis considerations (2-3 possibilities)
    
    Return only valid JSON with the enhanced metadata, maintaining the original structure.
    `;
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 500
    });
    
    // Parse and return enhanced metadata
    const enhancedMetadata = JSON.parse(response.choices[0].message.content);
    
    // Add AI enhancement metadata
    enhancedMetadata.aiEnhanced = true;
    enhancedMetadata.aiEnrichmentDate = new Date().toISOString();
    
    return JSON.stringify(enhancedMetadata);
    
  } catch (error) {
    console.error("AI enrichment failed:", error.message);
    
    // Return original metadata if AI fails
    const metadata = JSON.parse(metadataJson);
    metadata.aiEnhanced = false;
    metadata.aiEnrichmentError = error.message;
    
    return JSON.stringify(metadata);
  }
}

// Get metadata from command line argument
const metadataJson = process.argv[2];
if (!metadataJson) {
  console.error("Error: No metadata provided");
  process.exit(1);
}

// Enrich and output
enrichMetadata(metadataJson).then(enhanced => {
  console.log(enhanced);
}).catch(error => {
  console.error("Error:", error.message);
  process.exit(1);
});