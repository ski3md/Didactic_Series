import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassChartIcon, BullseyeIcon, BeakerIcon,
    ArrowRightToBracketIcon, ClipboardDocumentListIcon, ShieldExclamationIcon, EyeIcon
} from './icons.tsx';
import Alert from './ui/Alert.tsx';

// Map slide placeholder IDs to actual image URLs hosted on the CDN or reputable open sources.
// This map allows the lecture component to load real histology images instead of showing gray placeholders.
const lectureImageMap: Record<string, string> = {
    // Tuberculosis image illustrating well-formed granulomas with central caseous necrosis.
    lecture_tb_image:
        'https://storage.googleapis.com/granuloma-lecture-bucket/granulomas/tuberculosis/lungtuberculosisanapath02.jpg',
    // Histoplasmosis image showing intracellular yeasts within macrophages.
    lecture_histo_image:
        'https://storage.googleapis.com/granuloma-lecture-bucket/granulomas/histoplasmosis/Unclassified/histoplasmosis_histoplasmosis_06.jpg',
    // Blastomycosis image demonstrating broad-based budding yeast.
    lecture_blasto_image:
        'https://upload.wikimedia.org/wikipedia/commons/e/ee/Blastomyces_dermatitidis_GMS.jpeg',
    // Coccidioidomycosis image featuring large spherules with endospores.
    lecture_cocci_image:
        'https://storage.googleapis.com/granuloma-lecture-bucket/granulomas/coccidioidomycosis/Unclassified/coccidioidomycosis_coccidioidomycosis_05.jpg',
    // Cryptococcus image showing encapsulated yeasts highlighted by mucicarmine stain.
    lecture_crypto_image:
        'https://upload.wikimedia.org/wikipedia/commons/d/d9/Cryptococcosis_of_lung_in_patient_with_AIDS._Mucicarmine_stain_962_lores.jpg',
    // Sarcoidosis image with well-formed non-caseating granulomas.
    lecture_sarcoid_image:
        'https://storage.googleapis.com/granuloma-lecture-bucket/granulomas/sarcoidosis/Unclassified/sarcoidosis_sarcoidosis_60.jpg',
    // GPA image highlighting vasculitis with dirty necrosis.
    lecture_gpa_image:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Wegener%27s_granulomatosis_-b-_intermed_mag.jpg/1200px-Wegener%27s_granulomatosis_-b-_intermed_mag.jpg',
    // Hypersensitivity pneumonitis image with poorly formed peribronchiolar granulomas.
    lecture_hp_image:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Histology_of_chronic_hypersensitivity_pneumonitis.jpg/1200px-Histology_of_chronic_hypersensitivity_pneumonitis.jpg',
    // Aspiration pneumonia image showing foreign material with surrounding giant cells.
    lecture_aspiration_image:
        'https://upload.wikimedia.org/wikipedia/commons/c/c5/Aspiration_pneumonia_%282%29.jpg',
    // AFB stain highlighting slender red bacilli in tuberculosis.
    lecture_tb_afb_image:
        'https://upload.wikimedia.org/wikipedia/commons/7/71/Acid_fast_bacilli_of_Mycobacterium_tuberculosis.jpg',
    // Histoplasmosis with GMS-positive yeast forms.
    lecture_histoplasma_gms_image:
        'https://storage.googleapis.com/granuloma-lecture-bucket/granulomas/histoplasmosis/GMS/histoplasmosis_histoplasmosis_06.jpg',
    // Blastomycosis with broad-based budding demonstrated on PAS.
    lecture_blastomycosis_pas_image:
        'https://upload.wikimedia.org/wikipedia/commons/4/4e/Blastomycosis%2C_H%26E.jpg',
    // GPA case highlighting necrotizing vasculitis.
    lecture_gpa_vasculitis_image:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Wegener%27s_granulomatosis_-b-_intermed_mag.jpg/1200px-Wegener%27s_granulomatosis_-b-_intermed_mag.jpg',
    // Talc granulomatosis with birefringent material.
    lecture_talc_image:
        'https://upload.wikimedia.org/wikipedia/commons/1/1d/Pulmonary_talcosis_low_mag.jpg',
    // Coccidioidomycosis with large spherules.
    lecture_cocci_series_image:
        'https://storage.googleapis.com/granuloma-lecture-bucket/granulomas/coccidioidomycosis/Unclassified/coccidioidomycosis_coccidioidomycosis_95.jpg',
    // Cryptococcosis with mucicarmine-positive capsules.
    lecture_crypto_series_image:
        'https://upload.wikimedia.org/wikipedia/commons/d/d9/Cryptococcosis_of_lung_in_patient_with_AIDS._Mucicarmine_stain_962_lores.jpg',
};

// Secondary CDN images to use if primaries fail.
const lectureFallbackImageMap: Record<string, string> = {
    lecture_tb_image:
        'https://storage.googleapis.com/granuloma-lecture-bucket/granulomas/tuberculosis/Unclassified/tuberculosis_tuberculosis_11_2.jpg',
    lecture_tb_afb_image:
        'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6723956/bin/jcm-08-01180-g002.jpg',
    lecture_histo_image:
        'https://storage.googleapis.com/granuloma-lecture-bucket/granulomas/histoplasmosis/Unclassified/histoplasmosis_histoplasmosis_69.jpg',
    lecture_histoplasma_gms_image:
        'https://storage.googleapis.com/granuloma-lecture-bucket/granulomas/histoplasmosis/GMS/histoplasmosis_histoplasmosis_35.jpg',
    lecture_blasto_image:
        'https://storage.googleapis.com/granuloma-lecture-bucket/granulomas/blastomycosis/Unclassified/blastomycosis_blastomycosis_63.jpg',
    lecture_blastomycosis_pas_image:
        'https://storage.googleapis.com/granuloma-lecture-bucket/granulomas/blastomycosis/PAS/blastomycosis_blastomycosis_35.jpg',
    lecture_cocci_image:
        'https://storage.googleapis.com/granuloma-lecture-bucket/granulomas/coccidioidomycosis/Unclassified/coccidioidomycosis_coccidioidomycosis_56.jpg',
    lecture_cocci_series_image:
        'https://storage.googleapis.com/granuloma-lecture-bucket/granulomas/coccidioidomycosis/Unclassified/coccidioidomycosis_coccidioidomycosis_81.jpg',
    lecture_crypto_image:
        'https://storage.googleapis.com/granuloma-lecture-bucket/granulomas/cryptococcosis/Mucicarmine/cryptococcosis_cryptococcosis_05.jpg',
    lecture_crypto_series_image:
        'https://storage.googleapis.com/granuloma-lecture-bucket/granulomas/cryptococcosis/Mucicarmine/cryptococcosis_cryptococcosis_36.jpg',
    lecture_sarcoid_image:
        'https://storage.googleapis.com/granuloma-lecture-bucket/granulomas/sarcoidosis/Unclassified/sarcoidosis_sarcoidosis_48.jpg',
    lecture_gpa_image:
        'https://storage.googleapis.com/granuloma-lecture-bucket/granulomas/gpa/Unclassified/gpa_gpa_81.jpg',
    lecture_gpa_vasculitis_image:
        'https://storage.googleapis.com/granuloma-lecture-bucket/granulomas/gpa/Unclassified/gpa_gpa_56.jpg',
    lecture_hp_image:
        'https://storage.googleapis.com/granuloma-lecture-bucket/granulomas/hypersensitivity_pneumonitis/Unclassified/hypersensitivity_pneumonitis_hypersensitivity_pneumonitis_07.jpg',
    lecture_aspiration_image:
        'https://storage.googleapis.com/granuloma-lecture-bucket/granulomas/foreign_body/Unclassified/foreign_body_foreign_body_54.jpg',
    lecture_talc_image:
        'https://webpath.med.utah.edu/INFLHTML/INFL058.jpg',
};

