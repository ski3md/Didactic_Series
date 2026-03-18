
import type { DiagnosticAlgorithm, AlgorithmNode } from '../types';

// --- UNIVERSAL CARCINOMA ALGORITHM ---
const CARCINOMA_NODES: Record<string, AlgorithmNode> = {
    'start': {
        id: 'start', type: 'start', title: 'Carcinoma of Unknown Primary', description: 'Approach to the undifferentiated carcinoma.',
        options: [{ label: 'CK7 / CK20 Profile', nextNodeId: 'ck_split' }]
    },
    'ck_split': {
        id: 'ck_split', type: 'decision', title: 'Cytokeratin 7 & 20', description: 'The fundamental triage step.',
        recommendedInitialIHC: ['CK7', 'CK20', 'TTF1', 'CDX2', 'GATA3', 'PAX8', 'p63'],
        options: [
            { label: 'CK7+ / CK20-', nextNodeId: 'ck7_pos_branch' },
            { label: 'CK7- / CK20+', nextNodeId: 'ck20_pos_branch' },
            { label: 'CK7+ / CK20+', nextNodeId: 'double_pos_branch' },
            { label: 'CK7- / CK20-', nextNodeId: 'double_neg_branch' }
        ]
    },
    'ck7_pos_branch': {
        id: 'ck7_pos_branch', type: 'decision', title: 'CK7+ / CK20- Differential', description: 'Lung, Breast, GYN, Thyroid, Upper GI.',
        options: [
            { label: 'TTF1+', nextNodeId: 'result_lung_adeno' },
            { label: 'GATA3+ / Mammaglobin+', nextNodeId: 'result_breast' },
            { label: 'PAX8+ / WT1+', nextNodeId: 'result_serous_gyn' },
            { label: 'PAX8+ / WT1-', nextNodeId: 'result_endo_renal' }
        ]
    },
    'ck20_pos_branch': {
        id: 'ck20_pos_branch', type: 'decision', title: 'CK7- / CK20+ Differential', description: 'Colorectal, Merkel Cell.',
        options: [
            { label: 'CDX2+ / SATB2+', nextNodeId: 'result_colon' },
            { label: 'Synaptophysin+ / Dot-like CK20', nextNodeId: 'result_merkel' }
        ]
    },
    'double_pos_branch': {
        id: 'double_pos_branch', type: 'decision', title: 'CK7+ / CK20+ Differential', description: 'Urothelial, Pancreatic, Mucinous Ovarian.',
        options: [
            { label: 'p63+ / GATA3+', nextNodeId: 'result_urothelial' },
            { label: 'CA19-9+ / SMAD4 Loss', nextNodeId: 'result_pancreatic' },
            { label: 'PAX8+ / CDX2+', nextNodeId: 'result_mucinous_ovary' }
        ]
    },
    'double_neg_branch': {
        id: 'double_neg_branch', type: 'decision', title: 'CK7- / CK20- Differential', description: 'Prostate, HCC, Renal, Adrenal.',
        options: [
            { label: 'PSA+ / NKX3.1+', nextNodeId: 'result_prostate' },
            { label: 'HepPar1+ / Arginase+', nextNodeId: 'result_hcc' },
            { label: 'PAX8+ / CA9+', nextNodeId: 'result_rcc' }
        ]
    },
    // Results
    'result_lung_adeno': { id: 'result_lung_adeno', type: 'result', title: 'Lung Adenocarcinoma', diagnosis: 'Lung Adenocarcinoma', description: 'Pulmonary primary.', confirmatoryStudies: ['Napsin A'], pearls: ['TTF1 is highly specific', 'Exclude thyroid with Thyroglobulin'] },
    'result_breast': { id: 'result_breast', type: 'result', title: 'Breast Carcinoma', diagnosis: 'Metastatic Breast Carcinoma', description: 'Mammary origin.', confirmatoryStudies: ['ER/PR', 'HER2'], pearls: ['GATA3 is sensitive', 'SOX10 for Triple Negative'] },
    'result_serous_gyn': { id: 'result_serous_gyn', type: 'result', title: 'HGSC', diagnosis: 'High-Grade Serous Carcinoma (Gyn)', description: 'Ovarian/Tubal/Peritoneal.', pearls: ['WT1 diffuse', 'p53 mutant pattern'] },
    'result_endo_renal': { id: 'result_endo_renal', type: 'result', title: 'Endometrial / Renal', diagnosis: 'Endometrial or Renal Carcinoma', description: 'Requires further workup.', pearls: ['Vimentin+ for both', 'ER+ for Endometrial', 'RCC marker for Renal'] },
    'result_colon': { id: 'result_colon', type: 'result', title: 'Colorectal Adeno', diagnosis: 'Colorectal Adenocarcinoma', description: 'Intestinal origin.', pearls: ['Dirty necrosis', 'CDX2 strong'] },
    'result_merkel': { id: 'result_merkel', type: 'result', title: 'Merkel Cell Ca', diagnosis: 'Merkel Cell Carcinoma', description: 'Cutaneous neuroendocrine.', pearls: ['Dot-like CK20', 'INSM1+'] },
    'result_urothelial': { id: 'result_urothelial', type: 'result', title: 'Urothelial Ca', diagnosis: 'Urothelial Carcinoma', description: 'Bladder/Ureter origin.', pearls: ['Uroplakin II is specific', 'GATA3 strong'] },
    'result_pancreatic': { id: 'result_pancreatic', type: 'result', title: 'Pancreatic Adeno', diagnosis: 'Pancreatic Ductal Adenocarcinoma', description: 'Pancreatobiliary origin.', pearls: ['Maspin+', 'S100P+'] },
    'result_mucinous_ovary': { id: 'result_mucinous_ovary', type: 'result', title: 'Mucinous Ovarian', diagnosis: 'Mucinous Carcinoma (Ovary)', description: 'Primary ovarian mucinous.', pearls: ['CK7+', 'CDX2+', 'SATB2 negative (usually)'] },
    'result_prostate': { id: 'result_prostate', type: 'result', title: 'Prostate Adeno', diagnosis: 'Prostate Adenocarcinoma', description: 'Prostatic origin.', pearls: ['PSA', 'PSAP', 'NKX3.1'] },
    'result_hcc': { id: 'result_hcc', type: 'result', title: 'HCC', diagnosis: 'Hepatocellular Carcinoma', description: 'Liver primary.', pearls: ['Reticulin loss', 'Polygonal cells'] },
    'result_rcc': { id: 'result_rcc', type: 'result', title: 'Renal Cell Ca', diagnosis: 'Clear Cell RCC', description: 'Renal primary.', pearls: ['Vimentin+', 'Clear cells', 'Vascular'] }
};

