
import type { HistologicFamily, ServiceLine } from '../types';

export interface TutorialSection {
    id: string;
    title: string;
    level: 'intro' | 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
    content: string;
    relatedFamily?: { family: HistologicFamily, serviceLine: ServiceLine };
}

export const tutorialSections: TutorialSection[] = [
    {
        id: 'intro',
        level: 'intro',
        title: 'How to Use This Tutorial',
        content: `
            <p>This tutorial is designed using the <strong>ADDIE model</strong> of instructional design and is structured around <strong>Bloom's Taxonomy</strong> to build your diagnostic skills systematically.</p>
            <p>You will progress from foundational knowledge to complex synthesis, with each stage building on the last. Interactive quizzes are included to reinforce learning.</p>
            <ul class="list-disc list-inside mt-2 space-y-1">
                <li><strong>Remember & Understand:</strong> Core facts and patterns.</li>
                <li><strong>Apply & Analyze:</strong> Use patterns to build a differential diagnosis.</li>
                <li><strong>Evaluate:</strong> Weigh the evidence from ancillary tests.</li>
                <li><strong>Create:</strong> Synthesize findings into a final report.</li>
            </ul>
        `
    },
    {
        id: 'stage-1-remember',
        level: 'remember',
        title: '1. Remember: Clinical Context',
        content: `
            <p>The first step in any workup is gathering the clinical facts. Benign soft tissue tumors are 100x more common than sarcomas. Key clues can immediately narrow your differential.</p>
            <h4 class="font-bold mt-3 mb-2">Key Clinical Clues</h4>
            <ul class="list-disc list-inside space-y-2">
                <li><strong>Age:</strong> Sarcomas are rare in children. In adults, consider <strong>Synovial Sarcoma</strong> in the young, and <strong>UPS</strong> or <strong>DDLPS</strong> in the elderly.</li>
                <li><strong>Location & Depth:</strong> Benign lesions are typically small (&lt;5 cm) and superficial. Malignant lesions are often large (&gt;5 cm) and deep-seated ("deep to fascia").</li>
                <li><strong>Specific Location Clues:</strong>
                    <ul class="list-disc list-inside ml-4 mt-1">
                        <li><strong>Retroperitoneum:</strong> Think <strong>DDLPS</strong> first.</li>
                        <li><strong>Deep Extremities (Young Adult):</strong> High suspicion for <strong>Synovial Sarcoma</strong> or <strong>ASPS</strong>.</li>
                        <li><strong>Superficial Shoulder/Neck (Older Men):</strong> Classic for <strong>Spindle Cell Lipoma</strong>.</li>
                    </ul>
                </li>
            </ul>
        `
    },
    {
        id: 'stage-2-understand',
        level: 'understand',
        title: '2. Understand: Core Patterns',
        content: `
            <p>After reviewing the slide "blind," categorize the tumor into one of five basic architectural patterns. This is the most crucial step in forming a differential.</p>
            <table class="w-full text-left border-collapse mt-2">
                 <thead>
                    <tr class="bg-slate-50 dark:bg-slate-700/50">
                        <th class="border p-2 font-semibold">Pattern</th>
                        <th class="border p-2 font-semibold">Key Features</th>
                        <th class="border p-2 font-semibold">Common Examples</th>
                    </tr>
                 </thead>
                 <tbody>
                    <tr><td class="border p-2"><strong>Spindled</strong></td><td class="border p-2">Elongated cells, often in fascicles.</td><td class="border p-2">LMS, MPNST, SFT, Synovial Sarcoma</td></tr>
                    <tr><td class="border p-2"><strong>Epithelioid</strong></td><td class="border p-2">Polygonal cells, cohesive nests.</td><td class="border p-2">Epithelioid Sarcoma, ASPS, Melanoma</td></tr>
                    <tr><td class="border p-2"><strong>Round Cell</strong></td><td class="border p-2">Small, round, blue cells.</td><td class="border p-2">Ewing, Rhabdomyosarcoma, DSRCT</td></tr>
                    <tr><td class="border p-2"><strong>Pleomorphic</strong></td><td class="border p-2">Marked variation in cell size/shape.</td><td class="border p-2">UPS, DDLPS, Pleomorphic LMS/RMS</td></tr>
                    <tr><td class="border p-2"><strong>Myxoid</strong></td><td class="border p-2">Abundant extracellular myxoid matrix.</td><td class="border p-2">Myxoid Liposarcoma, MFS</td></tr>
                 </tbody>
            </table>
        `
    },
    {
        id: 'stage-3-apply',
        level: 'apply',
        title: '3. Apply: The Diagnostic Algorithm',
        content: `
            <p>Now, apply your pattern recognition to build a differential diagnosis (DDx). Select a pattern below to see the corresponding diagnostic algorithm and relevant deep dives.</p>
            <h4 class="font-bold mt-4 mb-2">Pattern-Based DDx Pathways</h4>
            <p>While we list deep dives by lineage below, a real-world workup is pattern-driven. For example, if you see a <strong>Spindled</strong> pattern, your initial DDx would include entities from the Nerve Sheath, Muscle, and SFT sections.</p>
            <details class="my-2 bg-slate-100 dark:bg-slate-700/50 p-3 rounded-lg">
                <summary class="font-semibold cursor-pointer">Example: Spindled Cell DDx</summary>
                <div class="mt-2 text-sm">
                    <p>For a spindle cell tumor, your DDx should include:</p>
                    <ul class="list-disc list-inside">
                        <li><strong>Smooth Muscle Tumor (LMS):</strong> Look for cigar-shaped nuclei. Stains: Desmin, SMA.</li>
                        <li><strong>Nerve Sheath Tumor (MPNST/Schwannoma):</strong> Look for wavy nuclei. Stains: S100, SOX10.</li>
                        <li><strong>SFT:</strong> Look for staghorn vessels. Stains: STAT6, CD34.</li>
                        <li><strong>Synovial Sarcoma:</strong> Monotonous cells. Stains: TLE1, Keratin.</li>
                    </ul>
                </div>
            </details>
        `
    },
    {
        id: 'detail-lipomatous',
        level: 'apply',
        title: 'Deep Dive: Lipomatous Tumors',
        relatedFamily: { family: 'adipocytic', serviceLine: 'BST' },
        content: `
            <h3 class="text-lg font-bold mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">Algorithm: The "Real Estate" Rule</h3>
            <div class="my-4 p-4 border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-900/20">
                <h4 class="font-bold text-amber-800 dark:text-amber-200">Location is King</h4>
                <p class="text-sm mt-1 text-amber-700 dark:text-amber-300">
                    In lipomatous tumors, location often trumps morphology. A "lipoma-like" tumor in the <strong>retroperitoneum</strong> is almost never a benign lipoma; it is a <strong>Well-Differentiated Liposarcoma (WDLPS)</strong> until proven otherwise.
                </p>
            </div>
            <p class="mb-2"><strong>Key Marker:</strong> MDM2 Amplification (FISH) or Overexpression (IHC).</p>
        `
    },
    {
        id: 'detail-nerve-sheath',
        level: 'apply',
        title: 'Deep Dive: Nerve Sheath Tumors',
        relatedFamily: { family: 'pnst', serviceLine: 'BST' },
        content: `
             <h3 class="text-lg font-bold mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">Algorithm: The "Dimmer Switch"</h3>
            <div class="my-4 p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
                <h4 class="font-bold text-blue-800 dark:text-blue-200">S100 Intensity Patterns</h4>
                <p class="text-sm mt-1 text-blue-700 dark:text-blue-300">
                    Benign nerve sheath tumors (Schwannoma, Neurofibroma) typically show <strong>diffuse, strong</strong> S100 staining.
                    Malignant Peripheral Nerve Sheath Tumors (MPNST) show <strong>weak, patchy, or absent</strong> S100. It's like turning a dimmer switch down.
                </p>
            </div>
            <p class="mb-2"><strong>Specific Marker:</strong> Loss of H3K27me3 (trimethylation) is highly specific for MPNST.</p>
        `
    },
    {
        id: 'detail-uncertain',
        level: 'apply',
        title: 'Deep Dive: Uncertain Differentiation',
        relatedFamily: { family: 'uncertain', serviceLine: 'BST' },
        content: `
             <h3 class="text-lg font-bold mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">Algorithm: Monomorphic Spindle Cell Sarcomas</h3>
             <p class="mb-4 text-sm">When you encounter a monotonous spindle cell proliferation ("blue ocean" of cells), use this algorithm.</p>
             <ul class="list-disc list-inside">
                <li><strong>Synovial Sarcoma:</strong> TLE1+, SS18-SSX fusion.</li>
                <li><strong>SFT:</strong> STAT6+, NAB2-STAT6 fusion.</li>
                <li><strong>MPNST:</strong> S100 (patchy), H3K27me3 loss.</li>
             </ul>
        `
    },
    {
        id: 'algo-heme',
        level: 'analyze',
        title: 'Algorithm: Hematopoietic Soft Tissue Mimics',
        content: `
            <p>Hematopoietic neoplasms are the "great mimickers". Always consider them.</p>
            <div class="my-6 p-4 border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-900/20">
                <h4 class="font-bold text-amber-800 dark:text-amber-200">The Gatekeeper</h4>
                <p class="text-sm mt-1 text-amber-700 dark:text-amber-300">
                    <strong>CD45 (LCA)</strong> is the mandatory screen. If positive, you are dealing with a lymphoma/leukemia.
                </p>
            </div>
        `
    },
    {
        id: 'stage-4-analyze',
        level: 'analyze',
        title: '4. Analyze: Building the DDx',
        content: `
            <p>Analysis involves synthesizing the clinical and morphologic data to create a ranked differential diagnosis. This prevents wasteful "shotgun" IHC ordering.</p>
            <h4 class="font-bold mt-3 mb-2">Example Case Analysis</h4>
            <ul class="list-disc list-inside space-y-2">
                <li><strong>Clinical:</strong> 28-year-old female with a deep 5cm mass in the knee.</li>
                <li><strong>Morphology:</strong> Monomorphic spindle cell proliferation in fascicles.</li>
            </ul>
            <p class="mt-2"><strong>Analysis:</strong> A deep-seated mass in a young adult is suspicious for sarcoma. The monomorphic spindle cell pattern raises a DDx of Synovial Sarcoma vs. MPNST.</p>
        `
    },
    {
        id: 'stage-5-evaluate',
        level: 'evaluate',
        title: '5. Evaluate: Weighing the Evidence',
        content: `
            <p>Evaluation is the skill of judging the significance of your findings. Not all "positive" stains are equal.</p>
            <h4 class="font-bold mt-3 mb-2">Evaluating IHC and Molecular Results</h4>
            <table class="w-full text-left border-collapse mt-2">
                 <thead>
                    <tr class="bg-slate-50 dark:bg-slate-700/50">
                        <th class="border p-2 font-semibold">Finding</th>
                        <th class="border p-2 font-semibold">Evaluation & Pitfalls</th>
                    </tr>
                 </thead>
                 <tbody>
                    <tr><td class="border p-2"><strong>STAT6 (+)</strong></td><td class="border p-2">Strong, diffuse nuclear STAT6 is essentially diagnostic for <strong>SFT</strong>. Cytoplasmic staining is non-specific.</td></tr>
                    <tr><td class="border p-2"><strong>MDM2 / CDK4 (+)</strong></td><td class="border p-2">Confirms <strong>WDLPS/DDLPS</strong>. Remember low-grade osteosarcoma can also be positive.</td></tr>
                    <tr><td class="border p-2"><strong>S100 (+)</strong></td><td class="border p-2"><strong>Diffuse/strong</strong> suggests Schwannoma or Melanoma. <strong>Focal/patchy</strong> is characteristic of MPNST.</td></tr>
                 </tbody>
            </table>
        `
    },
    {
        id: 'stage-6-create',
        level: 'create',
        title: '6. Create: Synthesizing the Report',
        content: `
            <p>The final step is to synthesize all findings into a coherent and clinically useful report. This includes the diagnosis, a comment summarizing the key features, and all relevant grading/staging information.</p>
            <h4 class="font-bold mt-3 mb-2">Elements of a Strong Diagnostic Comment</h4>
            <ul class="list-disc list-inside space-y-1">
                <li><strong>Diagnosis:</strong> The final diagnosis.</li>
                <li><strong>Key Features:</strong> Briefly mention the morphology (e.g., "high-grade spindle cell neoplasm").</li>
                <li><strong>Ancillary Results:</strong> State the key IHC and/or molecular findings that support the diagnosis.</li>
                <li><strong>Integration:</strong> Conclude by integrating the findings.</li>
            </ul>
        `
    },
    {
        id: 'gyn-ovary-workup',
        level: 'apply',
        title: 'Module: Ovarian Carcinoma Subtyping',
        relatedFamily: { family: 'epithelial_gyn', serviceLine: 'GYN' },
        content: `
            <h3 class="text-lg font-bold mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">The "Big Five" Algorithm</h3>
            <p class="mb-4">Ovarian carcinomas are not a single disease. Use the <strong>WT1/p53</strong> axis as your primary triage.</p>
            <ul class="list-disc list-inside">
                <li><strong>HGSC:</strong> WT1+, p53 mutant.</li>
                <li><strong>Endometrioid:</strong> WT1-, p53 wild-type, ER+.</li>
                <li><strong>Clear Cell:</strong> Napsin A+, HNF1b+.</li>
                <li><strong>Mucinous:</strong> CK7+, CK20+, CDX2+.</li>
            </ul>
        `
    },
    {
        id: 'gyn-mimics',
        level: 'analyze',
        title: 'Module: Gynecologic Pitfalls & Mimics',
        relatedFamily: { family: 'gyn_rare', serviceLine: 'GYN' },
        content: `
            <h3 class="text-lg font-bold mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">The "Is it Cancer?" Decision</h3>
            <p class="mb-4">Common traps:</p>
            <ul class="list-disc list-inside">
                <li><strong>Massive Ovarian Edema:</strong> Spared follicles in edema. Mimics Krukenberg.</li>
                <li><strong>Pregnancy Luteoma:</strong> Solid nodule, mimics Leydig cell tumor. Regresses.</li>
            </ul>
        `
    },
    {
        id: 'vaginal-path',
        level: 'apply',
        title: 'Module: Vaginal Pathology & Mimics',
        relatedFamily: { family: 'gyn_vagina', serviceLine: 'GYN' },
        content: `
            <h3 class="text-lg font-bold mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">Vaginal Pathology</h3>
            <p class="mb-4">Diagnosis of exclusion.</p>
            <ul class="list-disc list-inside">
                <li><strong>Botryoid RMS:</strong> Cambium layer, myogenin+.</li>
                <li><strong>Fibroepithelial Polyp:</strong> Bizarre stromal cells, CD34+.</li>
            </ul>
        `
    },
    {
        id: 'benign-mimics-expanded',
        level: 'evaluate',
        title: 'Module: Benign Mimics of Malignancy (Expanded)',
        relatedFamily: { family: 'gyn_expanded', serviceLine: 'GYN' },
        content: `
            <h3 class="text-lg font-bold mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">Scary but Benign</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div class="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg">
                    <h4 class="font-bold text-primary-600 dark:text-primary-400 mb-2">Postoperative Spindle Cell Nodule</h4>
                    <p>Recent surgery. Mitoses present but no atypia. Keratin +/-.</p>
                </div>
                <div class="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg">
                    <h4 class="font-bold text-green-600 dark:text-green-400 mb-2">Adenomatoid Tumor</h4>
                    <p>Mesothelial (Calretinin+). Gland-like but flattened.</p>
                </div>
            </div>
        `
    }
];