const defaultLectureImage =
    'https://storage.googleapis.com/granuloma-lecture-bucket/granulomas/sarcoidosis/Unclassified/sarcoidosis_sarcoidosis_60.jpg';

const defaultFallbackImage =
    'https://storage.googleapis.com/granuloma-lecture-bucket/granulomas/sarcoidosis/Unclassified/sarcoidosis_sarcoidosis_48.jpg';

const visualFallbackSarcoidosis: StoredImage = {
    id: 'visual_fallback_sarcoid',
    src: 'https://upload.wikimedia.org/wikipedia/commons/7/76/Non-caseating_granuloma%2C_sarcoid_type%2C_01.jpg',
    gcsPath: 'external/sarcoid/wikipedia_non_caseating_granuloma.jpg',
    title: 'Sarcoidosis – Non-caseating Granuloma (Wikimedia Commons)',
    description: 'Representative histology of sarcoidosis with a tight, non-caseating granuloma.',
    uploader: 'wikimedia',
    timestamp: Date.now(),
    category: 'official',
    tags: ['sarcoidosis', 'histopathology', 'granuloma'],
    entity: 'sarcoidosis',
    difficulty: 'intermediate',
    cells: []
};

const visualFallbackHP: StoredImage = {
    id: 'visual_fallback_hp',
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Histology_of_chronic_hypersensitivity_pneumonitis.jpg/1200px-Histology_of_chronic_hypersensitivity_pneumonitis.jpg',
    gcsPath: 'external/hp/wikipedia_chronic_hp.jpg',
    title: 'Chronic Hypersensitivity Pneumonitis (Wikimedia Commons)',
    description: 'Giant cells and interstitial inflammation highlighting hypersensitivity pneumonitis.',
    uploader: 'wikimedia',
    timestamp: Date.now(),
    category: 'official',
    tags: ['hypersensitivity pneumonitis', 'granuloma', 'histopathology'],
    entity: 'hypersensitivity_pneumonitis',
    difficulty: 'intermediate',
    cells: []
};

const getImageSources = (placeholderId?: string) => {
    const primary =
        (placeholderId && lectureImageMap[placeholderId]) || defaultLectureImage;
    const fallback =
        (placeholderId && lectureFallbackImageMap[placeholderId]) || defaultFallbackImage;
    return { primary, fallback };
};

const attachErrorFallback = (fallback: string) => (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.currentTarget;
    if (img.dataset.fallbackApplied === 'true') {
        if (img.src !== defaultFallbackImage) {
            img.src = defaultFallbackImage;
        }
        return;
    }
    img.dataset.fallbackApplied = 'true';
    if (img.src !== fallback) {
        img.src = fallback;
    } else {
        img.src = defaultFallbackImage;
    }
};

interface LectureProps {
    onComplete: () => void;
}

