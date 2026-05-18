import type { TutorialAbpathScope } from '../types.ts';

type MinimalTutorialRecord = {
  id: string;
  title: string;
};

const OFFICIAL_CP_SOURCE = 'ABPath Clinical Pathology Content Specifications 04/10/2026';

const makeCpScope = (root: string, primaryPath: string, title?: string): TutorialAbpathScope => ({
  domain: 'CP',
  root,
  primaryPath,
  title: title ?? primaryPath.split(' > ').at(-1) ?? root,
  confidence: 'high',
  source: OFFICIAL_CP_SOURCE,
  sourceLine: null,
});

export const resolveExactClinicalPathScope = (record: MinimalTutorialRecord): TutorialAbpathScope | undefined => {
  const id = record.id.toLowerCase();
  const title = record.title.toLowerCase();
  const text = `${id} ${title}`;

  const bbRoot = 'Blood Banking/Transfusion Medicine';
  const hpRoot = 'Hematopathology for Clinical Pathology';
  const cpRoot = 'Chemical Pathology';
  const mbRoot = 'Medical Microbiology';
  const miRoot = 'Management and Informatics';

  if (/(^topic-bb$|blood-banking-transfusion-medicine$)/.test(id) || /blood banking\/?transfusion medicine/.test(title)) {
    return makeCpScope(bbRoot, bbRoot, bbRoot);
  }
  if (/clinical practice case tutorial|^clinical-practice$/.test(text)) {
    return makeCpScope(bbRoot, `${bbRoot} > Clinical Practice`, 'Clinical Practice');
  }
  if (/autoimmune hemolytic anemia|positive dat/.test(text)) {
    return makeCpScope(bbRoot, `${bbRoot} > Clinical Practice > Autoimmune Hemolytic Anemia`, 'Autoimmune Hemolytic Anemia');
  }
  if (/paroxysmal nocturnal hemoglobinuria/.test(text)) {
    return makeCpScope(bbRoot, `${bbRoot} > Clinical Practice > Paroxysmal Nocturnal Hemoglobinuria`, 'Paroxysmal Nocturnal Hemoglobinuria');
  }
  if (/anemia in oncology patients/.test(text)) {
    return makeCpScope(bbRoot, `${bbRoot} > Clinical Practice > Anemia in Oncology Patients`, 'Anemia in Oncology Patients');
  }
  if (/immune thrombocytopenia|\bitp\b/.test(text)) {
    return makeCpScope(bbRoot, `${bbRoot} > Clinical Practice > Immune Thrombocytopenia`, 'Immune Thrombocytopenia');
  }
  if (/granulocyte transfusion/.test(text)) {
    return makeCpScope(bbRoot, `${bbRoot} > Neutrophils`, 'Neutrophils');
  }
  if (/obstetric|pediatric transfusion/.test(text)) {
    return makeCpScope(bbRoot, `${bbRoot} > Obstetric and Pediatric Patients`, 'Obstetric and Pediatric Patients');
  }
  if (/hemolytic disease of the fetus and newborn|hdfn/.test(text)) {
    return makeCpScope(bbRoot, `${bbRoot} > Obstetric and Pediatric Patients > Hemolytic Disease of the Fetus and Newborn`, 'Hemolytic Disease of the Fetus and Newborn');
  }
  if (/neonatal alloimmune thrombocytopenia|nait/.test(text)) {
    return makeCpScope(bbRoot, `${bbRoot} > Obstetric and Pediatric Patients > Neonatal Alloimmune Thrombocytopenia`, 'Neonatal Alloimmune Thrombocytopenia');
  }
  if (/rhig|fetomaternal hemorrhage/.test(text)) {
    return makeCpScope(bbRoot, `${bbRoot} > Obstetric and Pediatric Patients`, 'Obstetric and Pediatric Patients');
  }
  if (/intrauterine transfusion/.test(text)) {
    return makeCpScope(bbRoot, `${bbRoot} > Obstetric and Pediatric Patients > Intrauterine Transfusion`, 'Intrauterine Transfusion');
  }
  if (/hematopoietic progenitor cell|hpc/.test(text)) {
    return makeCpScope(bbRoot, `${bbRoot} > Hematopoietic Progenitor Cell (HPC) Transplantation`, 'Hematopoietic Progenitor Cell (HPC) Transplantation');
  }
  if (/cell and tissue therapy/.test(text)) {
    return makeCpScope(bbRoot, `${bbRoot} > Cell and Tissue Therapy`, 'Cell and Tissue Therapy');
  }
  if (/hla antigens and alleles/.test(text)) {
    return makeCpScope(bbRoot, `${bbRoot} > Cell and Tissue Therapy > HLA Antigens and Alleles`, 'HLA Antigens and Alleles');
  }
  if (/tissue banking|allografts|donation|suitability/.test(text)) {
    return makeCpScope(bbRoot, `${bbRoot} > Cell and Tissue Therapy > Tissue Banking`, 'Tissue Banking');
  }
  if (/adoptive immunotherapy|car-t|\btils?\b/.test(text)) {
    return makeCpScope(bbRoot, `${bbRoot} > Cell and Tissue Therapy > Adoptive Immunotherapy`, 'Adoptive Immunotherapy');
  }
  if (/gene therapy in transfusion medicine/.test(text)) {
    return makeCpScope(bbRoot, `${bbRoot} > Cell and Tissue Therapy > Gene Therapy in Transfusion Medicine`, 'Gene Therapy in Transfusion Medicine');
  }
  if (/tissue engineering|regenerative medicine/.test(text)) {
    return makeCpScope(bbRoot, `${bbRoot} > Cell and Tissue Therapy`, 'Cell and Tissue Therapy');
  }
  if (/rbcs and rbc components/.test(text)) {
    return makeCpScope(bbRoot, `${bbRoot} > RBCs and RBC Components`, 'RBCs and RBC Components');
  }
  if (/red cell production|kinetics|oxygen delivery/.test(text)) {
    return makeCpScope(bbRoot, `${bbRoot} > RBCs and RBC Components > Red Cell Production, Kinetics, and Oxygen Delivery`, 'Red Cell Production, Kinetics, and Oxygen Delivery');
  }
  if (/red cell metabolism|storage lesion/.test(text)) {
    return makeCpScope(bbRoot, `${bbRoot} > RBCs and RBC Components > Red Cell Metabolism and Preservation`, 'Red Cell Metabolism and Preservation');
  }
  if (/compatibility testing|red cell immunology/.test(text)) {
    return makeCpScope(bbRoot, `${bbRoot} > RBCs and RBC Components > Red Cell Immunology > Compatibility Testing`, 'Compatibility Testing');
  }
  if (/carbohydrate blood groups|\babo\b|lewis|\bii\b|\bp\)/.test(text)) {
    return makeCpScope(bbRoot, `${bbRoot} > RBCs and RBC Components > Carbohydrate Blood Groups`, 'Carbohydrate Blood Groups');
  }
  if (/rh and lw blood group|protein blood group|kell|duffy|kidd|mns|diego/.test(text)) {
    return makeCpScope(bbRoot, `${bbRoot} > RBCs and RBC Components > Protein Blood Group Systems`, 'Protein Blood Group Systems');
  }
  if (/therapeutic plasma exchange|\btpe\b/.test(text)) {
    return makeCpScope(bbRoot, `${bbRoot} > Apheresis > Therapeutic Plasma Exchange`, 'Therapeutic Plasma Exchange');
  }
  if (/therapeutic cytapheresis|red cell, platelet, and leukocyte apheresis/.test(text)) {
    return makeCpScope(bbRoot, `${bbRoot} > Apheresis`, 'Apheresis');
  }
  if (/apheresis|hemapheresis/.test(text)) {
    return makeCpScope(bbRoot, `${bbRoot} > Apheresis`, 'Apheresis');
  }
  if (/hazards of transfusion/.test(text)) {
    return makeCpScope(bbRoot, `${bbRoot} > Hazards of Transfusion`, 'Hazards of Transfusion');
  }
  if (/hemolytic transfusion reaction/.test(text)) {
    return makeCpScope(bbRoot, `${bbRoot} > Hazards of Transfusion`, 'Hazards of Transfusion');
  }
  if (/febrile|allergic|anaphylactic transfusion reaction/.test(text)) {
    return makeCpScope(bbRoot, `${bbRoot} > Hazards of Transfusion`, 'Hazards of Transfusion');
  }
  if (/ta-gvhd|graft-versus-host/.test(text)) {
    return makeCpScope(bbRoot, `${bbRoot} > Hazards of Transfusion`, 'Hazards of Transfusion');
  }
  if (/trali/.test(text)) {
    return makeCpScope(bbRoot, `${bbRoot} > Hazards of Transfusion`, 'Hazards of Transfusion');
  }
  if (/taco/.test(text)) {
    return makeCpScope(bbRoot, `${bbRoot} > Hazards of Transfusion`, 'Hazards of Transfusion');
  }
  if (/posttransfusion purpura/.test(text)) {
    return makeCpScope(bbRoot, `${bbRoot} > Hazards of Transfusion`, 'Hazards of Transfusion');
  }
  if (/plasma components|derivatives|albumin|ivig/.test(text)) {
    return makeCpScope(bbRoot, `${bbRoot} > Plasma Components and Derivatives`, 'Plasma Components and Derivatives');
  }
  if (/infectious hazards of transfusion|hepatitis viruses|retroviruses|cmv|herpesviruses|bacterial contamination of blood products|emerging pathogens|zika|west nile|prions/.test(text)) {
    return makeCpScope(bbRoot, `${bbRoot} > Infectious Hazards of Transfusion`, 'Infectious Hazards of Transfusion');
  }
  if (/blood donors and collection|donor eligibility|screening|collection complications|component processing and testing/.test(text)) {
    return makeCpScope(bbRoot, `${bbRoot} > Blood Donors and Collection`, 'Blood Donors and Collection');
  }

  if (/hematopathology \(cp\)|acute myeloid leukemia with myelodysplasia-related changes/.test(text)) {
    return makeCpScope(hpRoot, `${hpRoot} > Myeloid Neoplasms > Acute Myeloid Leukemia`, 'Acute Myeloid Leukemia');
  }
  if (/benign hematology/.test(text)) {
    return makeCpScope(hpRoot, `${hpRoot} > Normal Anatomy, Histology, Hematopoiesis and Hemostasis`, 'Normal Anatomy, Histology, Hematopoiesis and Hemostasis');
  }
  if (/coagulation|coagulopathy|hemophilia|von willebrand|\\bvwd\\b|thrombophilia|factor inhibitors/.test(text)) {
    return makeCpScope(hpRoot, `${hpRoot} > Hemostasis and Thrombosis`, 'Hemostasis and Thrombosis');
  }

  if (/case tutorial: chemical pathology$|^chemical-pathology$|advanced clinical biochemistry dossier/.test(text)) {
    return makeCpScope(cpRoot, cpRoot, cpRoot);
  }
  if (/analytical techniques/.test(text)) {
    return makeCpScope(cpRoot, `${cpRoot} > Analytical Techniques and Safety`, 'Analytical Techniques and Safety');
  }
  if (/spectrophotometry|optics/.test(text)) {
    return makeCpScope(cpRoot, `${cpRoot} > Optical Techniques`, 'Optical Techniques');
  }
  if (/electrochemistry|sensors/.test(text)) {
    return makeCpScope(cpRoot, `${cpRoot} > Electrochemistry and Chemical Sensors`, 'Electrochemistry and Chemical Sensors');
  }
  if (/electrophoresis/.test(text)) {
    return makeCpScope(cpRoot, `${cpRoot} > Electrophoresis`, 'Electrophoresis');
  }
  if (/chromatography/.test(text)) {
    return makeCpScope(cpRoot, `${cpRoot} > Chromatography`, 'Chromatography');
  }
  if (/mass spectrometry/.test(text)) {
    return makeCpScope(cpRoot, `${cpRoot} > Mass Spectrometry`, 'Mass Spectrometry');
  }
  if (/immunoassay/.test(text)) {
    return makeCpScope(cpRoot, `${cpRoot} > Principles of Immunochemical Techniques`, 'Principles of Immunochemical Techniques');
  }
  if (/method validation|precision|accuracy|bias|reference intervals|sensitivity|specificity|roc curves|statistical interpretation/.test(text)) {
    return makeCpScope(miRoot, `${miRoot} > Quality Management`, 'Quality Management');
  }
  if (/proteins & enzymes|serum protein electrophoresis|\bspep\b|\bife\b/.test(text)) {
    return makeCpScope(cpRoot, `${cpRoot} > Peptides and Proteins`, 'Peptides and Proteins');
  }
  if (/cardiac markers|troponin|bnp/.test(text)) {
    return makeCpScope(cpRoot, `${cpRoot} > Cardiac Function`, 'Cardiac Function');
  }
  if (/liver enzymes|ast, alt, alp, ggt/.test(text)) {
    return makeCpScope(cpRoot, `${cpRoot} > Liver Disease`, 'Liver Disease');
  }
  if (/tumor markers/.test(text)) {
    return makeCpScope(cpRoot, `${cpRoot} > Tumor Markers`, 'Tumor Markers');
  }
  if (/lipids|lipoproteins/.test(text)) {
    return makeCpScope(cpRoot, `${cpRoot} > Lipids, Lipoproteins and Apolipoproteins`, 'Lipids, Lipoproteins and Apolipoproteins');
  }
  if (/carbohydrates|diabetes/.test(text)) {
    return makeCpScope(cpRoot, `${cpRoot} > Carbohydrates`, 'Carbohydrates');
  }
  if (/blood gases|electrolytes/.test(text)) {
    return makeCpScope(cpRoot, `${cpRoot} > Electrolytes and Blood Gases`, 'Electrolytes and Blood Gases');
  }
  if (/hypothyroidism|thyroid function|thyroid/.test(text)) {
    return makeCpScope(cpRoot, `${cpRoot} > Thyroid`, 'Thyroid');
  }
  if (/adrenal cortex|medulla/.test(text)) {
    return makeCpScope(cpRoot, `${cpRoot} > The Adrenal Cortex`, 'The Adrenal Cortex');
  }
  if (/pituitary adenoma|reproductive manifestations|pituitary function/.test(text)) {
    return makeCpScope(cpRoot, `${cpRoot} > Pituitary Function`, 'Pituitary Function');
  }
  if (/calcium|bone metabolism/.test(text)) {
    return makeCpScope(cpRoot, `${cpRoot} > Mineral and Bone Metabolism`, 'Mineral and Bone Metabolism');
  }
  if (/toxicology|therapeutic drug monitoring|\btdm\b/.test(text)) {
    return makeCpScope(cpRoot, `${cpRoot} > Therapeutic Drugs and Their Management`, 'Therapeutic Drugs and Their Management');
  }
  if (/metals|volatiles|drugs of abuse|forensic toxicology/.test(text)) {
    return makeCpScope(cpRoot, `${cpRoot} > Clinical Toxicology`, 'Clinical Toxicology');
  }

  if (/quality control|quality assurance/.test(text)) {
    return makeCpScope(miRoot, `${miRoot} > Quality Management`, 'Quality Management');
  }
  if (/regulatory agencies|clia|cap|tjc|laws and regulations/.test(text)) {
    return makeCpScope(miRoot, `${miRoot} > Laws and Regulations`, 'Laws and Regulations');
  }
  if (/laboratory safety|safety/.test(text)) {
    return makeCpScope(miRoot, `${miRoot} > Safety`, 'Safety');
  }
  if (/laboratory data|statistical interpretation/.test(text)) {
    return makeCpScope(miRoot, `${miRoot} > Quality Management`, 'Quality Management');
  }

  if (/medical microbiology$|^topic-mb$/.test(text)) {
    return makeCpScope(mbRoot, mbRoot, mbRoot);
  }
  if (/bacteriology|community-acquired pneumonia|gram positive|gram negative|anaerobic|spirochetes|mycobacteria/.test(text)) {
    return makeCpScope(mbRoot, `${mbRoot} > Bacteria, including Mycobacteria, Nocardia, and other Aerobic Actinomycetes`, 'Bacteria, including Mycobacteria, Nocardia, and other Aerobic Actinomycetes');
  }
  if (/antimicrobial susceptibility testing/.test(text)) {
    return makeCpScope(mbRoot, `${mbRoot} > Bacteria, including Mycobacteria, Nocardia, and other Aerobic Actinomycetes`, 'Bacteria, including Mycobacteria, Nocardia, and other Aerobic Actinomycetes');
  }
  if (/mycology|yeasts|molds|dimorphic fungi/.test(text)) {
    return makeCpScope(mbRoot, `${mbRoot} > Fungi`, 'Fungi');
  }
  if (/virology|respiratory viruses|retroviruses|herpesviruses/.test(text)) {
    return makeCpScope(mbRoot, `${mbRoot} > Viruses and Prions`, 'Viruses and Prions');
  }
  if (/parasitology|protozoa|helminths|malaria|babesia|giardia|entamoeba/.test(text)) {
    return makeCpScope(mbRoot, `${mbRoot} > Parasites`, 'Parasites');
  }

  return undefined;
};
