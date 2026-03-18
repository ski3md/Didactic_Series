
import type { HistologicFamily } from '../types';

// This is a curated list of real, relevant H&E histology image URLs from Wikimedia Commons.
export const HISTOLOGY_IMAGE_DATA: Partial<Record<HistologicFamily | 'gyn_rare' | 'gyn_benign' | 'gyn_vagina' | 'gyn_cervix' | 'gyn_expanded' | 'gyn_variants', string[]>> = {
    sft: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Solitary_fibrous_tumour_--_high_mag.jpg/1024px-Solitary_fibrous_tumour_--_high_mag.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Solitary_fibrous_tumour_--_very_high_mag.jpg/1024px-Solitary_fibrous_tumour_--_very_high_mag.jpg",
    ],
    adipocytic: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Well-differentiated_liposarcoma_with_lipoblasts_and_hyperchromatic_stromal_cells.jpg/1024px-Well-differentiated_liposarcoma_with_lipoblasts_and_hyperchromatic_stromal_cells.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Myxoid_liposarcoma_2_--_high_mag.jpg/1024px-Myxoid_liposarcoma_2_--_high_mag.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Dedifferentiated_liposarcoma_-_high_mag.jpg/1024px-Dedifferentiated_liposarcoma_-_high_mag.jpg",
    ],
    pnst: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Schwannoma_1_--_high_mag.jpg/1024px-Schwannoma_1_--_high_mag.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Neurofibroma_--_high_mag.jpg/1024px-Neurofibroma_--_high_mag.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Malignant_peripheral_nerve_sheath_tumour_1_--_high_mag.jpg/1024px-Malignant_peripheral_nerve_sheath_tumour_1_--_high_mag.jpg",
    ],
    uncertain: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Synovial_sarcoma_1_--_high_mag.jpg/1024px-Synovial_sarcoma_1_--_high_mag.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Biphasic_synovial_sarcoma_showing_glandular_and_spindle_cell_components.jpg/1024px-Biphasic_synovial_sarcoma_showing_glandular_and_spindle_cell_components.jpg",
    ],
    undifferentiated: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Ewing%27s_sarcoma_-_high_mag.jpg/1024px-Ewing%27s_sarcoma_-_high_mag.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Ewing%27s_sarcoma_--_intermed_mag.jpg/1024px-Ewing%27s_sarcoma_--_intermed_mag.jpg"
    ],
    smc: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Leiomyosarcoma_1_--_high_mag.jpg/1024px-Leiomyosarcoma_1_--_high_mag.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Leiomyosarcoma_2_--_high_mag.jpg/1024px-Leiomyosarcoma_2_--_high_mag.jpg"
    ],
    gastrointestinal: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gastrointestinal_stromal_tumor_1_--_high_mag.jpg/1024px-Gastrointestinal_stromal_tumor_1_--_high_mag.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Epithelioid_GIST_High_Mag.jpg/1024px-Epithelioid_GIST_High_Mag.jpg"
    ],
    fibrohistiocytic: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Undifferentiated_pleomorphic_sarcoma_1_--_high_mag.jpg/1024px-Undifferentiated_pleomorphic_sarcoma_1_--_high_mag.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Undifferentiated_pleomorphic_sarcoma_3_--_high_mag.jpg/1024px-Undifferentiated_pleomorphic_sarcoma_3_--_high_mag.jpg"
    ],
    skm: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Embryonal_rhabdomyosarcoma_-_high_mag.jpg/1024px-Embryonal_rhabdomyosarcoma_-_high_mag.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Alveolar_rhabdomyosarcoma_1_--_high_mag.jpg/1024px-Alveolar_rhabdomyosarcoma_1_--_high_mag.jpg"
    ],
    melanocytic: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Spindle-cell_melanoma_1_--_high_mag.jpg/1024px-Spindle-cell_melanoma_1_--_high_mag.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Desmoplastic_melanoma_--_high_mag.jpg/1024px-Desmoplastic_melanoma_--_high_mag.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Nodular_melanoma_-_high_mag.jpg/1024px-Nodular_melanoma_-_high_mag.jpg"
    ],
    'chondro-osseous': [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Chondrosarcoma_1_--_high_mag.jpg/1024px-Chondrosarcoma_1_--_high_mag.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Dedifferentiated_chondrosarcoma_--_high_mag.jpg/1024px-Dedifferentiated_chondrosarcoma_--_high_mag.jpg"
    ],
    basaloid: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Basal_cell_carcinoma_--_high_mag.jpg/1024px-Basal_cell_carcinoma_--_high_mag.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Basal_cell_carcinoma_2_--_high_mag.jpg/1024px-Basal_cell_carcinoma_2_--_high_mag.jpg"
    ],
    squamous: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Squamous_cell_carcinoma_of_the_skin_-_high_mag.jpg/1024px-Squamous_cell_carcinoma_of_the_skin_-_high_mag.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Keratoacanthoma_-_high_mag.jpg/1024px-Keratoacanthoma_-_high_mag.jpg"
    ],
    histiocytic_dendritic: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Atypical_fibroxanthoma_--_high_mag.jpg/1024px-Atypical_fibroxanthoma_--_high_mag.jpg"
    ],
    fibroblastic: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Nodular_fasciitis_-_high_mag.jpg/1024px-Nodular_fasciitis_-_high_mag.jpg"
    ],
    pericytic: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Glomus_tumor_-_high_mag.jpg/1024px-Glomus_tumor_-_high_mag.jpg"
    ],
    vascular: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Angiosarcoma_1_--_high_mag.jpg/1024px-Angiosarcoma_1_--_high_mag.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Kaposi%27s_sarcoma_-_high_mag.jpg/1024px-Kaposi%27s_sarcoma_-_high_mag.jpg"
    ],
    neuroendocrine: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Merkel_cell_carcinoma_--_very_high_mag.jpg/1024px-Merkel_cell_carcinoma_--_very_high_mag.jpg"
    ],
    adnexal: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Sebaceous_carcinoma_--_high_mag.jpg/1024px-Sebaceous_carcinoma_--_high_mag.jpg"
    ],
    lymphoid: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Mycosis_fungoides_--_high_mag.jpg/1024px-Mycosis_fungoides_--_high_mag.jpg"
    ],
    spindled: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Dermatofibroma_--_high_mag.jpg/1024px-Dermatofibroma_--_high_mag.jpg"
    ],
    bone_other: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Osteosarcoma_--_high_mag.jpg/1024px-Osteosarcoma_--_high_mag.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Chordoma_-_high_mag.jpg/1024px-Chordoma_-_high_mag.jpg"
    ],
    bone_fibro: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Desmoplastic_fibroma_-_high_mag.jpg/1024px-Desmoplastic_fibroma_-_high_mag.jpg"
    ],
    bone_cartilage: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Chondrosarcoma_1_--_high_mag.jpg/1024px-Chondrosarcoma_1_--_high_mag.jpg"
    ],
    bone_vascular: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Hemangioma_of_bone_-_intermed_mag.jpg/1024px-Hemangioma_of_bone_-_intermed_mag.jpg"
    ],
    // --- GYN EXISTING & NEW ---
    epithelial_gyn: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/High-grade_serous_carcinoma_of_the_ovary_-_high_mag.jpg/1024px-High-grade_serous_carcinoma_of_the_ovary_-_high_mag.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Endometrioid_adenocarcinoma_of_endometrium_--_high_mag.jpg/1024px-Endometrioid_adenocarcinoma_of_endometrium_--_high_mag.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Clear_cell_carcinoma_of_the_ovary_-_high_mag.jpg/1024px-Clear_cell_carcinoma_of_the_ovary_-_high_mag.jpg"
    ],
    mesenchymal_gyn: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Leiomyosarcoma_1_--_high_mag.jpg/1024px-Leiomyosarcoma_1_--_high_mag.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Low-grade_endometrial_stromal_sarcoma_--_high_mag.jpg/1024px-Low-grade_endometrial_stromal_sarcoma_--_high_mag.jpg"
    ],
    sex_cord: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Adult_granulosa_cell_tumor_-_high_mag.jpg/1024px-Adult_granulosa_cell_tumor_-_high_mag.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Sertoli-Leydig_cell_tumor_-_high_mag.jpg/1024px-Sertoli-Leydig_cell_tumor_-_high_mag.jpg"
    ],
    germ_cell: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Dysgerminoma_-_high_mag.jpg/1024px-Dysgerminoma_-_high_mag.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Yolk_sac_tumor_-_Schiller-Duval_body_-_high_mag.jpg/1024px-Yolk_sac_tumor_-_Schiller-Duval_body_-_high_mag.jpg"
    ],
    trophoblastic: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Choriocarcinoma_-_high_mag.jpg/1024px-Choriocarcinoma_-_high_mag.jpg"
    ],
    gyn_rare: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Small_cell_carcinoma_of_the_ovary%2C_hypercalcemic_type_-_high_mag.jpg/1024px-Small_cell_carcinoma_of_the_ovary%2C_hypercalcemic_type_-_high_mag.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Aggressive_angiomyxoma_-_high_mag.jpg/1024px-Aggressive_angiomyxoma_-_high_mag.jpg"
    ],
    gyn_benign: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Endometriosis_of_ovary_-_high_mag.jpg/1024px-Endometriosis_of_ovary_-_high_mag.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Adenomyosis_-_high_mag.jpg/1024px-Adenomyosis_-_high_mag.jpg"
    ],
    gyn_vagina: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Vaginal_intraepithelial_neoplasia_III_-_high_mag.jpg/1024px-Vaginal_intraepithelial_neoplasia_III_-_high_mag.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Embryonal_rhabdomyosarcoma_-_high_mag.jpg/1024px-Embryonal_rhabdomyosarcoma_-_high_mag.jpg" // Botryoid
    ],
    gyn_cervix: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Cervical_squamous_cell_carcinoma_-_high_mag.jpg/1024px-Cervical_squamous_cell_carcinoma_-_high_mag.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Adenocarcinoma_in_situ_of_cervix_-_high_mag.jpg/1024px-Adenocarcinoma_in_situ_of_cervix_-_high_mag.jpg"
    ],
    gyn_expanded: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Adenomatoid_tumor_-_high_mag.jpg/1024px-Adenomatoid_tumor_-_high_mag.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Endosalpingiosis_-_high_mag.jpg/1024px-Endosalpingiosis_-_high_mag.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Malakoplakia_-_high_mag.jpg/1024px-Malakoplakia_-_high_mag.jpg"
    ],
    gyn_variants: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Juvenile_granulosa_cell_tumor_-_high_mag.jpg/1024px-Juvenile_granulosa_cell_tumor_-_high_mag.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Sertoli-Leydig_cell_tumor_retiform_pattern_-_intermed_mag.jpg/1024px-Sertoli-Leydig_cell_tumor_retiform_pattern_-_intermed_mag.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Struma_carcinoid_-_high_mag.jpg/1024px-Struma_carcinoid_-_high_mag.jpg"
    ]
};
