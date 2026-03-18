
import type { DiagnosticAlgorithm, AlgorithmNode } from '../types';

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

// --- SOFT TISSUE: EPITHELIOID ALGORITHM ---
const EPITHELIOID_NODES: Record<string, AlgorithmNode> = {
    'start': {
        id: 'start', type: 'start', title: 'Epithelioid Soft Tissue Tumors', description: 'Rule out carcinoma and melanoma first.',
        options: [{ label: 'Initial Panel', nextNodeId: 'broad_screen' }]
    },
    'broad_screen': {
        id: 'broad_screen', type: 'decision', title: 'Broad Lineage', description: 'Keratin, S100, Vascular markers.',
        recommendedInitialIHC: ['Pan-Keratin', 'S100', 'SOX10', 'CD31', 'ERG', 'INI1', 'CD34', 'CAMTA1', 'TFE3'],
        options: [
            { label: 'Keratin Strong +', nextNodeId: 'keratin_branch' },
            { label: 'S100 / SOX10 +', nextNodeId: 'melanocytic_branch' },
            { label: 'Vascular Markers +', nextNodeId: 'vascular_branch' },
            { label: 'INI1 Loss (rhabdoid)', nextNodeId: 'ini1_loss_branch' },
            { label: 'All Negative', nextNodeId: 'uncertain_branch' }
        ]
    },
    'keratin_branch': {
        id: 'keratin_branch', type: 'decision', title: 'Keratin Positive', description: 'Carcinoma vs Epithelioid Sarcoma.',
        options: [
            { label: 'CD34+, INI1 Loss', nextNodeId: 'result_epith_sarcoma' },
            { label: 'History of CA / p63+ / TTF1+', nextNodeId: 'result_metastasis' },
            { label: 'ERG+ / CD31+', nextNodeId: 'result_angio' },
            { label: 'Desmin+, Myogenin-', nextNodeId: 'result_desmoplastic_scc' } // Mimic
        ]
    },
    'melanocytic_branch': {
        id: 'melanocytic_branch', type: 'decision', title: 'Melanocytic / Neural', description: 'Melanoma vs PEComa vs Nerve sheath.',
        options: [
            { label: 'HMB45+, Melan-A+', nextNodeId: 'result_melanoma' },
            { label: 'TFE3+, Smooth Muscle+', nextNodeId: 'result_pecoma' },
            { label: 'S100+, HMB45+, EWSR1-ATF1', nextNodeId: 'result_ccs' },
            { label: 'S100+, EMA+, Granular', nextNodeId: 'result_granular_cell' }
        ]
    },
    'vascular_branch': {
        id: 'vascular_branch', type: 'decision', title: 'Vascular Differentiation', description: 'Malignant vs Borderline.',
        options: [
            { label: 'Atypia, Multilayering', nextNodeId: 'result_angio' },
            { label: 'Cords, Myxoid, CAMTA1+', nextNodeId: 'result_ehe' },
            { label: 'Solid, Glomoid, SMA+', nextNodeId: 'result_glomus' }
        ]
    },
    'ini1_loss_branch': {
        id: 'ini1_loss_branch', type: 'decision', title: 'INI1 (SMARCB1) Deficient', description: 'Key diagnostic group.',
        options: [
            { label: 'Proximal/Acral, CD34+', nextNodeId: 'result_epith_sarcoma' },
            { label: 'Kidney/Soft Tissue, Children', nextNodeId: 'result_rhabdoid' },
            { label: 'Deep Axial, S100+ (focal)', nextNodeId: 'result_mpnst_epithelioid' }
        ]
    },
    'uncertain_branch': {
        id: 'uncertain_branch', type: 'decision', title: 'Uncertain Lineage', description: 'Consider ASPS.',
        options: [
            { label: 'TFE3+, Granular cyto', nextNodeId: 'result_asps' },
            { label: 'Myogenin+ (Alveolar)', nextNodeId: 'result_rms' },
            { label: 'MUC4+, Low Grade', nextNodeId: 'result_sef' }
        ]
    },
    // Results
    'result_metastasis': { id: 'result_metastasis', type: 'stop', title: 'Metastatic Carcinoma', description: 'Most common "sarcoma" is a carcinoma.' },
    'result_epith_sarcoma': { id: 'result_epith_sarcoma', type: 'result', title: 'Epithelioid Sarcoma', diagnosis: 'Epithelioid Sarcoma', description: 'Malignant mesenchymal tumor with epithelial features.', pearls: ['Classic distal type (Hand)', 'Proximal type (Pelvis/Trunk)', 'INI1 loss is diagnostic', 'CD34+'] },
    'result_angio': { id: 'result_angio', type: 'result', title: 'Epithelioid Angiosarcoma', diagnosis: 'Epithelioid Angiosarcoma', description: 'Malignant vascular tumor.', pearls: ['Keratin can be positive!', 'Look for intracytoplasmic lumina', 'CD31/ERG+'] },
    'result_melanoma': { id: 'result_melanoma', type: 'result', title: 'Melanoma', diagnosis: 'Metastatic Melanoma', description: 'Malignant melanocytic tumor.', pearls: ['Great mimicker', 'SOX10+'] },
    'result_pecoma': { id: 'result_pecoma', type: 'result', title: 'PEComa', diagnosis: 'PEComa (Perivascular Epithelioid Cell Tumor)', description: 'Mesenchymal tumor with perivascular epithelioid cells.', pearls: ['Co-expression of melanocytic (HMB45) and smooth muscle (SMA) markers', 'TFE3 rearrangement in some'] },
    'result_ccs': { id: 'result_ccs', type: 'result', title: 'Clear Cell Sarcoma', diagnosis: 'Clear Cell Sarcoma (Melanoma of Soft Parts)', description: 'Malignant tumor associated with tendons/aponeuroses.', confirmatoryStudies: ['EWSR1-ATF1'], pearls: ['Deep tendons/aponeuroses', 'S100/HMB45 positive', 'Melan-A often negative'] },
    'result_ehe': { id: 'result_ehe', type: 'result', title: 'EHE', diagnosis: 'Epithelioid Hemangioendothelioma', description: 'Vascular tumor with intermediate malignancy.', confirmatoryStudies: ['WWTR1-CAMTA1', 'YAP1-TFE3'], pearls: ['Blister cells', 'Myxohyaline stroma', 'Cords/Strands'] },
    'result_rhabdoid': { id: 'result_rhabdoid', type: 'result', title: 'Malignant Rhabdoid Tumor', diagnosis: 'Malignant Rhabdoid Tumor', description: 'Aggressive pediatric tumor.', pearls: ['Paranuclear inclusions', 'INI1 loss', 'CD99/Keratin variable'] },
    'result_asps': { id: 'result_asps', type: 'result', title: 'Alveolar Soft Part Sarcoma', diagnosis: 'Alveolar Soft Part Sarcoma', description: 'Rare sarcoma with alveolar architecture.', confirmatoryStudies: ['ASPSCR1-TFE3'], pearls: ['PAS-D crystals', 'Organoid nesting', 'Brain mets'] },
    'result_rms': { id: 'result_rms', type: 'result', title: 'Alveolar Rhabdomyosarcoma', diagnosis: 'Alveolar Rhabdomyosarcoma (Solid variant)', description: 'Malignant skeletal muscle tumor.', nextAlgorithmId: 'algo_srbct' },
    'result_glomus': { id: 'result_glomus', type: 'result', title: 'Glomus Tumor', diagnosis: 'Glomus Tumor', description: 'Perivascular neoplasm.', pearls: ['Round uniform cells', 'SMA+', 'Collagen IV investing individual cells'] },
    'result_mpnst_epithelioid': { id: 'result_mpnst_epithelioid', type: 'result', title: 'Epithelioid MPNST', diagnosis: 'Epithelioid MPNST', description: 'Rare variant of MPNST.', pearls: ['S100 strong (unlike conventional MPNST)', 'INI1 loss in 50%', 'Nerve association'] },
    'result_granular_cell': { id: 'result_granular_cell', type: 'result', title: 'Granular Cell Tumor', diagnosis: 'Granular Cell Tumor', description: 'Neural tumor with granular cytoplasm.', pearls: ['S100+', 'CD68+', 'Inhibin+', 'Pustulo-ovoid bodies'] },
    'result_sef': { id: 'result_sef', type: 'result', title: 'Sclerosing Epithelioid Fibrosarcoma', diagnosis: 'Sclerosing Epithelioid Fibrosarcoma', description: 'Rare fibrosarcoma variant.', confirmatoryStudies: ['EWSR1-CREB3L1'], pearls: ['MUC4+', 'Dense collagenous stroma', 'Cords of epithelioid cells'] }
};

// --- SOFT TISSUE: MYXOID ALGORITHM ---
const MYXOID_NODES: Record<string, AlgorithmNode> = {
    'start': {
        id: 'start', type: 'start', title: 'Myxoid Soft Tissue Tumors', description: 'Differential of MFS, Myxoid LPS, LGFMS, and benign mimics.',
        options: [{ label: 'Assess Vasculature & Cellularity', nextNodeId: 'vascular_check' }]
    },
    'vascular_check': {
        id: 'vascular_check', type: 'decision', title: 'Vascular Pattern', description: 'The capillaries often define the entity.',
        options: [
            { label: 'Chicken-wire / Plexiform', nextNodeId: 'result_myxoid_lps' },
            { label: 'Curvilinear / Prominent', nextNodeId: 'atypia_check' },
            { label: 'Arcades / Whorled', nextNodeId: 'result_lgfms' },
            { label: 'Inconspicuous / Bland', nextNodeId: 'bland_check' }
        ]
    },
    'atypia_check': {
        id: 'atypia_check', type: 'decision', title: 'Cytologic Atypia', description: 'Is there hyperchromasia and pleomorphism?',
        options: [
            { label: 'Yes (High Grade)', nextNodeId: 'result_mfs' },
            { label: 'No (Bland/Low Grade)', nextNodeId: 'result_lgfms' }
        ]
    },
    'bland_check': {
        id: 'bland_check', type: 'decision', title: 'Specific Cell Types', description: 'Look for lipoblasts, stellate cells, or nerves.',
        recommendedInitialIHC: ['CD34', 'S100', 'MUC4', 'SMA', 'Desmin'],
        options: [
            { label: 'Stellate cells, CD34+', nextNodeId: 'result_myxoma' },
            { label: 'Spindle cells, S100+', nextNodeId: 'result_nerve_sheath' },
            { label: 'Rhabdomyoblasts', nextNodeId: 'result_rms' },
            { label: 'Physaliphorous cells', nextNodeId: 'result_chordoma' }
        ]
    },
    'result_myxoid_lps': { id: 'result_myxoid_lps', type: 'result', title: 'Myxoid Liposarcoma', diagnosis: 'Myxoid Liposarcoma', description: 'Liposarcoma with myxoid matrix.', confirmatoryStudies: ['FUS-DDIT3'], pearls: ['Lipoblasts', 'Pulmonary mets rare', 'Chicken-wire vessels', 'Round cell component = High grade'] },
    'result_mfs': { id: 'result_mfs', type: 'result', title: 'Myxofibrosarcoma', diagnosis: 'Myxofibrosarcoma', description: 'Myxoid malignant fibroblastic tumor.', pearls: ['Curvilinear vessels', 'Perivascular tumor condensation', 'Pseudolipoblasts', 'Infiltrative borders'] },
    'result_lgfms': { id: 'result_lgfms', type: 'result', title: 'LGFMS', diagnosis: 'Low-grade Fibromyxoid Sarcoma', description: 'Bland but metastasizing sarcoma.', confirmatoryStudies: ['MUC4', 'FUS-CREB3L2'], pearls: ['Giant rosettes', 'Arcade vessels', 'Bland but metastasizes late'] },
    'result_myxoma': { id: 'result_myxoma', type: 'result', title: 'Intramuscular Myxoma', diagnosis: 'Intramuscular Myxoma', description: 'Benign myxoid tumor.', pearls: ['GNAS mutations', 'Paucity of vessels', 'Atrophic muscle at rim', 'No atypia'] },
    'result_nerve_sheath': { id: 'result_nerve_sheath', type: 'result', title: 'Myxoid Nerve Sheath', diagnosis: 'Neurofibroma / Schwannoma (Myxoid)', description: 'Benign nerve sheath tumor with myxoid change.', pearls: ['S100 positive', 'Wagner-Meissner bodies', 'Shredded carrots collagen'] },
    'result_rms': { id: 'result_rms', type: 'result', title: 'Embryonal RMS', diagnosis: 'Embryonal Rhabdomyosarcoma', description: 'Primitive mesenchymal tumor.', nextAlgorithmId: 'algo_srbct' },
    'result_chordoma': { id: 'result_chordoma', type: 'result', title: 'Chordoma', diagnosis: 'Chordoma', description: 'Notochordal tumor.', confirmatoryStudies: ['Brachyury'], pearls: ['Physaliphorous cells', 'Axial skeleton', 'Keratin/S100+'] }
};

