import type { HistologicFamily } from '../types';

export type HistologyImage = {
    /** Unique identifier for stable keys + dedupe */
    id: string;
    /** What you show in the UI */
    title: string;
    /** Optional: entity name (helps tying to lectures/entities) */
    entity?: string;
    /** Family bucket */
    family: HistologicFamily | "gyn_rare" | "gyn_benign" | "gyn_vagina" | "gyn_cervix" | "gyn_expanded" | "gyn_variants" | "testis";
    /** Rendered image source (thumb is fast; full is for lightbox) */
    thumbUrl: string;
    fullUrl: string;
    /** Extra display/print info */
    caption?: string;
    stain?: "H&E" | "IHC" | "Special" | "Other";
    magnification?: "low" | "intermediate" | "high" | "very_high";
    /** Attribution (print-safe) */
    sourcePageUrl: string;     // Wikimedia File page
    author?: string;
    license?: string;
};

function makeWikiImage(opts: {
    id: string;
    title: string;
    family: HistologyImage["family"];
    entity?: string;
    fileName: string;
    thumbPath: string;
    caption?: string;
    stain?: HistologyImage["stain"];
    magnification?: HistologyImage["magnification"];
    author?: string;
    license?: string;
}): HistologyImage {
    const sourcePageUrl = `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(opts.fileName)}`;

    // Safe default thumbs (fast enough, prints fine)
    const thumbUrl = `https://upload.wikimedia.org/wikipedia/commons/thumb/${opts.thumbPath}/${encodeURIComponent(
        opts.fileName
    )}/768px-${encodeURIComponent(opts.fileName)}`;

    // Full (original) file
    const fullUrl = `https://upload.wikimedia.org/wikipedia/commons/${opts.thumbPath}/${encodeURIComponent(opts.fileName)}`;

    return {
        id: opts.id,
        title: opts.title,
        entity: opts.entity,
        family: opts.family,
        thumbUrl,
        fullUrl,
        caption: opts.caption,
        stain: opts.stain ?? "H&E",
        magnification: opts.magnification,
        sourcePageUrl,
        author: opts.author,
        license: opts.license,
    };
}