// --- RENAL MASS EVALUATION ALGORITHM (WHO 5th Ed) ---
const RENAL_NODES: Record<string, AlgorithmNode> = {
    'start': {
        id: 'start', type: 'start', title: 'Renal Mass Evaluation', description: 'Comprehensive workup for renal masses covering Epithelial, Mesenchymal, Metanephric, and Pediatric/Embryonal lineages.',
        options: [{ label: 'Determine Primary Morphology', nextNodeId: 'primary_morphology' }]
    },
    'primary_morphology': {
        id: 'primary_morphology', type: 'decision', title: 'Primary Pattern', description: 'What is the dominant histological appearance?',
        options: [
            { label: 'Epithelial / Cortical (Tubules/Nests)', nextNodeId: 'epithelial_branch' },
            { label: 'Mesenchymal / Spindle Cell', nextNodeId: 'mesenchymal_branch' },
            { label: 'Small Round Blue / Embryonal', nextNodeId: 'embryonal_branch' },
            { label: 'Urothelial / Pelvic', nextNodeId: 'urothelial_branch' },
            { label: 'Biphasic / Mixed', nextNodeId: 'mixed_branch' }
        ]
    },
    // --- Epithelial Branch ---
    'epithelial_branch': {
        id: 'epithelial_branch', type: 'decision', title: 'Cytoplasmic Features', description: 'Is the cytoplasm predominantly clear, eosinophilic, or other?',
        options: [
            { label: 'Clear Cytoplasm', nextNodeId: 'clear_branch' },
            { label: 'Eosinophilic / Granular', nextNodeId: 'eosinophilic_branch' },
            { label: 'Basophilic / Papillary', nextNodeId: 'basophilic_branch' },
            { label: 'High Grade / Medullary', nextNodeId: 'medullary_branch' }
        ]
    },
    'clear_branch': {
        id: 'clear_branch', type: 'decision', title: 'Clear Cell Differential', description: 'CCRCC vs mimics.',
        recommendedInitialIHC: ['CA9', 'CK7', 'CD10', 'AMACR', 'TFE3', 'HMB45'],
        options: [
            { label: 'CA9+ (Box), CK7-', nextNodeId: 'result_ccrcc' },
            { label: 'CA9+ (Cup), CK7+', nextNodeId: 'result_ccprcc' },
            { label: 'TFE3+ (Nuclear)', nextNodeId: 'result_translocation' },
            { label: 'HMB45+, Melan-A+', nextNodeId: 'result_epithelioid_aml' }, // Mimic
            { label: 'CK7+, CD10+, TCEB1 Mut', nextNodeId: 'result_eloc_mutated' }
        ]
    },
    'eosinophilic_branch': {
        id: 'eosinophilic_branch', type: 'decision', title: 'Eosinophilic Differential', description: 'Oncocytoma, Chromophobe, and mimics.',
        recommendedInitialIHC: ['CK7', 'CD117', 'Hale Colloidal Iron', 'FH', 'SDHB', 'CK20'],
        options: [
            { label: 'CK7+, CD117+', nextNodeId: 'result_chromophobe' },
            { label: 'CK7-, CD117+', nextNodeId: 'result_oncocytoma' },
            { label: 'CK7+, AMACR+, CD117-', nextNodeId: 'result_papillary' },
            { label: 'FH Loss / 2SC+', nextNodeId: 'result_fh_deficient' },
            { label: 'SDHB Loss', nextNodeId: 'result_sdh_deficient' },
            { label: 'CK20+, CK7-', nextNodeId: 'result_eosinophilic_cystic' }
        ]
    },
    'basophilic_branch': {
        id: 'basophilic_branch', type: 'decision', title: 'Basophilic / Papillary', description: 'Papillary lesions and mimics.',
        options: [
            { label: 'CK7+, AMACR+', nextNodeId: 'result_papillary' },
            { label: 'WT1+, BRAF V600E+', nextNodeId: 'result_metanephric' },
            { label: 'Mucinous / Spindle', nextNodeId: 'result_mtscc' },
            { label: 'Tubulocystic Architecture', nextNodeId: 'result_tubulocystic' }
        ]
    },
    'medullary_branch': {
        id: 'medullary_branch', type: 'decision', title: 'Medullary / High Grade', description: 'Aggressive tumors centered in medulla.',
        options: [
            { label: 'INI1 Loss, Sickle Cell', nextNodeId: 'result_medullary_ca' },
            { label: 'PAX8+, High Grade', nextNodeId: 'result_collecting_duct' },
            { label: 'ALK+ (VCL-ALK)', nextNodeId: 'result_alk_rearranged' }
        ]
    },
    // --- Mesenchymal Branch ---
    'mesenchymal_branch': {
        id: 'mesenchymal_branch', type: 'decision', title: 'Mesenchymal Pattern', description: 'Evaluate stromal/mesenchymal elements.',
        recommendedInitialIHC: ['HMB45', 'Melan-A', 'SMA', 'Desmin', 'CD117', 'PanCK', 'Renin'],
        options: [
            { label: 'Fat / Thick Vessels / HMB45+', nextNodeId: 'result_aml_classic' },
            { label: 'Epithelioid / HMB45+', nextNodeId: 'result_aml_epithelioid' },
            { label: 'Spindle / SMA+ / Desmin+', nextNodeId: 'result_leiomyosarcoma' },
            { label: 'Bland Spindle / Medullary', nextNodeId: 'result_rict' },
            { label: 'Renin+ / Vascular', nextNodeId: 'result_juxtaglomerular' },
            { label: 'Inhibin+, VHL+', nextNodeId: 'result_haemangioblastoma' }
        ]
    },
    // --- Embryonal / Small Blue Branch ---
    'embryonal_branch': {
        id: 'embryonal_branch', type: 'decision', title: 'Embryonal / Small Blue', description: 'Pediatric and adult small cell tumors.',
        recommendedInitialIHC: ['WT1', 'Desmin', 'Myogenin', 'INI1', 'Cyclin D1', 'BCOR', 'Synaptophysin', 'CD45'],
        options: [
            { label: 'WT1+ (Nuclear), Triphasic', nextNodeId: 'result_wilms' },
            { label: 'Cyclin D1+, BCOR+', nextNodeId: 'result_ccsk' },
            { label: 'INI1 Loss, Rhabdoid', nextNodeId: 'result_rhabdoid' },
            { label: 'ETV6-NTRK3, Spindle', nextNodeId: 'result_cmn' },
            { label: 'CD45+, CD20+', nextNodeId: 'result_lymphoma' },
            { label: 'Neuroendocrine+', nextNodeId: 'result_neuroendocrine' }
        ]
    },
    // --- Urothelial Branch ---
    'urothelial_branch': {
        id: 'urothelial_branch', type: 'decision', title: 'Urothelial Features', description: 'Invasive tumor centered on pelvis.',
        recommendedInitialIHC: ['GATA3', 'p63', 'p40', 'CK7', 'CK20', 'PAX8'],
        options: [
            { label: 'GATA3+ / p63+', nextNodeId: 'result_urothelial_upper' }
        ]
    },
    // --- Mixed Branch ---
    'mixed_branch': {
        id: 'mixed_branch', type: 'decision', title: 'Mixed Epithelial/Stromal', description: 'Biphasic tumors.',
        options: [
            { label: 'Cystic / Ovarian Stroma', nextNodeId: 'result_mest' },
            { label: 'Blastema / Epithelium / Stroma', nextNodeId: 'result_wilms' },
            { label: 'Pediatric / Cysts / Septa', nextNodeId: 'result_cpdn' }
        ]
    },

    // Results - Epithelial
    'result_ccrcc': { id: 'result_ccrcc', type: 'result', title: 'Clear Cell RCC', diagnosis: 'Clear Cell RCC', description: 'VHL-associated malignancy. Most common renal cancer.', pearls: ['VHL inactivation', 'Gold standard CA9 box pattern', 'Vascular network'] },
    'result_ccprcc': { id: 'result_ccprcc', type: 'result', title: 'Clear Cell Papillary', diagnosis: 'Clear Cell Papillary Renal Cell Tumor', description: 'Indolent neoplasm. CK7+, CA9 (Cup-like).', pearls: ['Cup-like CA9', 'Subnuclear vacuoles', 'GATA3+', 'CK7+'] },
    'result_translocation': { id: 'result_translocation', type: 'result', title: 'Translocation RCC', diagnosis: 'TFE3-rearranged RCC', description: 'Xp11.2 (TFE3). Young patients, psammoma bodies.', pearls: ['Young patients', 'Psammoma bodies', 'TFE3 nuclear'] },
    'result_eloc_mutated': { id: 'result_eloc_mutated', type: 'result', title: 'ELOC-Mutated RCC', diagnosis: 'ELOC-mutated RCC', description: 'Clear cells with thick fibromuscular bands.', pearls: ['CK7+', 'CD10+', 'TCEB1 mutation'] },
    'result_chromophobe': { id: 'result_chromophobe', type: 'result', title: 'Chromophobe RCC', diagnosis: 'Chromophobe RCC', description: 'Vegetable cell borders, perinuclear halos.', pearls: ['Hale colloidal iron diffuse', 'Raisinoid nuclei', 'CK7+', 'KIT+'] },
    'result_oncocytoma': { id: 'result_oncocytoma', type: 'result', title: 'Oncocytoma', diagnosis: 'Oncocytoma', description: 'Benign oncocytic neoplasm. Central scar.', pearls: ['Central scar', 'EDTA-negative', 'CK7-', 'KIT+'] },
    'result_papillary': { id: 'result_papillary', type: 'result', title: 'Papillary RCC', diagnosis: 'Papillary RCC', description: 'Papillae with foam cells. Trisomy 7/17.', pearls: ['Foam cells in cores', 'Trisomy 7/17', 'CK7+', 'AMACR+'] },
    'result_fh_deficient': { id: 'result_fh_deficient', type: 'result', title: 'FH-Deficient RCC', diagnosis: 'Fumarate Hydratase-deficient RCC', description: 'HLRCC syndrome. Large viral-like nucleoli.', pearls: ['Large viral-like nucleoli', 'Perinuclear halos', 'Loss of FH', '2SC positive'] },
    'result_sdh_deficient': { id: 'result_sdh_deficient', type: 'result', title: 'SDH-Deficient RCC', diagnosis: 'Succinate Dehydrogenase-deficient RCC', description: 'Rare, syndromic. Eosinophilic, vacuolated.', pearls: ['Eosinophilic cytoplasm', 'Vacuolated cytoplasm', 'Loss of SDHB'] },
    'result_eosinophilic_cystic': { id: 'result_eosinophilic_cystic', type: 'result', title: 'ESC RCC', diagnosis: 'Eosinophilic Solid and Cystic RCC', description: 'Sporadic, indolent. TSC mutations.', pearls: ['CK20 positive', 'CK7 negative', 'Stippled inclusions'] },
    'result_metanephric': { id: 'result_metanephric', type: 'result', title: 'Metanephric Adenoma', diagnosis: 'Metanephric Adenoma', description: 'Benign, highly cellular, blue.', pearls: ['Blue book pattern', 'BRAF V600E', 'WT1 positive', 'CD57+'] },
    'result_medullary_ca': { id: 'result_medullary_ca', type: 'result', title: 'Renal Medullary Ca', diagnosis: 'Renal Medullary Carcinoma', description: 'Aggressive, SMARCB1-deficient. Sickle trait.', pearls: ['Sickle cell trait association', 'Loss of INI1', 'High grade adenoca', 'OCT4+'] },
    'result_collecting_duct': { id: 'result_collecting_duct', type: 'result', title: 'Collecting Duct Ca', diagnosis: 'Collecting Duct Carcinoma', description: 'High grade, medullary, desmoplastic.', pearls: ['Hobnail cells', 'High grade', 'PAX8 positive', 'Diagnosis of exclusion'] },
    'result_alk_rearranged': { id: 'result_alk_rearranged', type: 'result', title: 'ALK-Rearranged RCC', diagnosis: 'ALK-rearranged RCC', description: 'Rare. VCL-ALK fusion most common.', pearls: ['ALK IHC positive', 'Medullary location', 'Mimics RMC'] },
    'result_mtscc': { id: 'result_mtscc', type: 'result', title: 'MTSCC', diagnosis: 'Mucinous Tubular and Spindle Cell Ca', description: 'Low grade. Elongated tubules in mucin.', pearls: ['Elongated tubules', 'Mucinous stroma', 'CK7+'] },
    'result_tubulocystic': { id: 'result_tubulocystic', type: 'result', title: 'Tubulocystic RCC', diagnosis: 'Tubulocystic RCC', description: 'Swiss cheese appearance. Hobnail cells.', pearls: ['Swiss cheese macroscopic', 'Hobnail cells', 'CD10+', 'AMACR+'] },

    // Results - Mesenchymal
    'result_aml_classic': { id: 'result_aml_classic', type: 'result', title: 'Angiomyolipoma', diagnosis: 'Angiomyolipoma (Classic)', description: 'PEComa family. Triphasic (fat, vessels, muscle).', pearls: ['Triphasic: Vessels, Muscle, Fat', 'HMB45 positive', 'Melan-A positive'] },
    'result_aml_epithelioid': { id: 'result_aml_epithelioid', type: 'result', title: 'Epithelioid AML', diagnosis: 'Epithelioid Angiomyolipoma', description: 'Malignant potential PEComa. Epithelioid cells.', pearls: ['High grade epithelioid cells', 'HMB45/Melan-A positive', 'Keratin negative', 'TFE3+ (sometimes)'] },
    'result_leiomyosarcoma': { id: 'result_leiomyosarcoma', type: 'result', title: 'Renal LMS', diagnosis: 'Renal Leiomyosarcoma', description: 'Malignant smooth muscle tumor of kidney.', pearls: ['Originates from renal vein or capsule', 'SMA/Desmin positive', 'HMB45 negative'] },
    'result_rict': { id: 'result_rict', type: 'result', title: 'Renomedullary Tumor', diagnosis: 'Renomedullary Interstitial Cell Tumor', description: 'Benign medullary fibroma. Amaranth fibers.', pearls: ['Small medullary nodule', 'Entrapped tubules at periphery', 'Bland spindle cells', 'Amaranth fibers'] },
    'result_juxtaglomerular': { id: 'result_juxtaglomerular', type: 'result', title: 'JG Cell Tumor', diagnosis: 'Juxtaglomerular Cell Tumor', description: 'Renin-secreting tumor. Hypertension.', pearls: ['Young females', 'Hypertension', 'Renin positive', 'CD34 positive'] },
    'result_haemangioblastoma': { id: 'result_haemangioblastoma', type: 'result', title: 'Renal Haemangioblastoma', diagnosis: 'Renal Haemangioblastoma', description: 'Rare in kidney. VHL association.', pearls: ['Inhibin-A positive', 'S100 positive', 'VHL syndrome'] },

    // Results - Urothelial/Other
    'result_urothelial_upper': { id: 'result_urothelial_upper', type: 'result', title: 'Urothelial Carcinoma', diagnosis: 'Urothelial Carcinoma (Upper Tract)', description: 'Invasive carcinoma of renal pelvis.', pearls: ['Infiltrative growth', 'GATA3 positive', 'Associated with Lynch syndrome'] },
    'result_lymphoma': { id: 'result_lymphoma', type: 'result', title: 'Renal Lymphoma', diagnosis: 'Renal Lymphoma', description: 'Hematologic malignancy.', pearls: ['Diffuse large B-cell most common', 'Sparsely destroys glomeruli', 'CD45 positive'] },
    'result_neuroendocrine': { id: 'result_neuroendocrine', type: 'result', title: 'Renal Neuroendocrine', diagnosis: 'Renal Neuroendocrine Tumor', description: 'Rare renal primary.', pearls: ['Salt and pepper chromatin', 'Synaptophysin positive', 'Well-differentiated'] },

    // Results - Pediatric
    'result_wilms': { id: 'result_wilms', type: 'result', title: 'Wilms Tumor', diagnosis: 'Wilms Tumor', description: 'Most common pediatric renal tumor. Triphasic.', pearls: ['Triphasic: Blastema, Epithelium, Stroma', 'WT1 nuclear'] },
    'result_ccsk': { id: 'result_ccsk', type: 'result', title: 'CCSK', diagnosis: 'Clear Cell Sarcoma of Kidney', description: 'Bone metastasizing renal tumor of childhood.', pearls: ['Chicken-wire vessels', 'Cyclin D1+', 'BCOR+', 'Bone mets'] },
    'result_rhabdoid': { id: 'result_rhabdoid', type: 'result', title: 'Rhabdoid Tumor', diagnosis: 'Rhabdoid Tumor of Kidney', description: 'Highly aggressive. SMARCB1 loss.', pearls: ['Loss of INI1 (SMARCB1)', 'Rhabdoid cells', 'High grade'] },
    'result_cmn': { id: 'result_cmn', type: 'result', title: 'Mesoblastic Nephroma', diagnosis: 'Congenital Mesoblastic Nephroma', description: 'Infantile spindle cell tumor.', pearls: ['Cellular: ETV6-NTRK3', 'Classic: Infantile fibromatosis-like'] },
    'result_cpdn': { id: 'result_cpdn', type: 'result', title: 'CPDN', diagnosis: 'Cystic Partially Differentiated Nephroblastoma', description: 'Cystic Wilms variant.', pearls: ['Multilocular cysts', 'Septa with blastema', 'Benign behavior'] },

    'result_mest': { id: 'result_mest', type: 'result', title: 'MEST / Cystic Nephroma', diagnosis: 'Mixed Epithelial and Stromal Tumor', description: 'Biphasic tumor.', pearls: ['Perimenopausal women', 'Ovarian-type stroma (ER/PR+)', 'Cysts'] }
};

