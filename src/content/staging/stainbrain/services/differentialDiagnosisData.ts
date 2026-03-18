import type { HistologicFamily } from '../types';

export interface DifferentialDiagnosisLink {
    name: string;
    family: HistologicFamily;
}

export const DIFFERENTIAL_DIAGNOSIS_MAP: Partial<Record<HistologicFamily, DifferentialDiagnosisLink[]>> = {
    sft: [
        { name: 'MPNST', family: 'pnst' },
        { name: 'Leiomyosarcoma', family: 'smc' },
        { name: 'Synovial Sarcoma', family: 'uncertain' },
    ],
    adipocytic: [
        { name: 'Pleomorphic UPS', family: 'fibrohistiocytic' },
        { name: 'Dedifferentiated Liposarcoma', family: 'adipocytic' },
        { name: 'Myxoid Liposarcoma', family: 'adipocytic' },
    ],
    pnst: [
        { name: 'Synovial Sarcoma', family: 'uncertain' },
        { name: 'Spindled Melanoma', family: 'melanocytic' },
        { name: 'Leiomyosarcoma', family: 'smc' },
    ],
    uncertain: [ // Synovial Sarcoma
        { name: 'MPNST', family: 'pnst' },
        { name: 'Ewing Sarcoma', family: 'undifferentiated' },
        { name: 'SFT', family: 'sft' },
    ],
    undifferentiated: [ // Ewing Sarcoma
        { name: 'Alveolar Rhabdomyosarcoma', family: 'skm' },
        { name: 'Mesenchymal Chondrosarcoma', family: 'chondro-osseous' },
        { name: 'Poorly-differentiated Synovial Sarcoma', family: 'uncertain' },
    ],
    smc: [ // Leiomyosarcoma
        { name: 'MPNST', family: 'pnst' },
        { name: 'SFT', family: 'sft' },
        { name: 'Fibrosarcomatous UPS', family: 'fibrohistiocytic' }
    ],
    fibrohistiocytic: [ // UPS
        { name: 'Dedifferentiated Liposarcoma', family: 'adipocytic' },
        { name: 'Pleomorphic Rhabdomyosarcoma', family: 'skm' },
        { name: 'Pleomorphic Leiomyosarcoma', family: 'smc' },
    ],
    melanocytic: [
        { name: 'Spitz Nevus', family: 'melanocytic' },
        { name: 'Poorly Differentiated Carcinoma', family: 'squamous' },
        { name: 'MPNST', family: 'pnst' }
    ],
    squamous: [
        { name: 'Keratoacanthoma', family: 'squamous' },
        { name: 'Metastatic Carcinoma', family: 'squamous' },
        { name: 'Spindled/Desmoplastic SCC', family: 'squamous' }
    ],
    basaloid: [
        { name: 'Trichoepithelioma', family: 'adnexal' },
        { name: 'Basaloid SCC', family: 'squamous' },
        { name: 'Merkel Cell Carcinoma', family: 'uncertain' }
    ],
    histiocytic_dendritic: [ // AFX
        { name: 'Spindle Cell Melanoma', family: 'melanocytic' },
        { name: 'Pleomorphic UPS', family: 'fibrohistiocytic' },
        { name: 'Spindle Cell SCC', family: 'squamous' }
    ]
};