const slideData = [
    { type: 'title', title: 'Granulomatous Lung Disease', subtitle: 'A Diagnostic Approach: The Lecture Component' },
    {
        type: 'bullets',
        title: 'Learning Objectives',
        items: [
            { icon: <MagnifyingGlassChartIcon className="h-6 w-6" />, text: '<strong>Analyze:</strong> Compare and contrast key histologic features, morphology, and location of common granulomatous diseases.' },
            { icon: <BullseyeIcon className="h-6 w-6" />, text: '<strong>Apply:</strong> Correctly identify the most likely etiology (Infectious, Autoimmune, Inhalational) from a given histologic pattern.' },
            { icon: <BeakerIcon className="h-6 w-6" />, text: '<strong>Evaluate:</strong> Justify the selection of the most appropriate ancillary test (e.g., special stains, serology) to confirm a diagnosis.' },
        ],
    },
    {
        type: 'bullets',
        title: 'The Diagnostic Approach',
        items: [
            { icon: <EyeIcon className="h-6 w-6" />, text: 'This lecture is a review on how to approach a diagnosis.' },
            { icon: <ClipboardDocumentListIcon className="h-6 w-6" />, text: 'Finding granulomas (small clusters of inflammatory cells) in the lung requires a careful <strong>process of elimination</strong>.' },
            { icon: <ShieldExclamationIcon className="h-6 w-6" />, text: 'We must always start by ruling out the most common (and treatable) causes.' },
        ],
    },
    {
        type: 'section_title',
        title: 'The Core Framework',
        text: 'The key is not just <strong>if</strong> there is a granuloma, but its <strong>quality</strong>, <strong>distribution</strong>, and <strong>clinical context</strong>.',
    },
    {
        type: 'table',
        title: 'Core Differential Diagnosis',
        headers: ['Feature', 'Sarcoidosis', 'Tuberculosis (TB)', 'Hypersensitivity (HP)', 'GPA (Vasculitis)'],
        rows: [
            ['<strong>Granuloma Type</strong>', 'Well-formed, non-caseating', 'Well-formed, caseating', 'Poorly-formed', 'Palisading'],
            ['<strong>Necrosis</strong>', 'Absent', 'Caseous ("clean")', 'Absent', 'Geographic ("dirty")'],
            ['<strong>Distribution</strong>', 'Lymphangitic ("Stacks")', 'Apical, cavitary', 'Peribronchiolar ("Hugs")', 'Random, nodular'],
            ['<strong>Key Test</strong>', 'Diagnosis of Exclusion', 'AFB Stain / PCR', 'Exposure History', 'c-ANCA Serology'],
        ],
    },
    {
        type: 'quiz',
        title: 'Knowledge Check: Core Concepts',
        question: 'A biopsy shows caseating granulomas. Based on the table, which two ancillary tests are non-negotiable to order first?',
        options: ['c-ANCA and Serum ACE', 'AFB Stain and GMS Stain', 'Exposure History and BeLPT', 'None, it must be sarcoidosis'],
        correctAnswer: 'AFB Stain and GMS Stain',
        feedback: 'Correct. Caseating necrosis has a broad differential, but infectious causes (TB and Fungi) must be ruled out first with special stains before considering non-infectious mimics.',
    },
    {
        type: 'section_title',
        title: 'Category 1: Infectious Causes',
        text: 'Most granulomas are caused by infection. A pathologist\'s first job is to rule these out, often using special stains (AFB and GMS) to look for organisms.',
    },
    {
        type: 'image_hotspot',
        title: 'Pattern 1: Infectious - Tuberculosis',
        text: '<h3>Histologic Clues:</h3><ul><li><strong>Organism:</strong> <i>Mycobacterium tuberculosis</i> (or Nontuberculous Mycobacteria - NTM).</li><li><strong>Granulomas:</strong> Well-formed, often confluent.</li><li><strong>Necrosis:</strong> Central <strong>caseous necrosis</strong> is the hallmark. It appears "clean" (acellular and eosinophilic).</li><li><strong>Stains:</strong> An Acid-Fast Bacilli (AFB) stain is mandatory to identify the organisms.</li></ul>',
        placeholderId: 'lecture_tb_image',
        quiz: {
            question: 'Click the feature in the text that best describes the pink, acellular material in the center of the image.',
            options: ['Well-formed granulomas', 'Caseous necrosis', 'Acid-Fast Bacilli'],
            correctAnswer: 'Caseous necrosis',
            feedback: "Excellent. That central, eosinophilic debris is the classic 'caseous' (cheese-like) necrosis of TB.",
        },
    },
    {
        type: 'image_hotspot',
        title: 'Infectious Mimic: Histoplasmosis',
        text: '<h3>Histologic Clues:</h3><ul><li><strong>Organism:</strong> <i>Histoplasma capsulatum</i> (often found in areas with bird or bat droppings).</li><li><strong>Mimicry:</strong> Also presents with caseating granulomas, perfectly mimicking TB on H&E.</li><li><strong>Organisms:</strong> The key is finding small (2-5 µm), intracellular yeasts within macrophages.</li><li><strong>Stains:</strong> A Gomori Methenamine-Silver (GMS) stain is required to visualize the fungi.</li></ul>',
        placeholderId: 'lecture_histo_image',
        quiz: {
            question: 'In this image of Histoplasmosis, what is the key diagnostic finding?',
            options: ['Broad-based budding', 'Intracellular yeasts', 'Spherules with endospores'],
            correctAnswer: 'Intracellular yeasts',
            feedback: 'Correct! The tiny dots within the macrophages are the small yeasts of <i>Histoplasma capsulatum</i>.',
        },
    },
    {
        type: 'three_column_image',
        title: 'Other Key Fungi',
        tiles: [
            { placeholderId: 'lecture_blasto_image', caption: '<strong>Blastomycosis:</strong> Large yeasts with broad-based budding.' },
            { placeholderId: 'lecture_cocci_image', caption: '<strong>Coccidioidomycosis:</strong> Large spherules with internal endospores.' },
            { placeholderId: 'lecture_crypto_image', caption: '<strong>Cryptococcus:</strong> Encapsulated yeasts, positive with Mucicarmine.' },
        ],
    },
    {
        type: 'section_title',
        title: 'Category 2: Major Non-Infectious Causes',
        text: 'If no infection is found, the diagnosis then shifts to non-infectious causes.',
    },
    {
        type: 'image_hotspot',
        title: 'Non-Infectious: Sarcoidosis',
        text: '<h3>Histologic Clues:</h3><ul><li><strong>Etiology:</strong> An inflammatory disease of unknown cause, classically affecting lungs and lymph nodes.</li><li><strong>Granulomas:</strong> <strong>Well-formed, non-caseating</strong> ("naked" granulomas) are the classic finding. They lack a "cheesy" center.</li><li><strong>Distribution:</strong> Typically lymphangitic (following the lymph channels).</li><li><strong>Diagnosis:</strong> This is a diagnosis of exclusion after infection has been ruled out.</li></ul>',
        placeholderId: 'lecture_sarcoid_image',
        quiz: {
            question: 'What is the key <em>negative</em> finding that defines these granulomas as "non-caseating"?',
            options: ['Absence of necrosis', 'Absence of giant cells', 'Absence of lymphocytes'],
            correctAnswer: 'Absence of necrosis',
            feedback: 'Correct. Sarcoid granulomas are "non-caseating," meaning they lack the central caseous necrosis seen in tuberculosis.',
        },
    },
    {
        type: 'image_hotspot',
        title: 'Non-Infectious: GPA (Vasculitis)',
        text: '<h3>Histologic Clues:</h3><ul><li><strong>Etiology:</strong> Granulomatosis with Polyangiitis (formerly Wegener&#39;s). A small-vessel vasculitis.</li><li><strong>Granulomas:</strong> Often "palisading" (histiocytes lined up) around areas of necrosis.</li><li><strong>Necrosis:</strong> Classic necrosis is <strong>geographic</strong> and "dirty" (contains neutrophils and cellular debris).</li><li><strong>Key Finding:</strong> Look for an associated <strong>vasculitis</strong> (inflammation of blood vessels).</li><li><strong>Key Test:</strong> c-ANCA serology is often positive.</li></ul>',
        placeholderId: 'lecture_gpa_image',
    },
    {
        type: 'image_hotspot',
        title: 'Non-Infectious: Hypersensitivity Pneumonitis (HP)',
        text: '<h3>Histologic Clues:</h3><ul><li><strong>Etiology:</strong> An allergic reaction to an inhaled organic substance (e.g., "Farmer&apos;s Lung" from moldy hay, "Bird Fancier&apos;s Lung" from bird proteins).</li><li><strong>Granulomas:</strong> <strong>Poorly-formed</strong>, loose clusters of histiocytes.</li><li><strong>Distribution:</strong> Classically <strong>peribronchiolar</strong> (centered on the small airways).</li><li><strong>Key Finding:</strong> Often accompanied by a prominent lymphocytic interstitial pneumonia and organizing pneumonia.</li></ul>',
        placeholderId: 'lecture_hp_image',
    },
    {
        type: 'bullets',
        title: 'Related Condition: Hot Tub Lung',
        items: [
            { icon: <BeakerIcon className="h-6 w-6" />, text: 'This is considered a specific type of hypersensitivity pneumonitis.' },
            { icon: <ShieldExclamationIcon className="h-6 w-6" />, text: '<strong>It is not an infection.</strong> It is an <i>immune reaction</i> to inhaling aerosolized nontuberculous mycobacteria (<i>Mycobacterium avium</i> complex).' },
            { icon: <MagnifyingGlassChartIcon className="h-6 w-6" />, text: 'Histology is identical to HP: poorly-formed, peribronchiolar granulomas.' },
        ],
    },
    {
        type: 'image_hotspot',
        title: 'Non-Infectious: Aspiration Pneumonia',
        text: '<h3>Histologic Clues:</h3><ul><li><strong>Etiology:</strong> Inhalation of foreign material into the lungs (e.g., food particles, vegetable matter).</li><li><strong>Granulomas:</strong> A <strong>foreign-body giant cell reaction</strong>. Histiocytes and giant cells surround and "wall off" the foreign material.</li><li><strong>Key Finding:</strong> You must identify the foreign material itself. Vegetable matter (as seen in the image) shows rigid, clear cell walls.</li></ul>',
        placeholderId: 'lecture_aspiration_image',
    },
    {
        type: 'image_hotspot',
        title: 'Related Condition: Talc Granulomatosis',
        text: '<h3>Histologic Clues:</h3><ul><li><strong>Etiology:</strong> Intravenous injection of crushed oral medications allows talc excipients to embolize pulmonary arterioles.</li><li><strong>Granulomas:</strong> Foreign-body giant cells surround refractile talc plates.</li><li><strong>Polarized Light:</strong> Birefringent rectangular crystals clinch the diagnosis.</li></ul>',
        placeholderId: 'lecture_talc_image'
    },
    {
        type: 'section_title',
        title: 'Interactive Case Lab',
        text: 'Apply the framework to case-based challenges with escalating difficulty.',
    },
    {
        type: 'case_series',
        title: 'Case Challenge 1: Necrotizing Granuloma in an Immunocompromised Host',
        vignette: 'A 48-year-old kidney transplant recipient on tacrolimus presents with fevers, weight loss, and a cavitary right upper lobe lesion. A wedge biopsy reveals necrotizing granulomas with palisading histiocytes.',
        pearls: [
            '<strong>Clinical Clue:</strong> Immunosuppression raises the stakes for rapid organism identification.',
            '<strong>Histologic Focus:</strong> Clean, eosinophilic necrosis rimmed by palisaded histiocytes prioritizes mycobacterial infection.',
            '<strong>Next Step:</strong> Confirm an infectious etiology before escalating immunosuppression.'
        ],
        placeholderId: 'lecture_tb_afb_image',
        imageCaption: 'AFB stain demonstrating slender red bacilli hugging the necrotic edge.',
        questions: [
            {
                question: 'Which ancillary study most strongly supports reactivation tuberculosis in this scenario?',
                options: [
                    'Negative PAS stain throughout the granulomas',
                    'Positive Ziehl-Neelsen stain highlighting organisms at the necrotic rim',
                    'Diffuse CD1a positivity within interstitial histiocytes',
                    'Positive Prussian blue staining accentuating hemosiderin'
                ],
                correctAnswer: 'Positive Ziehl-Neelsen stain highlighting organisms at the necrotic rim',
                feedback: 'Acid-fast bacilli located at the interface of necrosis and viable tissue are definitive for mycobacterial infection. The other findings suggest alternative processes (Langerhans histiocytosis, siderosis, or non-specific changes).'
            },
            {
                question: 'Which histologic pattern would point away from tuberculosis and toward an ANCA-associated vasculitis?',
                options: [
                    'Caseating necrosis bordered by epithelioid histiocytes and scant neutrophils',
                    'Dirty geographic necrosis with basophilic debris and angiocentric inflammation',
                    'Loose peribronchiolar granulomas rich in plasma cells and lymphocytes',
                    'Fibrocaseous nodules with abundant Langhans giant cells'
                ],
                correctAnswer: 'Dirty geographic necrosis with basophilic debris and angiocentric inflammation',
                feedback: 'Dirty geographic necrosis accompanied by vasculitis is classic for GPA. The other options fit infectious granulomas more closely.'
            }
        ]
    },
    {
        type: 'case_series',
        title: 'Case Challenge 2: Disseminated Fungal Mimic',
        vignette: 'A 32-year-old spelunker from Missouri presents with fevers, hepatosplenomegaly, and diffuse pulmonary nodules. BAL reveals macrophages packed with tiny round organisms.',
        pearls: [
            '<strong>Exposure:</strong> Cave exploration or bat guano should raise suspicion for Histoplasma capsulatum.',
            '<strong>Size Matters:</strong> Yeasts measuring 2–4 µm in macrophages favor Histoplasma over Blastomyces.',
            '<strong>Systemic Clue:</strong> Dissemination often brings bone marrow suppression and hepatosplenomegaly.'
        ],
        placeholderId: 'lecture_histoplasma_gms_image',
        imageCaption: 'GMS stain highlighting numerous intracellular yeasts within alveolar macrophages.',
        questions: [
            {
                question: 'Which immunologic parameter most often drops in disseminated histoplasmosis and helps monitor therapy?',
                options: [
                    'Serum ACE levels',
                    'Urine Histoplasma antigen titer',
                    'c-ANCA (PR3) levels',
                    'Anti-centromere antibodies'
                ],
                correctAnswer: 'Urine Histoplasma antigen titer',
                feedback: 'Antigen detection in urine (and serum) tracks fungal burden and response to therapy in disseminated histoplasmosis.'
            },
            {
                question: 'Which histologic clue would push you toward Blastomyces rather than Histoplasma?',
                options: [
                    'Yeasts budding with a narrow base within macrophages',
                    'Broad-based budding yeasts with thick refractile walls',
                    'Granulomas lacking necrosis and a lymphangitic distribution',
                    'Multinucleated giant cells encasing vegetable matter'
                ],
                correctAnswer: 'Broad-based budding yeasts with thick refractile walls',
                feedback: 'Broad-based buds are the signature of Blastomyces. Narrow based budding fits Histoplasma, while the other answers reference different processes.'
            }
        ]
    },
    {
        type: 'case_series',
        title: 'Case Challenge 3: Cavitary Nodule in a Former Smoker',
        vignette: 'A 61-year-old former smoker presents with hemoptysis and chronic sinusitis. Imaging shows bilateral cavitary nodules and segmental renal infarcts. Biopsy reveals granulomas with central basophilic debris.',
        pearls: [
            '<strong>Systemic Context:</strong> ENT involvement plus renal lesions suggest a vasculitic process.',
            '<strong>Microscopic Tell:</strong> “Dirty” necrosis filled with neutrophils argues for GPA over infection.',
            '<strong>Serology:</strong> Correlate with c-ANCA (PR3) before making long-term treatment decisions.'
        ],
        placeholderId: 'lecture_gpa_vasculitis_image',
        imageCaption: 'H&E section showing necrotizing vasculitis with palisading histiocytes.',
        questions: [
            {
                question: 'Which clinicopathologic feature most reliably distinguishes GPA from chronic hypersensitivity pneumonitis in this setting?',
                options: [
                    'Peribronchiolar accentuation of granulomas',
                    'Geographic necrosis with neutrophilic karyorrhexis and vasculitis',
                    'Increased plasma cells within the interstitium',
                    'Non-necrotizing granulomas with asteroid bodies'
                ],
                correctAnswer: 'Geographic necrosis with neutrophilic karyorrhexis and vasculitis',
                feedback: 'Dirty, geographic necrosis plus vasculitis is characteristic of GPA. The other findings favor hypersensitivity pneumonitis or sarcoidosis.'
            },
            {
                question: 'Which immediate management step best protects organ function in GPA once infection is excluded?',
                options: [
                    'High-dose systemic glucocorticoids with a rituximab induction regimen',
                    'Empiric amphotericin B followed by itraconazole suppressive therapy',
                    'Nebulized pentamidine prophylaxis',
                    'Observation with repeat imaging in 6 weeks'
                ],
                correctAnswer: 'High-dose systemic glucocorticoids with a rituximab induction regimen',
                feedback: 'Rapid immunosuppression with steroids plus rituximab (or cyclophosphamide) is standard once infection has been excluded.'
            }
        ]
    },
    {
        type: 'section_title',
        title: 'Lightning Round: Board-Style Stumpers',
        text: 'Answer each question within 60 seconds. Pattern recognition is your superpower.',
    },
    {
        type: 'quiz_stack',
        title: 'Lightning Round',
        intro: 'For every prompt decide which clue best fits. Challenge yourself to justify each distractor before moving on.',
        questions: [
            {
                question: 'Asteroid bodies and laminated Schaumann bodies are most strongly associated with which granulomatous disorder?',
                options: [
                    'Sarcoidosis',
                    'Hypersensitivity pneumonitis',
                    'GPA',
                    'Hot tub lung'
                ],
                correctAnswer: 'Sarcoidosis',
                feedback: 'These inclusions are classic but not pathognomonic for sarcoidosis. Hypersensitivity pneumonitis lacks these inclusions, GPA is necrotizing, and hot tub lung is an HP variant.'
            },
            {
                question: 'Which exposure history best aligns with talc granulomatosis?',
                options: [
                    'Long-term intravenous injection of crushed analgesic tablets',
                    'Handling of bird droppings in a pigeon coop',
                    'Occupational silica exposure in a sandblasting facility',
                    'Travel to the desert Southwest with dust storms'
                ],
                correctAnswer: 'Long-term intravenous injection of crushed analgesic tablets',
                feedback: 'Intravascular talc from injected tablets embolizes to pulmonary arterioles, provoking a foreign-body granulomatous response.'
            },
            {
                question: 'Large spherules with endospores on H&E that measure up to 80 µm are typical of which organism?',
                options: [
                    'Histoplasma capsulatum',
                    'Blastomyces dermatitidis',
                    'Coccidioides immitis/posadasii',
                    'Cryptococcus neoformans'
                ],
                correctAnswer: 'Coccidioides immitis/posadasii',
                feedback: 'Coccidioides forms large spherules with numerous endospores. Histoplasma is tiny, Blastomyces shows broad-based budding, and Cryptococcus has narrow-based budding with mucinous capsule.'
            },
            {
                question: 'Which intervention is most appropriate first-line management for hot tub lung?',
                options: [
                    'Remove access to the offending spa environment and improve ventilation',
                    'Start dual antituberculous therapy immediately',
                    'Initiate rituximab and prednisone induction',
                    'Administer lifelong azole prophylaxis'
                ],
                correctAnswer: 'Remove access to the offending spa environment and improve ventilation',
                feedback: 'Hot tub lung is an HP variant from inhaled nontuberculous mycobacteria aerosols. Exposure cessation is the critical first step.'
            },
            {
                question: 'Necrotizing sarcoid granulomatosis is best described as:',
                options: [
                    'A sarcoidosis variant with vascular invasion mimicking GPA but lacking ANCAs',
                    'A hypersensitivity pneumonitis subset driven by mold hyphae',
                    'another term for necrotizing granulomatous inflammation due to TB',
                    'A histologic synonym for talc granulomatosis'
                ],
                correctAnswer: 'A sarcoidosis variant with vascular invasion mimicking GPA but lacking ANCAs',
                feedback: 'Necrotizing sarcoid granulomatosis shows sarcoid-like granulomas with vasculitis but typically lacks ANCA seropositivity, making clinicopathologic correlation vital.'
            }
        ],
        footnote: 'Tip: Run the trio—quality, necrosis, distribution—before committing to a diagnosis.'
    },
    {
        type: 'section_title',
        title: 'Wrap-Up and Reflection',
        text: 'Consolidate diagnostic heuristics and plan next steps for deliberate practice.',
    },
    {
        type: 'reference',
        title: 'Reference Spotlight',
        citationTitle: 'Granulomatous Lung Disease: An Approach to the Differential Diagnosis',
        authors: 'Mukhopadhyay S, Gal AA',
        journal: 'Arch Pathol Lab Med. 2010;134(5):667-690.',
        doi: '10.5858/134.5.667',
        summary: '<p>This review article outlines a practical diagnostic framework for surgical pathologists evaluating pulmonary granulomas. It underscores that infectious etiologies—especially mycobacteria and dimorphic fungi—dominate the differential, and accurate diagnosis hinges on recognizing the tissue reaction pattern, correlating with clinical exposures, and deploying the appropriate special stains.</p><p>The authors also benchmark core noninfectious mimics—sarcoidosis, granulomatosis with polyangiitis (Wegener), hypersensitivity pneumonitis (including hot tub lung), aspiration pneumonia, and talc granulomatosis—highlighting distinguishing histologic clues for each.</p>',
        directLink: 'https://meridian.allenpress.com/aplm/article/134/5/667/461054/Granulomatous-Lung-Disease-An-Approach-to-the',
        takeaways: [
            'Most pulmonary granulomas are infectious—think mycobacteria first, dimorphic fungi second.',
            'Pattern analysis (quality of necrosis, granuloma architecture, distribution) guides ancillary testing.',
            'Noninfectious entities (sarcoid, GPA, HP, hot tub lung, aspiration, talc) demand clinicopathologic correlation.'
        ]
    },
    {
        type: 'accordion',
        title: 'Decision Pitfalls & Memory Hooks',
        items: [
            {
                heading: 'When necrosis misleads',
                content: '<p><strong>Clean</strong> necrosis favors infection, whereas <strong>dirty</strong> necrosis with vasculitis screams GPA. Always ask: are neutrophils littering the necrotic bed?</p>'
            },
            {
                heading: 'Distribution saves the day',
                content: '<p>Lymphangitic tracking? Think sarcoidosis. Peribronchiolar accentuation with lymphoplasmacytic cuffs? Hypersensitivity pneumonitis jumps up the list.</p>'
            },
            {
                heading: 'Stain smarter, not harder',
                content: '<p>Order stains in pairs: AFB + GMS for necrotizing granulomas, mucicarmine when capsules are suspected, and use PAS when you need to unmask polysaccharide-rich organisms.</p>'
            },
            {
                heading: 'Clinical cliff notes',
                content: '<p>Always integrate exposures: spas (hot tub lung), caves (Histoplasma), desert dust (Coccidioides), IV pills (talc). Exposure history often breaks the tie between look-alike slides.</p>'
            }
        ]
    },
    {
        type: 'launch',
        title: 'Next Steps',
        text: 'You have reviewed the core lecture content.',
        buttonText: 'Launch Interactive Module',
    },
];