// --- SOFT TISSUE: LIPOMATOUS ALGORITHM ---
const LIPOMATOUS_NODES: Record<string, AlgorithmNode> = {
    'start': {
        id: 'start', type: 'start', title: 'Adipocytic Tumors', description: 'Approach to fatty masses.',
        options: [{ label: 'Assess Atypia & Stromal Cells', nextNodeId: 'atypia_check' }]
    },
    'atypia_check': {
        id: 'atypia_check', type: 'decision', title: 'Nuclear Atypia', description: 'Are there hyperchromatic stromal cells?',
        options: [
            { label: 'Yes (Atypical)', nextNodeId: 'location_check' },
            { label: 'No (Bland)', nextNodeId: 'bland_branch' },
            { label: 'Pleomorphic Lipoblasts', nextNodeId: 'result_pleomorphic_lps' }
        ]
    },
    'location_check': {
        id: 'location_check', type: 'decision', title: 'Anatomic Location', description: 'Location predicts behavior for atypical fatty tumors.',
        options: [
            { label: 'Extremity / Subcutaneous', nextNodeId: 'result_alt' },
            { label: 'Retroperitoneum / Deep', nextNodeId: 'result_wdlps' }
        ]
    },
    'bland_branch': {
        id: 'bland_branch', type: 'decision', title: 'Specific Features', description: 'Vascular thrombi, ropey collagen, or brown fat.',
        options: [
            { label: 'Fibrin Thrombi', nextNodeId: 'result_angiolipoma' },
            { label: 'Ropey Collagen / Spindled', nextNodeId: 'result_scl' },
            { label: 'Pure Fat', nextNodeId: 'result_lipoma' },
            { label: 'Multivacuolated / Brown', nextNodeId: 'result_hibernoma' },
            { label: 'Adrenal / Smooth Muscle', nextNodeId: 'result_myelolipoma' }
        ]
    },
    'result_alt': { id: 'result_alt', type: 'result', title: 'ALT', diagnosis: 'Atypical Lipomatous Tumor', description: 'Locally aggressive adipocytic tumor.', confirmatoryStudies: ['MDM2 Amplification'], pearls: ['Does not metastasize unless dedifferentiated'] },
    'result_wdlps': { id: 'result_wdlps', type: 'result', title: 'WDLPS', diagnosis: 'Well-Differentiated Liposarcoma', description: 'Malignant adipocytic tumor.', confirmatoryStudies: ['MDM2 Amplification'], pearls: ['Retroperitoneum = WDLPS (never call it lipoma)', 'Sclerosing variant mimics carcinoma'] },
    'result_pleomorphic_lps': { id: 'result_pleomorphic_lps', type: 'result', title: 'Pleomorphic Liposarcoma', diagnosis: 'Pleomorphic Liposarcoma', description: 'High-grade adipocytic sarcoma.', pearls: ['High grade sarcoma + Pleomorphic lipoblasts', 'MDM2 Negative', 'Complex karyotype'] },
    'result_angiolipoma': { id: 'result_angiolipoma', type: 'result', title: 'Angiolipoma', diagnosis: 'Angiolipoma', description: 'Benign vascular fatty tumor.', pearls: ['Painful', 'Fibrin thrombi', 'Subcutaneous'] },
    'result_scl': { id: 'result_scl', type: 'result', title: 'Spindle Cell Lipoma', diagnosis: 'Spindle Cell Lipoma', description: 'Benign adipocytic tumor with spindle cells.', pearls: ['CD34+', 'Retinoblastoma (RB1) loss', 'Posterior neck/Shoulder'] },
    'result_lipoma': { id: 'result_lipoma', type: 'result', title: 'Lipoma', diagnosis: 'Lipoma (Conventional)', description: 'Benign tumor of fat.', pearls: ['No atypia', 'Simple karyotype'] },
    'result_hibernoma': { id: 'result_hibernoma', type: 'result', title: 'Hibernoma', diagnosis: 'Hibernoma', description: 'Benign tumor of brown fat.', pearls: ['Brown fat differentiation', 'S100+', 'Mulberry cells'] },
    'result_myelolipoma': { id: 'result_myelolipoma', type: 'result', title: 'Myelolipoma/Angiomyolipoma', diagnosis: 'Angiomyolipoma (if HMB45+)', description: 'Fat containing PEComa vs Marrow elements.', pearls: ['HMB45/SMA positive for AML'] }
};

// --- BONE: SRBCT (Ewing, etc.) ---
const SRBCT_NODES: Record<string, AlgorithmNode> = {
    'start': {
        id: 'start', type: 'start', title: 'Small Round Blue Cell Tumors', description: 'Urgent differentiation required.',
        remainingDifferential: ['Lymphoma', 'Ewing Sarcoma', 'Rhabdomyosarcoma', 'DSRCT', 'Neuroblastoma', 'CIC-Sarcoma', 'BCOR-Sarcoma', 'Mesenchymal Chondrosarcoma'],
        options: [{ label: 'Start IHC Triage', nextNodeId: 'cd45_check' }]
    },
    'cd45_check': {
        id: 'cd45_check', type: 'decision', title: 'CD45 (LCA)', description: 'Is it hematopoietic?',
        options: [
            { label: 'Positive', nextNodeId: 'result_lymphoma' },
            { label: 'Negative', nextNodeId: 'cd99_check' }
        ]
    },
    'result_lymphoma': { id: 'result_lymphoma', type: 'stop', title: 'Lymphoma/Leukemia', description: 'Proceed to Hematopathology workup (TdT, CD20, CD3, etc.).' },
    'cd99_check': {
        id: 'cd99_check', type: 'decision', title: 'CD99 Expression', description: 'Strong membranous positivity?',
        recommendedInitialIHC: ['CD99', 'NKX2.2', 'Desmin', 'Myogenin', 'WT1', 'Keratin', 'Synaptophysin'],
        options: [
            { label: 'Strong Diffuse +', nextNodeId: 'ewing_branch' },
            { label: 'Negative / Weak', nextNodeId: 'muscle_check' }
        ]
    },
    'ewing_branch': {
        id: 'ewing_branch', type: 'decision', title: 'Ewing Markers', description: 'Check NKX2.2 and Cytokeratin.',
        options: [
            { label: 'NKX2.2 +, Keratin -', nextNodeId: 'result_ewing' },
            { label: 'Keratin +, Desmin +', nextNodeId: 'result_dsrct' },
            { label: 'TdT +', nextNodeId: 'result_lbl' },
            { label: 'NKX2.2 -', nextNodeId: 'result_cic' },
            { label: 'Synaptophysin +', nextNodeId: 'result_synovial_poor' }
        ]
    },
    'muscle_check': {
        id: 'muscle_check', type: 'decision', title: 'Myogenic Markers', description: 'Desmin and Myogenin.',
        options: [
            { label: 'Myogenin +', nextNodeId: 'result_rms' },
            { label: 'BCOR +', nextNodeId: 'result_bcor' },
            { label: 'Synaptophysin +', nextNodeId: 'result_neuroblastoma' },
            { label: 'SOX10/S100 +', nextNodeId: 'result_mpnst_epith' },
            { label: 'HEY1-NCOA2', nextNodeId: 'result_mes_chondro' }
        ]
    },
    'result_ewing': { id: 'result_ewing', type: 'result', title: 'Ewing Sarcoma', diagnosis: 'Ewing Sarcoma', description: 'Primitive round cell sarcoma.', confirmatoryStudies: ['EWSR1 rearrangement'], pearls: ['CD99 membranous', 'NKX2.2 nuclear', 'Glycogen (PAS+)'] },
    'result_dsrct': { id: 'result_dsrct', type: 'result', title: 'DSRCT', diagnosis: 'Desmoplastic Small Round Cell Tumor', description: 'Aggressive sarcoma with polyphenotypic differentiation.', confirmatoryStudies: ['EWSR1-WT1', 'WT1 C-term IHC'], pearls: ['Polyphenotypic', 'Desmoplastic stroma', 'Abdominal mass'] },
    'result_lbl': { id: 'result_lbl', type: 'result', title: 'Lymphoblastic Lymphoma', diagnosis: 'Lymphoblastic Lymphoma', description: 'Precursor lymphoid neoplasm.', pearls: ['TdT positive', 'CD99 is NOT specific for Ewing!'] },
    'result_rms': { id: 'result_rms', type: 'result', title: 'Rhabdomyosarcoma', diagnosis: 'Rhabdomyosarcoma (Alveolar/Embryonal)', description: 'Skeletal muscle malignancy.', confirmatoryStudies: ['PAX3/7-FOXO1 (for Alveolar)'], pearls: ['Myogenin is specific nucleus', 'Cambium layer (Embryonal)'] },
    'result_cic': { id: 'result_cic', type: 'result', title: 'CIC-rearranged Sarcoma', diagnosis: 'CIC-rearranged Sarcoma', description: 'Ewing-like sarcoma.', pearls: ['CD99 patchy', 'WT1 nuclear', 'More aggressive than Ewing', 'ETV4+'] },
    'result_bcor': { id: 'result_bcor', type: 'result', title: 'BCOR-rearranged Sarcoma', diagnosis: 'BCOR-CCNB3 Sarcoma', description: 'Ewing-like sarcoma.', pearls: ['Cyclin D1+', 'BCOR+', 'Bone predominant'] },
    'result_neuroblastoma': { id: 'result_neuroblastoma', type: 'result', title: 'Neuroblastoma', diagnosis: 'Neuroblastoma', description: 'Sympathetic nervous system tumor.', pearls: ['Neuropil', 'PHOX2B+', 'Catecholamines', 'Rosettes'] },
    'result_synovial_poor': { id: 'result_synovial_poor', type: 'result', title: 'Poorly Diff Synovial', diagnosis: 'Poorly Differentiated Synovial Sarcoma', description: 'Round cell variant.', confirmatoryStudies: ['SS18-SSX'], pearls: ['TLE1+', 'CD99+', 'Reduced TLE1 intensity vs monophasic'] },
    'result_mpnst_epith': { id: 'result_mpnst_epithelioid', type: 'result', title: 'Epithelioid MPNST', diagnosis: 'Epithelioid MPNST', description: 'Rare variant.', pearls: ['INI1 loss', 'S100 strong'] },
    'result_mes_chondro': { id: 'result_mes_chondro', type: 'result', title: 'Mesenchymal Chondrosarcoma', diagnosis: 'Mesenchymal Chondrosarcoma', description: 'Biphasic cartilage + small round cells.', confirmatoryStudies: ['HEY1-NCOA2'], pearls: ['Hemangiopericytoma-like vessels', 'Mature cartilage islands'] }
};

