import { GoogleGenAI, Type } from "@google/genai";
import { StoredImage, Case, CaseStudy, CaseMetadataRules } from '../types';
import { getOfficialImages, getCommunityImages } from './imageStore';
import { getCases, saveCases, getCaseStudies, saveCaseStudies } from './caseStore';

// The JSON file import was removed and its content is now inlined below to prevent module resolution errors.
const caseMetadataRules: CaseMetadataRules = {
  "version": "1.0.0",
  "schema": "who-2022-thoracic",
  "entities": {
    "tuberculosis": {
      "category": "infectious",
      "patterns": [
        {"keyword": "caseous", "description": "caseating necrosis"},
        {"keyword": "langhans", "description": "Langhans giant cells"}
      ],
      "cells": ["epithelioid histiocytes", "Langhans giant cells", "lymphocytes"],
      "difficulty": "advanced",
      "tags": ["mycobacterial", "caseating", "necrosis"],
      "teachingPoint": "Caseating granulomas with central necrosis suggest mycobacterial infection (e.g., TB).",
      "caseContext": "Tuberculosis typically shows caseating granulomas with Langhans giant cells. AFB staining may reveal acid-fast bacilli."
    },
    "histoplasmosis": {
      "category": "infectious",
      "patterns": [
        {"keyword": "yeast", "description": "intracellular yeast forms"}
      ],
      "cells": ["epithelioid histiocytes", "intracellular yeast", "macrophages"],
      "difficulty": "advanced",
      "tags": ["fungal", "dimorphic", "yeast"],
      "teachingPoint": "Small intracellular yeast forms with narrow-based budding are characteristic of histoplasmosis.",
      "caseContext": "Histoplasmosis granulomas contain small yeast forms within macrophages. GMS or PAS staining highlights the organisms."
    },
    "sarcoidosis": {
      "category": "noninfectious",
      "patterns": [
        {"keyword": "noncaseating", "description": "noncaseating granulomas"}
      ],
      "cells": ["epithelioid histiocytes", "asteroid bodies (sometimes)", "lymphocytes"],
      "difficulty": "intermediate",
      "tags": ["noncaseating", "systemic", "asteroid"],
      "teachingPoint": "Noncaseating granulomas in the appropriate clinical setting support sarcoidosis.",
      "caseContext": "Sarcoidosis features well-formed noncaseating granulomas. Asteroid bodies may be seen but are not specific."
    },
    "rheumatoid": {
      "category": "autoimmune",
      "patterns": [
        {"keyword": "necrobiotic", "description": "necrobiotic granulomas"}
      ],
      "cells": ["histiocytes", "fibroblasts", "lymphocytes"],
      "difficulty": "intermediate",
      "tags": ["autoimmune", "necrobiotic", "rheumatoid"],
      "teachingPoint": "Rheumatoid nodules show central necrobiotic material surrounded by palisading histiocytes.",
      "caseContext": "Rheumatoid lung nodules demonstrate necrobiotic granulomas with a fibrinoid center and palisading histiocytes."
    }
  },
  "stainRoles": {
    "H&E": "general morphology",
    "GMS": "highlight fungal cell walls",
    "PAS": "highlight fungal cell walls and mucin",
    "AFB": "highlight mycobacterial organisms",
    "Polarized": "reveal polarizable foreign material"
  },
  "difficultyLevels": {
    "beginner": "Classic presentations with obvious diagnostic features",
    "intermediate": "Moderate diagnostic complexity, requires pattern recognition",
    "advanced": "Subtle findings, mimics, or rare presentations"
  },
  "caseTypes": {
    "classic": "Classic textbook presentation of the disease",
    "atypical": "Unusual or variant presentation",
    "mimic": "Presentation that mimics other conditions",
    "complicated": "Case with additional complications or comorbidities"
  }
};


const rules = caseMetadataRules as CaseMetadataRules;

/**
 * Enriches an image with AI-inferred entity and difficulty if not present.
 */
