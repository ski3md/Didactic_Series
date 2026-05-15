#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = process.cwd();
const DEFAULT_APP_DIR = '/Applications/JH Neuro Atlas.app/Wrapper/JHNeuroAtlas.app';
const DEFAULT_DB = path.join(DEFAULT_APP_DIR, 'neuro_atlas_db_v021_en.db');
const OUT_DIR = path.join(ROOT, 'src', 'content', 'neuro');
const MANIFEST_PATH = path.join(OUT_DIR, 'jh_neuro_atlas_entity_manifest.json');
const SUMMARY_PATH = path.join(OUT_DIR, 'jh_neuro_atlas_entity_manifest.summary.json');

const args = process.argv.slice(2);
const getArg = (name, fallback = '') => {
  const prefixed = args.find((arg) => arg.startsWith(`${name}=`));
  if (prefixed) return prefixed.slice(name.length + 1);
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};

const dbPath = getArg('--db', DEFAULT_DB);
const sourceAppPath = getArg('--app-dir', DEFAULT_APP_DIR);

const normalizePath = (value) =>
  String(value || '')
    .replace(/\\/g, '/')
    .replace(/^images\//i, '');

const toBool = (value) => value === 1 || value === '1' || value === true;

const query = (sql) => {
  const result = spawnSync('sqlite3', ['-json', dbPath, sql], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `sqlite3 exited ${result.status}`);
  }
  const output = result.stdout.trim();
  return output ? JSON.parse(output) : [];
};

const uniqueSorted = (values) => [...new Set(values.filter(Boolean))].sort((left, right) => String(left).localeCompare(String(right)));

const groupBy = (rows, key) => {
  const grouped = new Map();
  for (const row of rows) {
    const groupKey = row[key];
    if (!grouped.has(groupKey)) grouped.set(groupKey, []);
    grouped.get(groupKey).push(row);
  }
  return grouped;
};

const rowsById = (rows) => new Map(rows.map((row) => [row.ID, row]));