// --- BLADDER / UROTHELIAL ALGORITHM ---
const BLADDER_NODES: Record<string, AlgorithmNode> = {
    'start': {
        id: 'start', type: 'start', title: 'Urothelial Neoplasms', description: 'Algorithm for bladder and urothelial tract lesions.',
        options: [{ label: 'Assess Primary Morphology', nextNodeId: 'primary_morphology' }]
    },
    'primary_morphology': {
        id: 'primary_morphology', type: 'decision', title: 'Dominant Architecture', description: 'Is the lesion papillary, flat, or invasive?',
        options: [
            { label: 'Non-Invasive Papillary', nextNodeId: 'papillary_branch' },
            { label: 'Flat Urothelial Lesion', nextNodeId: 'flat_branch' },
            { label: 'Invasive Carcinoma', nextNodeId: 'invasive_branch' }
        ]
    },
    'papillary_branch': {
        id: 'papillary_branch', type: 'decision', title: 'Papillary Grading', description: 'Evaluate architectural and cytologic atypia.',
        options: [
            { label: 'Thickened, Normal Cytology', nextNodeId: 'result_punlmp' },
            { label: 'Minimal Atypia, Organized', nextNodeId: 'result_lguc' },
            { label: 'Moderate/Severe Atypia', nextNodeId: 'result_hguc' },
            { label: 'Fibrovascular cores absent', nextNodeId: 'result_papilloma' }
        ]
    },
    'flat_branch': {
        id: 'flat_branch', type: 'decision', title: 'Flat Lesion Assessment', description: 'Distinguish reactive from CIS.',
        recommendedInitialIHC: ['CK20', 'CD44', 'p53'],
        options: [
            { label: 'Full thickness atypia, CK20+', nextNodeId: 'result_cis' },
            { label: 'Basal atypia only', nextNodeId: 'result_dysplasia' },
            { label: 'Normal umbrella cells, CD44+', nextNodeId: 'result_reactive' }
        ]
    },
    'invasive_branch': {
        id: 'invasive_branch', type: 'decision', title: 'Invasive Features', description: 'Depth of invasion and histologic subtype.',
        options: [
            { label: 'Lamina Propria Invasion (T1)', nextNodeId: 'result_t1_invasive' },
            { label: 'Muscularis Propria (T2)', nextNodeId: 'result_t2_invasive' },
            { label: 'Variant Histology', nextNodeId: 'variant_branch' }
        ]
    },
    'variant_branch': {
        id: 'variant_branch', type: 'decision', title: 'Variant Histology', description: 'Aggressive variants.',
        options: [
            { label: 'Nests in Lacunae', nextNodeId: 'result_micropapillary' },
            { label: 'Discohesive / Signet Ring', nextNodeId: 'result_plasmacytoid' },
            { label: 'Bland Nests (Deep)', nextNodeId: 'result_nested' },
            { label: 'Spindle Cell / Pleomorphic', nextNodeId: 'result_sarcomatoid' }
        ]
    },
    // Results
    'result_punlmp': { id: 'result_punlmp', type: 'result', title: 'PUNLMP', diagnosis: 'Papillary Urothelial Neoplasm of Low Malignant Potential', description: 'Thickened urothelium, normal cytology. Low recurrence risk.', pearls: ['No significant atypia', 'Not cancer, but requires follow-up'] },
    'result_lguc': { id: 'result_lguc', type: 'result', title: 'Low Grade UC', diagnosis: 'Low Grade Papillary Urothelial Carcinoma', description: 'Orderly architecture, mild nuclear variation.', pearls: ['Umbrella cells preserved', 'Rare mitoses', 'Recur but rarely progress'] },
    'result_hguc': { id: 'result_hguc', type: 'result', title: 'High Grade UC', diagnosis: 'High Grade Papillary Urothelial Carcinoma', description: 'Disordered, pleomorphic, frequent mitoses.', pearls: ['Loss of polarity', 'Full thickness atypia', 'High risk of invasion'] },
    'result_papilloma': { id: 'result_papilloma', type: 'result', title: 'Urothelial Papilloma', diagnosis: 'Urothelial Papilloma', description: 'Benign exophytic lesion.', pearls: ['Simple branching', 'Normal urothelium', 'Younger patients'] },
    'result_cis': { id: 'result_cis', type: 'result', title: 'Carcinoma In Situ', diagnosis: 'Urothelial Carcinoma In Situ (CIS)', description: 'High grade flat lesion. Precursor to invasive disease.', pearls: ['Full thickness atypia', 'CK20 full thickness', 'p53 strong diffuse', 'CD44 negative'] },
    'result_dysplasia': { id: 'result_dysplasia', type: 'result', title: 'Dysplasia', diagnosis: 'Urothelial Dysplasia', description: 'Pre-neoplastic change falling short of CIS.', pearls: ['CK20/p53 equivocal', 'Basal atypia only'] },
    'result_reactive': { id: 'result_reactive', type: 'result', title: 'Reactive Atypia', diagnosis: 'Reactive Urothelial Atypia', description: 'Inflammation-associated changes.', pearls: ['Prominent nucleoli present but uniform', 'Normal N:C ratio', 'CK20 umbrella only'] },
    'result_t1_invasive': { id: 'result_t1_invasive', type: 'result', title: 'T1 Invasive', diagnosis: 'Invasive Urothelial Carcinoma (pT1)', description: 'Invades subepithelial connective tissue (lamina propria).', pearls: ['Retraction artifact', 'Single cells', 'Desmoplasia'] },
    'result_t2_invasive': { id: 'result_t2_invasive', type: 'result', title: 'T2 Invasive', diagnosis: 'Invasive Urothelial Carcinoma (pT2)', description: 'Invades muscularis propria (detrusor muscle).', pearls: ['Thick muscle bundles', 'Radical cystectomy candidate'] },
    'result_micropapillary': { id: 'result_micropapillary', type: 'result', title: 'Micropapillary', diagnosis: 'Micropapillary Urothelial Carcinoma', description: 'Aggressive variant. Reverse polarity.', pearls: ['Nests within lacunae', 'MUC1 pattern', 'High metastatic rate'] },
    'result_plasmacytoid': { id: 'result_plasmacytoid', type: 'result', title: 'Plasmacytoid', diagnosis: 'Plasmacytoid Urothelial Carcinoma', description: 'Single discohesive cells. CD138+.', pearls: ['Loss of E-Cadherin', 'Mimics lobular breast ca', 'Peritoneal spread'] },
    'result_nested': { id: 'result_nested', type: 'result', title: 'Nested Variant', diagnosis: 'Nested Variant Urothelial Carcinoma', description: 'Deceptively bland nests invading deeply.', pearls: ['Looks benign/Von Brunn', 'Deep invasion', 'TERT promoter mut'] },
    'result_sarcomatoid': { id: 'result_sarcomatoid', type: 'result', title: 'Sarcomatoid', diagnosis: 'Sarcomatoid Urothelial Carcinoma', description: 'Biphasic malignant neoplasm.', pearls: ['Keratin positive in spindle cells', 'GATA3 variable', 'High grade'] }
};