// --- BONE: MATRIX PRODUCING ---
const BONE_NODES: Record<string, AlgorithmNode> = {
    'start': {
        id: 'start', type: 'start', title: 'Bone Tumor Workup', description: 'Primary triage by matrix production and radiology.',
        options: [{ label: 'Assess Matrix', nextNodeId: 'matrix_check' }]
    },
    'matrix_check': {
        id: 'matrix_check', type: 'decision', title: 'Dominant Matrix', description: 'Is the tumor producing osteoid or cartilage?',
        options: [
            { label: 'Osteoid (Bone)', nextNodeId: 'osteoid_branch' },
            { label: 'Cartilage', nextNodeId: 'cartilage_branch' },
            { label: 'Lytic / Cystic', nextNodeId: 'lytic_branch' },
            { label: 'Small Blue Cell', nextNodeId: 'srbct_branch' }
        ]
    },
    'srbct_branch': { id: 'srbct_branch', type: 'stop', title: 'Go to SRBCT Algorithm', description: 'Rule out Ewing, Lymphoma.', nextAlgorithmId: 'algo_srbct' },
    'osteoid_branch': {
        id: 'osteoid_branch', type: 'decision', title: 'Osteoid Forming', description: 'Malignant vs Benign osteoid.',
        options: [
            { label: 'Malignant Stroma (Osteosarcoma)', nextNodeId: 'result_osteosarcoma' },
            { label: 'Benign Nidus (<2cm)', nextNodeId: 'result_osteoid_osteoma' },
            { label: 'Benign Nidus (>2cm)', nextNodeId: 'result_osteoblastoma' },
            { label: 'Surface / Parosteal', nextNodeId: 'result_parosteal' }
        ]
    },
    'cartilage_branch': {
        id: 'cartilage_branch', type: 'decision', title: 'Cartilage Forming', description: 'Cellularity and host bone entrapment.',
        options: [
            { label: 'Entraps Host Bone / Permeative', nextNodeId: 'result_chondrosarcoma' },
            { label: 'Circumscribed lobules (Medullary)', nextNodeId: 'result_enchondroma' },
            { label: 'Surface cap (Exostosis)', nextNodeId: 'result_osteochondroma' },
            { label: 'Epiphyseal / Chicken-wire calc', nextNodeId: 'result_chondroblastoma' },
            { label: 'Myxoid / Stellate cells', nextNodeId: 'result_cmf' }
        ]
    },
    'lytic_branch': {
        id: 'lytic_branch', type: 'decision', title: 'Lytic Lesion', description: 'Dominant cell type.',
        options: [
            { label: 'Giant Cells', nextNodeId: 'result_gct' },
            { label: 'Fibrous / Cystic', nextNodeId: 'fibrous_branch' },
            { label: 'Plasma Cells', nextNodeId: 'result_myeloma' }
        ]
    },
    'fibrous_branch': {
        id: 'fibrous_branch', type: 'decision', title: 'Fibro-osseous / Cystic', description: 'Stromal appearance.',
        options: [
            { label: 'Chinese Characters (Woven Bone)', nextNodeId: 'result_fd' },
            { label: 'Blood-filled spaces', nextNodeId: 'result_abc' },
            { label: 'Storiform pattern', nextNodeId: 'result_nof' },
            { label: 'Epithelial Nests', nextNodeId: 'result_adamantinoma' }
        ]
    },
    'result_osteosarcoma': { id: 'result_osteosarcoma', type: 'result', title: 'Osteosarcoma', diagnosis: 'Osteosarcoma (Conventional)', description: 'Malignant osteoid-producing tumor.', pearls: ['Production of osteoid by malignant cells', 'SATB2+', 'Sunburst radiology'] },
    'result_parosteal': { id: 'result_parosteal', type: 'result', title: 'Parosteal Osteosarcoma', diagnosis: 'Parosteal Osteosarcoma', description: 'Low-grade surface osteosarcoma.', pearls: ['Low grade', 'Surface of bone', 'MDM2 amplification', 'String sign'] },
    'result_osteoid_osteoma': { id: 'result_osteoid_osteoma', type: 'result', title: 'Osteoid Osteoma', diagnosis: 'Osteoid Osteoma', description: 'Benign osteoblastic tumor.', pearls: ['Pain relieved by aspirin', 'Nidus < 2cm', 'Nocturnal pain'] },
    'result_osteoblastoma': { id: 'result_osteoblastoma', type: 'result', title: 'Osteoblastoma', diagnosis: 'Osteoblastoma', description: 'Benign osteoblastic tumor > 2cm.', pearls: ['Histologically similar to Osteoid Osteoma but > 2cm', 'Posterior elements of spine'] },
    'result_chondrosarcoma': { id: 'result_chondrosarcoma', type: 'result', title: 'Chondrosarcoma', diagnosis: 'Chondrosarcoma', description: 'Malignant cartilage tumor.', pearls: ['Permeation of marrow fat is key feature vs Enchondroma', 'IDH1/2 mutations'] },
    'result_enchondroma': { id: 'result_enchondroma', type: 'result', title: 'Enchondroma', diagnosis: 'Enchondroma', description: 'Benign cartilage tumor.', pearls: ['Hands/Feet common', 'Circumscribed nodules', 'Ollier disease'] },
    'result_osteochondroma': { id: 'result_osteochondroma', type: 'result', title: 'Osteochondroma', diagnosis: 'Osteochondroma', description: 'Benign cartilage-capped bony projection.', pearls: ['Medullary continuity with host bone', 'EXT1/2'] },
    'result_chondroblastoma': { id: 'result_chondroblastoma', type: 'result', title: 'Chondroblastoma', diagnosis: 'Chondroblastoma', description: 'Benign epiphyseal cartilage tumor.', pearls: ['Epiphyseal', 'Chicken-wire calcification', 'H3K36M mutation', 'Grooved nuclei'] },
    'result_cmf': { id: 'result_cmf', type: 'result', title: 'Chondromyxoid Fibroma', diagnosis: 'Chondromyxoid Fibroma', description: 'Benign cartilaginous tumor.', pearls: ['Lobulated', 'Hypocellular center, hypercellular periphery', 'GRM1 rearrangement'] },
    'result_gct': { id: 'result_gct', type: 'result', title: 'Giant Cell Tumor', diagnosis: 'Giant Cell Tumor of Bone', description: 'Locally aggressive giant cell rich tumor.', confirmatoryStudies: ['H3.3 G34W'], pearls: ['Epiphysis', 'Mononuclear cells are the neoplastic component'] },
    'result_myeloma': { id: 'result_myeloma', type: 'result', title: 'Plasma Cell Myeloma', diagnosis: 'Plasma Cell Myeloma', description: 'Malignant proliferation of plasma cells.', pearls: ['CD138+', 'Kappa/Lambda restriction', 'Lytic lesions'] },
    'result_fd': { id: 'result_fd', type: 'result', title: 'Fibrous Dysplasia', diagnosis: 'Fibrous Dysplasia', description: 'Benign fibro-osseous lesion.', pearls: ['GNAS mutation', 'No osteoblastic rimming', 'Chinese characters', 'Ground glass'] },
    'result_abc': { id: 'result_abc', type: 'result', title: 'Aneurysmal Bone Cyst', diagnosis: 'Aneurysmal Bone Cyst', description: 'Benign expansile cystic lesion.', pearls: ['USP6 rearrangement', 'Fluid-fluid levels'] },
    'result_nof': { id: 'result_nof', type: 'result', title: 'Non-ossifying Fibroma', diagnosis: 'Non-ossifying Fibroma', description: 'Benign fibrous cortical defect.', pearls: ['Benign fibrous defect', 'Storiform pattern', 'Foam cells', 'Jaffe-Campanacci'] },
    'result_adamantinoma': { id: 'result_adamantinoma', type: 'result', title: 'Adamantinoma', diagnosis: 'Adamantinoma', description: 'Low-grade malignant biphasic tumor.', pearls: ['Tibia', 'Biphasic (Epithelial + Osteofibrous)', 'Keratin+'] }
};

// --- DERMPATH: EPIDERMAL ---
const EPIDERMAL_NODES: Record<string, AlgorithmNode> = {
    'start': {
        id: 'start', type: 'start', title: 'Epidermal Lesions', description: 'Common keratinocytic proliferations.',
        options: [{ label: 'Architecture', nextNodeId: 'arch_check' }]
    },
    'arch_check': {
        id: 'arch_check', type: 'decision', title: 'Growth Pattern', description: 'Exophytic vs Endophytic/Invasive.',
        options: [
            { label: 'Verrucous / Stuck-on', nextNodeId: 'exophytic_branch' },
            { label: 'Invasive / Ulcerated', nextNodeId: 'invasive_branch' }
        ]
    },
    'exophytic_branch': {
        id: 'exophytic_branch', type: 'decision', title: 'Feature Check', description: 'Horn cysts vs Koilocytes.',
        options: [
            { label: 'Horn Cysts / Basaloid', nextNodeId: 'result_sk' },
            { label: 'Koilocytes / Parakeratosis', nextNodeId: 'result_verruca' },
            { label: 'Clear Cells / Glycogen', nextNodeId: 'result_clear_cell_acanthoma' },
            { label: 'Porokeratotic columns', nextNodeId: 'result_porokeratosis' }
        ]
    },
    'invasive_branch': {
        id: 'invasive_branch', type: 'decision', title: 'Invasion Type', description: 'Crateriform vs infiltrative.',
        options: [
            { label: 'Crater / Glassy', nextNodeId: 'result_ka' },
            { label: 'Infiltrative Nests', nextNodeId: 'result_scc' },
            { label: 'Basaloid Nests / Retraction', nextNodeId: 'result_bcc' },
            { label: 'Full Thickness Atypia (In Situ)', nextNodeId: 'result_sccis' }
        ]
    },
    'result_sk': { id: 'result_sk', type: 'result', title: 'Seborrheic Keratosis', diagnosis: 'Seborrheic Keratosis', description: 'Benign epidermal neoplasm.', pearls: ['Horn cysts', 'Squamous eddies', 'Benign', 'Stuck-on'] },
    'result_verruca': { id: 'result_verruca', type: 'result', title: 'Verruca Vulgaris', diagnosis: 'Verruca Vulgaris', description: 'Viral wart.', pearls: ['HPV-associated', 'Koilocytes', 'Tiered parakeratosis', 'Inward bending of rete'] },
    'result_clear_cell_acanthoma': { id: 'result_clear_cell_acanthoma', type: 'result', title: 'Clear Cell Acanthoma', diagnosis: 'Clear Cell Acanthoma', description: 'Benign acanthoma with clear cells.', pearls: ['Pale keratinocytes', 'Neutrophils in stratum corneum', 'PAS+'] },
    'result_porokeratosis': { id: 'result_porokeratosis', type: 'result', title: 'Porokeratosis', diagnosis: 'Porokeratosis', description: 'Clonal disorder of keratinization.', pearls: ['Cornoid lamella', 'Loss of granular layer'] },
    'result_ka': { id: 'result_ka', type: 'result', title: 'Keratoacanthoma', diagnosis: 'Keratoacanthoma', description: 'Rapidly growing squamous tumor.', pearls: ['Rapid growth', 'Central keratin plug', 'Glassy cytoplasm', 'Elastic fiber trapping'] },
    'result_scc': { id: 'result_scc', type: 'result', title: 'Squamous Cell Carcinoma', diagnosis: 'Invasive Squamous Cell Carcinoma', description: 'Malignant keratinocytic tumor.', pearls: ['Infiltrative', 'Keratin pearls', 'Desmoplasia'] },
    'result_sccis': { id: 'result_sccis', type: 'result', title: 'SCC In Situ (Bowen)', diagnosis: 'Squamous Cell Carcinoma In Situ', description: 'Intraepidermal malignancy.', pearls: ['Full thickness atypia', 'Windblown nuclei', 'Eyeliner sign'] },
    'result_bcc': { id: 'result_bcc', type: 'result', title: 'Basal Cell Carcinoma', diagnosis: 'Basal Cell Carcinoma', description: 'Malignant basaloid tumor.', pearls: ['Peripheral palisading', 'Retraction artifact', 'Mucin', 'BerEP4+'] }
};

// --- DERMPATH: SPINDLE CELL ---
const SKIN_SPINDLE_NODES: Record<string, AlgorithmNode> = {
    'start': {
        id: 'start', type: 'start', title: 'Cutaneous Spindle Cell Tumors', description: 'The "SLAM" differential: SCC, Leiomyosarcoma, AFX, Melanoma.',
        options: [{ label: 'Start IHC Panel', nextNodeId: 'ihc_triage' }]
    },
    'ihc_triage': {
        id: 'ihc_triage', type: 'decision', title: 'Basic IHC Panel', description: 'Keratin, S100, SMA/Desmin, CD10.',
        recommendedInitialIHC: ['Pan-Keratin', 'p63/p40', 'S100/SOX10', 'SMA', 'Desmin', 'CD10', 'CD34', 'Procollagen'],
        options: [
            { label: 'Keratin/p63 +', nextNodeId: 'result_scc_spindle' },
            { label: 'S100/SOX10 +', nextNodeId: 'result_melanoma_spindle' },
            { label: 'SMA/Desmin +', nextNodeId: 'result_lms_skin' },
            { label: 'CD10/Procollagen +', nextNodeId: 'result_afx' },
            { label: 'CD34 +', nextNodeId: 'result_dfsp' },
            { label: 'ERG/CD31 +', nextNodeId: 'result_ks' }
        ]
    },
    'result_scc_spindle': { id: 'result_scc_spindle', type: 'result', title: 'Spindle Cell SCC', diagnosis: 'Spindle Cell Squamous Cell Carcinoma', description: 'Spindle cell variant of SCC.', pearls: ['Deep invasion', 'Connection to epidermis', 'Keratin often weak', 'p63/p40 better'] },
    'result_melanoma_spindle': { id: 'result_melanoma_spindle', type: 'result', title: 'Desmoplastic Melanoma', diagnosis: 'Desmoplastic Melanoma', description: 'Spindle cell variant of melanoma.', pearls: ['p16 loss common', 'S100 usually positive', 'Melan-A often negative', 'Neurotropic'] },
    'result_lms_skin': { id: 'result_lms_skin', type: 'result', title: 'Cutaneous Leiomyosarcoma', diagnosis: 'Cutaneous Leiomyosarcoma', description: 'Malignant smooth muscle tumor.', pearls: ['Desmin +', 'p53 mutant', 'Blunt-ended nuclei', 'Perinuclear vacuoles'] },
    'result_afx': { id: 'result_afx', type: 'result', title: 'AFX / PDS', diagnosis: 'Atypical Fibroxanthoma (or PDS if deep)', description: 'Pleomorphic dermal tumor.', pearls: ['Diagnosis of exclusion', 'Sun-damaged skin', 'Rapid growth', 'CD10+'] },
    'result_dfsp': { id: 'result_dfsp', type: 'result', title: 'DFSP', diagnosis: 'Dermatofibrosarcoma Protuberans', description: 'Locally aggressive cutaneous sarcoma.', confirmatoryStudies: ['COL1A1-PDGFB'], pearls: ['Honeycomb fat entrapment', 'CD34+', 'Storey-form pattern'] },
    'result_ks': { id: 'result_ks', type: 'result', title: 'Kaposi Sarcoma', diagnosis: 'Kaposi Sarcoma', description: 'HHV-8 associated vascular tumor.', pearls: ['HHV-8+', 'Promontory sign', 'Slit-like spaces'] }
};