type DeviceType = 'mobile' | 'tablet' | 'desktop';

type LayoutTokens = {
    frame: {
        containerWidth: string;
        outerPadding: string;
        verticalPadding: string;
        radius: string;
        innerPadding: string;
        contentWidth: string;
    };
    typeScale: {
        heading: string;
        subtitle: string;
        sectionHeading: string;
        body: string;
        smallBody: string;
    };
    bullet: {
        grid: string;
        gap: string;
        itemPadding: string;
    };
    table: {
        textSize: string;
    };
    quiz: {
        cardPadding: string;
        optionPadding: string;
        optionText: string;
    };
    hotspot: {
        layout: string;
        textStackSpacing: string;
        figureClass: string;
        imageClass: string;
    };
    galleryImageClass: string;
    caseDeck: {
        layout: string;
        infoPadding: string;
        questionGrid: string;
        imageClass: string;
    };
    lightning: {
        grid: string;
        cardPadding: string;
    };
    reference: {
        cardPadding: string;
    };
    accordion: {
        spacing: string;
    };
};

const useDeviceType = (): DeviceType => {
    const getType = (width: number): DeviceType => {
        if (width < 640) return 'mobile';
        if (width < 1024) return 'tablet';
        return 'desktop';
    };

    const [device, setDevice] = useState<DeviceType>(() => {
        if (typeof window === 'undefined') return 'desktop';
        return getType(window.innerWidth);
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        let frame: number | null = null;
        const handleResize = () => {
            if (frame) cancelAnimationFrame(frame);
            frame = window.requestAnimationFrame(() => {
                const next = getType(window.innerWidth);
                setDevice(prev => (prev === next ? prev : next));
            });
        };

        window.addEventListener('resize', handleResize, { passive: true });
        return () => {
            if (frame) cancelAnimationFrame(frame);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return device;
};

const layoutByDevice: Record<DeviceType, LayoutTokens> = {
    mobile: {
        frame: {
            containerWidth: 'max-w-screen-md',
            outerPadding: 'px-4',
            verticalPadding: 'py-8',
            radius: 'rounded-2xl',
            innerPadding: 'p-5',
            contentWidth: 'max-w-3xl',
        },
        typeScale: {
            heading: 'text-3xl',
            subtitle: 'text-lg',
            sectionHeading: 'text-3xl',
            body: 'text-base leading-relaxed',
            smallBody: 'text-sm leading-relaxed',
        },
        bullet: {
            grid: 'grid-cols-1',
            gap: 'gap-4',
            itemPadding: 'p-4',
        },
        table: {
            textSize: 'text-sm',
        },
        quiz: {
            cardPadding: 'p-4',
            optionPadding: 'px-3 py-3',
            optionText: 'text-sm',
        },
        hotspot: {
            layout: 'grid grid-cols-1 gap-6 items-start',
            textStackSpacing: 'space-y-4',
            figureClass: 'w-full rounded-xl overflow-hidden border border-slate-200 shadow-lg bg-white',
            imageClass: 'w-full h-auto max-h-80 object-cover',
        },
        galleryImageClass: 'w-full max-h-60 object-contain rounded-xl',
        caseDeck: {
            layout: 'grid grid-cols-1 gap-6 items-start',
            infoPadding: 'p-4',
            questionGrid: 'grid grid-cols-1 gap-4',
            imageClass: 'w-full max-h-80 object-contain rounded-xl',
        },
        lightning: {
            grid: 'grid grid-cols-1 gap-5',
            cardPadding: 'p-4',
        },
        reference: {
            cardPadding: 'p-5',
        },
        accordion: {
            spacing: 'space-y-4',
        },
    },
    tablet: {
        frame: {
            containerWidth: 'max-w-screen-lg',
            outerPadding: 'px-6',
            verticalPadding: 'py-10',
            radius: 'rounded-[2rem]',
            innerPadding: 'p-8',
            contentWidth: 'max-w-4xl',
        },
        typeScale: {
            heading: 'text-4xl',
            subtitle: 'text-xl',
            sectionHeading: 'text-4xl',
            body: 'text-lg leading-relaxed',
            smallBody: 'text-base leading-relaxed',
        },
        bullet: {
            grid: 'grid-cols-1 md:grid-cols-2',
            gap: 'gap-6',
            itemPadding: 'p-6',
        },
        table: {
            textSize: 'text-base',
        },
        quiz: {
            cardPadding: 'p-5',
            optionPadding: 'px-4 py-3',
            optionText: 'text-base',
        },
        hotspot: {
            layout: 'grid grid-cols-1 lg:grid-cols-2 gap-8 items-start',
            textStackSpacing: 'space-y-5',
            figureClass: 'w-full rounded-2xl overflow-hidden border border-slate-200 shadow-lg bg-white',
            imageClass: 'w-full h-auto max-h-[24rem] object-cover',
        },
        galleryImageClass: 'w-full max-h-[18rem] object-contain rounded-2xl',
        caseDeck: {
            layout: 'grid grid-cols-1 xl:grid-cols-12 gap-8 items-start',
            infoPadding: 'p-5',
            questionGrid: 'grid grid-cols-1 md:grid-cols-2 gap-5',
            imageClass: 'w-full max-h-[22rem] object-contain rounded-2xl',
        },
        lightning: {
            grid: 'grid grid-cols-1 md:grid-cols-2 gap-6',
            cardPadding: 'p-5',
        },
        reference: {
            cardPadding: 'p-6',
        },
        accordion: {
            spacing: 'space-y-4',
        },
    },
    desktop: {
        frame: {
            containerWidth: 'max-w-screen-xl',
            outerPadding: 'px-10',
            verticalPadding: 'py-12',
            radius: 'rounded-[2.5rem]',
            innerPadding: 'p-10',
            contentWidth: 'max-w-5xl',
        },
        typeScale: {
            heading: 'text-5xl',
            subtitle: 'text-2xl',
            sectionHeading: 'text-4xl',
            body: 'text-lg leading-relaxed',
            smallBody: 'text-base leading-relaxed',
        },
        bullet: {
            grid: 'grid-cols-1 md:grid-cols-2',
            gap: 'gap-8',
            itemPadding: 'p-7',
        },
        table: {
            textSize: 'text-lg',
        },
        quiz: {
            cardPadding: 'p-6',
            optionPadding: 'px-5 py-3',
            optionText: 'text-base',
        },
        hotspot: {
            layout: 'grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-12 items-start',
            textStackSpacing: 'space-y-6',
            figureClass: 'w-full rounded-3xl overflow-hidden border border-slate-200 shadow-xl bg-white',
            imageClass: 'w-full h-auto max-h-[28rem] object-cover',
        },
        galleryImageClass: 'w-full max-h-[20rem] object-contain rounded-3xl',
        caseDeck: {
            layout: 'grid grid-cols-1 xl:grid-cols-12 gap-10 items-start',
            infoPadding: 'p-6',
            questionGrid: 'grid grid-cols-1 md:grid-cols-2 gap-6',
            imageClass: 'w-full max-h-[24rem] object-contain rounded-3xl',
        },
        lightning: {
            grid: 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6',
            cardPadding: 'p-6',
        },
        reference: {
            cardPadding: 'p-7',
        },
        accordion: {
            spacing: 'space-y-5',
        },
    },
};

const QuizComponent: React.FC<{
  question: string;
  options: string[];
  correctAnswer: string;
  feedback: string;
  layout: LayoutTokens;
}> = ({ question, options, correctAnswer, feedback, layout }) => {
    const [answer, setAnswer] = useState<string | null>(null);

    return (
        <div className={`bg-gradient-to-br from-slate-50 via-white to-slate-50 rounded-2xl border border-slate-200/80 shadow-md shadow-slate-900/5 space-y-4 text-left ${layout.quiz.cardPadding}`} role="radiogroup" aria-label={question}>
            <p className={`font-semibold text-slate-900 ${layout.typeScale.body}`}>{question}</p>
            <div className="flex flex-col gap-2 md:grid md:grid-cols-2 md:gap-3 xl:gap-4">
                {options.map(option => {
                    const isAnswered = answer !== null;
                    const isSelected = answer === option;
                    const isCorrect = option === correctAnswer;

                    let optionClass = 'bg-white border-slate-300 hover:bg-slate-50';
                    if (isAnswered) {
                        if (isCorrect) optionClass = 'bg-teal-50 border-teal-500 text-teal-900';
                        else if (isSelected) optionClass = 'bg-rose-50 border-rose-500 text-rose-900';
                        else optionClass = 'bg-slate-50 border-slate-300 text-slate-600 opacity-70';
                    }
                    
                    return (
                        <button
                            key={option}
                            onClick={() => setAnswer(option)}
                            disabled={isAnswered}
                            className={`w-full text-left border rounded-xl transition-all font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 ${layout.quiz.optionPadding} ${layout.quiz.optionText} ${optionClass}`}
                            role="radio"
                            aria-checked={isSelected}
                        >
                            {option}
                        </button>
                    );
                })}
            </div>
            {answer && <div className="pt-1"><Alert type={answer === correctAnswer ? 'success' : 'error'}>{feedback}</Alert></div>}
        </div>
    );
};

type CaseQuestion = {
    question: string;
    options: string[];
    correctAnswer: string;
    feedback: string;
};

const CaseChallenge: React.FC<{
    title: string;
    vignette: string;
    pearls: string[];
    placeholderId?: string;
    imageCaption?: string;
    questions: CaseQuestion[];
    layout: LayoutTokens;
}> = ({ title, vignette, pearls, placeholderId, imageCaption, questions, layout }) => {
    const { primary, fallback } = getImageSources(placeholderId);
    const canShowImage = Boolean(placeholderId);

    return (
        <div className="w-full text-left space-y-8">
            <div className="text-center space-y-3">
                <h2 className={`font-roboto-slab font-bold text-slate-900 tracking-tight ${layout.typeScale.sectionHeading}`}>
                    {title}
                </h2>
                <p className={`text-slate-600 max-w-4xl mx-auto ${layout.typeScale.body}`}>
                    {vignette}
                </p>
            </div>
            <div className={layout.caseDeck.layout}>
                <div className={`bg-white/90 border border-slate-200 rounded-3xl shadow-lg shadow-slate-900/10 space-y-4 ${layout.caseDeck.infoPadding} xl:col-span-5`}>
                    <h3 className="font-semibold text-slate-900 uppercase tracking-[0.18em] text-xs md:text-sm">
                        Diagnostic Pearls
                    </h3>
                    <ul className={`list-disc list-inside space-y-2.5 text-slate-700 ${layout.typeScale.smallBody}`}>
                        {pearls.map((pearl, idx) => (
                            <li key={idx} dangerouslySetInnerHTML={{ __html: pearl }}></li>
                        ))}
                    </ul>
                </div>
                {canShowImage && (
                    <figure className="bg-white/90 border border-slate-200 shadow-xl shadow-slate-900/10 overflow-hidden w-full rounded-3xl xl:col-span-7">
                        <img
                            src={primary}
                            alt={title}
                            className={layout.caseDeck.imageClass}
                            loading="lazy"
                            data-fallback-applied="false"
                            onError={attachErrorFallback(fallback)}
                            referrerPolicy="no-referrer"
                            crossOrigin="anonymous"
                        />
                        {imageCaption && (
                            <figcaption className="p-4 text-xs md:text-sm text-slate-600 bg-slate-100/80 border-t border-slate-200">
                                {imageCaption}
                            </figcaption>
                        )}
                    </figure>
                )}
            </div>
            <div className={layout.caseDeck.questionGrid}>
                {questions.map((question, idx) => (
                    <div key={`${title}-q${idx}`} className={`bg-white/95 border border-slate-200 rounded-3xl shadow-md shadow-slate-900/5 ${layout.lightning.cardPadding}`}>
                        <QuizComponent layout={layout} {...question} />
                    </div>
                ))}
            </div>
        </div>
    );
};

const LightningRound: React.FC<{
    title: string;
    intro: string;
    questions: CaseQuestion[];
    footnote?: string;
    layout: LayoutTokens;
}> = ({ title, intro, questions, footnote, layout }) => (
    <div className="w-full text-left space-y-6">
        <div className="text-center space-y-3">
            <h2 className={`font-roboto-slab font-bold text-slate-900 tracking-tight ${layout.typeScale.sectionHeading}`}>{title}</h2>
            <p className={`text-slate-600 ${layout.typeScale.body}`}>{intro}</p>
        </div>
        <div className={layout.lightning.grid}>
            {questions.map((question, idx) => (
                <div key={`lightning-${idx}`} className={`bg-white/95 border border-slate-200 rounded-3xl shadow-lg shadow-slate-900/8 flex flex-col h-full space-y-4 ${layout.lightning.cardPadding}`}>
                    <div className="text-[0.7rem] uppercase tracking-[0.28em] text-sky-600 font-semibold">
                        Question {idx + 1}
                    </div>
                    <QuizComponent layout={layout} {...question} />
                </div>
            ))}
        </div>
        {footnote && (
            <p className="text-sm text-slate-500 italic text-center">{footnote}</p>
        )}
    </div>
);

const InteractiveAccordion: React.FC<{
    items: { heading: string; content: string }[];
    layout: LayoutTokens;
}> = ({ items, layout }) => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <div className={layout.accordion.spacing}>
            {items.map((item, idx) => {
                const isOpen = openIndex === idx;
                return (
                    <div key={item.heading} className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm shadow-slate-900/5 bg-white/95">
                        <button
                            onClick={() => setOpenIndex(isOpen ? null : idx)}
                            className="w-full flex items-center justify-between px-5 py-4 bg-white/95 hover:bg-slate-50 text-left text-slate-900 font-semibold transition-colors text-[clamp(1rem,0.95rem+0.2vw,1.25rem)]"
                            aria-expanded={isOpen}
                        >
                            <span>{item.heading}</span>
                            <span className="text-slate-500 text-sm">{isOpen ? 'Hide' : 'Reveal'}</span>
                        </button>
                        {isOpen && (
                            <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 text-[clamp(0.95rem,0.9rem+0.15vw,1.15rem)] leading-relaxed text-slate-700" dangerouslySetInnerHTML={{ __html: item.content }}></div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

const SlideContent: React.FC<{ slide: (typeof slideData)[0]; onComplete: () => void; layout: LayoutTokens; }> = ({ slide, onComplete, layout }) => {
    const renderLayout = (slide: any) => {
      const content = (
        <div
          className={`font-lato text-slate-800 prose prose-slate max-w-none ${layout.typeScale.body}`}
          dangerouslySetInnerHTML={{ __html: slide.text }}
        ></div>
      );
      const quiz = slide.quiz ? <QuizComponent layout={layout} {...slide.quiz} /> : null;
      let image: React.ReactNode = null;

      if (slide.placeholderId) {
        const { primary, fallback } = getImageSources(slide.placeholderId);
        image = (
          <figure className={layout.hotspot.figureClass}>
            <img
              src={primary}
              alt={slide.title}
              className={layout.hotspot.imageClass}
              data-fallback-applied="false"
              onError={attachErrorFallback(fallback)}
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
            />
          </figure>
        );
      }
  
      switch (slide.type) {
        case 'image_hotspot':
          return (
            <div className={layout.hotspot.layout}>
              <div className={layout.hotspot.textStackSpacing}>
                {content}
                {quiz}
              </div>
              {image}
            </div>
          );
        default:
          return null;
      }
    };
  
    switch(slide.type) {
        case 'title': return (
            <div className="text-center space-y-4">
                <h1 className={`font-roboto-slab font-bold tracking-tight text-slate-900 ${layout.typeScale.heading}`}>
                    {slide.title}
                </h1>
                <p className={`font-lato text-slate-700/90 max-w-3xl mx-auto ${layout.typeScale.subtitle}`}>
                    {slide.subtitle}
                </p>
            </div>
        );
        case 'bullets': return (
            <div className="w-full text-left space-y-6">
                <h2 className={`font-roboto-slab font-bold text-slate-900 tracking-tight ${layout.typeScale.sectionHeading}`}>
                    {slide.title}
                </h2>
                <ul className={`grid ${layout.bullet.grid} ${layout.bullet.gap}`}>
                    {slide.items.map((item, i) => (
                        <li
                            key={i}
                            className={`flex items-start gap-4 rounded-2xl bg-slate-50/60 border border-slate-200 shadow-sm shadow-slate-900/5 ${layout.bullet.itemPadding}`}
                        >
                            <span className="text-sky-600 flex-shrink-0 mt-1">
                                {item.icon}
                            </span>
                            <span
                                className={`font-lato text-slate-800 ${layout.typeScale.body}`}
                                dangerouslySetInnerHTML={{ __html: item.text }}
                            />
                        </li>
                    ))}
                </ul>
            </div>
        );
        case 'section_title': return (
            <div className="text-center space-y-5">
                <div className="w-24 h-1 bg-gradient-to-r from-sky-400 via-sky-500 to-sky-400 mx-auto rounded-full"></div>
                <h2 className={`font-roboto-slab font-bold text-sky-800 tracking-tight ${layout.typeScale.sectionHeading}`}>
                    {slide.title}
                </h2>
                <p
                    className={`font-lato text-slate-700/90 italic max-w-4xl mx-auto ${layout.typeScale.body}`}
                    dangerouslySetInnerHTML={{ __html: slide.text }}
                ></p>
            </div>
        );
        case 'table': return (
            <div className="w-full text-left space-y-6">
                <h2 className={`font-roboto-slab font-bold text-slate-900 tracking-tight ${layout.typeScale.sectionHeading}`}>
                    {slide.title}
                </h2>
                <div className="overflow-x-auto rounded-3xl border border-slate-200 shadow-inner shadow-slate-900/5">
                    <table className={`w-full text-left border-collapse font-lato ${layout.table.textSize}`}>
                        <thead>
                            <tr className="bg-gradient-to-r from-sky-700 to-sky-600 text-white">
                                {slide.headers.map((header: string, idx: number) => (
                                    <th key={idx} className="px-4 py-3 md:px-5 md:py-4 text-left uppercase tracking-wide text-[0.75rem] md:text-xs">
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {slide.rows.map((row, i) => (
                                <tr key={i} className="border-b border-slate-200/80 odd:bg-white even:bg-slate-50/70">
                                    {row.map((cell, j) => (
                                        <td
                                            key={j}
                                            className="px-4 py-3 md:px-5 md:py-4 text-slate-800 align-top"
                                            dangerouslySetInnerHTML={{ __html: cell }}
                                        ></td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
        case 'quiz': return (
            <div className="w-full max-w-[min(100%,820px)] mx-auto space-y-6 text-center">
                <h2 className={`font-roboto-slab font-bold text-slate-900 ${layout.typeScale.sectionHeading}`}>
                    {slide.title}
                </h2>
                <QuizComponent
                    layout={layout}
                    question={slide.question!}
                    options={slide.options!}
                    correctAnswer={slide.correctAnswer!}
                    feedback={slide.feedback!}
                />
            </div>
        );
        case 'image_hotspot': return (
            <div className="w-full text-left space-y-6">
                <h2 className={`font-roboto-slab font-bold text-slate-900 tracking-tight ${layout.typeScale.sectionHeading}`}>
                    {slide.title}
                </h2>
                {renderLayout(slide)}
            </div>
        );
        case 'three_column_image': return (
            <div className="w-full text-left space-y-6">
                <h2 className={`font-roboto-slab font-bold text-slate-900 tracking-tight ${layout.typeScale.sectionHeading}`}>{slide.title}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {slide.tiles.map((tile, i) => {
                        const captionText = typeof tile.caption === 'string' ? tile.caption.replace(/<[^>]*>/g, '') : slide.title;
                        const { primary, fallback } = getImageSources(tile.placeholderId);
                        return (
                            <div key={i} className="text-center space-y-4 bg-white/90 rounded-3xl border border-slate-200 shadow-lg shadow-slate-900/10 p-5">
                                <img
                                    src={primary}
                                    alt={captionText}
                                    className={layout.galleryImageClass}
                                    data-fallback-applied="false"
                                    onError={attachErrorFallback(fallback)}
                                    loading="lazy"
                                    referrerPolicy="no-referrer"
                                    crossOrigin="anonymous"
                                />
                                <p className={`font-lato text-slate-700 ${layout.typeScale.body}`} dangerouslySetInnerHTML={{ __html: tile.caption }}></p>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
        case 'case_series': return <CaseChallenge layout={layout} title={slide.title} vignette={slide.vignette} pearls={slide.pearls} placeholderId={slide.placeholderId} imageCaption={slide.imageCaption} questions={slide.questions} />;
        case 'quiz_stack': return <LightningRound layout={layout} title={slide.title} intro={slide.intro} questions={slide.questions} footnote={slide.footnote} />;
        case 'reference': return (
            <div className="w-full text-left space-y-6">
                <div className="space-y-2">
                    <h2 className={`font-roboto-slab font-bold text-slate-900 ${layout.typeScale.sectionHeading}`}>{slide.title}</h2>
                    <h3 className={`font-roboto-slab text-slate-800 tracking-tight ${layout.typeScale.body}`}>{slide.citationTitle}</h3>
                    <p className={`text-slate-600 ${layout.typeScale.smallBody}`}>{slide.authors}</p>
                    <p className={`text-slate-600 ${layout.typeScale.smallBody}`}>{slide.journal} <span className="font-mono text-xs md:text-sm">doi:{' '}{slide.doi}</span></p>
                </div>
                <div className={`bg-gradient-to-br from-white via-slate-50 to-white border border-slate-200 rounded-3xl shadow-lg shadow-slate-900/10 space-y-5 ${layout.reference.cardPadding}`}>
                    <div className={`prose max-w-none text-slate-700 ${layout.typeScale.body}`} dangerouslySetInnerHTML={{ __html: slide.summary }}></div>
                    <ul className={`list-disc list-inside space-y-2.5 text-slate-700 ${layout.typeScale.body}`}>
                        {slide.takeaways.map((point: string, idx: number) => (
                            <li key={idx}>{point}</li>
                        ))}
                    </ul>
                    <a
                        href={slide.directLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sky-700 font-semibold hover:text-sky-900 text-sm md:text-base"
                    >
                        <span className="h-2 w-2 rounded-full bg-sky-500"></span>
                        Read the full article
                    </a>
                </div>
            </div>
        );
        case 'accordion': return (
            <div className="w-full text-left space-y-6">
                <h2 className={`font-roboto-slab font-bold text-slate-900 ${layout.typeScale.sectionHeading}`}>{slide.title}</h2>
                <InteractiveAccordion layout={layout} items={slide.items} />
            </div>
        );
        case 'launch': return (
            <div className="text-center space-y-5">
                <h2 className={`font-roboto-slab font-bold text-slate-900 tracking-tight ${layout.typeScale.heading}`}>
                    {slide.title}
                </h2>
                <p className={`font-lato text-slate-700 max-w-3xl mx-auto ${layout.typeScale.body}`}>
                    {slide.text}
                </p>
                <button
                    onClick={onComplete}
                    className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-sky-600 to-sky-500 text-white font-roboto-slab text-lg md:text-xl font-semibold shadow-lg shadow-sky-600/30 hover:shadow-xl hover:shadow-sky-600/35 transition-all duration-200"
                >
                    <ArrowRightToBracketIcon className="h-6 w-6" />
                    {slide.buttonText}
                </button>
            </div>
        );
        default: return null;
    }
}

const Lecture: React.FC<LectureProps> = ({ onComplete }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const slideRefs = useRef<Array<HTMLDivElement | null>>([]);
    const [announcement, setAnnouncement] = useState('');
    const minSwipeDistance = 50;
    const deviceType = useDeviceType();
    const layout = useMemo(() => layoutByDevice[deviceType], [deviceType]);

    const nextSlide = () => setCurrentSlide(prev => Math.min(prev + 1, slideData.length - 1));
    const prevSlide = () => setCurrentSlide(prev => Math.max(prev - 1, 0));
    const goToSlide = (index: number) => setCurrentSlide(index);

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            if (currentSlide < slideData.length - 1 && slideData[currentSlide].type !== 'launch') {
                nextSlide();
            }
        } else if (isRightSwipe) {
            if (currentSlide > 0) {
                prevSlide();
            }
        }
        setTouchStart(null);
        setTouchEnd(null);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') nextSlide();
            if (e.key === 'ArrowLeft') prevSlide();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentSlide]);

    useEffect(() => {
        const instance = slideRefs.current[currentSlide];
        instance?.focus();
        const slide = slideData[currentSlide];
        const label = (slide as any)?.title || `Slide ${currentSlide + 1}`;
        setAnnouncement(`Slide ${currentSlide + 1} of ${slideData.length}: ${label}`);
    }, [currentSlide]);

    return (
        <div 
            className="w-full h-full bg-slate-50 relative overflow-x-hidden overflow-y-auto flex flex-col"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            <div className="flex-grow relative">
                {slideData.map((slide, index) => (
                    <div 
                        key={index} 
                        className={`slide-container ${index === currentSlide ? 'active' : ''} ${index < currentSlide ? 'prev' : ''}`}
                        aria-hidden={index !== currentSlide}
                        role="group"
                        aria-roledescription="Slide"
                        aria-label={`${(slide as any).title || `Slide ${index + 1}`} (${index + 1} of ${slideData.length})`}
                        tabIndex={index === currentSlide ? 0 : -1}
                        ref={el => { slideRefs.current[index] = el; }}
                        id={`slide-${index}`}
                    >
                        <div className={`mx-auto ${layout.frame.containerWidth} ${layout.frame.outerPadding} ${layout.frame.verticalPadding}`}>
                            <div className="flex justify-center">
                                <div className={`w-full ${layout.frame.contentWidth}`}>
                                    <div className={`${layout.frame.radius} bg-white/95 shadow-xl sm:shadow-2xl shadow-slate-900/10 ring-1 ring-slate-200/70 backdrop-blur-sm`}>
                                        <div className={layout.frame.innerPadding}>
                                            <SlideContent layout={layout} slide={slide} onComplete={onComplete} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="absolute top-1/2 left-5 transform -translate-y-1/2 z-10">
              <button
                  onClick={prevSlide}
                  disabled={currentSlide === 0}
                  className="bg-black/30 text-white rounded-full p-2 hover:bg-black/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  aria-label="Previous slide"
                  aria-controls={`slide-${Math.max(currentSlide - 1, 0)}`}
                  aria-disabled={currentSlide === 0}
              >
                  <ChevronLeftIcon className="h-8 w-8"/>
              </button>
            </div>
            <div className="absolute top-1/2 right-5 transform -translate-y-1/2 z-10">
              <button
                  onClick={nextSlide}
                  disabled={currentSlide === slideData.length - 1 || slideData[currentSlide].type === 'launch'}
                  className="bg-black/30 text-white rounded-full p-2 hover:bg-black/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  aria-label="Next slide"
                  aria-controls={`slide-${Math.min(currentSlide + 1, slideData.length - 1)}`}
                  aria-disabled={currentSlide === slideData.length - 1 || slideData[currentSlide].type === 'launch'}
              >
                  <ChevronRightIcon className="h-8 w-8"/>
              </button>
            </div>
            <div className="absolute bottom-5 left-1/2 transform -translateX-1/2 z-10 flex space-x-2">
                {slideData.map((_, index) => (
                    <button 
                        key={index} 
                        onClick={() => goToSlide(index)} 
                        className={`w-3 h-3 rounded-full transition-colors ${index === currentSlide ? 'bg-sky-600' : 'bg-slate-300 hover:bg-slate-400'}`}
                        aria-label={`Go to slide ${index + 1}`}
                        aria-current={index === currentSlide ? 'step' : undefined}
                    />
                ))}
            </div>
            <div aria-live="polite" role="status" className="sr-only">
                {announcement}
            </div>
        </div>
    );
};

export default Lecture;