const main = () => {
  if (!fs.existsSync(dbPath)) throw new Error(`JH Neuro Atlas database not found: ${dbPath}`);

  const diagnoses = query('select ID, Short_list, Diagnosis from diagnoses order by Diagnosis;');
  const synonyms = query('select ID, Synonym, Diagnosis_ID from synonyms order by Diagnosis_ID, Synonym;');
  const stains = rowsById(query('select ID, Stain from stains order by ID;'));
  const modalities = rowsById(query('select ID, Modality from modalities order by ID;'));
  const features = rowsById(query('select ID, Feature from features order by ID;'));
  const patients = rowsById(query('select ID, Age, Race, Sex from patients order by ID;'));
  const specimens = rowsById(query('select ID, PatientID from specimens order by ID;'));
  const images = query(`
    select ID, Filepath, SpecimenID, PatientID, Legend, Magnification, StainID,
           DiagnosisID, ModalityID, SubdiagnosisID, DiagnosisImageIndex, Credits,
           Copyright, License, UseForFlash
    from images
    order by DiagnosisID, DiagnosisImageIndex, ID;
  `);
  const imageFeatures = query('select ID, ImageID, FeatureID, FeatureImageIndex from imageFeatures order by ImageID, FeatureImageIndex, ID;');
  const questions = query(`
    select ID, ImageID, QuestionNumber, Question, Answer1, Answer2, Answer3, Answer4,
           Answer5, Correct, Explanation
    from questions
    order by ImageID, QuestionNumber, ID;
  `);
  const diagnosisNodes = query('select ID, Name, Description, Image from diagnosisNodes order by ID;');
  const diagnosisNodeDiagnosis = query('select ID, DiagnosisNodeID, DiagnosisID from diagnosisNodeDiagnosis order by DiagnosisNodeID, DiagnosisID;');
  const featureNodes = query('select ID, Name, Description, Image from featureNodes order by ID;');
  const featureNodeFeature = query('select ID, FeatureNodeID, FeatureID from featureNodeFeature order by FeatureNodeID, FeatureID;');
  const featureNodeDiagnosisNode = query('select ID, FeatureNodeID, DiagnosisNodeID from featureNodeDiagnosisNode order by FeatureNodeID, DiagnosisNodeID;');

  const synonymsByDiagnosis = groupBy(synonyms, 'Diagnosis_ID');
  const imagesByDiagnosis = groupBy(images, 'DiagnosisID');
  const imageFeaturesByImage = groupBy(imageFeatures, 'ImageID');
  const questionsByImage = groupBy(questions, 'ImageID');
  const diagnosisNodeIdsByDiagnosis = groupBy(diagnosisNodeDiagnosis, 'DiagnosisID');
  const diagnosisIdsByNode = groupBy(diagnosisNodeDiagnosis, 'DiagnosisNodeID');
  const featureIdsByNode = groupBy(featureNodeFeature, 'FeatureNodeID');
  const diagnosisNodeIdsByFeatureNode = groupBy(featureNodeDiagnosisNode, 'FeatureNodeID');

  const entities = diagnoses.map((diagnosis) => {
    const diagnosisImages = imagesByDiagnosis.get(diagnosis.ID) || [];
    const annotationRows = diagnosisImages.map((image) => {
      const specimen = specimens.get(image.SpecimenID);
      const patient = patients.get(image.PatientID || specimen?.PatientID);
      const featureAnnotations = (imageFeaturesByImage.get(image.ID) || []).map((row) => ({
        id: row.FeatureID,
        label: features.get(row.FeatureID)?.Feature || `Feature ${row.FeatureID}`,
        imageIndex: row.FeatureImageIndex,
      }));
      const quizItems = (questionsByImage.get(image.ID) || []).map((question) => ({
        id: question.ID,
        questionNumber: question.QuestionNumber,
        question: question.Question,
        answers: [question.Answer1, question.Answer2, question.Answer3, question.Answer4, question.Answer5].filter(Boolean),
        correctAnswerIndex: question.Correct,
        explanation: question.Explanation,
      }));
      return {
        imageId: image.ID,
        filePath: normalizePath(image.Filepath),
        thumbPath: `thumb_${normalizePath(image.Filepath)}`,
        diagnosisImageIndex: image.DiagnosisImageIndex,
        magnification: image.Magnification,
        stain: stains.get(image.StainID)?.Stain || null,
        modality: modalities.get(image.ModalityID)?.Modality || null,
        subdiagnosisId: image.SubdiagnosisID || null,
        legend: image.Legend || '',
        features: featureAnnotations,
        questions: quizItems,
        patient:
          patient && (patient.Age || patient.Race || patient.Sex)
            ? {
                age: patient.Age,
                race: patient.Race,
                sex: patient.Sex,
              }
            : null,
        rights: {
          credits: image.Credits || '',
          copyright: image.Copyright || '',
          license: image.License || '',
          useForFlash: toBool(image.UseForFlash),
        },
      };
    });
    const diagnosisNodeMembership = (diagnosisNodeIdsByDiagnosis.get(diagnosis.ID) || []).map((row) => {
      const node = diagnosisNodes.find((candidate) => candidate.ID === row.DiagnosisNodeID);
      return node
        ? {
            id: node.ID,
            name: node.Name,
          }
        : { id: row.DiagnosisNodeID, name: `Diagnosis node ${row.DiagnosisNodeID}` };
    });

    return {
      id: diagnosis.ID,
      name: diagnosis.Diagnosis,
      shortList: toBool(diagnosis.Short_list),
      synonyms: (synonymsByDiagnosis.get(diagnosis.ID) || []).map((row) => row.Synonym),
      diagnosisNodes: diagnosisNodeMembership,
      imageCount: annotationRows.length,
      stains: uniqueSorted(annotationRows.map((row) => row.stain)),
      modalities: uniqueSorted(annotationRows.map((row) => row.modality)),
      features: uniqueSorted(annotationRows.flatMap((row) => row.features.map((feature) => feature.label))),
      questionCount: annotationRows.reduce((sum, row) => sum + row.questions.length, 0),
      annotations: annotationRows,
    };
  });

  const algorithm = {
    diagnosisNodes: diagnosisNodes.map((node) => ({
      id: node.ID,
      name: node.Name,
      description: node.Description || '',
      image: node.Image || '',
      diagnoses: (diagnosisIdsByNode.get(node.ID) || [])
        .map((row) => diagnoses.find((diagnosis) => diagnosis.ID === row.DiagnosisID))
        .filter(Boolean)
        .map((diagnosis) => ({ id: diagnosis.ID, name: diagnosis.Diagnosis })),
    })),
    featureNodes: featureNodes.map((node) => ({
      id: node.ID,
      name: node.Name,
      description: node.Description || '',
      image: node.Image || '',
      features: (featureIdsByNode.get(node.ID) || [])
        .map((row) => features.get(row.FeatureID))
        .filter(Boolean)
        .map((feature) => ({ id: feature.ID, label: feature.Feature })),
      diagnosisNodes: (diagnosisNodeIdsByFeatureNode.get(node.ID) || [])
        .map((row) => diagnosisNodes.find((diagnosisNode) => diagnosisNode.ID === row.DiagnosisNodeID))
        .filter(Boolean)
        .map((diagnosisNode) => ({ id: diagnosisNode.ID, name: diagnosisNode.Name })),
    })),
  };

  const manifest = {
    version: '2026-05-07',
    generatedAt: new Date().toISOString(),
    source: {
      name: 'Johns Hopkins Atlas of Surgical Neuropathology',
      appDirectory: sourceAppPath,
      database: dbPath,
      imageBinaryPolicy: 'Image files remain in the licensed app bundle and are not copied into this project by this metadata import.',
      contentPolicy: 'This file mirrors local atlas metadata for curriculum mapping and review on this workstation.',
    },
    summary: {
      diagnoses: entities.length,
      images: images.length,
      features: features.size,
      questions: questions.length,
      diagnosisNodes: diagnosisNodes.length,
      featureNodes: featureNodes.length,
      stains: stains.size,
      modalities: modalities.size,
      shortListDiagnoses: entities.filter((entity) => entity.shortList).length,
      entitiesWithImages: entities.filter((entity) => entity.imageCount > 0).length,
      entitiesWithQuestions: entities.filter((entity) => entity.questionCount > 0).length,
    },
    stains: [...stains.values()].map((row) => ({ id: row.ID, name: row.Stain })),
    modalities: [...modalities.values()].map((row) => ({ id: row.ID, name: row.Modality })),
    featureVocabulary: [...features.values()].map((row) => ({ id: row.ID, label: row.Feature })),
    algorithm,
    entities,
  };

  const summary = {
    generatedAt: manifest.generatedAt,
    source: manifest.source,
    summary: manifest.summary,
    entities: entities.map((entity) => ({
      id: entity.id,
      name: entity.name,
      shortList: entity.shortList,
      imageCount: entity.imageCount,
      questionCount: entity.questionCount,
      synonyms: entity.synonyms,
      stains: entity.stains,
      features: entity.features,
      diagnosisNodes: entity.diagnosisNodes,
    })),
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  fs.writeFileSync(SUMMARY_PATH, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(
    JSON.stringify(
      {
        manifest: path.relative(ROOT, MANIFEST_PATH),
        summary: path.relative(ROOT, SUMMARY_PATH),
        ...manifest.summary,
      },
      null,
      2
    )
  );
};

main();