// --- PLEOMORPHIC SARCOMA ---
const PLEOMORPHIC_NODES: Record<string, AlgorithmNode> = {
    'start': {
        id: 'start', type: 'start', title: 'Pleomorphic Sarcomas', description: 'Approach to high-grade undifferentiated neoplasms.',
        options: [{ label: 'Start', nextNodeId: 'lineage_check' }]
    },
    'lineage_check': {
        id: 'lineage_check', type: 'decision', title: 'Lineage Markers', description: 'Exclude specific differentiation.',
        recommendedInitialIHC: ['Pan-Keratin', 'S100', 'SOX10', 'Desmin', 'Myogenin', 'SMA', 'MDM2', 'CD31', 'ERG'],
        options: [
            { label: 'Keratin+', nextNodeId: 'result_carcinoma' },
            { label: 'Melanocytic+', nextNodeId: 'result_melanoma' },
            { label: 'MDM2/CDK4 +', nextNodeId: 'result_ddlps' },
            { label: 'Myogenin+', nextNodeId: 'result_pleom_rms' },
            { label: 'Vascular+', nextNodeId: 'result_angio' },
            { label: 'SMA/Desmin+', nextNodeId: 'result_pleom_lms' },
            { label: 'All Negative', nextNodeId: 'result_ups' }
        ]
    },
    'result_carcinoma': { id: 'result_carcinoma', type: 'stop', title: 'Pleomorphic Carcinoma', description: 'Consider Sarcomatoid Carcinoma (Lung, Kidney, Skin).' },
    'result_melanoma': { id: 'result_melanoma', type: 'stop', title: 'Dedifferentiated Melanoma', description: 'Can lose specific markers. S100/SOX10 usually retained.' },
    'result_ddlps': { id: 'result_ddlps', type: 'result', title: 'Dedifferentiated Liposarcoma', diagnosis: 'Dedifferentiated Liposarcoma', description: 'High-grade sarcoma arising from WDLPS.', confirmatoryStudies: ['MDM2 Amplification'], pearls: ['Retroperitoneum is DDLPS until proven otherwise', 'Look for WDLPS component'] },
    'result_pleom_rms': { id: 'result_pleom_rms', type: 'result', title: 'Pleomorphic Rhabdo', diagnosis: 'Pleomorphic Rhabdomyosarcoma', description: 'Pleomorphic skeletal muscle sarcoma.', pearls: ['Large rhabdomyoblasts', 'Desmin/Myogenin positive', 'Adults'] },
    'result_pleom_lms': { id: 'result_pleom_lms', type: 'result', title: 'Pleomorphic LMS', diagnosis: 'Pleomorphic Leiomyosarcoma', description: 'Smooth muscle sarcoma.', pearls: ['Fascicular areas', 'h-Caldesmon+', 'Desmin+'] },
    'result_angio': { id: 'result_angio', type: 'result', title: 'Angiosarcoma', diagnosis: 'Epithelioid/Pleomorphic Angiosarcoma', description: 'Malignant vascular tumor.', pearls: ['CD31/ERG positive', 'Vasoformative channels', 'Radiation history'] },
    'result_ups': { id: 'result_ups', type: 'result', title: 'UPS', diagnosis: 'Undifferentiated Pleomorphic Sarcoma', description: 'Diagnosis of exclusion. High grade, no line of differentiation.' }
};

// --- GYN: ENDOMETRIAL ---
const ENDOMETRIAL_NODES: Record<string, AlgorithmNode> = {
    'start': {
        id: 'start', type: 'start', title: 'Endometrial Carcinoma Molecular Class', description: 'ProMisE / TCGA Classification.',
        options: [{ label: 'Step 1: MMR', nextNodeId: 'mmr_check' }]
    },
    'mmr_check': {
        id: 'mmr_check', type: 'decision', title: 'MMR Status', description: 'Check MLH1, PMS2, MSH2, MSH6.',
        options: [
            { label: 'Loss (dMMR)', nextNodeId: 'result_mmrd' },
            { label: 'Intact (pMMR)', nextNodeId: 'pole_check' }
        ]
    },
    'pole_check': {
        id: 'pole_check', type: 'decision', title: 'POLE Mutation', description: 'Sequencing for POLE exonuclease domain.',
        options: [
            { label: 'Pathogenic Mutation', nextNodeId: 'result_pole' },
            { label: 'Wild-type', nextNodeId: 'p53_check' }
        ]
    },
    'p53_check': {
        id: 'p53_check', type: 'decision', title: 'p53 IHC', description: 'Check for aberrant patterns (Null, Overexpression, Cytoplasmic).',
        options: [
            { label: 'Aberrant (Mutant)', nextNodeId: 'result_p53abn' },
            { label: 'Wild-type', nextNodeId: 'result_nsmp' }
        ]
    },
    'result_mmrd': { id: 'result_mmrd', type: 'result', title: 'MMR Deficient', diagnosis: 'Endometrial Ca, MMR-deficient (MSI-H)', description: 'Mismatch repair deficient.', pearls: ['Lynch Syndrome screening indicated', 'Intermediate prognosis'] },
    'result_pole': { id: 'result_pole', type: 'result', title: 'POLE Ultramutated', diagnosis: 'Endometrial Ca, POLE-mutated', description: 'Ultramutated phenotype.', prognosis: 'Excellent prognosis, even if high grade histology.', pearls: ['Can de-escalate therapy', 'Ambiguous morphology'] },
    'result_p53abn': { id: 'result_p53abn', type: 'result', title: 'p53 Abnormal', diagnosis: 'Endometrial Ca, p53-abnormal (Copy-number high)', description: 'Copy-number high / Serous-like.', prognosis: 'Poor prognosis. Aggressive therapy.', pearls: ['Correlates with Serous histology but can be Endometrioid'] },
    'result_nsmp': { id: 'result_nsmp', type: 'result', title: 'NSMP', diagnosis: 'Endometrial Ca, NSMP (Copy-number low)', description: 'Non-Specific Molecular Profile.', prognosis: 'Intermediate prognosis.', pearls: ['Most common group', 'Estrogen driven'] }
};

// --- GYN: OVARIAN ---
const OVARIAN_NODES: Record<string, AlgorithmNode> = {
    'start': {
        id: 'start', type: 'start', title: 'Ovarian Carcinoma Subtyping', description: 'Distinguishing the 5 major histotypes of ovarian carcinoma.',
        options: [{ label: 'Start Workup', nextNodeId: 'wt1_p53_check' }]
    },
    'wt1_p53_check': {
        id: 'wt1_p53_check', type: 'decision', title: 'WT1 and p53', description: 'The primary triage axis.',
        recommendedInitialIHC: ['WT1', 'p53', 'PAX8', 'Napsin A', 'ER', 'PR'],
        options: [
            { label: 'WT1+, p53 Mutant', nextNodeId: 'result_hgsc' },
            { label: 'WT1-, p53 WT', nextNodeId: 'endo_clear_branch' },
            { label: 'WT1+, p53 WT', nextNodeId: 'result_lgsc' },
            { label: 'PAX8-', nextNodeId: 'mucinous_branch' }
        ]
    },
    'endo_clear_branch': {
        id: 'endo_clear_branch', type: 'decision', title: 'Endometrioid vs Clear Cell', description: 'Check Napsin A and ER.',
        options: [
            { label: 'Napsin A+, ER-, HNF1b+', nextNodeId: 'result_ccc' },
            { label: 'Napsin A-, ER+, Vimentin+', nextNodeId: 'result_endo' }
        ]
    },
    'mucinous_branch': {
        id: 'mucinous_branch', type: 'decision', title: 'Mucinous', description: 'Primary vs Metastatic.',
        recommendedInitialIHC: ['CK7', 'CK20', 'CDX2', 'PAX8'],
        options: [
            { label: 'CK7+, CK20+, CDX2+, PAX8-', nextNodeId: 'result_mucinous' },
            { label: 'CK7-, CK20+, CDX2+', nextNodeId: 'result_gi_met' }
        ]
    },
    'result_hgsc': { id: 'result_hgsc', type: 'result', title: 'High-Grade Serous', diagnosis: 'High-Grade Serous Carcinoma', description: 'Most common ovarian malignancy.', pearls: ['Originates from STIC in Fallopian Tube', 'Most common', 'p53 mutation obligatory'] },
    'result_lgsc': { id: 'result_lgsc', type: 'result', title: 'Low-Grade Serous', diagnosis: 'Low-Grade Serous Carcinoma', description: 'Indolent serous carcinoma.', pearls: ['Associated with borderline tumors', 'BRAF/KRAS mutations', 'Psammoma bodies'] },
    'result_ccc': { id: 'result_ccc', type: 'result', title: 'Clear Cell Carcinoma', diagnosis: 'Clear Cell Carcinoma', description: 'Endometriosis-associated carcinoma.', pearls: ['Hobnail cells', 'Hyaline globules', 'Endometriosis association'] },
    'result_endo': { id: 'result_endo', type: 'result', title: 'Endometrioid Carcinoma', diagnosis: 'Endometrioid Carcinoma', description: 'Endometriosis-associated carcinoma.', pearls: ['Associated with endometriosis', 'Squamous differentiation common', 'CTNNB1 mutations'] },
    'result_mucinous': { id: 'result_mucinous', type: 'result', title: 'Mucinous Carcinoma', diagnosis: 'Mucinous Carcinoma (Primary Ovarian)', description: 'Primary mucinous carcinoma.', pearls: ['Expansile invasion', 'Large size (>10cm favors primary)', 'Unilateral'] },
    'result_gi_met': { id: 'result_gi_met', type: 'stop', title: 'Metastatic GI Cancer', description: 'Rule out Appendix (LAMN/Adeno), Colorectal, Pancreatic. Bilateral, small size, surface involvement favor met.' }
};

// --- GYN: UTERINE MESENCHYMAL ---
const UTERINE_MESENCHYMAL_NODES: Record<string, AlgorithmNode> = {
    'start': {
        id: 'start', type: 'start', title: 'Uterine Mesenchymal Tumors', description: 'Distinguishing smooth muscle from stromal tumors.',
        options: [{ label: 'Determine Cell Type', nextNodeId: 'cell_type' }]
    },
    'cell_type': {
        id: 'cell_type', type: 'decision', title: 'Dominant Morphology', description: 'Spindle vs Round/Stromal cells.',
        options: [
            { label: 'Spindle / Eosinophilic', nextNodeId: 'spindle_branch' },
            { label: 'Round / Basophilic', nextNodeId: 'stromal_branch' },
            { label: 'Epithelioid', nextNodeId: 'epithelioid_branch' }
        ]
    },
    'spindle_branch': {
        id: 'spindle_branch', type: 'decision', title: 'Smooth Muscle Assessment', description: 'Evaluate for atypia, necrosis, and mitoses.',
        recommendedInitialIHC: ['Desmin', 'SMA', 'p16', 'p53', 'H-Caldesmon'],
        options: [
            { label: 'Severe Atypia + Necrosis/Mitoses', nextNodeId: 'result_lms' },
            { label: 'Bland cytology, No Necrosis', nextNodeId: 'result_leiomyoma' },
            { label: 'Ambiguous Features', nextNodeId: 'result_stump' }
        ]
    },
    'stromal_branch': {
        id: 'stromal_branch', type: 'decision', title: 'Stromal Markers', description: 'CD10 and Hormone Receptors.',
        recommendedInitialIHC: ['CD10', 'ER', 'PR', 'Cyclin D1', 'BCOR', 'Desmin'],
        options: [
            { label: 'CD10+, ER+, Bland', nextNodeId: 'result_ess_lg' },
            { label: 'Cyclin D1+ or BCOR+', nextNodeId: 'result_ess_hg' },
            { label: 'Desmin+, H-Caldesmon+', nextNodeId: 'result_leiomyoma_cell' } // Cellular Leiomyoma mimic
        ]
    },
    'epithelioid_branch': {
        id: 'epithelioid_branch', type: 'decision', title: 'Epithelioid Cells', description: 'PEComa vs LMS.',
        options: [
            { label: 'HMB45+, TFE3+', nextNodeId: 'result_pecoma_gyn' },
            { label: 'Desmin+, SMA+', nextNodeId: 'result_lms_epith' }
        ]
    },
    'result_lms': { id: 'result_lms', type: 'result', title: 'Leiomyosarcoma', diagnosis: 'Leiomyosarcoma', description: 'Malignant smooth muscle tumor.', confirmatoryStudies: ['p16 diffuse block+', 'p53 mutant'], pearls: ['Coagulative tumor cell necrosis is specific', 'Atypia + Mitoses'] },
    'result_leiomyoma': { id: 'result_leiomyoma', type: 'result', title: 'Leiomyoma', diagnosis: 'Leiomyoma', description: 'Benign smooth muscle tumor.', pearls: ['FH (fumarate hydratase) loss in hereditary cases (HLRCC)', 'Bland nuclei'] },
    'result_stump': { id: 'result_stump', type: 'result', title: 'STUMP', diagnosis: 'Smooth Muscle Tumor of Uncertain Malignant Potential', description: 'Uncertain malignant potential.', pearls: ['Cannot unequivocally classify as benign or malignant', 'Requires follow-up'] },
    'result_ess_lg': { id: 'result_ess_lg', type: 'result', title: 'Low-Grade ESS', diagnosis: 'Low-Grade Endometrial Stromal Sarcoma', description: 'Indolent stromal sarcoma.', confirmatoryStudies: ['JAZF1 fusion'], pearls: ['Tongue-like invasion', 'Spiral arterioles', 'ER/PR strong'] },
    'result_ess_hg': { id: 'result_ess_hg', type: 'result', title: 'High-Grade ESS', diagnosis: 'High-Grade Endometrial Stromal Sarcoma', description: 'Aggressive stromal sarcoma.', confirmatoryStudies: ['YWHAE-NUTM2 (Cyclin D1+)', 'ZC3H7B-BCOR (BCOR+)'], pearls: ['More aggressive than LG-ESS', 'Often CD10 negative', 'High mitotic rate'] },
    'result_leiomyoma_cell': { id: 'result_leiomyoma_cell', type: 'result', title: 'Cellular Leiomyoma', diagnosis: 'Cellular Leiomyoma', description: 'Hypercellular benign leiomyoma.', pearls: ['Can mimic ESS but is Desmin/Caldesmon positive', 'Cleft-like spaces'] },
    'result_pecoma_gyn': { id: 'result_pecoma_gyn', type: 'result', title: 'PEComa', diagnosis: 'PEComa (Uterine)', description: 'Perivascular epithelioid cell tumor.', pearls: ['HMB45+', 'Clear to eosinophilic cytoplasm', 'TSC1/2 mutations'] },
    'result_lms_epith': { id: 'result_lms_epith', type: 'result', title: 'Epithelioid LMS', diagnosis: 'Epithelioid Leiomyosarcoma', description: 'Epithelioid variant.', pearls: ['Can mimic carcinoma', 'Desmin strong'] }
};