// --- PROSTATE ALGORITHM ---
const PROSTATE_NODES: Record<string, AlgorithmNode> = {
    'start': {
        id: 'start', type: 'start', title: 'Prostate Needle Evaluation', description: 'Diagnostic approach to prostatic adenocarcinoma and mimics.',
        options: [{ label: 'Evaluate Glandular Architecture', nextNodeId: 'architecture_check' }]
    },
    'architecture_check': {
        id: 'architecture_check', type: 'decision', title: 'Architectural Pattern', description: 'Assess the gland formation and stromal relationship.',
        options: [
            { label: 'Well-formed Glands', nextNodeId: 'glandular_branch' },
            { label: 'Cribriform / Fused', nextNodeId: 'cribriform_branch' },
            { label: 'Single Cells / Sheets', nextNodeId: 'solid_branch' },
            { label: 'Basal Cell Evaluation', nextNodeId: 'basal_branch' }
        ]
    },
    'glandular_branch': {
        id: 'glandular_branch', type: 'decision', title: 'Glandular Patterns', description: 'Separating benign from cancer.',
        recommendedInitialIHC: ['p63', 'HMWCK (34BE12)', 'AMACR (P504S)'],
        options: [
            { label: 'Small crowded glands, No basals', nextNodeId: 'result_gleason3' },
            { label: 'Large branching glands, Basals+', nextNodeId: 'result_benign' },
            { label: 'Partial basal loss / Atypia', nextNodeId: 'result_asap' }
        ]
    },
    'cribriform_branch': {
        id: 'cribriform_branch', type: 'decision', title: 'Cribriform / Fused', description: 'Grade Group 2 and above features.',
        options: [
            { label: 'Invasive Cribriform', nextNodeId: 'result_gleason4' },
            { label: 'Intraductal (Basals Preserved)', nextNodeId: 'result_idcp' },
            { label: 'Glomeruloid formations', nextNodeId: 'result_glomeruloid' }
        ]
    },
    'solid_branch': {
        id: 'solid_branch', type: 'decision', title: 'Solid / Single Cells', description: 'High grade features.',
        options: [
            { label: 'Solid Sheets / Comedo', nextNodeId: 'result_gleason5' },
            { label: 'Single Infiltrating Cells', nextNodeId: 'result_gleason5_single' }
        ]
    },
    'basal_branch': {
        id: 'basal_branch', type: 'decision', title: 'Basal Cell Evaluation', description: 'IHC interpretation.',
        options: [
            { label: 'p63-/CK903- / AMACR+', nextNodeId: 'result_adenoca' },
            { label: 'p63+/CK903+ / AMACR-', nextNodeId: 'result_benign' },
            { label: 'p63+/CK903+ / AMACR+', nextNodeId: 'result_hgpin' }
        ]
    },
    // Results
    'result_gleason3': { id: 'result_gleason3', type: 'result', title: 'Gleason Pattern 3', diagnosis: 'Prostate Adenocarcinoma, Gleason 3+3=6 (GG1)', description: 'Discrete, well-formed glands. Infiltrative.', pearls: ['No cribriforming', 'Single layer of cells', 'Prominent nucleoli'] },
    'result_gleason4': { id: 'result_gleason4', type: 'result', title: 'Gleason Pattern 4', diagnosis: 'Prostate Adenocarcinoma, Gleason Pattern 4', description: 'Fused, cribriform, or poorly formed glands.', pearls: ['Loss of intervening stroma', 'Cribriform is adverse', 'Glomeruloid is 4'] },
    'result_gleason5': { id: 'result_gleason5', type: 'result', title: 'Gleason Pattern 5', diagnosis: 'Prostate Adenocarcinoma, Gleason Pattern 5', description: 'Lack of gland formation. Solid sheets or necrosis.', pearls: ['Comedonecrosis', 'Solid nests', 'Highest risk'] },
    'result_gleason5_single': { id: 'result_gleason5_single', type: 'result', title: 'Gleason 5 (Single)', diagnosis: 'Prostate Adenocarcinoma, Gleason Pattern 5', description: 'Single cells or cords. Signet ring-like.', pearls: ['Easily missed at low power', 'No glandular lumens'] },
    'result_idcp': { id: 'result_idcp', type: 'result', title: 'Intraductal Ca', diagnosis: 'Intraductal Carcinoma of Prostate (IDC-P)', description: 'Malignant cells filling ducts with preservation of basal cells.', pearls: ['Solid/Cribriform', 'Basal cells present (IHC)', 'Adverse prognostic factor'] },
    'result_hgpin': { id: 'result_hgpin', type: 'result', title: 'HGPIN', diagnosis: 'High Grade Prostatic Intraepithelial Neoplasia', description: 'Precursor lesion. Cytologic atypia within pre-existing ducts.', pearls: ['Basal cells present', 'Tufting/Micropapillary', 'Not cancer'] },
    'result_asap': { id: 'result_asap', type: 'result', title: 'ASAP', diagnosis: 'Atypical Small Acinar Proliferation', description: 'Suspicious but insufficient for diagnosis.', pearls: ['Small focus', 'Loss of basals inconclusive', 'Re-biopsy recommended'] },
    'result_benign': { id: 'result_benign', type: 'result', title: 'Benign / Atrophy', diagnosis: 'Benign Prostatic Tissue', description: 'Atrophy, adenosis, or normal glands.', pearls: ['Basal cells present', 'Corpora amylacea', 'Pale cytoplasm (atrophy)'] },
    'result_glomeruloid': { id: 'result_glomeruloid', type: 'result', title: 'Glomeruloid', diagnosis: 'Glomeruloid Pattern (Gleason 4)', description: 'Cribriform structure attached to one side of gland.', pearls: ['Counts as Pattern 4', 'Mimics glomerulus'] },
    'result_adenoca': { id: 'result_adenoca', type: 'result', title: 'Adenocarcinoma', diagnosis: 'Prostate Adenocarcinoma', description: 'Diagnosis confirmed by IHC.', pearls: ['AMACR positive (red)', 'Basals negative (brown)', 'Nucleomegaly'] }
};