export const HISTOLOGY_IMAGES: HistologyImage[] = [
    makeWikiImage({
        id: "sft_solitary_fibrous_tumour____high_mag",
        title: "Solitary fibrous tumour — high mag",
        entity: "Solitary fibrous tumour",
        family: "sft",
        fileName: "Solitary_fibrous_tumour_--_high_mag.jpg",
        thumbPath: "c/cb",
        magnification: "high",
    }),
    makeWikiImage({
        id: "sft_solitary_fibrous_tumour____very_high_mag",
        title: "Solitary fibrous tumour — very high mag",
        entity: "Solitary fibrous tumour",
        family: "sft",
        fileName: "Solitary_fibrous_tumour_--_very_high_mag.jpg",
        thumbPath: "1/15",
        magnification: "very_high",
    }),
    makeWikiImage({
        id: "adipocytic_well_differentiated_liposarcoma_with_lipoblasts_and_hyperchromatic_stromal_cells",
        title: "Well-differentiated liposarcoma with lipoblasts and hyperchromatic stromal cells",
        entity: "Well-differentiated liposarcoma with lipoblasts and hyperchromatic stromal cells",
        family: "adipocytic",
        fileName: "Well-differentiated_liposarcoma_with_lipoblasts_and_hyperchromatic_stromal_cells.jpg",
        thumbPath: "8/8a",
        magnification: "intermediate",
    }),
    makeWikiImage({
        id: "adipocytic_myxoid_liposarcoma_2____high_mag",
        title: "Myxoid liposarcoma 2 — high mag",
        entity: "Myxoid liposarcoma 2",
        family: "adipocytic",
        fileName: "Myxoid_liposarcoma_2_--_high_mag.jpg",
        thumbPath: "c/c2",
        magnification: "high",
    }),
    makeWikiImage({
        id: "adipocytic_dedifferentiated_liposarcoma___high_mag",
        title: "Dedifferentiated liposarcoma — high mag",
        entity: "Dedifferentiated liposarcoma",
        family: "adipocytic",
        fileName: "Dedifferentiated_liposarcoma_-_high_mag.jpg",
        thumbPath: "d/d3",
        magnification: "high",
    }),
    makeWikiImage({
        id: "pnst_schwannoma_1____high_mag",
        title: "Schwannoma 1 — high mag",
        entity: "Schwannoma 1",
        family: "pnst",
        fileName: "Schwannoma_1_--_high_mag.jpg",
        thumbPath: "e/e5",
        magnification: "high",
    }),
    makeWikiImage({
        id: "pnst_neurofibroma____high_mag",
        title: "Neurofibroma — high mag",
        entity: "Neurofibroma",
        family: "pnst",
        fileName: "Neurofibroma_--_high_mag.jpg",
        thumbPath: "b/b2",
        magnification: "high",
    }),
    makeWikiImage({
        id: "pnst_malignant_peripheral_nerve_sheath_tumour_1____high_mag",
        title: "Malignant peripheral nerve sheath tumour 1 — high mag",
        entity: "Malignant peripheral nerve sheath tumour 1",
        family: "pnst",
        fileName: "Malignant_peripheral_nerve_sheath_tumour_1_--_high_mag.jpg",
        thumbPath: "e/e5",
        magnification: "high",
    }),
    makeWikiImage({
        id: "uncertain_synovial_sarcoma_1____high_mag",
        title: "Synovial sarcoma 1 — high mag",
        entity: "Synovial sarcoma 1",
        family: "uncertain",
        fileName: "Synovial_sarcoma_1_--_high_mag.jpg",
        thumbPath: "8/89",
        magnification: "high",
    }),
    makeWikiImage({
        id: "uncertain_biphasic_synovial_sarcoma_showing_glandular_and_spindle_cell_components",
        title: "Biphasic synovial sarcoma showing glandular and spindle cell components",
        entity: "Biphasic synovial sarcoma showing glandular and spindle cell components",
        family: "uncertain",
        fileName: "Biphasic_synovial_sarcoma_showing_glandular_and_spindle_cell_components.jpg",
        thumbPath: "2/23",
        magnification: "intermediate",
    }),
    makeWikiImage({
        id: "undifferentiated_ewings_sarcoma___high_mag",
        title: "Ewing's sarcoma — high mag",
        entity: "Ewing's sarcoma",
        family: "undifferentiated",
        fileName: "Ewing%27s_sarcoma_-_high_mag.jpg",
        thumbPath: "c/cd",
        magnification: "high",
    }),
    makeWikiImage({
        id: "undifferentiated_ewings_sarcoma____intermed_mag",
        title: "Ewing's sarcoma — intermed mag",
        entity: "Ewing's sarcoma",
        family: "undifferentiated",
        fileName: "Ewing%27s_sarcoma_--_intermed_mag.jpg",
        thumbPath: "8/87",
        magnification: "intermediate",
    }),
    makeWikiImage({
        id: "smc_leiomyosarcoma_1____high_mag",
        title: "Leiomyosarcoma 1 — high mag",
        entity: "Leiomyosarcoma 1",
        family: "smc",
        fileName: "Leiomyosarcoma_1_--_high_mag.jpg",
        thumbPath: "5/5b",
        magnification: "high",
    }),
    makeWikiImage({
        id: "smc_leiomyosarcoma_2____high_mag",
        title: "Leiomyosarcoma 2 — high mag",
        entity: "Leiomyosarcoma 2",
        family: "smc",
        fileName: "Leiomyosarcoma_2_--_high_mag.jpg",
        thumbPath: "a/ab",
        magnification: "high",
    }),
    makeWikiImage({
        id: "gastrointestinal_gastrointestinal_stromal_tumor_1____high_mag",
        title: "Gastrointestinal stromal tumor 1 — high mag",
        entity: "Gastrointestinal stromal tumor 1",
        family: "gastrointestinal",
        fileName: "Gastrointestinal_stromal_tumor_1_--_high_mag.jpg",
        thumbPath: "d/dd",
        magnification: "high",
    }),
    makeWikiImage({
        id: "gastrointestinal_epithelioid_gist_high_mag",
        title: "Epithelioid GIST High Mag",
        entity: "Epithelioid GIST High Mag",
        family: "gastrointestinal",
        fileName: "Epithelioid_GIST_High_Mag.jpg",
        thumbPath: "9/9e",
        magnification: "high",
    }),
    makeWikiImage({
        id: "fibrohistiocytic_undifferentiated_pleomorphic_sarcoma_1____high_mag",
        title: "Undifferentiated pleomorphic sarcoma 1 — high mag",
        entity: "Undifferentiated pleomorphic sarcoma 1",
        family: "fibrohistiocytic",
        fileName: "Undifferentiated_pleomorphic_sarcoma_1_--_high_mag.jpg",
        thumbPath: "1/1a",
        magnification: "high",
    }),
    makeWikiImage({
        id: "fibrohistiocytic_undifferentiated_pleomorphic_sarcoma_3____high_mag",
        title: "Undifferentiated pleomorphic sarcoma 3 — high mag",
        entity: "Undifferentiated pleomorphic sarcoma 3",
        family: "fibrohistiocytic",
        fileName: "Undifferentiated_pleomorphic_sarcoma_3_--_high_mag.jpg",
        thumbPath: "e/e9",
        magnification: "high",
    }),
    makeWikiImage({
        id: "skm_embryonal_rhabdomyosarcoma___high_mag",
        title: "Embryonal rhabdomyosarcoma — high mag",
        entity: "Embryonal rhabdomyosarcoma",
        family: "skm",
        fileName: "Embryonal_rhabdomyosarcoma_-_high_mag.jpg",
        thumbPath: "c/c2",
        magnification: "high",
    }),
    makeWikiImage({
        id: "skm_alveolar_rhabdomyosarcoma_1____high_mag",
        title: "Alveolar rhabdomyosarcoma 1 — high mag",
        entity: "Alveolar rhabdomyosarcoma 1",
        family: "skm",
        fileName: "Alveolar_rhabdomyosarcoma_1_--_high_mag.jpg",
        thumbPath: "0/0c",
        magnification: "high",
    }),
    makeWikiImage({
        id: "melanocytic_spindle_cell_melanoma_1____high_mag",
        title: "Spindle-cell melanoma 1 — high mag",
        entity: "Spindle-cell melanoma 1",
        family: "melanocytic",
        fileName: "Spindle-cell_melanoma_1_--_high_mag.jpg",
        thumbPath: "a/a2",
        magnification: "high",
    }),
    makeWikiImage({
        id: "melanocytic_desmoplastic_melanoma____high_mag",
        title: "Desmoplastic melanoma — high mag",
        entity: "Desmoplastic melanoma",
        family: "melanocytic",
        fileName: "Desmoplastic_melanoma_--_high_mag.jpg",
        thumbPath: "1/10",
        magnification: "high",
    }),
    makeWikiImage({
        id: "melanocytic_nodular_melanoma___high_mag",
        title: "Nodular melanoma — high mag",
        entity: "Nodular melanoma",
        family: "melanocytic",
        fileName: "Nodular_melanoma_-_high_mag.jpg",
        thumbPath: "e/e0",
        magnification: "high",
    }),
    makeWikiImage({
        id: "chondro-osseous_chondrosarcoma_1____high_mag",
        title: "Chondrosarcoma 1 — high mag",
        entity: "Chondrosarcoma 1",
        family: "chondro-osseous",
        fileName: "Chondrosarcoma_1_--_high_mag.jpg",
        thumbPath: "f/fa",
        magnification: "high",
    }),
    makeWikiImage({
        id: "chondro-osseous_dedifferentiated_chondrosarcoma____high_mag",
        title: "Dedifferentiated chondrosarcoma — high mag",
        entity: "Dedifferentiated chondrosarcoma",
        family: "chondro-osseous",
        fileName: "Dedifferentiated_chondrosarcoma_--_high_mag.jpg",
        thumbPath: "e/e2",
        magnification: "high",
    }),
    makeWikiImage({
        id: "basaloid_basal_cell_carcinoma____high_mag",
        title: "Basal cell carcinoma — high mag",
        entity: "Basal cell carcinoma",
        family: "basaloid",
        fileName: "Basal_cell_carcinoma_--_high_mag.jpg",
        thumbPath: "1/1a",
        magnification: "high",
    }),
    makeWikiImage({
        id: "basaloid_basal_cell_carcinoma_2____high_mag",
        title: "Basal cell carcinoma 2 — high mag",
        entity: "Basal cell carcinoma 2",
        family: "basaloid",
        fileName: "Basal_cell_carcinoma_2_--_high_mag.jpg",
        thumbPath: "1/1f",
        magnification: "high",
    }),
    makeWikiImage({
        id: "squamous_squamous_cell_carcinoma_of_the_skin___high_mag",
        title: "Squamous cell carcinoma of the skin — high mag",
        entity: "Squamous cell carcinoma of the skin",
        family: "squamous",
        fileName: "Squamous_cell_carcinoma_of_the_skin_-_high_mag.jpg",
        thumbPath: "b/b3",
        magnification: "high",
    }),
    makeWikiImage({
        id: "squamous_keratoacanthoma___high_mag",
        title: "Keratoacanthoma — high mag",
        entity: "Keratoacanthoma",
        family: "squamous",
        fileName: "Keratoacanthoma_-_high_mag.jpg",
        thumbPath: "a/ad",
        magnification: "high",
    }),
    makeWikiImage({
        id: "histiocytic_dendritic_atypical_fibroxanthoma____high_mag",
        title: "Atypical fibroxanthoma — high mag",
        entity: "Atypical fibroxanthoma",
        family: "histiocytic_dendritic",
        fileName: "Atypical_fibroxanthoma_--_high_mag.jpg",
        thumbPath: "f/fa",
        magnification: "high",
    }),
    makeWikiImage({
        id: "fibroblastic_nodular_fasciitis___high_mag",
        title: "Nodular fasciitis — high mag",
        entity: "Nodular fasciitis",
        family: "fibroblastic",
        fileName: "Nodular_fasciitis_-_high_mag.jpg",
        thumbPath: "8/87",
        magnification: "high",
    }),
    makeWikiImage({
        id: "pericytic_glomus_tumor___high_mag",
        title: "Glomus tumor — high mag",
        entity: "Glomus tumor",
        family: "pericytic",
        fileName: "Glomus_tumor_-_high_mag.jpg",
        thumbPath: "f/f0",
        magnification: "high",
    }),
    makeWikiImage({
        id: "vascular_angiosarcoma_1____high_mag",
        title: "Angiosarcoma 1 — high mag",
        entity: "Angiosarcoma 1",
        family: "vascular",
        fileName: "Angiosarcoma_1_--_high_mag.jpg",
        thumbPath: "3/3a",
        magnification: "high",
    }),
    makeWikiImage({
        id: "vascular_kaposis_sarcoma___high_mag",
        title: "Kaposi's sarcoma — high mag",
        entity: "Kaposi's sarcoma",
        family: "vascular",
        fileName: "Kaposi%27s_sarcoma_-_high_mag.jpg",
        thumbPath: "f/f8",
        magnification: "high",
    }),
    makeWikiImage({
        id: "neuroendocrine_merkel_cell_carcinoma____very_high_mag",
        title: "Merkel cell carcinoma — very high mag",
        entity: "Merkel cell carcinoma",
        family: "neuroendocrine",
        fileName: "Merkel_cell_carcinoma_--_very_high_mag.jpg",
        thumbPath: "c/c8",
        magnification: "very_high",
    }),
    makeWikiImage({
        id: "adnexal_sebaceous_carcinoma____high_mag",
        title: "Sebaceous carcinoma — high mag",
        entity: "Sebaceous carcinoma",
        family: "adnexal",
        fileName: "Sebaceous_carcinoma_--_high_mag.jpg",
        thumbPath: "5/56",
        magnification: "high",
    }),
    makeWikiImage({
        id: "lymphoid_mycosis_fungoides____high_mag",
        title: "Mycosis fungoides — high mag",
        entity: "Mycosis fungoides",
        family: "lymphoid",
        fileName: "Mycosis_fungoides_--_high_mag.jpg",
        thumbPath: "7/77",
        magnification: "high",
    }),
    makeWikiImage({
        id: "spindled_dermatofibroma____high_mag",
        title: "Dermatofibroma — high mag",
        entity: "Dermatofibroma",
        family: "spindled",
        fileName: "Dermatofibroma_--_high_mag.jpg",
        thumbPath: "2/2e",
        magnification: "high",
    }),
    makeWikiImage({
        id: "bone_other_osteosarcoma____high_mag",
        title: "Osteosarcoma — high mag",
        entity: "Osteosarcoma",
        family: "bone_other",
        fileName: "Osteosarcoma_--_high_mag.jpg",
        thumbPath: "8/8b",
        magnification: "high",
    }),
    makeWikiImage({
        id: "bone_other_chordoma___high_mag",
        title: "Chordoma — high mag",
        entity: "Chordoma",
        family: "bone_other",
        fileName: "Chordoma_-_high_mag.jpg",
        thumbPath: "c/cb",
        magnification: "high",
    }),
    makeWikiImage({
        id: "bone_fibro_desmoplastic_fibroma___high_mag",
        title: "Desmoplastic fibroma — high mag",
        entity: "Desmoplastic fibroma",
        family: "bone_fibro",
        fileName: "Desmoplastic_fibroma_-_high_mag.jpg",
        thumbPath: "a/a2",
        magnification: "high",
    }),

    makeWikiImage({
        id: "bone_vascular_hemangioma_of_bone___intermed_mag",
        title: "Hemangioma of bone — intermed mag",
        entity: "Hemangioma of bone",
        family: "bone_vascular",
        fileName: "Hemangioma_of_bone_-_intermed_mag.jpg",
        thumbPath: "7/77",
        magnification: "intermediate",
    }),
    makeWikiImage({
        id: "epithelial_gyn_high_grade_serous_carcinoma_of_the_ovary___high_mag",
        title: "High-grade serous carcinoma of the ovary — high mag",
        entity: "High-grade serous carcinoma of the ovary",
        family: "epithelial_gyn",
        fileName: "High-grade_serous_carcinoma_of_the_ovary_-_high_mag.jpg",
        thumbPath: "d/d4",
        magnification: "high",
    }),
    makeWikiImage({
        id: "epithelial_gyn_endometrioid_adenocarcinoma_of_endometrium____high_mag",
        title: "Endometrioid adenocarcinoma of endometrium — high mag",
        entity: "Endometrioid adenocarcinoma of endometrium",
        family: "epithelial_gyn",
        fileName: "Endometrioid_adenocarcinoma_of_endometrium_--_high_mag.jpg",
        thumbPath: "c/c4",
        magnification: "high",
    }),
    makeWikiImage({
        id: "epithelial_gyn_clear_cell_carcinoma_of_the_ovary___high_mag",
        title: "Clear cell carcinoma of the ovary — high mag",
        entity: "Clear cell carcinoma of the ovary",
        family: "epithelial_gyn",
        fileName: "Clear_cell_carcinoma_of_the_ovary_-_high_mag.jpg",
        thumbPath: "2/2e",
        magnification: "high",
    }),

    makeWikiImage({
        id: "mesenchymal_gyn_low_grade_endometrial_stromal_sarcoma____high_mag",
        title: "Low-grade endometrial stromal sarcoma — high mag",
        entity: "Low-grade endometrial stromal sarcoma",
        family: "mesenchymal_gyn",
        fileName: "Low-grade_endometrial_stromal_sarcoma_--_high_mag.jpg",
        thumbPath: "a/a8",
        magnification: "high",
    }),
    makeWikiImage({
        id: "sex_cord_adult_granulosa_cell_tumor___high_mag",
        title: "Adult granulosa cell tumor — high mag",
        entity: "Adult granulosa cell tumor",
        family: "sex_cord",
        fileName: "Adult_granulosa_cell_tumor_-_high_mag.jpg",
        thumbPath: "5/53",
        magnification: "high",
    }),
    makeWikiImage({
        id: "sex_cord_sertoli_leydig_cell_tumor___high_mag",
        title: "Sertoli-Leydig cell tumor — high mag",
        entity: "Sertoli-Leydig cell tumor",
        family: "sex_cord",
        fileName: "Sertoli-Leydig_cell_tumor_-_high_mag.jpg",
        thumbPath: "1/1c",
        magnification: "high",
    }),
    makeWikiImage({
        id: "germ_cell_dysgerminoma___high_mag",
        title: "Dysgerminoma — high mag",
        entity: "Dysgerminoma",
        family: "germ_cell",
        fileName: "Dysgerminoma_-_high_mag.jpg",
        thumbPath: "c/c2",
        magnification: "high",
    }),


    makeWikiImage({
        id: "gyn_rare_small_cell_carcinoma_of_the_ovary_hypercalcemic_type___high_mag",
        title: "Small cell carcinoma of the ovary, hypercalcemic type — high mag",
        entity: "Small cell carcinoma of the ovary, hypercalcemic type",
        family: "gyn_rare",
        fileName: "Small_cell_carcinoma_of_the_ovary%2C_hypercalcemic_type_-_high_mag.jpg",
        thumbPath: "d/d8",
        magnification: "high",
    }),
    makeWikiImage({
        id: "gyn_rare_aggressive_angiomyxoma___high_mag",
        title: "Aggressive angiomyxoma — high mag",
        entity: "Aggressive angiomyxoma",
        family: "gyn_rare",
        fileName: "Aggressive_angiomyxoma_-_high_mag.jpg",
        thumbPath: "1/1a",
        magnification: "high",
    }),
    makeWikiImage({
        id: "gyn_benign_endometriosis_of_ovary___high_mag",
        title: "Endometriosis of ovary — high mag",
        entity: "Endometriosis of ovary",
        family: "gyn_benign",
        fileName: "Endometriosis_of_ovary_-_high_mag.jpg",
        thumbPath: "e/e4",
        magnification: "high",
    }),
    makeWikiImage({
        id: "gyn_benign_adenomyosis___high_mag",
        title: "Adenomyosis — high mag",
        entity: "Adenomyosis",
        family: "gyn_benign",
        fileName: "Adenomyosis_-_high_mag.jpg",
        thumbPath: "0/05",
        magnification: "high",
    }),
    makeWikiImage({
        id: "gyn_vagina_vaginal_intraepithelial_neoplasia_iii___high_mag",
        title: "Vaginal intraepithelial neoplasia III — high mag",
        entity: "Vaginal intraepithelial neoplasia III",
        family: "gyn_vagina",
        fileName: "Vaginal_intraepithelial_neoplasia_III_-_high_mag.jpg",
        thumbPath: "8/87",
        magnification: "high",
    }),

    makeWikiImage({
        id: "gyn_cervix_cervical_squamous_cell_carcinoma___high_mag",
        title: "Cervical squamous cell carcinoma — high mag",
        entity: "Cervical squamous cell carcinoma",
        family: "gyn_cervix",
        fileName: "Cervical_squamous_cell_carcinoma_-_high_mag.jpg",
        thumbPath: "c/ce",
        magnification: "high",
    }),
    makeWikiImage({
        id: "gyn_cervix_adenocarcinoma_in_situ_of_cervix___high_mag",
        title: "Adenocarcinoma in situ of cervix — high mag",
        entity: "Adenocarcinoma in situ of cervix",
        family: "gyn_cervix",
        fileName: "Adenocarcinoma_in_situ_of_cervix_-_high_mag.jpg",
        thumbPath: "1/12",
        magnification: "high",
    }),
    makeWikiImage({
        id: "gyn_expanded_adenomatoid_tumor___high_mag",
        title: "Adenomatoid tumor — high mag",
        entity: "Adenomatoid tumor",
        family: "gyn_expanded",
        fileName: "Adenomatoid_tumor_-_high_mag.jpg",
        thumbPath: "2/23",
        magnification: "high",
    }),
    makeWikiImage({
        id: "gyn_expanded_endosalpingiosis___high_mag",
        title: "Endosalpingiosis — high mag",
        entity: "Endosalpingiosis",
        family: "gyn_expanded",
        fileName: "Endosalpingiosis_-_high_mag.jpg",
        thumbPath: "1/13",
        magnification: "high",
    }),
    makeWikiImage({
        id: "gyn_expanded_malakoplakia___high_mag",
        title: "Malakoplakia — high mag",
        entity: "Malakoplakia",
        family: "gyn_expanded",
        fileName: "Malakoplakia_-_high_mag.jpg",
        thumbPath: "3/30",
        magnification: "high",
    }),
    makeWikiImage({
        id: "gyn_variants_juvenile_granulosa_cell_tumor___high_mag",
        title: "Juvenile granulosa cell tumor — high mag",
        entity: "Juvenile granulosa cell tumor",
        family: "gyn_variants",
        fileName: "Juvenile_granulosa_cell_tumor_-_high_mag.jpg",
        thumbPath: "f/f0",
        magnification: "high",
    }),
    makeWikiImage({
        id: "gyn_variants_sertoli_leydig_cell_tumor_retiform_pattern___intermed_mag",
        title: "Sertoli-Leydig cell tumor retiform pattern — intermed mag",
        entity: "Sertoli-Leydig cell tumor retiform pattern",
        family: "gyn_variants",
        fileName: "Sertoli-Leydig_cell_tumor_retiform_pattern_-_intermed_mag.jpg",
        thumbPath: "5/52",
        magnification: "intermediate",
    }),
    makeWikiImage({
        id: "gyn_variants_struma_carcinoid___high_mag",
        title: "Struma carcinoid — high mag",
        entity: "Struma carcinoid",
        family: "gyn_variants",
        fileName: "Struma_carcinoid_-_high_mag.jpg",
        thumbPath: "1/1c",
        magnification: "high",
    }),
    makeWikiImage({
        id: "testis_seminoma___high_mag",
        title: "Seminoma — high mag",
        entity: "Seminoma",
        family: "testis",
        fileName: "Seminoma_-_high_mag.jpg",
        thumbPath: "c/c4",
        magnification: "high",
    }),
    makeWikiImage({
        id: "testis_embryonal_carcinoma_of_testis___high_mag",
        title: "Embryonal carcinoma of testis — high mag",
        entity: "Embryonal carcinoma of testis",
        family: "testis",
        fileName: "Embryonal_carcinoma_of_testis_-_high_mag.jpg",
        thumbPath: "4/4e",
        magnification: "high",
    }),
    makeWikiImage({
        id: "testis_yolk_sac_tumor___schiller_duval_body___high_mag",
        title: "Yolk sac tumor — Schiller-Duval body — high mag",
        entity: "Yolk sac tumor",
        family: "testis",
        fileName: "Yolk_sac_tumor_-_Schiller-Duval_body_-_high_mag.jpg",
        thumbPath: "2/20",
        magnification: "high",
    }),
    makeWikiImage({
        id: "testis_choriocarcinoma___high_mag",
        title: "Choriocarcinoma — high mag",
        entity: "Choriocarcinoma",
        family: "testis",
        fileName: "Choriocarcinoma_-_high_mag.jpg",
        thumbPath: "9/90",
        magnification: "high",
    }),
    makeWikiImage({
        id: "testis_leydig_cell_tumor___high_mag",
        title: "Leydig cell tumor — high mag",
        entity: "Leydig cell tumor",
        family: "testis",
        fileName: "Leydig_cell_tumor_-_high_mag.jpg",
        thumbPath: "d/d7",
        magnification: "high",
    }),
];