// --- GYN: GTD ---
const GTD_NODES: Record<string, AlgorithmNode> = {
    'start': { id: 'start', type: 'start', title: 'Gestational Trophoblastic Disease', description: 'Trophoblastic tumors.', options: [{ label: 'Villi Presence', nextNodeId: 'villi_check' }] },
    'villi_check': { id: 'villi_check', type: 'decision', title: 'Chorionic Villi', description: 'Are villi present?', options: [{ label: 'Yes (Mole)', nextNodeId: 'mole_branch' }, { label: 'No (Neoplasm)', nextNodeId: 'troph_type' }] },
    'mole_branch': { id: 'mole_branch', type: 'decision', title: 'Mole Type', description: 'Partial vs Complete.', options: [{ label: 'p57 Negative (Villous/Stromal)', nextNodeId: 'result_complete_mole' }, { label: 'p57 Positive', nextNodeId: 'result_partial_mole' }] },
    'troph_type': { id: 'troph_type', type: 'decision', title: 'Trophoblast Type', description: 'Biphasic vs Intermediate.', options: [{ label: 'Biphasic (Cyto+Syncytio)', nextNodeId: 'result_chorio' }, { label: 'Intermediate Trophoblast', nextNodeId: 'inter_branch' }] },
    'inter_branch': { id: 'inter_branch', type: 'decision', title: 'Intermediate Trophoblast', description: 'Implantation site vs Chorionic type.', options: [{ label: 'PSTT (Implantation)', nextNodeId: 'result_pstt' }, { label: 'ETT (Chorionic)', nextNodeId: 'result_ett' }] },
    'result_complete_mole': { id: 'result_complete_mole', type: 'result', title: 'Complete Mole', diagnosis: 'Complete Hydatidiform Mole', description: 'Diploid, androgenetic.', pearls: ['p57 negative', 'Circumferential trophoblastic proliferation', 'Risk of Chorio'] },
    'result_partial_mole': { id: 'result_partial_mole', type: 'result', title: 'Partial Mole', diagnosis: 'Partial Hydatidiform Mole', description: 'Triploid.', pearls: ['p57 positive', 'Scalloped villi', 'Fetal parts often present'] },
    'result_chorio': { id: 'result_chorio', type: 'result', title: 'Choriocarcinoma', diagnosis: 'Choriocarcinoma', description: 'Malignant trophoblastic tumor.', pearls: ['Biphasic', 'Hemorrhage', 'High hCG', 'Early vascular invasion'] },
    'result_pstt': { id: 'result_pstt', type: 'result', title: 'PSTT', diagnosis: 'Placental Site Trophoblastic Tumor', description: 'Implantation site intermediate trophoblast.', pearls: ['hPL+', 'Ki67 10-30%', 'Infiltrates myometrium cells'] },
    'result_ett': { id: 'result_ett', type: 'result', title: 'ETT', diagnosis: 'Epithelioid Trophoblastic Tumor', description: 'Chorionic type intermediate trophoblast.', pearls: ['p63+', 'Nests/Cords', 'Hyaline matrix', 'Geographic necrosis'] }
};

// --- GYN: VULVA ---
const VULVAR_NODES: Record<string, AlgorithmNode> = {
    'start': { id: 'start', type: 'start', title: 'Vulvar Squamous Lesions', description: 'Precursors and Carcinoma.', options: [{ label: 'Architecture', nextNodeId: 'inv_check' }] },
    'inv_check': { id: 'inv_check', type: 'decision', title: 'Invasion', description: 'Invasive or Intraepithelial?', options: [{ label: 'Invasive', nextNodeId: 'result_scc' }, { label: 'Intraepithelial', nextNodeId: 'precursor_check' }] },
    'precursor_check': { id: 'precursor_check', type: 'decision', title: 'Precursor Type', description: 'HPV vs Dermatosis associated.', options: [{ label: 'HPV-associated (HSIL)', nextNodeId: 'result_hsil' }, { label: 'HPV-independent (dVIN)', nextNodeId: 'result_dvin' }] },
    'result_scc': { id: 'result_scc', type: 'result', title: 'Vulvar SCC', diagnosis: 'Vulvar Squamous Cell Carcinoma', description: 'Invasive malignancy.', pearls: ['Determine p16 status for classification (HPV+ vs HPV-)'] },
    'result_hsil': { id: 'result_hsil', type: 'result', title: 'uVIN / HSIL', diagnosis: 'High-grade Squamous Intraepithelial Lesion', description: 'HPV-associated precursor.', pearls: ['p16 block positive', 'Full thickness atypia', 'Younger patients'] },
    'result_dvin': { id: 'result_dvin', type: 'result', title: 'dVIN', diagnosis: 'Differentiated Vulvar Intraepithelial Neoplasia', description: 'HPV-independent precursor.', pearls: ['p53 mutant (null or overexpression)', 'Basal atypia only', 'Associated with Lichen Sclerosus'] }
};

// --- GYN: VAGINA ---
const VAGINAL_NODES: Record<string, AlgorithmNode> = {
    'start': { id: 'start', type: 'start', title: 'Vaginal Mass', description: 'Primary vs Secondary.', options: [{ label: 'Epithelial vs Mesenchymal', nextNodeId: 'type_check' }] },
    'type_check': { id: 'type_check', type: 'decision', title: 'Tumor Type', description: 'Squamous/Glandular vs Spindle.', options: [{ label: 'Squamous', nextNodeId: 'result_scc' }, { label: 'Adenocarcinoma', nextNodeId: 'adeno_check' }, { label: 'Spindle/Polypoid', nextNodeId: 'spindle_check' }] },
    'adeno_check': { id: 'adeno_check', type: 'decision', title: 'Adenocarcinoma', description: 'Rule out metastasis.', options: [{ label: 'Clear Cell (DES)', nextNodeId: 'result_clear_cell' }, { label: 'Mucinous/Endometrioid', nextNodeId: 'result_met' }] },
    'spindle_check': { id: 'spindle_check', type: 'decision', title: 'Spindle Cell', description: 'Benign vs Malignant.', options: [{ label: 'Fibroepithelial Polyp', nextNodeId: 'result_fep' }, { label: 'Leiomyoma', nextNodeId: 'result_leiomyoma' }, { label: 'Cambium Layer', nextNodeId: 'result_botryoid' }] },
    'result_scc': { id: 'result_scc', type: 'result', title: 'Vaginal SCC', diagnosis: 'Vaginal Squamous Cell Carcinoma', description: 'Diagnosis of exclusion (must rule out Cervical/Vulvar primary).', pearls: ['HPV-associated'] },
    'result_clear_cell': { id: 'result_clear_cell', type: 'result', title: 'Clear Cell Ca', diagnosis: 'Clear Cell Carcinoma', description: 'Rare, associated with DES or Adenosis.', pearls: ['Napsin A+', 'HNF1b+'] },
    'result_met': { id: 'result_met', type: 'stop', title: 'Metastasis', description: 'Metastasis from Endometrium, Cervix, or Colon is more common than primary vaginal adenocarcinoma.' },
    'result_fep': { id: 'result_fep', type: 'result', title: 'Fibroepithelial Polyp', diagnosis: 'Fibroepithelial Polyp', description: 'Benign stromal polyp.', pearls: ['Stellate cells', 'CD34+', 'ER/PR+', 'Associated with pregnancy'] },
    'result_leiomyoma': { id: 'result_leiomyoma', type: 'result', title: 'Leiomyoma', diagnosis: 'Vaginal Leiomyoma', description: 'Benign smooth muscle tumor.', pearls: ['Bland spindle cells', 'Desmin+'] },
    'result_botryoid': { id: 'result_botryoid', type: 'result', title: 'Botryoid RMS', diagnosis: 'Embryonal Rhabdomyosarcoma (Botryoid)', description: 'Pediatric sarcoma.', pearls: ['Cambium layer', 'Myogenin+', 'Grape-like mass'] }
};

// --- GYN: CERVIX ---
const CERVICAL_NODES: Record<string, AlgorithmNode> = {
    'start': { id: 'start', type: 'start', title: 'Cervical Carcinoma', description: 'Classification by cell type and HPV.', options: [{ label: 'Squamous vs Glandular', nextNodeId: 'type_check' }] },
    'type_check': { id: 'type_check', type: 'decision', title: 'Morphology', description: 'Squamous pearls vs Glands.', options: [{ label: 'Squamous', nextNodeId: 'result_scc' }, { label: 'Glandular', nextNodeId: 'adeno_branch' }, { label: 'Neuroendocrine', nextNodeId: 'result_smnc' }] },
    'adeno_branch': { id: 'adeno_branch', type: 'decision', title: 'Adenocarcinoma Type', description: 'HPV-associated vs Gastric-type.', options: [{ label: 'Usual Type (HPV+)', nextNodeId: 'result_hpv_adeno' }, { label: 'Gastric Type (HPV-)', nextNodeId: 'result_gastric' }, { label: 'Mesonephric', nextNodeId: 'result_mesonephric' }] },
    'result_scc': { id: 'result_scc', type: 'result', title: 'Cervical SCC', diagnosis: 'Cervical Squamous Cell Carcinoma', description: 'Most common type.', pearls: ['p16 block positive', 'HPV driven'] },
    'result_hpv_adeno': { id: 'result_hpv_adeno', type: 'result', title: 'Endocervical Adeno (HPV)', diagnosis: 'Endocervical Adenocarcinoma, HPV-associated', description: 'Apical mitoses and apoptosis.', pearls: ['p16 block positive', 'HPV RNA+', 'Lack of goblet cells'] },
    'result_gastric': { id: 'result_gastric', type: 'result', title: 'Gastric-type Adeno', diagnosis: 'Endocervical Adenocarcinoma, Gastric-type', description: 'HPV-independent, aggressive.', pearls: ['p16 negative/patchy', 'p53 mutant', 'MUC6+', 'HIK1083+'] },
    'result_mesonephric': { id: 'result_mesonephric', type: 'result', title: 'Mesonephric Adeno', diagnosis: 'Mesonephric Adenocarcinoma', description: 'Wolffian origin.', pearls: ['GATA3+', 'CD10+', 'TTF1+', 'ER/PR negative'] },
    'result_smnc': { id: 'result_smnc', type: 'result', title: 'Small Cell Carcinoma', diagnosis: 'Small Cell Neuroendocrine Carcinoma', description: 'High grade neuroendocrine.', pearls: ['TTF1+', 'CD56+', 'HPV-associated', 'Aggressive'] }
};

// --- GYN: MIMICS ---
const MIMIC_NODES: Record<string, AlgorithmNode> = {
    'start': { id: 'start', type: 'start', title: 'Benign GYN Mimics', description: 'Lesions often confused with malignancy.', options: [{ label: 'Select Site', nextNodeId: 'site_check' }] },
    'site_check': { id: 'site_check', type: 'decision', title: 'Site', description: 'Ovary vs Uterus.', options: [{ label: 'Ovary', nextNodeId: 'ovary_mimics' }, { label: 'Uterus', nextNodeId: 'uterus_mimics' }] },
    'ovary_mimics': { id: 'ovary_mimics', type: 'decision', title: 'Ovarian Lesion', description: 'Solid/Cystic.', options: [{ label: 'Massive Edema', nextNodeId: 'result_edema' }, { label: 'Pregnancy Luteoma', nextNodeId: 'result_luteoma' }, { label: 'Leydig Hyperplasia', nextNodeId: 'result_leydig' }] },
    'uterus_mimics': { id: 'uterus_mimics', type: 'decision', title: 'Uterine Lesion', description: 'Glandular/Stromal.', options: [{ label: 'Arias-Stella', nextNodeId: 'result_arias' }, { label: 'STUMP', nextNodeId: 'result_stump' }, { label: 'Adenomatoid Tumor', nextNodeId: 'result_adenomatoid' }] },
    'result_edema': { id: 'result_edema', type: 'result', title: 'Massive Ovarian Edema', diagnosis: 'Massive Ovarian Edema', description: 'Young women, preservation of follicles.', pearls: ['Can mimic Krukenberg or fibroma', 'Intercellular edema'] },
    'result_luteoma': { id: 'result_luteoma', type: 'result', title: 'Pregnancy Luteoma', diagnosis: 'Pregnancy Luteoma', description: 'Solid nodules of luteinized cells.', pearls: ['Regresses postpartum', 'Mimics Leydig cell tumor', 'Hirsutism possible'] },
    'result_leydig': { id: 'result_leydig', type: 'result', title: 'Leydig Hyperplasia', diagnosis: 'Leydig Cell Hyperplasia', description: 'Hilus cell proliferation.', pearls: ['Reinke crystals', 'Associated with stromal hyperplasia'] },
    'result_arias': { id: 'result_arias', type: 'result', title: 'Arias-Stella Reaction', diagnosis: 'Arias-Stella Reaction', description: 'Hypersecretory change in pregnancy.', pearls: ['Clear cells', 'Hobnailing', 'No mitoses', 'Nuclear atypia is degenerative'] },
    'result_stump': { id: 'result_stump', type: 'result', title: 'STUMP', diagnosis: 'STUMP', description: 'Ambiguous smooth muscle tumor.', pearls: ['Follow-up required'] },
    'result_adenomatoid': { id: 'result_adenomatoid', type: 'result', title: 'Adenomatoid Tumor', diagnosis: 'Adenomatoid Tumor', description: 'Benign mesothelial tumor.', pearls: ['Calretinin+', 'WT1+', 'Gland-like spaces without mucin'] }
};