// --- TESTIS ALGORITHM ---
const TESTIS_NODES: Record<string, AlgorithmNode> = {
    'start': {
        id: 'start', type: 'start', title: 'Testicular Mass', description: 'Evaluation of Germ Cell and Sex Cord-Stromal Tumors.',
        options: [{ label: 'Patient Age & Morphology', nextNodeId: 'age_morph' }]
    },
    'age_morph': {
        id: 'age_morph', type: 'decision', title: 'Primary Classification', description: 'Pre-pubertal vs Post-pubertal context.',
        options: [
            { label: 'Post-Pubertal Germ Cell', nextNodeId: 'gct_branch' },
            { label: 'Sex Cord / Stromal', nextNodeId: 'scst_branch' },
            { label: 'Older Male (>60)', nextNodeId: 'elderly_branch' }
        ]
    },
    'gct_branch': {
        id: 'gct_branch', type: 'decision', title: 'Germ Cell Tumor (GCT)', description: 'Seminoma vs Non-Seminoma.',
        recommendedInitialIHC: ['OCT4', 'CD30', 'CD117', 'PLAP', 'Glypican-3', 'AFP', 'hCG'],
        options: [
            { label: 'Solid, Lymphs, OCT4+', nextNodeId: 'result_seminoma' },
            { label: 'Glandular / Papillary, CD30+', nextNodeId: 'result_embryonal' },
            { label: 'Reticular / Microcystic, GPC3+', nextNodeId: 'result_yolk_sac' },
            { label: 'Hemorrhagic / Biphasic, hCG+', nextNodeId: 'result_choriocarcinoma' },
            { label: 'Cysts / Cartilage / Squamous', nextNodeId: 'result_teratoma' }
        ]
    },
    'scst_branch': {
        id: 'scst_branch', type: 'decision', title: 'Sex Cord Stromal', description: 'Non-germ cell neoplasms.',
        recommendedInitialIHC: ['Inhibin', 'Calretinin', 'SF-1', 'Melan-A'],
        options: [
            { label: 'Eosinophilic, Reinke Crystals', nextNodeId: 'result_leydig' },
            { label: 'Tubular formations, Pale', nextNodeId: 'result_sertoli' }
        ]
    },
    'elderly_branch': {
        id: 'elderly_branch', type: 'decision', title: 'Elderly Patient', description: 'Lymphoma and Spermatocytic Tumor.',
        options: [
            { label: 'Bland, Polymorphous, CD117-', nextNodeId: 'result_spermatocytic' },
            { label: 'Infiltrating, CD45+', nextNodeId: 'result_testis_lymphoma' }
        ]
    },
    // Results
    'result_seminoma': { id: 'result_seminoma', type: 'result', title: 'Seminoma', diagnosis: 'Classic Seminoma', description: 'Most common GCT. Fried egg cells.', pearls: ['OCT4+, CD117+, CD30-', 'Lymphocytic infiltrate', 'GCNIS background'] },
    'result_embryonal': { id: 'result_embryonal', type: 'result', title: 'Embryonal Ca', diagnosis: 'Embryonal Carcinoma', description: 'Aggressive non-seminoma.', pearls: ['CD30+, OCT4+, CD117-', 'Glandular/Papillary', 'Necrosis'] },
    'result_yolk_sac': { id: 'result_yolk_sac', type: 'result', title: 'Yolk Sac Tumor', diagnosis: 'Yolk Sac Tumor (Post-pubertal)', description: 'Reticular/microcystic patterns.', pearls: ['Glypican-3+, AFP+, SALL4+', 'Schiller-Duval bodies', 'Hyaline globules'] },
    'result_choriocarcinoma': { id: 'result_choriocarcinoma', type: 'result', title: 'Choriocarcinoma', diagnosis: 'Choriocarcinoma', description: 'Highly aggressive. Biphasic.', pearls: ['Syncytio- and Cytotrophoblasts', 'hCG+', 'Hemorrhage'] },
    'result_teratoma': { id: 'result_teratoma', type: 'result', title: 'Teratoma', diagnosis: 'Teratoma (Post-pubertal)', description: 'Somatic tissues. Malignant potential in adults.', pearls: ['Cartilage, glands, skin', 'Post-pubertal = Malignant', 'Pre-pubertal = Benign'] },
    'result_leydig': { id: 'result_leydig', type: 'result', title: 'Leydig Cell Tumor', diagnosis: 'Leydig Cell Tumor', description: 'Endocrine active. Reinke crystals.', pearls: ['Inhibin+, Calretinin+', 'Reinke crystals (30%)', 'Golden brown gross'] },
    'result_sertoli': { id: 'result_sertoli', type: 'result', title: 'Sertoli Cell Tumor', diagnosis: 'Sertoli Cell Tumor', description: 'Tubule formation.', pearls: ['Beta-catenin nuclear (some)', 'Inhibin+', 'Associated with syndromes'] },
    'result_spermatocytic': { id: 'result_spermatocytic', type: 'result', title: 'Spermatocytic Tumor', diagnosis: 'Spermatocytic Tumor', description: 'Indolent tumor of older men.', pearls: ['Three cell sizes', 'No lymphocytes', 'CD117+, OCT4-'] },
    'result_testis_lymphoma': { id: 'result_testis_lymphoma', type: 'result', title: 'Lymphoma', diagnosis: 'Testicular Lymphoma', description: 'Most common testicular tumor in elderly.', pearls: ['Diffuse Large B-cell', 'Intertubular growth', 'CD45+'] }
};

