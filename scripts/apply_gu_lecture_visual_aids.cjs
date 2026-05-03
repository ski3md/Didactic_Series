#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { commonsImage } = require('./commons_image_sources.cjs');

const repoRoot = path.resolve(__dirname, '..');
const lecturesPath = path.join(repoRoot, 'src/content/lectures/gu_who_complete_lectures.normalized.json');

const visualAidsByLecture = {
  penile_who_complete_pathology: {
    'Why Penile Pathology Is a Sign-Out Problem': commonsImage(
      'Squamous carcinoma of the penis -- low mag.jpg',
      'This low-power penile SCC image shows invasive architecture; the report must state depth of invasion, involved anatomic structures, LVI/PNI, and margin status.',
      'Low-power micrograph of penile squamous cell carcinoma'
    ),
    'Specimen First': commonsImage(
      'Penile verrucous carcinoma.jpg',
      'This exophytic penile mass requires sampling of the base; superficial biopsy cannot exclude destructive invasion or a mixed usual-type SCC component.',
      'Gross photograph of penile verrucous carcinoma'
    ),
    'HPV Pathway': commonsImage(
      'Penile intraepithelial neoplasia -- high mag.jpg',
      'Penile intraepithelial neoplasia provides the visual bridge into HPV-associated precursor disease.',
      'High-power micrograph of penile intraepithelial neoplasia'
    ),
    'Precursor Lesions': commonsImage(
      'Penile intraepithelial neoplasia -- intermed mag.jpg',
      'Intermediate-power PeIN helps learners compare intraepithelial atypia with invasive carcinoma.',
      'Intermediate-power micrograph of penile intraepithelial neoplasia'
    ),
    'HPV-Associated SCC': commonsImage(
      'Penile intraepithelial neoplasia - alt -- high mag.jpg',
      'This PeIN image shows basaloid/warty HPV-associated atypia; use block-pattern p16 as support and search the biopsy base for invasion.',
      'Alternative high-power micrograph of penile intraepithelial neoplasia'
    ),
    'HPV-Independent SCC': commonsImage(
      'Squamous carcinoma of the penis -- high mag.jpg',
      'This keratinizing penile SCC image shows an HPV-independent usual-type pattern; report depth, grade, LVI/PNI, involved structures, and margins.',
      'High-power micrograph of penile squamous cell carcinoma'
    ),
    'Non-Squamous Stops': commonsImage(
      'Extramammary Paget disease - high mag.jpg',
      'This extramammary Paget disease image shows intraepidermal glandular cells; stop the SCC algorithm and evaluate primary versus secondary Paget disease with CK7, GATA3, urothelial, and GI markers as indicated.',
      'High-power micrograph of extramammary Paget disease'
    ),
    'Penectomy Report': commonsImage(
      'Micrograph of penile verrucous carcinoma - 20x and 200x.jpg',
      'Paired low- and high-power verrucous carcinoma image highlights base assessment and reporting consequences.',
      'Composite micrograph of penile verrucous carcinoma at low and high power'
    ),
    'Resident Takeaways': commonsImage(
      'Micrograph of penile verrucous carcinoma - 200x.jpg',
      'This verrucous carcinoma image shows bland squamous proliferation with a pushing profile; sign-out still requires base assessment, invasion status, and margin status.',
      'High-power micrograph of penile verrucous carcinoma'
    ),
  },
  testicular_who_complete_pathology: {
    'Age Is Diagnostic Architecture': commonsImage(
      'Seminoma_-_high_mag.jpg',
      'This seminoma image shows uniform clear cells and lymphocyte-rich septa; correlate age, AFP, beta-hCG, LDH, and background GCNIS before finalizing a pure seminoma diagnosis.',
      'High-power micrograph of seminoma'
    ),
    'Specimen Orientation': commonsImage(
      'Seminoma with syncytiotrophoblasts - low mag.jpg',
      'This seminoma with syncytiotrophoblasts image can explain mild beta-hCG elevation; elevated AFP still requires additional sampling for yolk sac tumor or another NSGCT component.',
      'Low-power micrograph of seminoma with syncytiotrophoblasts'
    ),
    'Tumors Arising in a GCNIS Background': commonsImage(
      'Mixed germ cell tumour - high mag.jpg',
      'This mixed germ cell tumor image requires a report that lists each component and percentage; embryonal carcinoma, yolk sac tumor, choriocarcinoma, teratoma, and somatic-type malignancy change staging discussions, serum marker interpretation, chemotherapy response, or surgical planning.',
      'High-power micrograph of mixed germ cell tumor'
    ),
    'Tumors Unrelated to GCNIS': commonsImage(
      'Spermatocytic seminoma high mag.jpg',
      'This spermatocytic tumor image should trigger a diagnosis in an older patient that is unrelated to GCNIS; do not diagnose classic seminoma unless morphology and OCT4/CD117/GCNIS findings support seminoma.',
      'High-power micrograph of spermatocytic tumor'
    ),
    'Sex Cord-Stromal Tumors': commonsImage(
      'Sertoli cell tumour high mag.jpg',
      'This Sertoli cell tumor image should trigger sex cord-stromal markers such as inhibin, calretinin, and SF1 rather than a germ cell tumor marker panel alone.',
      'High-power micrograph of Sertoli cell tumor'
    ),
    'Paratesticular and Adnexal Tumors': commonsImage(
      'Adenomatoid tumour - high mag.jpg',
      'This adenomatoid tumor image should be worked up as a benign paratesticular mesothelial tumor; confirm localization and avoid signing it out as an intratesticular germ cell tumor.',
      'High-power micrograph of adenomatoid tumor'
    ),
    'Lymphoma and Metastasis in Older Patients': commonsImage(
      'DLBCL of testis -- high mag.jpg',
      'This DLBCL image shows diffuse lymphoid replacement of testis; in older patients or bilateral masses, order CD45 early and do not finalize seminoma until lymphoma is excluded.',
      'High-power micrograph of diffuse large B-cell lymphoma of the testis'
    ),
    'Mixed GCT Report': commonsImage(
      'Yolk sac tumour -- high mag.jpg',
      'This yolk sac tumor image explains AFP elevation; if AFP is elevated in an apparent seminoma, submit more tissue and report yolk sac tumor percentage when identified.',
      'High-power micrograph of yolk sac tumor of the testis'
    ),
    'Resident Takeaways': commonsImage(
      'Embryonal carcinoma - high mag.jpg',
      'This embryonal carcinoma image shows a high-grade CD30/OCT4-positive NSGCT component; quantify it in mixed tumors because it changes risk assessment and treatment planning.',
      'High-power micrograph of embryonal carcinoma'
    ),
  },
};

const lectures = JSON.parse(fs.readFileSync(lecturesPath, 'utf8'));

for (const lecture of lectures) {
  const visualAids = visualAidsByLecture[lecture.id];
  if (!visualAids) {
    continue;
  }

  lecture.slides = lecture.slides.map((slide) => ({
    ...slide,
    visualAid: visualAids[slide.title] ?? slide.visualAid,
  }));
}

fs.writeFileSync(lecturesPath, `${JSON.stringify(lectures, null, 2)}\n`);