// --- BREAST ALGORITHM ---
const BREAST_NODES: Record<string, AlgorithmNode> = {
    'start': { id: 'start', type: 'start', title: 'Breast Neoplasms', description: 'Triage for breast masses.', options: [{ label: 'Epithelial vs Fibroepithelial', nextNodeId: 'type_check' }] },
    'type_check': { id: 'type_check', type: 'decision', title: 'Lesion Type', description: 'Carcinoma vs Stromal-rich.', options: [{ label: 'Carcinoma / Invasive', nextNodeId: 'carcinoma_branch' }, { label: 'Fibroepithelial (Stroma+Glands)', nextNodeId: 'fibro_branch' }, { label: 'Papillary', nextNodeId: 'papillary_branch' }] },
    'carcinoma_branch': {
        id: 'carcinoma_branch', type: 'decision', title: 'Invasive Carcinoma', description: 'Evaluate E-cadherin.',
        recommendedInitialIHC: ['E-Cadherin', 'p120', 'ER', 'PR', 'HER2'],
        options: [
            { label: 'E-cad (+), p120 membranous', nextNodeId: 'result_idc' },
            { label: 'E-cad (-), p120 cytoplasmic', nextNodeId: 'result_ilc' },
            { label: 'Triple Negative, Basal', nextNodeId: 'result_metaplastic' }
        ]
    },
    'fibro_branch': {
        id: 'fibro_branch', type: 'decision', title: 'Fibroepithelial Lesion', description: 'Stromal cellularity and overgrowth.',
        options: [
            { label: 'Low Cellularity', nextNodeId: 'result_fa' },
            { label: 'High Cellularity / Leaf-like', nextNodeId: 'result_phyllodes' }
        ]
    },
    'papillary_branch': {
        id: 'papillary_branch', type: 'decision', title: 'Papillary Lesion', description: 'Myoepithelial layer.',
        options: [
            { label: 'Myoeps Present', nextNodeId: 'result_papilloma' },
            { label: 'Myoeps Absent', nextNodeId: 'result_papillary_ca' }
        ]
    },
    'result_idc': { id: 'result_idc', type: 'result', title: 'Invasive Ductal Carcinoma', diagnosis: 'Invasive Ductal Carcinoma (NST)', description: 'Most common breast cancer.', pearls: ['Tubule formation', 'Grading (Nottingham) is key'] },
    'result_ilc': { id: 'result_ilc', type: 'result', title: 'Invasive Lobular Carcinoma', diagnosis: 'Invasive Lobular Carcinoma', description: 'Infiltrative carcinoma with loss of cohesion.', pearls: ['Loss of E-cadherin', 'Single file infiltration', 'Targetoid growth'] },
    'result_fa': { id: 'result_fa', type: 'result', title: 'Fibroadenoma', diagnosis: 'Fibroadenoma', description: 'Benign fibroepithelial tumor.', pearls: ['Benign', 'Intracanalicular/Pericanalicular pattern'] },
    'result_phyllodes': { id: 'result_phyllodes', type: 'result', title: 'Phyllodes Tumor', diagnosis: 'Phyllodes Tumor', description: 'Fibroepithelial tumor with stromal overgrowth.', pearls: ['Stromal overgrowth', 'Leaf-like architecture', 'Grade (Benign/Borderline/Malignant)'] },
    'result_metaplastic': { id: 'result_metaplastic', type: 'result', title: 'Metaplastic Carcinoma', diagnosis: 'Metaplastic Carcinoma', description: 'Carcinoma with squamous or mesenchymal differentiation.', pearls: ['p63+', 'High grade', 'Spindle cell component'] },
    'result_papilloma': { id: 'result_papilloma', type: 'result', title: 'Intraductal Papilloma', diagnosis: 'Intraductal Papilloma', description: 'Benign papillary lesion.', pearls: ['Fibrovascular cores', 'Myoepithelial cells present'] },
    'result_papillary_ca': { id: 'result_papillary_ca', type: 'result', title: 'Papillary Carcinoma', diagnosis: 'Papillary Carcinoma', description: 'Malignant papillary lesion.', pearls: ['No myoepithelial cells in papillae', 'Cribriforming'] }
};

// --- GU: KIDNEY ALGORITHM ---
const KIDNEY_NODES: Record<string, AlgorithmNode> = {
    'start': { id: 'start', type: 'start', title: 'Renal Cell Carcinoma', description: 'Workup of renal masses.', options: [{ label: 'Cytoplasm Color', nextNodeId: 'cyto_check' }] },
    'cyto_check': { id: 'cyto_check', type: 'decision', title: 'Cytoplasm Appearance', description: 'Clear vs Eosinophilic.', options: [{ label: 'Clear Cells', nextNodeId: 'clear_branch' }, { label: 'Eosinophilic / Papillary', nextNodeId: 'eosinophilic_branch' }] },
    'clear_branch': {
        id: 'clear_branch', type: 'decision', title: 'Clear Cell Markers', description: 'CA9 and PAX8.',
        recommendedInitialIHC: ['PAX8', 'CA9', 'CD10', 'CK7', 'TFE3'],
        options: [
            { label: 'CA9 Box-like +', nextNodeId: 'result_ccrcc' },
            { label: 'TFE3 +', nextNodeId: 'result_tfe3' },
            { label: 'CK7+, CA9 Cup-like', nextNodeId: 'result_ccpap' }
        ]
    },
    'eosinophilic_branch': {
        id: 'eosinophilic_branch', type: 'decision', title: 'Papillary/Oncoytic', description: 'CK7, CD117, Hale Colloidal Iron.',
        recommendedInitialIHC: ['CK7', 'CD117', 'AMACR', 'Hale Colloidal Iron'],
        options: [
            { label: 'CK7+, AMACR+, CD117-', nextNodeId: 'result_pap_rcc' },
            { label: 'CD117+, CK7-', nextNodeId: 'result_onco' },
            { label: 'CK7+, CD117+, Halo', nextNodeId: 'result_chromophobe' },
            { label: 'Medullary, Sickle Cell', nextNodeId: 'result_medullary' }
        ]
    },
    'result_ccrcc': { id: 'result_ccrcc', type: 'result', title: 'Clear Cell RCC', diagnosis: 'Clear Cell Renal Cell Carcinoma', description: 'Most common renal malignancy.', pearls: ['VHL mutation', 'Fine vascular network'] },
    'result_tfe3': { id: 'result_tfe3', type: 'result', title: 'Translocation RCC', diagnosis: 'Translocation-Associated RCC', description: 'Xp11 translocation.', pearls: ['Younger patients', 'TFE3 rearrangement', 'Voluminous clear cytoplasm', 'Psammoma bodies'] },
    'result_ccpap': { id: 'result_ccpap', type: 'result', title: 'Clear Cell Papillary', diagnosis: 'Clear Cell Papillary Renal Cell Tumor', description: 'Low malignant potential.', pearls: ['Low grade', 'Cup-like CA9', 'Nuclei aligned away from basement membrane'] },
    'result_pap_rcc': { id: 'result_pap_rcc', type: 'result', title: 'Papillary RCC', diagnosis: 'Papillary Renal Cell Carcinoma', description: 'Papillary architecture.', pearls: ['Foam cells in cores', 'Type 1 (Basophilic) vs Type 2 (Eosinophilic)', 'Trisomy 7, 17'] },
    'result_onco': { id: 'result_onco', type: 'result', title: 'Oncocytoma', diagnosis: 'Renal Oncocytoma', description: 'Benign oncocytic tumor.', pearls: ['Benign', 'Central scar', 'Central islands', 'No perinuclear halo'] },
    'result_chromophobe': { id: 'result_chromophobe', type: 'result', title: 'Chromophobe RCC', diagnosis: 'Chromophobe Renal Cell Carcinoma', description: 'Distinctive cell borders.', pearls: ['Perinuclear halos', 'Plant cell walls', 'Hale Colloidal Iron diffuse+', 'Raisinoid nuclei'] },
    'result_medullary': { id: 'result_medullary', type: 'result', title: 'Medullary Carcinoma', diagnosis: 'Renal Medullary Carcinoma', description: 'Aggressive, Sickle Cell Trait.', pearls: ['INI1 loss', 'Sickle cell trait', 'Cribriform/Reticular'] }
};

// --- GU: BLADDER ---
const BLADDER_NODES: Record<string, AlgorithmNode> = {
    'start': { id: 'start', type: 'start', title: 'Urothelial Neoplasia', description: 'Grading and Invasion.', options: [{ label: 'Papillary vs Flat', nextNodeId: 'arch_check' }] },
    'arch_check': { id: 'arch_check', type: 'decision', title: 'Architecture', description: 'Growth pattern.', options: [{ label: 'Papillary', nextNodeId: 'papillary_grade' }, { label: 'Flat', nextNodeId: 'flat_check' }, { label: 'Invasive', nextNodeId: 'invasive_branch' }] },
    'papillary_grade': { id: 'papillary_grade', type: 'decision', title: 'Grading (WHO 2004/2016)', description: 'Order vs Disorder.', options: [{ label: 'Orderly, Umbrella cells', nextNodeId: 'result_lgun' }, { label: 'Disordered, Fused', nextNodeId: 'result_hgun' }, { label: 'Thickened only', nextNodeId: 'result_punlmp' }] },
    'flat_check': { id: 'flat_check', type: 'decision', title: 'Flat Lesion', description: 'Atypia assessment.', options: [{ label: 'Severe Atypia', nextNodeId: 'result_cis' }, { label: 'Mild Atypia', nextNodeId: 'result_dysplasia' }] },
    'invasive_branch': { id: 'invasive_branch', type: 'decision', title: 'Invasive Type', description: 'Histology.', options: [{ label: 'Urothelial', nextNodeId: 'result_invasive_uc' }, { label: 'Squamous', nextNodeId: 'result_scc_bladder' }, { label: 'Adenocarcinoma', nextNodeId: 'result_adeno_bladder' }] },
    'result_lgun': { id: 'result_lgun', type: 'result', title: 'Low-Grade UC', diagnosis: 'Low-Grade Papillary Urothelial Carcinoma', description: 'Minimal architectural complexity, mild atypia.', pearls: ['Retains polarity', 'Rare mitoses'] },
    'result_hgun': { id: 'result_hgun', type: 'result', title: 'High-Grade UC', diagnosis: 'High-Grade Papillary Urothelial Carcinoma', description: 'Architectural disarray, severe atypia.', pearls: ['Frequent mitoses', 'Loss of polarity', 'Fused papillae'] },
    'result_punlmp': { id: 'result_punlmp', type: 'result', title: 'PUNLMP', diagnosis: 'Papillary Urothelial Neoplasm of Low Malignant Potential', description: 'Thickened urothelium, no atypia.', pearls: ['Very low risk of progression'] },
    'result_cis': { id: 'result_cis', type: 'result', title: 'Carcinoma In Situ', diagnosis: 'Urothelial Carcinoma In Situ', description: 'Flat, high-grade lesion.', pearls: ['Full thickness atypia', 'CK20 diffuse', 'Denudation common'] },
    'result_dysplasia': { id: 'result_dysplasia', type: 'result', title: 'Dysplasia', diagnosis: 'Urothelial Dysplasia', description: 'Atypia falling short of CIS.', pearls: ['CK20 intermediate'] },
    'result_invasive_uc': { id: 'result_invasive_uc', type: 'result', title: 'Invasive UC', diagnosis: 'Invasive Urothelial Carcinoma', description: 'Invades lamina propria or muscularis.', pearls: ['Paradoxical differentiation', 'Desmoplasia'] },
    'result_scc_bladder': { id: 'result_scc_bladder', type: 'result', title: 'Squamous Cell Ca', diagnosis: 'Squamous Cell Carcinoma (Bladder)', description: 'Schistosomiasis association.', pearls: ['Keratin pearls', 'Pure squamous (no urothelial)'] },
    'result_adeno_bladder': { id: 'result_adeno_bladder', type: 'result', title: 'Adenocarcinoma', diagnosis: 'Adenocarcinoma (Bladder/Urachal)', description: 'Enteric type.', pearls: ['Beta-catenin nuclear (colonic type)', 'CDX2+', 'Urachal remnant'] }
};