// --- SOFT TISSUE: SPINDLE CELL ALGORITHM ---
const SPINDLE_CELL_NODES: Record<string, AlgorithmNode> = {
    'start': {
        id: 'start', type: 'start', title: 'Spindle Cell Neoplasms', description: 'Diagnostic approach to deep-seated or cutaneous spindle cell tumors.',
        remainingDifferential: ['SFT', 'MPNST', 'Leiomyosarcoma', 'Synovial Sarcoma', 'Fibrosarcoma', 'DFSP', 'Spindle Cell Lipoma', 'Desmoid', 'GIST', 'Melanoma', 'Kaposi Sarcoma'],
        options: [{ label: 'Assess Pattern & Cytology', nextNodeId: 'pattern_check' }]
    },
    'pattern_check': {
        id: 'pattern_check', type: 'decision', title: 'Dominant Pattern', description: 'What is the architectural arrangement?',
        options: [
            { label: 'Fascicular / Herringbone', nextNodeId: 'fascicular_branch' },
            { label: 'Patternless / Staghorn', nextNodeId: 'sft_branch' },
            { label: 'Storiform / Cartwheel', nextNodeId: 'storiform_branch' },
            { label: 'Myxoid Background', nextNodeId: 'myxoid_branch' },
            { label: 'Plexiform / Nodular', nextNodeId: 'plexiform_branch' }
        ]
    },
    'fascicular_branch': {
        id: 'fascicular_branch', type: 'decision', title: 'Fascicular Growth', description: 'Evaluate cytology and specific markers.',
        recommendedInitialIHC: ['SMA', 'Desmin', 'S100', 'SOX10', 'H3K27me3', 'Beta-Catenin', 'TLE1', 'Pan-Keratin', 'CD117', 'DOG1'],
        options: [
            { label: 'Desmin/SMA Positive', nextNodeId: 'result_lms' },
            { label: 'S100/SOX10 Positive', nextNodeId: 'neural_branch' },
            { label: 'Beta-Catenin (Nuclear)', nextNodeId: 'result_desmoid' },
            { label: 'Keratin/TLE1 Positive', nextNodeId: 'result_synovial' },
            { label: 'CD117/DOG1 Positive', nextNodeId: 'result_gist' },
            { label: 'Diagnosis of Exclusion', nextNodeId: 'result_fibrosarcoma' }
        ]
    },
    'neural_branch': {
        id: 'neural_branch', type: 'decision', title: 'Neural Differentiation', description: 'Distinguish benign from malignant nerve sheath.',
        options: [
            { label: 'Diffuse S100, Bland', nextNodeId: 'result_schwannoma' },
            { label: 'Wavy nuclei, S100+', nextNodeId: 'result_neurofibroma' },
            { label: 'Patchy S100, H3K27me3 Loss', nextNodeId: 'result_mpnst' },
            { label: 'Pigmented, HMB45+', nextNodeId: 'result_melanoma' }
        ]
    },
    'sft_branch': {
        id: 'sft_branch', type: 'decision', title: 'Hemangiopericytoma-like', description: 'Staghorn vessels and patternless architecture.',
        recommendedInitialIHC: ['STAT6', 'CD34', 'CD99', 'BCL2', 'HHV-8', 'ERG'],
        options: [
            { label: 'STAT6 Nuclear +', nextNodeId: 'result_sft' },
            { label: 'HHV-8+, ERG+', nextNodeId: 'result_kaposi' },
            { label: 'SMA+, Glomoid cells', nextNodeId: 'result_myopericytoma' }
        ]
    },
    'storiform_branch': {
        id: 'storiform_branch', type: 'decision', title: 'Storiform Pattern', description: 'CD34 status is key.',
        recommendedInitialIHC: ['CD34', 'Factor XIIIa', 'S100'],
        options: [
            { label: 'CD34 Diffuse (Honeycomb)', nextNodeId: 'result_dfsp' },
            { label: 'CD34 Negative / Focal', nextNodeId: 'result_df' }
        ]
    },
    'plexiform_branch': {
        id: 'plexiform_branch', type: 'decision', title: 'Plexiform Growth', description: 'Consider neural or fibroblastic entities.',
        recommendedInitialIHC: ['S100', 'CD34', 'EMA'],
        options: [
            { label: 'S100 Diffuse', nextNodeId: 'result_plexiform_nf' },
            { label: 'CD34+, Spindle Cells', nextNodeId: 'result_scl' },
            { label: 'CD34+, Bland', nextNodeId: 'result_fibroblastic' }
        ]
    },
    'myxoid_branch': {
        id: 'myxoid_branch', type: 'stop', title: 'Go to Myxoid Algorithm', description: 'Evaluate vasculature and curvilinear vessels.', nextAlgorithmId: 'algo_myxoid_soft_tissue'
    },
    // Results
    'result_sft': { id: 'result_sft', type: 'result', title: 'Solitary Fibrous Tumor', diagnosis: 'Solitary Fibrous Tumor', description: 'Fibroblastic neoplasm with staghorn vessels.', confirmatoryStudies: ['NAB2-STAT6 fusion'], pearls: ['Staghorn vessels', 'Ropey collagen', 'CD34+'] },
    'result_lms': { id: 'result_lms', type: 'result', title: 'Leiomyosarcoma', diagnosis: 'Leiomyosarcoma', description: 'Malignant smooth muscle tumor.', pearls: ['Cigar nuclei', 'Perinuclear vacuoles', 'Coagulative necrosis'] },
    'result_schwannoma': { id: 'result_schwannoma', type: 'result', title: 'Schwannoma', diagnosis: 'Schwannoma', description: 'Benign nerve sheath tumor.', pearls: ['Antoni A/B', 'Verocay bodies', 'Hyalinized vessels'] },
    'result_neurofibroma': { id: 'result_neurofibroma', type: 'result', title: 'Neurofibroma', diagnosis: 'Neurofibroma', description: 'Benign nerve sheath tumor.', pearls: ['Shredded carrots collagen', 'Mast cells', 'S100+'] },
    'result_mpnst': { id: 'result_mpnst', type: 'result', title: 'MPNST', diagnosis: 'Malignant Peripheral Nerve Sheath Tumor', description: 'Malignant tumor of nerve sheath origin.', pearls: ['Marble-like pattern', 'Perivascular herniation', 'NF1 history', 'H3K27me3 loss'] },
    'result_melanoma': { id: 'result_melanoma', type: 'result', title: 'Spindle Cell Melanoma', diagnosis: 'Malignant Melanoma (Spindle Cell)', description: 'Malignant melanocytic tumor.', pearls: ['S100/SOX10 usually positive', 'HMB45/Melan-A often negative in spindle type'] },
    'result_desmoid': { id: 'result_desmoid', type: 'result', title: 'Desmoid Fibromatosis', diagnosis: 'Desmoid-type Fibromatosis', description: 'Locally aggressive fibroblastic neoplasm.', pearls: ['Infiltrative borders', 'Broad sweeping fascicles', 'Keloidal collagen'] },
    'result_synovial': { id: 'result_synovial', type: 'result', title: 'Synovial Sarcoma', diagnosis: 'Synovial Sarcoma, Monophasic', description: 'Translocation-associated sarcoma.', confirmatoryStudies: ['SS18-SSX fusion'], pearls: ['Paradoxical Keratin+', 'TLE1+', 'Deep extremity mass'] },
    'result_gist': { id: 'result_gist', type: 'result', title: 'GIST', diagnosis: 'Gastrointestinal Stromal Tumor', description: 'Mesenchymal tumor of GI tract.', confirmatoryStudies: ['KIT/PDGFRA mutation'], pearls: ['CD117+', 'DOG1+', 'Paranuclear vacuoles'] },
    'result_fibrosarcoma': { id: 'result_fibrosarcoma', type: 'result', title: 'Fibrosarcoma (NOS)', diagnosis: 'Fibrosarcoma (Adult type)', description: 'Malignant fibroblastic tumor.', pearls: ['Diagnosis of exclusion', 'Herringbone pattern', 'Variable CD34'] },
    'result_dfsp': { id: 'result_dfsp', type: 'result', title: 'DFSP', diagnosis: 'Dermatofibrosarcoma Protuberans', description: 'Locally aggressive cutaneous tumor.', confirmatoryStudies: ['COL1A1-PDGFB'], pearls: ['Honeycomb fat entrapment', 'CD34+', 'Cartwheel pattern'] },
    'result_df': { id: 'result_df', type: 'result', title: 'Dermatofibroma', diagnosis: 'Benign Fibrous Histiocytoma', description: 'Common benign skin lesion.', pearls: ['Peripheral collagen trapping', 'Factor XIIIa+'] },
    'result_kaposi': { id: 'result_kaposi', type: 'result', title: 'Kaposi Sarcoma', diagnosis: 'Kaposi Sarcoma', description: 'Vascular neoplasm associated with HHV-8.', pearls: ['Slit-like vascular spaces', 'Promontory sign', 'HHV-8 LANA+'] },
    'result_myopericytoma': { id: 'result_myopericytoma', type: 'result', title: 'Myopericytoma', diagnosis: 'Myopericytoma', description: 'Perivascular tumor.', pearls: ['Concentric growth around vessels', 'SMA+'] },
    'result_plexiform_nf': { id: 'result_plexiform_nf', type: 'result', title: 'Plexiform Neurofibroma', diagnosis: 'Plexiform Neurofibroma', description: 'Pathognomonic for NF1.', pearls: ['Bag of worms appearance', 'S100+'] },
    'result_scl': { id: 'result_scl', type: 'result', title: 'Spindle Cell Lipoma', diagnosis: 'Spindle Cell Lipoma', description: 'Benign adipocytic tumor.', pearls: ['Ropey collagen', 'CD34+', 'Retinoblastoma loss', 'Posterior neck'] },
    'result_fibroblastic': { id: 'result_fibroblastic', type: 'result', title: 'Mammary-type Fibroblastoma', diagnosis: 'Mammary-type Myofibroblastoma', description: 'Benign spindle cell tumor.', pearls: ['CD34+', 'Desmin+', 'RB1 loss'] }
};