async function enrichImageWithMetadata(image: StoredImage, ai: GoogleGenAI): Promise<StoredImage> {
    if (image.entity && image.difficulty) {
        return image;
    }

    const prompt = `
        You are an expert pathologist's assistant. Your task is to analyze the metadata of a histology image and classify it.
        The image title is: "${image.title}"
        The image description is: "${image.description}"
        
        Here is a list of known entities: ${Object.keys(rules.entities).join(', ')}.
        Here are the possible difficulty levels: ${Object.keys(rules.difficultyLevels).join(', ')}.

        Based on the title and description, determine the single most likely entity and the most appropriate difficulty level.
        Respond with a single JSON object with no markdown formatting. The format should be: {"entity": "the_best_entity", "difficulty": "the_best_difficulty"}.
        If you cannot determine the entity, respond with {"entity": null, "difficulty": "intermediate"}.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        entity: { type: Type.STRING, nullable: true },
                        difficulty: { type: Type.STRING },
                    },
                    required: ["entity", "difficulty"],
                }
            }
        });
        const result = JSON.parse(response.text.trim());
        return {
            ...image,
            entity: result.entity || 'unknown',
            difficulty: result.difficulty || 'intermediate',
        };
    } catch (error) {
        console.warn(`AI metadata enrichment failed for image ${image.id}:`, error);
        // Fail gracefully, assign default values
        return { ...image, entity: 'unknown', difficulty: 'intermediate' };
    }
}

/**
 * Main function to generate and update case mappings.
 */
export async function generateCaseMappings() {
    console.log("Starting case mapping generation...");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // 1. Load data
    let casesStore = getCases();
    let caseStudiesStore = getCaseStudies();
    const allImages = [...getOfficialImages(), ...getCommunityImages()];

    // 2. Enrich images with metadata
    const enrichedImages = await Promise.all(
        allImages.map(img => enrichImageWithMetadata(img, ai))
    );

    // 3. Group images by potential cases (entity + difficulty)
    const imageGroups: Record<string, StoredImage[]> = {};
    for (const image of enrichedImages) {
        if (!image.entity || image.entity === 'unknown') continue;
        const groupKey = `${image.entity}_${image.difficulty}`;
        if (!imageGroups[groupKey]) {
            imageGroups[groupKey] = [];
        }
        imageGroups[groupKey].push(image);
    }

    // 4. Create or update cases
    let casesCreated = 0;
    let casesUpdated = 0;
    let caseCounter = Object.keys(casesStore.cases).length + 1;

    for (const [groupKey, images] of Object.entries(imageGroups)) {
        const [entity, difficulty] = groupKey.split('_') as [string, 'beginner' | 'intermediate' | 'advanced'];
        const existingCase = Object.values(casesStore.cases).find(c => c.entity === entity && c.difficulty === difficulty);

        if (existingCase) {
            // Update existing case
            existingCase.updatedAt = new Date().toISOString();
            casesStore.cases[existingCase.caseId] = existingCase;
            casesUpdated++;
        } else {
            // Create new case
            const caseId = `CASE${caseCounter.toString().padStart(3, '0')}`;
            // Fix: Explicitly type `entityData` to allow safe access to its optional properties.
            const entityData: Partial<CaseMetadataRules['entities'][string]> = rules.entities[entity] || {};
            const newCase: Case = {
                caseId,
                title: `${entity.charAt(0).toUpperCase() + entity.slice(1)} Case (${difficulty})`,
                entity,
                category: entityData.category || 'unknown',
                difficulty,
                caseType: 'classic',
                description: entityData.teachingPoint || `Case demonstrating ${entity} at a ${difficulty} level.`,
                caseContext: entityData.caseContext || `Histologic features of ${entity}.`,
                learningObjectives: [
                    `Recognize histologic features of ${entity}`,
                    `Differentiate ${entity} from other granulomatous diseases`
                ],
                tags: entityData.tags || [entity],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            casesStore.cases[caseId] = newCase;
            casesCreated++;
            caseCounter++;
        }
    }
    
    // 5. Generate Case Studies
    for (const caseData of Object.values(casesStore.cases)) {
        const caseImages = enrichedImages.filter(img => img.entity === caseData.entity && img.difficulty === caseData.difficulty);
        // Fix: Explicitly type `entityData` to allow safe access to its optional properties.
        const entityData: Partial<CaseMetadataRules['entities'][string]> = rules.entities[caseData.entity] || {};

        const caseStudy: CaseStudy = {
            ...caseData,
            images: caseImages.map((img, index) => ({
                imageId: `${caseData.caseId}_IMG${(index + 1).toString().padStart(3, '0')}`,
                path: img.src,
                stain: 'H&E', // Placeholder, could be inferred in the future
                caption: img.title,
                findings: entityData.cells || []
            })),
            discussion: `This case demonstrates ${caseData.entity}. ${caseData.caseContext}`,
            teachingPoints: [
                caseData.description,
                `Key features include: ${(entityData.cells || []).join(', ') || 'granulomatous inflammation'}`
            ],
            references: [
                "WHO Classification of Thoracic Tumours, 5th Edition",
                "Pathology of Granulomatous Diseases, Current Diagnostic Criteria"
            ]
        };
        caseStudiesStore.caseStudies[caseData.caseId] = caseStudy;
    }

    // 6. Save data
    saveCases(casesStore);
    saveCaseStudies(caseStudiesStore);
    
    console.log(`Case mapping complete. ${casesCreated} created, ${casesUpdated} updated. Total: ${Object.keys(casesStore.cases).length}`);
    return {
        casesCreated,
        casesUpdated,
        totalCases: Object.keys(casesStore.cases).length,
    };
}