// --- GU: PROSTATE ---
const PROSTATE_NODES: Record<string, AlgorithmNode> = {
    'start': { id: 'start', type: 'start', title: 'Prostate Glandular Lesions', description: 'Benign vs Malignant glands.', options: [{ label: 'Assess Basal Cells', nextNodeId: 'basal_check' }] },
    'basal_check': {
        id: 'basal_check', type: 'decision', title: 'Basal Cell Layer', description: 'Use p63 / HMWCK.',
        recommendedInitialIHC: ['p63', 'HMWCK (34betaE12)', 'AMACR (Racemase)'],
        options: [
            { label: 'Present (Continuous)', nextNodeId: 'result_benign' },
            { label: 'Absent', nextNodeId: 'result_adeno' },
            { label: 'Present but AMACR+', nextNodeId: 'result_hgpin' },
            { label: 'Patchy/Discontinuous', nextNodeId: 'result_asap' }
        ]
    },
    'result_benign': { id: 'result_benign', type: 'result', title: 'Benign Glands', diagnosis: 'Benign Prostatic Tissue', description: 'Benign prostate glands.', pearls: ['Double cell layer', 'Corpora amylacea'] },
    'result_adeno': { id: 'result_adeno', type: 'result', title: 'Adenocarcinoma', diagnosis: 'Prostate Adenocarcinoma', description: 'Invasive malignancy.', pearls: ['AMACR Positive, Basal Negative', 'Nucleomegaly', 'Prominent nucleoli', 'Crystalloids'] },
    'result_hgpin': { id: 'result_hgpin', type: 'result', title: 'HGPIN', diagnosis: 'High Grade Prostatic Intraepithelial Neoplasia', description: 'Precursor lesion.', pearls: ['Tufting', 'Micropapillary', 'Basal layer intact', 'Nucleoli'] },
    'result_asap': { id: 'result_asap', type: 'result', title: 'ASAP', diagnosis: 'Atypical Small Acinar Proliferation', description: 'Indeterminate focus.', pearls: ['Suspicious but not diagnostic', 'Re-biopsy recommended'] }
};

// --- GU: TESTIS ---
const TESTIS_NODES: Record<string, AlgorithmNode> = {
    'start': { id: 'start', type: 'start', title: 'Testicular Germ Cell Tumors', description: 'Seminoma vs Non-Seminoma.', options: [{ label: 'Morphology', nextNodeId: 'morph_check' }] },
    'morph_check': { id: 'morph_check', type: 'decision', title: 'Cell Type', description: 'Clear cells vs Others.', options: [{ label: 'Uniform, Clear, Lymphocytes', nextNodeId: 'result_seminoma' }, { label: 'Pleomorphic / Glandular / Other', nextNodeId: 'nsgct_branch' }, { label: 'Three cell sizes', nextNodeId: 'result_spermatocytic' }] },
    'nsgct_branch': { id: 'nsgct_branch', type: 'decision', title: 'Non-Seminoma', description: 'Specific features.', options: [{ label: 'Papillary/Glandular, CD30+', nextNodeId: 'result_ec' }, { label: 'Reticular, Schiller-Duval', nextNodeId: 'result_yolk' }, { label: 'Cytotrophoblast/Syncytio', nextNodeId: 'result_chorio' }, { label: 'Cartilage/Glands/Squam', nextNodeId: 'result_teratoma' }] },
    'result_seminoma': { id: 'result_seminoma', type: 'result', title: 'Seminoma', diagnosis: 'Seminoma', description: 'Most common GCT.', pearls: ['KIT+, OCT4+, SALL4+', 'Fibrous septa with lymphocytes'] },
    'result_spermatocytic': { id: 'result_spermatocytic', type: 'result', title: 'Spermatocytic Tumor', diagnosis: 'Spermatocytic Tumor', description: 'Older men, indolent.', pearls: ['Three cell sizes (small, medium, giant)', 'No lymphocytes', 'OCT4 negative'] },
    'result_ec': { id: 'result_ec', type: 'result', title: 'Embryonal Carcinoma', diagnosis: 'Embryonal Carcinoma', description: 'Aggressive component.', pearls: ['CD30+', 'OCT4+', 'Ki67 high', 'Necrosis'] },
    'result_yolk': { id: 'result_yolk', type: 'result', title: 'Yolk Sac Tumor', diagnosis: 'Yolk Sac Tumor', description: 'Pre-pubertal (pure) or Post-pubertal (mixed).', pearls: ['AFP+', 'Glypican-3+', 'Schiller-Duval bodies', 'Reticular/Microcystic'] },
    'result_chorio': { id: 'result_chorio', type: 'result', title: 'Choriocarcinoma', diagnosis: 'Choriocarcinoma', description: 'Hemorrhagic, aggressive.', pearls: ['hCG+', 'Biphasic (Cyto + Syncytio)', 'Early hematogenous spread'] },
    'result_teratoma': { id: 'result_teratoma', type: 'result', title: 'Teratoma', diagnosis: 'Teratoma', description: 'Mature or Immature.', pearls: ['Post-pubertal teratomas are malignant', 'Derivatives of 3 germ layers'] }
};

// --- THORACIC: LUNG ALGORITHM ---
const LUNG_NODES: Record<string, AlgorithmNode> = {
    'start': { id: 'start', type: 'start', title: 'Lung Carcinoma', description: 'NSCLC vs Small Cell.', options: [{ label: 'Cell Size & Pattern', nextNodeId: 'size_check' }] },
    'size_check': { id: 'size_check', type: 'decision', title: 'Small vs Non-Small', description: 'Nuclear features.', options: [{ label: 'Small Blue Cells, Molding', nextNodeId: 'result_sclc' }, { label: 'Large Cells, Glands/Squam', nextNodeId: 'nsclc_branch' }] },
    'nsclc_branch': {
        id: 'nsclc_branch', type: 'decision', title: 'NSCLC Subtyping', description: 'Adeno vs Squamous.',
        recommendedInitialIHC: ['TTF1', 'p40', 'Napsin A', 'CK5/6'],
        options: [
            { label: 'TTF1+, p40-', nextNodeId: 'result_adeno' },
            { label: 'p40+, TTF1-', nextNodeId: 'result_scc' },
            { label: 'All Negative', nextNodeId: 'result_large_cell' },
            { label: 'Neuroendocrine Markers +', nextNodeId: 'result_lcnsc' }
        ]
    },
    'result_sclc': { id: 'result_sclc', type: 'result', title: 'Small Cell Carcinoma', diagnosis: 'Small Cell Carcinoma', description: 'High-grade neuroendocrine carcinoma.', confirmatoryStudies: ['INSM1', 'Synaptophysin', 'Chromogranin'], pearls: ['Azzopardi effect', 'Nuclear molding', 'TTF1 positive in 90%', 'Crush artifact'] },
    'result_adeno': { id: 'result_adeno', type: 'result', title: 'Adenocarcinoma', diagnosis: 'Lung Adenocarcinoma', description: 'Glandular differentiation.', pearls: ['Glandular differentiation', 'Mucin', 'Molecular testing mandatory (EGFR/ALK/ROS1)'] },
    'result_scc': { id: 'result_scc', type: 'result', title: 'Squamous Cell Carcinoma', diagnosis: 'Squamous Cell Carcinoma of Lung', description: 'Keratinizing or non-keratinizing.', pearls: ['Keratin pearls', 'Intercellular bridges', 'Central location'] },
    'result_large_cell': { id: 'result_large_cell', type: 'result', title: 'Large Cell Carcinoma', diagnosis: 'Large Cell Carcinoma (NOS)', description: 'Diagnosis of exclusion. High grade, large cells, no differentiation markers.' },
    'result_lcnsc': { id: 'result_lcnsc', type: 'result', title: 'LCNEC', diagnosis: 'Large Cell Neuroendocrine Carcinoma', description: 'High grade neuroendocrine, large cells.', pearls: ['Neuroendocrine morphology + markers', 'High mitotic rate', 'Necrosis'] }
};

// --- GI TRACT ALGORITHM ---
const GI_NODES: Record<string, AlgorithmNode> = {
    'start': { id: 'start', type: 'start', title: 'GI Tract Neoplasms', description: 'Site-specific approach.', options: [{ label: 'Select Site', nextNodeId: 'site_check' }] },
    'site_check': { id: 'site_check', type: 'decision', title: 'Anatomic Site', description: 'Where is the tumor?', options: [{ label: 'Colon/Rectum', nextNodeId: 'colon_branch' }, { label: 'Stomach', nextNodeId: 'stomach_branch' }, { label: 'Liver', nextNodeId: 'liver_branch' }] },
    'colon_branch': { id: 'colon_branch', type: 'decision', title: 'Colon Polyp', description: 'Serrated vs Adenomatous.', options: [{ label: 'Dysplasia, Nuclear pencil-shape', nextNodeId: 'result_tubular' }, { label: 'Saw-tooth, Boot-shaped', nextNodeId: 'result_ssl' }, { label: 'Hyperplastic', nextNodeId: 'result_hp' }] },
    'stomach_branch': { id: 'stomach_branch', type: 'decision', title: 'Gastric Malignancy', description: 'Carcinoma vs GIST.', options: [{ label: 'Glandular/Signet Ring', nextNodeId: 'result_gastric_ca' }, { label: 'Spindle Cell', nextNodeId: 'result_gist' }] },
    'liver_branch': { id: 'liver_branch', type: 'decision', title: 'Liver Primary', description: 'HCC vs Cholangio.', recommendedInitialIHC: ['HepPar1', 'Arginase-1', 'CK7', 'CK19', 'Glypican-3'], options: [{ label: 'HepPar1+, Arginase-1+', nextNodeId: 'result_hcc' }, { label: 'CK7+, CK19+, Arginase-', nextNodeId: 'result_cholangio' }] },
    'result_tubular': { id: 'result_tubular', type: 'result', title: 'Tubular Adenoma', diagnosis: 'Tubular Adenoma', description: 'Precursor to CRC.', pearls: ['Nuclear stratification', 'Hyperchromasia', 'APC mutation pathway'] },
    'result_ssl': { id: 'result_ssl', type: 'result', title: 'Sessile Serrated Lesion', diagnosis: 'Sessile Serrated Lesion', description: 'Serrated pathway precursor.', pearls: ['Right sided', 'BRAF mutation', 'Boot-shaped crypts', 'Horizontal growth'] },
    'result_hp': { id: 'result_hp', type: 'result', title: 'Hyperplastic Polyp', diagnosis: 'Hyperplastic Polyp', description: 'Benign serrated polyp.', pearls: ['Left sided', 'Surface serration only', 'Star-shaped crypts'] },
    'result_gastric_ca': { id: 'result_gastric_ca', type: 'result', title: 'Gastric Adenocarcinoma', diagnosis: 'Gastric Adenocarcinoma', description: 'Stomach cancer.', pearls: ['Intestinal type vs Diffuse (Signet ring - CDH1 mutation)', 'Linitis plastica'] },
    'result_gist': { id: 'result_gist', type: 'result', title: 'GIST', diagnosis: 'Gastrointestinal Stromal Tumor', description: 'Mesenchymal GI tumor.', confirmatoryStudies: ['KIT', 'DOG1'], pearls: ['Cajal cell origin', 'Tyrosine kinase inhibitors', 'Spindle or Epithelioid'] },
    'result_hcc': { id: 'result_hcc', type: 'result', title: 'Hepatocellular Carcinoma', diagnosis: 'Hepatocellular Carcinoma', description: 'Primary liver cancer.', pearls: ['Trabecular pattern', 'Bile production', 'Reticulin loss', 'Polyclonal CEA canalicular'] },
    'result_cholangio': { id: 'result_cholangio', type: 'result', title: 'Cholangiocarcinoma', diagnosis: 'Cholangiocarcinoma', description: 'Bile duct cancer.', pearls: ['Gland formation', 'Desmoplastic stroma', 'Mucin+'] }
};

// --- HEAD & NECK: THYROID ---
const THYROID_NODES: Record<string, AlgorithmNode> = {
    'start': { id: 'start', type: 'start', title: 'Thyroid Carcinoma', description: 'Follicular vs Parafollicular.', options: [{ label: 'Cell Origin', nextNodeId: 'origin_check' }] },
    'origin_check': { id: 'origin_check', type: 'decision', title: 'Cell Type', description: 'Follicular vs C-cell.', options: [{ label: 'Follicular Cell', nextNodeId: 'follicular_branch' }, { label: 'C-Cell (Neuroendocrine)', nextNodeId: 'result_medullary' }] },
    'follicular_branch': { id: 'follicular_branch', type: 'decision', title: 'Nuclear Features', description: 'Papillary nuclear features.', options: [{ label: 'Present (Grooves, Inclusions)', nextNodeId: 'result_ptc' }, { label: 'Absent', nextNodeId: 'result_ftc' }, { label: 'Anaplastic/Pleomorphic', nextNodeId: 'result_atc' }] },
    'result_ptc': { id: 'result_ptc', type: 'result', title: 'Papillary Carcinoma', diagnosis: 'Papillary Thyroid Carcinoma', description: 'Most common.', pearls: ['Nuclear clearing (Orphan Annie)', 'Grooves', 'Inclusions', 'BRAF V600E'] },
    'result_ftc': { id: 'result_ftc', type: 'result', title: 'Follicular Carcinoma', diagnosis: 'Follicular Thyroid Carcinoma', description: 'Capsular/Vascular invasion required.', pearls: ['RAS mutations', 'PAX8-PPARg', 'Indistinguishable from adenoma on FNA'] },
    'result_medullary': { id: 'result_medullary', type: 'result', title: 'Medullary Carcinoma', diagnosis: 'Medullary Thyroid Carcinoma', description: 'C-cell origin.', pearls: ['Calcitonin+', 'Amyloid', 'RET mutations', 'MEN2 association'] },
    'result_atc': { id: 'result_atc', type: 'result', title: 'Anaplastic Carcinoma', diagnosis: 'Anaplastic Thyroid Carcinoma', description: 'Undifferentiated, aggressive.', pearls: ['p53 mutant', 'Loss of TTF1/Thyroglobulin', 'Sarcomatoid'] }
};