// --- SMALL ROUND BLUE CELL TUMOR ALGORITHM ---
const SRBCT_NODES: Record<string, AlgorithmNode> = {
    'start': {
        id: 'start', type: 'start', title: 'Small Round Blue Cell Tumors', description: 'Approach to undifferentiated small round cell neoplasms.',
        options: [{ label: 'Initial Broad Panel', nextNodeId: 'initial_panel' }]
    },
    'initial_panel': {
        id: 'initial_panel', type: 'decision', title: 'Lineage Determination', description: 'CD45, Cytokeratin, Desmin, S100/SOX10, CD99.',
        options: [
            { label: 'CD45+', nextNodeId: 'result_lymphoma' },
            { label: 'Cytokeratin+', nextNodeId: 'carcinoma_branch' },
            { label: 'Desmin/Myogenin+', nextNodeId: 'result_rms' },
            { label: 'CD99+ / NKX2.2+', nextNodeId: 'result_ewing' },
            { label: 'S100/SOX10+', nextNodeId: 'result_melanoma_pnet' },
            { label: 'WT1+ / Desmin+ / Keratin+', nextNodeId: 'result_dsrct' }
        ]
    },
    'carcinoma_branch': {
        id: 'carcinoma_branch', type: 'decision', title: 'Carcinoma / Neuroendocrine', description: 'Distinguish carcinoma types.',
        options: [
            { label: 'CK20 Dot-like / Neuroendocrine', nextNodeId: 'result_merkel' },
            { label: 'TTF1+ / Neuroendocrine', nextNodeId: 'result_sclc' },
            { label: 'NUT Nuclear (Speckled)', nextNodeId: 'result_nut' }
        ]
    },
    // Results
    'result_lymphoma': { id: 'result_lymphoma', type: 'result', title: 'Lymphoma', diagnosis: 'Lymphoma/Leukemia', description: 'Hematopoietic malignancy.', confirmatoryStudies: ['Flow Cytometry'], pearls: ['Always exclude first'] },
    'result_rms': { id: 'result_rms', type: 'result', title: 'Rhabdomyosarcoma', diagnosis: 'Rhabdomyosarcoma', description: 'Skeletal muscle differentiation.', confirmatoryStudies: ['PAX3-FOXO1 (Alveolar)'], pearls: ['Myogenin is nuclear', 'Desmin is cytoplasmic'] },
    'result_ewing': { id: 'result_ewing', type: 'result', title: 'Ewing Sarcoma', diagnosis: 'Ewing Sarcoma', description: 'Undifferentiated sarcoma.', confirmatoryStudies: ['EWSR1-FLI1'], pearls: ['Membranous CD99', 'NKX2.2'] },
    'result_melanoma_pnet': { id: 'result_melanoma_pnet', type: 'result', title: 'Melanoma / PNET', diagnosis: 'Melanoma or Peripheral Neuroectodermal Tumor', description: 'Neural crest origin.', pearls: ['HMB45/Melan-A for Melanoma'] },
    'result_dsrct': { id: 'result_dsrct', type: 'result', title: 'DSRCT', diagnosis: 'Desmoplastic Small Round Cell Tumor', description: 'Polyphenotypic tumor.', confirmatoryStudies: ['EWSR1-WT1'], pearls: ['Co-expression of CK, Desmin, WT1'] },
    'result_merkel': { id: 'result_merkel', type: 'result', title: 'Merkel Cell Ca', diagnosis: 'Merkel Cell Carcinoma', description: 'Cutaneous neuroendocrine.', pearls: ['CK20 dot-like', 'MCPyV'] },
    'result_sclc': { id: 'result_sclc', type: 'result', title: 'Small Cell Lung Ca', diagnosis: 'Small Cell Carcinoma', description: 'High grade neuroendocrine.', pearls: ['TTF1+', 'Crush artifact'] },
    'result_nut': { id: 'result_nut', type: 'result', title: 'NUT Carcinoma', diagnosis: 'NUT Midline Carcinoma', description: 'Aggressive squamous-like.', pearls: ['NUT nuclear speckled', 'Midline location'] }
};



