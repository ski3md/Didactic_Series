#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { commonsImage: resolvedCommonsImage } = require('./commons_image_sources.cjs');

const repoRoot = path.resolve(__dirname, '..');
const manifestPath = path.join(repoRoot, 'src/content/gu/who_gu_entity_manifest.json');

const commonsImage = (filename, caption, alt = caption, stain = 'H&E') =>
  resolvedCommonsImage(filename, caption, alt, stain);

const visualAidMap = {
  'penis-lsil-condyloma-pein1': [
    commonsImage('Condyloma acuminatum - high mag.jpg', 'Condyloma/LSIL reference image showing low-grade HPV-type squamous proliferation.', 'High-power H&E micrograph of condyloma acuminatum'),
  ],
  'penis-hsil-pein2-3': [
    commonsImage('Penile intraepithelial neoplasia -- high mag.jpg', 'Penile intraepithelial neoplasia image for HSIL/PeIN2-3 pattern recognition.', 'High-power H&E micrograph of penile intraepithelial neoplasia'),
  ],
  'penis-differentiated-pein': [
    commonsImage('Differentiated vulvar intraepithelial neoplasia - deep - high mag.jpg', 'Differentiated intraepithelial neoplasia analogue showing basal atypia with maturation; use until a penile dPeIN image is curated.', 'High-power H&E micrograph of differentiated intraepithelial neoplasia'),
    commonsImage('Lichen sclerosus - high mag.jpg', 'This lichen sclerosus image shows dermal sclerosis and chronic inflammatory context; in penile mucosa, that context should prompt careful search for differentiated PeIN and keratinizing SCC.', 'High-power H&E micrograph of lichen sclerosus'),
  ],
  'penis-hpv-associated-scc-nos': [
    commonsImage('Squamous carcinoma of the penis - alt -- high mag.jpg', 'Penile invasive SCC reference image used for HPV-associated SCC NOS when subtype is not specific.', 'High-power H&E micrograph of penile squamous cell carcinoma'),
  ],
  'penis-basaloid-scc': [
    commonsImage('Penile intraepithelial neoplasia - alt -- high mag.jpg', 'This high-grade HPV-associated squamous neoplasia image shows basaloid cytology; correlate with block-pattern p16 and exclude invasive basaloid SCC.', 'High-power H&E micrograph of basaloid-appearing penile intraepithelial neoplasia'),
  ],
  'penis-warty-scc': [
    commonsImage('Penile intraepithelial neoplasia - alt -- intermed mag.jpg', 'Warty/HPV-associated penile squamous neoplasia reference showing papillary intraepithelial disease.', 'Intermediate-power H&E micrograph of penile intraepithelial neoplasia'),
  ],
  'penis-warty-basaloid-scc': [
    commonsImage('Penile intraepithelial neoplasia - alt -- high mag.jpg', 'Mixed warty-basaloid teaching reference for HPV-associated high-grade squamous neoplasia.', 'High-power H&E micrograph of penile intraepithelial neoplasia'),
  ],
  'penis-clear-cell-scc': [
    commonsImage('Squamous carcinoma of the penis - 2 -- high mag.jpg', 'Penile SCC reference image for clear-cell SCC differential anchoring; replace with exact clear-cell penile SCC when available.', 'High-power H&E micrograph of penile squamous cell carcinoma'),
  ],
  'penis-lymphoepithelioma-like-scc': [
    commonsImage('Squamous carcinoma of the penis -- high mag.jpg', 'Poorly differentiated penile SCC reference for lymphoepithelioma-like differential anchoring.', 'High-power H&E micrograph of penile squamous cell carcinoma'),
  ],
  'penis-hpv-independent-scc-nos': [
    commonsImage('Squamous carcinoma of the penis -- high mag.jpg', 'Keratinizing penile SCC reference for HPV-independent SCC NOS.', 'High-power H&E micrograph of penile squamous cell carcinoma'),
  ],
  'penis-usual-scc': [
    commonsImage('Squamous carcinoma of the penis -- low mag.jpg', 'Usual-type penile SCC reference emphasizing invasive architecture.', 'Low-power H&E micrograph of penile squamous cell carcinoma'),
  ],
  'penis-verrucous-scc': [
    commonsImage('Micrograph of penile verrucous carcinoma - 20x and 200x.jpg', 'Penile verrucous carcinoma composite image showing exophytic growth and broad pushing front.', 'Composite H&E micrograph of penile verrucous carcinoma'),
  ],
  'penis-papillary-scc-nos': [
    commonsImage('Micrograph of penile verrucous carcinoma - 20x.jpg', 'Papillary/verruciform penile SCC reference image for exophytic architecture and base assessment.', 'Low-power H&E micrograph of penile verrucous carcinoma'),
  ],
  'penis-sarcomatoid-scc': [
    commonsImage('Sarcomatoid squamous cell carcinoma - high mag.jpg', 'Sarcomatoid SCC reference image for spindle-cell carcinoma differential.', 'High-power H&E micrograph of sarcomatoid squamous cell carcinoma'),
  ],
  'penis-adenosquamous-mucoepidermoid': [
    commonsImage('Adenosquamous carcinoma - high mag.jpg', 'Adenosquamous carcinoma reference image for squamous plus glandular differentiation.', 'High-power H&E micrograph of adenosquamous carcinoma'),
  ],
  'penis-mixed-scc': [
    commonsImage('Micrograph of penile verrucous carcinoma - 20x and 200x.jpg', 'Mixed SCC teaching reference: verrucous/cuniculatum-like pattern requires search for usual invasive component.', 'Composite H&E micrograph of penile verrucous carcinoma'),
  ],
  'penis-scc-nos': [
    commonsImage('Squamous carcinoma of the penis - 2 -- intermed mag.jpg', 'Penile SCC NOS reference image for biopsy-limited invasive squamous carcinoma.', 'Intermediate-power H&E micrograph of penile squamous cell carcinoma'),
  ],
  'penis-extramammary-paget': [
    commonsImage('Extramammary Paget disease - high mag.jpg', 'Extramammary Paget disease image showing large pale Paget cells in epidermis.', 'High-power H&E micrograph of extramammary Paget disease'),
  ],
  'penis-melanoma': [
    commonsImage('Melanoma - high mag.jpg', 'Melanoma histology reference image for the non-squamous penile biopsy stop.', 'High-power H&E micrograph of melanoma'),
  ],
  'penis-mesenchymal-hematolymphoid-secondary': [
    commonsImage('Spindle cell sarcoma - high mag.jpg', 'Spindle-cell sarcoma reference image for non-squamous mesenchymal differential anchoring.', 'High-power H&E micrograph of spindle cell sarcoma'),
    commonsImage('Diffuse large B-cell lymphoma (DLBCL), high mag.jpg', 'DLBCL reference image for hematolymphoid penile mass differential.', 'High-power H&E micrograph of diffuse large B-cell lymphoma'),
  ],
  'testis-gcnis': [
    commonsImage('Germ cell neoplasia in situ - high mag.jpg', 'GCNIS reference image showing atypical germ cells along seminiferous tubule basement membranes.', 'High-power H&E micrograph of germ cell neoplasia in situ'),
  ],
  'testis-intratubular-specific-forms': [
    commonsImage('Intertubular seminoma - alt -- low mag.jpg', 'Intratubular/intertubular seminoma reference image for subtle intratubular and interstitial spread patterns.', 'Low-power H&E micrograph of intertubular seminoma'),
  ],
  'testis-gonadoblastoma': [
    commonsImage('Gonadoblastoma - high mag.jpg', 'Gonadoblastoma reference image for mixed germ cell and sex cord elements.', 'High-power H&E micrograph of gonadoblastoma'),
  ],
  'testis-seminoma': [
    commonsImage('Seminoma_-_high_mag.jpg', 'Classic seminoma image showing uniform clear cells and lymphocyte-rich septa.', 'High-power H&E micrograph of seminoma'),
  ],
  'testis-embryonal-carcinoma': [
    commonsImage('Embryonal carcinoma - high mag.jpg', 'Embryonal carcinoma image showing high-grade primitive epithelial morphology.', 'High-power H&E micrograph of embryonal carcinoma'),
  ],
  'testis-yolk-sac-postpubertal': [
    commonsImage('Yolk sac tumour -- high mag.jpg', 'Yolk sac tumor image for AFP-linked NSGCT morphology.', 'High-power H&E micrograph of yolk sac tumor of the testis'),
  ],
  'testis-choriocarcinoma': [
    commonsImage('Choriocarcinoma - high mag.jpg', 'Choriocarcinoma reference image for biphasic trophoblastic morphology.', 'High-power H&E micrograph of choriocarcinoma'),
  ],
  'testis-other-trophoblastic-tumors': [
    commonsImage('Seminoma with syncytiotrophoblasts - high mag.jpg', 'Syncytiotrophoblastic differentiation reference image for hCG-producing trophoblastic differential.', 'High-power H&E micrograph of seminoma with syncytiotrophoblasts'),
  ],
  'testis-teratoma-postpubertal': [
    commonsImage('Teratoma - high mag.jpg', 'This teratoma image shows somatic tissue differentiation; in a postpubertal testis tumor, report teratoma percentage because residual teratoma is chemotherapy-resistant and surgically managed.', 'High-power H&E micrograph of teratoma'),
  ],
  'testis-teratoma-somatic-type-malignancy': [
    commonsImage('Mixed germ cell tumour - high mag.jpg', 'This mixed GCT image shows heterogeneous tumor composition; sample additional grossly distinct areas and report any somatic-type malignancy by lineage and percentage.', 'High-power H&E micrograph of mixed germ cell tumor'),
  ],
  'testis-mixed-germ-cell-tumor': [
    commonsImage('Mixed germ cell tumour - intermed mag.jpg', 'Mixed germ cell tumor image showing more than one component in the same tumor.', 'Intermediate-power H&E micrograph of mixed germ cell tumor'),
  ],
  'testis-spermatocytic-tumor': [
    commonsImage('Spermatocytic seminoma high mag.jpg', 'Spermatocytic tumor reference image showing a tumor of older patients that is unrelated to GCNIS.', 'High-power H&E micrograph of spermatocytic tumor'),
  ],
  'testis-spermatocytic-sarcomatous': [
    commonsImage('Testicular spermatocytic tumour high mag.jpg', 'Spermatocytic tumor reference image; sarcomatous areas require separate sampling when present.', 'High-power H&E micrograph of testicular spermatocytic tumor'),
  ],
  'testis-yolk-sac-prepubertal': [
    commonsImage('Yolk sac tumour -- intermed mag.jpg', 'This yolk sac tumor image shows pediatric/prepubertal-type morphology; interpret it with age, AFP, and absence of GCNIS or 12p amplification.', 'Intermediate-power H&E micrograph of yolk sac tumor'),
  ],
  'testis-teratoma-prepubertal': [
    commonsImage('Dermoid cyst - high mag.jpg', 'Dermoid/prepubertal-type teratoma reference image for benign teratomatous lesions that are not derived from GCNIS.', 'High-power H&E micrograph of dermoid cyst'),
  ],
  'testis-neuroendocrine-tumor-prepubertal': [
    commonsImage('Neuroendocrine tumor - high mag.jpg', 'This neuroendocrine tumor image shows well-differentiated neuroendocrine morphology; use neuroendocrine tumor terminology rather than carcinoid and exclude metastasis.', 'High-power H&E micrograph of neuroendocrine tumor'),
  ],
  'testis-leydig-cell-tumor': [
    commonsImage('Histopathology of leydig cell tumor of the ovary, high mag.jpg', 'Leydig cell tumor histology reference showing polygonal eosinophilic cells; sex cord-stromal morphology is the teaching target.', 'High-power H&E micrograph of Leydig cell tumor'),
  ],
  'testis-sertoli-cell-tumor': [
    commonsImage('Sertoli cell tumour high mag.jpg', 'Sertoli cell tumor reference image showing cords/trabeculae of sex cord cells.', 'High-power H&E micrograph of Sertoli cell tumor'),
  ],
  'testis-granulosa-cell-tumor': [
    commonsImage('Granulosa cell tumor - high mag.jpg', 'Granulosa cell tumor reference image for microfollicular/sex cord differentiation.', 'High-power H&E micrograph of granulosa cell tumor'),
  ],
  'testis-other-sex-cord-stromal': [
    commonsImage('Sertoli-Leydig cell tumour - high mag.jpg', 'Mixed sex cord-stromal tumor reference image for uncommon sex cord-stromal patterns.', 'High-power H&E micrograph of Sertoli-Leydig cell tumor'),
  ],
  'testis-ovarian-type-epithelial': [
    commonsImage('Serous cystadenoma - high mag.jpg', 'Serous cystadenoma reference image for ovarian-type epithelial tumor morphology.', 'High-power H&E micrograph of serous cystadenoma'),
  ],
  'testis-rete-testis-tumors': [
    commonsImage('Adenomatoid tumour - high mag.jpg', 'Hilar/paratesticular epithelial-pattern reference image for rete-region differential anchoring; replace with exact rete tumor image when curated.', 'High-power H&E micrograph of adenomatoid tumor'),
  ],
  'testis-paratesticular-mesothelial': [
    commonsImage('Adenomatoid tumour - high mag.jpg', 'Adenomatoid tumor reference image for benign paratesticular mesothelial tumor.', 'High-power H&E micrograph of adenomatoid tumor'),
  ],
  'testis-epididymal-tumors': [
    commonsImage('Adenomatoid tumour - intermed mag.jpg', 'Paratesticular/epididymal mass reference image for benign mesothelial-pattern differential; replace with exact epididymal cystadenoma image when curated.', 'Intermediate-power H&E micrograph of adenomatoid tumor'),
  ],
  'testis-hematolymphoid-metastatic': [
    commonsImage('DLBCL of testis -- high mag.jpg', 'Diffuse large B-cell lymphoma of testis image for the lymphoma diagnosis that must be considered early in older patients.', 'High-power H&E micrograph of DLBCL of testis'),
  ],
};

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

manifest.entities = manifest.entities.map((entity) => ({
  ...entity,
  visualAids: visualAidMap[entity.id] ?? [],
}));

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