// --- HEAD & NECK: SALIVARY ---
const SALIVARY_NODES: Record<string, AlgorithmNode> = {
    'start': { id: 'start', type: 'start', title: 'Salivary Gland Neoplasms', description: 'Common entities.', options: [{ label: 'Cell Type / Pattern', nextNodeId: 'pattern_check' }] },
    'pattern_check': { id: 'pattern_check', type: 'decision', title: 'Pattern', description: 'Cribriform, Mixed, or Oncocytic.', options: [{ label: 'Chondromyxoid + Epithelial', nextNodeId: 'result_pa' }, { label: 'Cribriform / Cylinders', nextNodeId: 'result_acc' }, { label: 'Oncocytic + Lymphocytes', nextNodeId: 'result_warthin' }, { label: 'Mucous + Squamous', nextNodeId: 'result_mec' }, { label: 'Serous Acini', nextNodeId: 'result_acinic' }] },
    'result_pa': { id: 'result_pa', type: 'result', title: 'Pleomorphic Adenoma', diagnosis: 'Pleomorphic Adenoma', description: 'Benign mixed tumor.', pearls: ['PLAG1 rearrangement', 'Most common', 'Ducts and myoepithelium'] },
    'result_acc': { id: 'result_acc', type: 'result', title: 'Adenoid Cystic Ca', diagnosis: 'Adenoid Cystic Carcinoma', description: 'Perineural invasion common.', pearls: ['MYB-NFIB fusion', 'Swiss cheese pattern', 'Slow but relentless'] },
    'result_warthin': { id: 'result_warthin', type: 'result', title: 'Warthin Tumor', diagnosis: 'Warthin Tumor', description: 'Benign, cystic.', pearls: ['Double layer epithelium', 'Lymphoid stroma', 'Smokers'] },
    'result_mec': { id: 'result_mec', type: 'result', title: 'Mucoepidermoid Ca', diagnosis: 'Mucoepidermoid Carcinoma', description: 'Most common malignant salivary tumor.', pearls: ['MAML2 rearrangement', 'Mucocytes + Intermediate + Squamous'] },
    'result_acinic': { id: 'result_acinic', type: 'result', title: 'Acinic Cell Ca', diagnosis: 'Acinic Cell Carcinoma', description: 'Serous differentiation.', pearls: ['Zymogen granules', 'DOG1+'] }
};

// --- CNS ---
const CNS_NODES: Record<string, AlgorithmNode> = {
    'start': { id: 'start', type: 'start', title: 'CNS Tumors (Adult)', description: 'Glial vs Non-Glial.', options: [{ label: 'Glial Marker (GFAP)', nextNodeId: 'gfap_check' }] },
    'gfap_check': { id: 'gfap_check', type: 'decision', title: 'GFAP Status', description: 'Is it a glioma?', options: [{ label: 'Positive', nextNodeId: 'glioma_branch' }, { label: 'Negative', nextNodeId: 'non_glial_branch' }] },
    'glioma_branch': {
        id: 'glioma_branch', type: 'decision', title: 'IDH Mutation', description: 'The key molecular classifier (WHO 2021).',
        recommendedInitialIHC: ['IDH1 R132H', 'ATRX', 'p53', 'Ki67'],
        options: [{ label: 'IDH Mutant', nextNodeId: 'idh_mut_branch' }, { label: 'IDH Wild-type', nextNodeId: 'result_gbm' }]
    },
    'idh_mut_branch': {
        id: 'idh_mut_branch', type: 'decision', title: '1p/19q Codeletion', description: 'Oligo vs Astro.',
        options: [{ label: 'Codeleted (ATRX retained)', nextNodeId: 'result_oligo' }, { label: 'Intact (ATRX loss)', nextNodeId: 'result_astro' }]
    },
    'non_glial_branch': {
        id: 'non_glial_branch', type: 'decision', title: 'Other Tumors', description: 'Meningeal vs Metastatic.',
        options: [{ label: 'Whorls, EMA+', nextNodeId: 'result_meningioma' }, { label: 'Epithelial, Keratin+', nextNodeId: 'result_met' }, { label: 'S100+, Antoni A/B', nextNodeId: 'result_schwannoma_cns' }]
    },
    'result_gbm': { id: 'result_gbm', type: 'result', title: 'Glioblastoma', diagnosis: 'Glioblastoma, IDH-wildtype', description: 'High grade glioma.', pearls: ['Grade 4', 'Necrosis', 'Microvascular proliferation', 'TERT/EGFR'] },
    'result_oligo': { id: 'result_oligo', type: 'result', title: 'Oligodendroglioma', diagnosis: 'Oligodendroglioma, IDH-mutant, 1p/19q-codeleted', description: 'Infiltrating glioma.', pearls: ['Fried egg cells', 'Chicken wire vessels', 'Calcification', 'Cortical'] },
    'result_astro': { id: 'result_astro', type: 'result', title: 'Astrocytoma', diagnosis: 'Astrocytoma, IDH-mutant', description: 'Infiltrating glioma.', pearls: ['ATRX loss', 'p53 overexpression'] },
    'result_meningioma': { id: 'result_meningioma', type: 'result', title: 'Meningioma', diagnosis: 'Meningioma', description: 'Meningothelial tumor.', pearls: ['Dural based', 'Psammoma bodies', 'SSTR2+', 'NF2 loss'] },
    'result_met': { id: 'result_met', type: 'stop', title: 'Metastatic Carcinoma', description: 'Rule out Lung, Breast, Melanoma.' },
    'result_schwannoma_cns': { id: 'result_schwannoma_cns', type: 'result', title: 'Schwannoma', diagnosis: 'Schwannoma', description: 'Benign nerve sheath tumor.', pearls: ['Cerebellopontine angle', 'Verocay bodies', 'S100+'] }
};

export const ALGORITHMS: DiagnosticAlgorithm[] = [
    // Soft Tissue & Bone
    { id: 'algo_spindle_soft_tissue', title: 'Spindle Cell Neoplasms', category: 'Soft Tissue', summary: 'Comprehensive workup for spindle cell tumors including SFT, Nerve Sheath, and Smooth Muscle.', startNodeId: 'start', nodes: SPINDLE_CELL_NODES },
    { id: 'algo_epithelioid_soft_tissue', title: 'Epithelioid Soft Tissue', category: 'Soft Tissue', summary: 'Distinguishing Carcinoma, Melanoma, Epithelioid Sarcoma, and PEComa.', startNodeId: 'start', nodes: EPITHELIOID_NODES },
    { id: 'algo_myxoid_soft_tissue', title: 'Myxoid Soft Tissue', category: 'Soft Tissue', summary: 'Navigating Myxoid Liposarcoma, MFS, LGFMS, and benign mimics.', startNodeId: 'start', nodes: MYXOID_NODES },
    { id: 'algo_srbct', title: 'Small Round Blue Cell Tumors', category: 'Pediatric / Bone', summary: 'Expert triage of Ewing, Lymphoma, Rhabdo, and new molecular entities (CIC, BCOR).', startNodeId: 'start', nodes: SRBCT_NODES },
    { id: 'algo_pleomorphic', title: 'Pleomorphic Sarcomas', category: 'Soft Tissue', summary: 'High-grade sarcoma exclusion algorithm (Dediff LPS vs UPS vs Pleomorphic Rhabdo).', startNodeId: 'start', nodes: PLEOMORPHIC_NODES },
    { id: 'algo_bone_matrix', title: 'Bone Tumor Workup', category: 'Bone', summary: 'Matrix-based approach (Osteoid vs Cartilage vs Lytic).', startNodeId: 'start', nodes: BONE_NODES },
    { id: 'algo_lipomatous', title: 'Lipomatous Tumors', category: 'Soft Tissue', summary: 'Differentiation of Lipoma variants from ALT/WDLPS.', startNodeId: 'start', nodes: LIPOMATOUS_NODES },

    // DermPath
    { id: 'algo_epidermal', title: 'Epidermal Lesions', category: 'Dermatopathology', summary: 'Keratinocytic tumors: Verruca vs KA vs SCC vs BCC.', startNodeId: 'start', nodes: EPIDERMAL_NODES },
    { id: 'algo_skin_spindle', title: 'Cutaneous Spindle Cell', category: 'Dermatopathology', summary: 'The "SLAM" differential (SCC, LMS, AFX, Melanoma) with IHC details.', startNodeId: 'start', nodes: SKIN_SPINDLE_NODES },

    // GYN
    { id: 'algo_endometrial_molecular', title: 'Endometrial Molecular (ProMisE)', category: 'Gynecologic', summary: 'TCGA-based molecular classification of Endometrial Carcinoma.', startNodeId: 'start', nodes: ENDOMETRIAL_NODES },
    { id: 'algo_ovarian_carcinoma', title: 'Ovarian Carcinoma Subtyping', category: 'Gynecologic', summary: 'Distinguishing the 5 major histotypes of ovarian carcinoma.', startNodeId: 'start', nodes: OVARIAN_NODES },
    { id: 'algo_gtd', title: 'Gestational Trophoblastic Disease', category: 'Gynecologic', summary: 'Choriocarcinoma vs PSTT vs ETT.', startNodeId: 'start', nodes: GTD_NODES },
    { id: 'algo_uterine_mesenchymal', title: 'Uterine Mesenchymal', category: 'Gynecologic', summary: 'Leiomyosarcoma vs ESS vs STUMP vs Cellular Leiomyoma.', startNodeId: 'start', nodes: UTERINE_MESENCHYMAL_NODES },
    { id: 'algo_vulva', title: 'Vulvar Pathology', category: 'Gynecologic', summary: 'Squamous lesions (HPV-associated vs Independent).', startNodeId: 'start', nodes: VULVAR_NODES },
    { id: 'algo_vagina', title: 'Vaginal Pathology', category: 'Gynecologic', summary: 'Vaginal mass evaluation.', startNodeId: 'start', nodes: VAGINAL_NODES },
    { id: 'algo_cervix', title: 'Cervical Carcinoma', category: 'Gynecologic', summary: 'Squamous vs Adeno (HPV vs Gastric-type).', startNodeId: 'start', nodes: CERVICAL_NODES },
    { id: 'algo_gyn_mimics', title: 'Benign GYN Mimics', category: 'Gynecologic', summary: 'Recognizing lesions that simulate cancer.', startNodeId: 'start', nodes: MIMIC_NODES },

    // General Surgical Pathology
    { id: 'algo_breast', title: 'Breast Neoplasms', category: 'Breast', summary: 'Invasive Carcinoma subtyping and Fibroepithelial lesions.', startNodeId: 'start', nodes: BREAST_NODES },
    { id: 'algo_kidney', title: 'Renal Cell Carcinoma', category: 'Genitourinary', summary: 'Comprehensive RCC subtyping (Clear vs Eosinophilic).', startNodeId: 'start', nodes: KIDNEY_NODES },
    { id: 'algo_bladder', title: 'Urothelial Neoplasms', category: 'Genitourinary', summary: 'Grading and invasion assessment.', startNodeId: 'start', nodes: BLADDER_NODES },
    { id: 'algo_prostate', title: 'Prostate Adenocarcinoma', category: 'Genitourinary', summary: 'Diagnosis of Malignancy (Basal Cell Loss) & Mimics.', startNodeId: 'start', nodes: PROSTATE_NODES },
    { id: 'algo_testis', title: 'Testicular Germ Cell', category: 'Genitourinary', summary: 'Seminoma vs Non-Seminoma classification.', startNodeId: 'start', nodes: TESTIS_NODES },
    { id: 'algo_lung', title: 'Lung Carcinoma', category: 'Thoracic', summary: 'NSCLC (Adeno/Squamous) vs Small Cell.', startNodeId: 'start', nodes: LUNG_NODES },
    { id: 'algo_gi_tract', title: 'GI Tract Neoplasms', category: 'Gastrointestinal', summary: 'Colon, Stomach, and Liver primary tumors.', startNodeId: 'start', nodes: GI_NODES },
    { id: 'algo_thyroid', title: 'Thyroid Carcinoma', category: 'Head & Neck', summary: 'Follicular vs Papillary vs Medullary.', startNodeId: 'start', nodes: THYROID_NODES },
    { id: 'algo_salivary', title: 'Salivary Gland', category: 'Head & Neck', summary: 'Common benign and malignant entities.', startNodeId: 'start', nodes: SALIVARY_NODES },
    { id: 'algo_cns', title: 'CNS Tumors (WHO 2021)', category: 'Neuropathology', summary: 'Integrated molecular diagnosis of Gliomas.', startNodeId: 'start', nodes: CNS_NODES }
];

export const getAlgorithm = (id: string): DiagnosticAlgorithm | undefined => {
    return ALGORITHMS.find(a => a.id === id);
};

export const findLineage = (algorithmId: string, targetNodeId: string): string[] => {
    const algorithm = getAlgorithm(algorithmId);
    if (!algorithm) return [];

    const nodes = algorithm.nodes;
    const startNodeId = algorithm.startNodeId;

    // BFS to find path
    const queue: { id: string; path: string[] }[] = [{ id: startNodeId, path: [startNodeId] }];
    const visited = new Set<string>();

    while (queue.length > 0) {
        const { id, path } = queue.shift()!;

        if (id === targetNodeId) {
            return path;
        }

        if (visited.has(id)) continue;
        visited.add(id);

        const node = nodes[id];
        if (node && node.options) {
            for (const option of node.options) {
                if (option.nextNodeId) {
                    queue.push({
                        id: option.nextNodeId,
                        path: [...path, option.nextNodeId]
                    });
                }
            }
        }
    }

    return [];
};