// --- MECHANISM-FIRST RENAL ALGORITHM ---
const RENAL_MECHANISM_NODES: Record<string, AlgorithmNode> = {
    'start': {
        id: 'start', type: 'start', title: 'Mechanism-First Renal Decision Tree',
        description: '**Core Concept:** Instead of just morphology, ask: *What molecular program is active?*\n\nThis tree traces the broken biochemical systems:\n- Oxygen Sensing (VHL)\n- Fatty Acid Metabolism\n- Krebs Cycle\n- Lysosomal Biogenesis\n- Chromatin Remodeling',
        options: [{ label: 'Start Biochemical Analysis', nextNodeId: 'step1' }]
    },
    'step1': {
        id: 'step1', type: 'decision', title: 'Step 1: Renal Epithelial Lineage',
        description: '**Is the nephric transcriptional program active?**\n\n**Marker Mechanism:**\n- **PAX8**: Paired-box transcription factor; activates renal epithelial gene sets.\n- **WT1**: Metanephric differentiation program.\n\n**Principle**: These factors establish renal identity upstream of morphology.',
        options: [
            { label: 'PAX8 Positive (+)', nextNodeId: 'step2' },
            { label: 'PAX8 Negative (-)', nextNodeId: 'stop_non_renal' }
        ]
    },
    'stop_non_renal': {
        id: 'stop_non_renal', type: 'stop', title: 'Consider Non-Renal Neoplasm',
        description: '**Mechanism Fail:** The renal epithelial program is inactive.\n\n**Consider:**\n- Urothelial Carcinoma\n- Metastatic disease\n- Adrenocortical Neoplasm\n- Hematolymphoid process',
        stopConditions: ['PAX8 Negative', 'No renal lineage markers']
    },
    'step2': {
        id: 'step2', type: 'decision', title: 'Step 2: Hypoxia / Pseudohypoxia',
        description: '**Is the VHL–HIF oxygen-sensing axis broken?**\n\n**Marker Mechanism:**\n- **CAIX**: HIF-1α target for pH regulation.\n- **Vimentin**: EMT / hypoxia-associated cytoskeletal shift.\n\n**Biochemical Logic:** VHL loss → HIF stabilization → Constitutive "Hypoxia" → CAIX induction.',
        options: [
            { label: 'Diffuse CAIX ("Box-like") + PAX8+', nextNodeId: 'result_ccrcc_mech' },
            { label: 'Focal / Negative CAIX', nextNodeId: 'step3' }
        ]
    },
    'step3': {
        id: 'step3', type: 'decision', title: 'Step 3: Metabolic Reprogramming',
        description: '**Is there Fatty Acid or Krebs Cycle derangement?**\n\n**3A. Branched-Chain Fatty Acid Metabolism**\n- **AMACR**: Peroxisomal β-oxidation enzyme.\n\n**3B. Krebs Cycle Failure (Oncometabolites)**\n- **FH loss**: Fumarate accumulation (Pseudo-hypoxia).\n- **SDHB loss**: Succinate accumulation (DNA hypermethylation).',
        options: [
            { label: 'AMACR+ / CK7+', nextNodeId: 'result_papillary_mech' },
            { label: 'FH Loss / 2SC+', nextNodeId: 'result_hlrcc_mech' },
            { label: 'SDHB Loss', nextNodeId: 'result_sdh_mech' },
            { label: 'None of the above', nextNodeId: 'step4' }
        ]
    },
    'step4': {
        id: 'step4', type: 'decision', title: 'Step 4: MiTF / TFE Program',
        description: '**Is the Lysosomal–Melanocytic program active?**\n\n**Marker Mechanism:**\n- **Cathepsin-K**: MiTF-driven lysosomal protease.\n- **TFE3/TFEB**: MiT family transcription factors.\n\n**Insight:** These tumors behave like "lysosome-addicted" cancers.',
        options: [
            { label: 'Cathepsin-K+ / TFE3+', nextNodeId: 'result_translocation_mech' },
            { label: 'Standard TFE Program Absent', nextNodeId: 'step5' }
        ]
    },
    'step5': {
        id: 'step5', type: 'decision', title: 'Step 5: Distal Nephron Biology',
        description: '**Is the Mitochondria-rich acid–base machinery active?**\n\n**Marker Mechanism:**\n- **CK7**: Distal tubular cytoskeleton.\n- **c-KIT (CD117)**: Stem cell factor receptor.\n- **Vimentin**: Usually NEGATIVE (unlike proximal types).',
        options: [
            { label: 'CK7+ / c-KIT+ / Vimentin-', nextNodeId: 'result_chromophobe_mech' },
            { label: 'CK7- / c-KIT+ / Vimentin-', nextNodeId: 'result_oncocytoma_mech' },
            { label: 'Neither', nextNodeId: 'step6' }
        ]
    },
    'step6': {
        id: 'step6', type: 'decision', title: 'Step 6: Melanocytic / PEComa',
        description: '**Is the mTOR / MiTF overlap program active?**\n\n**Marker Mechanism:**\n- **HMB45 / Melan-A**: Melanosome-associated proteins.\n- **SMA / Calponin**: Perivascular smooth muscle.\n\n**Consequence:** Increased protein synthesis & cell size (mTOR driven).',
        options: [
            { label: 'Melanocytic + Muscle Markers', nextNodeId: 'result_aml_mech' },
            { label: 'Negative', nextNodeId: 'step7' }
        ]
    },
    'step7': {
        id: 'step7', type: 'decision', title: 'Step 7: Developmental Arrest',
        description: '**Is this Embryonal / Metanephric programming?**\n\n**Marker Mechanism:**\n- **WT1**: Nephrogenesis.\n- **CD57**: Embryonal adhesion glycoepitope.\n- **BRAF V600E**: MAPK driver (in Metanephric Adenoma).',
        options: [
            { label: 'WT1+ / CD57+ / BRAF+', nextNodeId: 'result_metanephric_mech' },
            { label: 'WT1+ (Pediatric Context)', nextNodeId: 'result_wilms_mech' },
            { label: 'Negative', nextNodeId: 'step8' }
        ]
    },
    'step8': {
        id: 'step8', type: 'decision', title: 'Step 8: Chromatin Remodeling Failure',
        description: '**Is this High-Grade with SWI/SNF failure?**\n\n**Marker Mechanism:**\n- **INI1 loss**: SWI/SNF chromatin complex failure.\n- **OCT4**: Stemness reprogramming.\n\n**Context:** Inflammatory & desmoplastic microenvironment.',
        options: [
            { label: 'INI1 Loss / OCT4+', nextNodeId: 'result_rmc_mech' },
            { label: 'PAX8+ / AMACR+ / High Grade', nextNodeId: 'result_papillary_hg_mech' },
            { label: 'Negative', nextNodeId: 'step9' }
        ]
    },
    'step9': {
        id: 'step9', type: 'decision', title: 'Step 9: Urothelial Biology',
        description: '**Is this actually Urothelial differentiation?**\n\n**Marker Mechanism:**\n- **GATA3**: Urothelial transcription factor.\n- **p63 / p40**: Basal stratified epithelium program.\n\n**Pitfall:** Up to 20% of upper tract UC are PAX8+.',
        options: [
            { label: 'GATA3+ / p63+', nextNodeId: 'result_urothelial_mech' },
            { label: 'None of the above', nextNodeId: 'result_unclassified' }
        ]
    },
    // --- MECHANISM RESULTS ---
    'result_ccrcc_mech': {
        id: 'result_ccrcc_mech', type: 'result', title: 'Clear Cell RCC', diagnosis: 'Clear Cell RCC',
        description: '**Mechanism:** VHL loss → HIF stabilization → CAIX induction + Angiogenesis.\n\n**Key:** Diffuse membranous CAIX ("Box").',
        pearls: ['Oxygen sensing failure', 'Glycolytic shift (Warburg)', 'Vascular recruitment']
    },
    'result_papillary_mech': {
        id: 'result_papillary_mech', type: 'result', title: 'Papillary RCC', diagnosis: 'Papillary RCC',
        description: '**Mechanism:** Lipid Metabolism Derangement.\n\n**Key:** AMACR+ (Fatty acid oxidation) / CK7+.',
        pearls: ['Mitochondrial/Lipid shift', 'Trisomy 7/17 (MET copy number)']
    },
    'result_hlrcc_mech': {
        id: 'result_hlrcc_mech', type: 'result', title: 'HLRCC', diagnosis: 'FH-Deficient RCC',
        description: '**Mechanism:** Krebs Cycle Failure (FH Loss).\n\n**Key:** Accumulation of Fumarate → 2SC adducts.',
        pearls: ['Oncometabolite driven', 'Pseudohypoxia without VHL loss']
    },
    'result_sdh_mech': {
        id: 'result_sdh_mech', type: 'result', title: 'SDH-Deficient RCC', diagnosis: 'SDH-Deficient RCC',
        description: '**Mechanism:** Krebs Cycle Failure (SDH Loss).\n\n**Key:** Succinate accumulation → DNA hypermethylation.',
        pearls: ['Mitochondrial complex II failure', 'Epigenetic reprogramming']
    },
    'result_translocation_mech': {
        id: 'result_translocation_mech', type: 'result', title: 'Translocation RCC', diagnosis: 'MiT Family Translocation RCC',
        description: '**Mechanism:** MiTF/TFE Transcriptional Drive.\n\n**Key:** Cathepsin-K+ / TFE3+ / Melanocytic markers.',
        pearls: ['Lysosomal biogenesis program', 'Fusion protein driven']
    },
    'result_chromophobe_mech': {
        id: 'result_chromophobe_mech', type: 'result', title: 'Chromophobe RCC', diagnosis: 'Chromophobe RCC',
        description: '**Mechanism:** Distal Nephron / Intercalated Cell Defect.\n\n**Key:** CK7+ / c-KIT+ / Vimentin-.\n\n**Note:** Dysfunctional mitochondria.',
        pearls: ['Intercalated cell lineage', 'Mitochondrial accumulation']
    },
    'result_oncocytoma_mech': {
        id: 'result_oncocytoma_mech', type: 'result', title: 'Oncocytoma', diagnosis: 'Oncocytoma',
        description: '**Mechanism:** Benign Mitochondrial Hyperplasia.\n\n**Key:** CK7- / c-KIT+.\n\n**Note:** Energy dysregulation without malignancy.',
        pearls: ['Mitochondrial overload', 'Lacks invasive drive']
    },
    'result_aml_mech': {
        id: 'result_aml_mech', type: 'result', title: 'Angiomyolipoma', diagnosis: 'Angiomyolipoma',
        description: '**Mechanism:** mTOR / Melanocytic Program.\n\n**Key:** HMB45+ / SMA+ co-expression.',
        pearls: ['PEComa family', 'mTOR activation']
    },
    'result_metanephric_mech': {
        id: 'result_metanephric_mech', type: 'result', title: 'Metanephric Adenoma', diagnosis: 'Metanephric Adenoma',
        description: '**Mechanism:** Developmental Arrest (Nephrogenesis).\n\n**Key:** WT1+ / CD57+ / BRAF V600E+.',
        pearls: ['Embryonal program retention', 'MAPK driver']
    },
    'result_wilms_mech': {
        id: 'result_wilms_mech', type: 'result', title: 'Wilms Tumor', diagnosis: 'Wilms Tumor',
        description: '**Mechanism:** Nephrogenic Rest Persistence.\n\n**Key:** WT1+ (Triphasic).',
        pearls: ['Pediatric context', 'Failure of differentiation']
    },
    'result_rmc_mech': {
        id: 'result_rmc_mech', type: 'result', title: 'Renal Medullary Ca', diagnosis: 'Renal Medullary Carcinoma',
        description: '**Mechanism:** SWI/SNF Chromatin Remodeling Failure.\n\n**Key:** INI1 Loss / OCT4+.',
        pearls: ['Epigenetic catastrophe', 'Dedifferentiation']
    },
    'result_papillary_hg_mech': {
        id: 'result_papillary_hg_mech', type: 'result', title: 'High-Grade Papillary', diagnosis: 'High-Grade Papillary RCC',
        description: '**Mechanism:** Aggressive Transformation.',
        pearls: ['Type 2 features', 'Check FH/SDH']
    },
    'result_urothelial_mech': {
        id: 'result_urothelial_mech', type: 'result', title: 'Urothelial Carcinoma', diagnosis: 'Urothelial Carcinoma',
        description: '**Mechanism:** Stratified Epithelial Differentiation.\n\n**Key:** GATA3+ / p63+.',
        pearls: ['Non-renal lineage', 'Pelvic origin']
    },
    'result_unclassified': {
        id: 'result_unclassified', type: 'stop', title: 'Unclassified / Rare',
        description: 'The tumor does not fit the common biochemical pathways. Consider rare entities or molecular sequencing.',
        stopConditions: ['Consult recommended']
    }
};

export const ALGORITHMS: DiagnosticAlgorithm[] = [
    { id: 'algo_cup', title: 'Carcinoma of Unknown Primary', category: 'General', summary: 'Universal algorithm for metastatic carcinomas using CK7/CK20.', startNodeId: 'start', nodes: CARCINOMA_NODES },
    { id: 'algo_renal', title: 'Renal Mass Evaluation', category: 'GU', summary: 'Comprehensive approach to kidney neoplasms (Epithelial, Mesenchymal, & Hematologic) based on WHO 5th Ed.', startNodeId: 'start', nodes: RENAL_NODES },
    { id: 'algo_bladder', title: 'Urothelial Neoplasms', category: 'GU', summary: 'Grading and invasion assessment for bladder lesions.', startNodeId: 'start', nodes: BLADDER_NODES },
    { id: 'algo_prostate', title: 'Prostate Needle Core', category: 'GU', summary: 'Gleason grading, mimickers, and IHC interpretation.', startNodeId: 'start', nodes: PROSTATE_NODES },
    { id: 'algo_testis', title: 'Testicular Mass Workup', category: 'GU', summary: 'Germ cell tumors and sex cord-stromal tumors.', startNodeId: 'start', nodes: TESTIS_NODES },
    { id: 'algo_spindle_soft_tissue', title: 'Spindle Cell Neoplasms', category: 'Soft Tissue', summary: 'Comprehensive workup for spindle cell tumors.', startNodeId: 'start', nodes: SPINDLE_CELL_NODES },
    { id: 'algo_srbct', title: 'Small Round Blue Cell Tumors', category: 'General', summary: 'Differential for undifferentiated small round cell neoplasms.', startNodeId: 'start', nodes: SRBCT_NODES },
    { id: 'algo_renal_mechanism', title: 'Renal Tumors: Mechanism-First', category: 'GU', summary: 'Biochemical and pathway-driven approach to renal neoplasia (VHL, mTOR, Krebs Cycle, etc).', startNodeId: 'start', nodes: RENAL_MECHANISM_NODES }
];

export const getAlgorithm = (id: string): DiagnosticAlgorithm | undefined => {
    return ALGORITHMS.find(a => a.id === id);
};