/**
 * Backward compatibility export:
 * Generates the old `Record<Family, string[]>` format from the new rich dataset.
 */
export const HISTOLOGY_IMAGE_DATA: Partial<
    Record<
        HistologicFamily | "gyn_rare" | "gyn_benign" | "gyn_vagina" | "gyn_cervix" | "gyn_expanded" | "gyn_variants" | "testis",
        string[]
    >
> = HISTOLOGY_IMAGES.reduce((acc, img) => {
    (acc[img.family] ??= []).push(img.fullUrl);
    return acc;
}, {} as any);


/**
 * Guard to ensure no duplicate fullURLs exist in the dataset.
 */
function assertNoDuplicates(images: HistologyImage[]) {
    // if (import.meta.env.PROD) return; // Skip in production for performance
    const seen = new Set<string>();
    for (const img of images) {
        if (seen.has(img.fullUrl)) {
            console.warn("[HISTOLOGY_IMAGES] duplicate fullUrl:", img.fullUrl, "id:", img.id);
        }
        seen.add(img.fullUrl);
    }
}
// Run validation
assertNoDuplicates(HISTOLOGY_IMAGES);


/**
 * Maps generic marker names to more specific search queries.
 * Context-aware override helper.
 */
export const SEARCH_TERM_OVERRIDES: Record<string, string> = {
    "OCT4": "Seminoma OCT4 immunohistochemistry",
    "SALL4": "Seminoma SALL4 immunohistochemistry",
    "CD117": "Seminoma KIT immunohistochemistry",
    "CD30": "Embryonal Carcinoma CD30 immunohistochemistry",
    "PLAP": "Seminoma PLAP immunohistochemistry",
    "Glypican-3": "Yolk Sac Tumor Glypican-3 immunohistochemistry",
    "Inhibin": "Granulosa Cell Tumor Inhibin immunohistochemistry",
    "Calretinin": "Mesothelioma Calretinin immunohistochemistry",
    "AFP (Serum/Tissue)": "Yolk Sac Tumor AFP immunohistochemistry",
    "hCG (Serum/Tissue)": "Choriocarcinoma hCG immunohistochemistry",
    "i(12p)": "Isochromosome 12p FISH",
    "Melan-A": "Melanoma Melan-A immunohistochemistry",
    "HMB45": "Melanoma HMB45 immunohistochemistry",
    "CD45": "Lymphoma CD45 immunohistochemistry",
    "S100": "Melanoma S100 immunohistochemistry",
    "SOX10": "Melanoma SOX10 immunohistochemistry",
};

export function getSearchOverride(marker: string, context?: { entity?: string; organ?: string }) {
    const base = SEARCH_TERM_OVERRIDES[marker];
    if (!base) return undefined;

    // If we have context, allow it to refine the search
    if (context?.entity) return `${base} ${context.entity}`;
    if (context?.organ) return `${base} ${context.organ}`;

    return base;
}

/**
 * Finds curated images matching the entity name.
 * Uses exact match on 'entity' field or fuzzy match on 'title'.
 */
export function findCuratedImages(query: string): HistologyImage[] {
    if (!query) return [];

    const normalizedQuery = query.toLowerCase().trim();

    return HISTOLOGY_IMAGES.filter(img => {
        if (img.entity?.toLowerCase() === normalizedQuery) return true;
        if (img.title.toLowerCase().includes(normalizedQuery)) return true;
        return false;
    });
}
