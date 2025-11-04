import React, { useState, useRef, useEffect } from 'react';
import Card from './ui/Card';
import SectionHeader from './ui/SectionHeader';
import Alert from './ui/Alert';
import { CheckCircleIcon, XCircleIcon, LightbulbIcon, ArrowPathIcon, BacteriaIcon, SeedlingIcon, VirusIcon, DiseaseIcon, HeartbeatIcon, AllergiesIcon, EllipsisHorizontalIcon } from './icons';
import { User, Section, StoredImage } from '../types';
import { trackEvent } from '../utils/tracking';
import { findRelevantImage } from '../utils/aiImageSelector';
import WSIViewer from './WSIViewer';

type NodeId =
  | 'root'
  | 'infectious-workup'
  | 'mycobacterial-workup'
  | 'mtb-workup'
  | 'ntm-workup'
  | 'fungal-workup'
  | 'endemic-fungi'
  | 'cryptococcus'
  | 'aspergillus'
  | 'other-infectious'
  | 'non-infectious-workup'
  | 'sarcoidosis-workup'
  | 'vasculitis-workup'
  | 'gpa-workup'
  | 'egpa-workup'
  | 'hypersensitivity-workup'
  | 'other-non-infectious'
  | 'comprehensive-workup';

type NodeType = 'infectious' | 'non-infectious' | 'undetermined';

interface NodeOption {
  text: string;
  target: NodeId;
  icon?: React.ReactNode;
}

interface NodeData {
  id: NodeId;
  phase: number;
  type: NodeType;
  title: string;
  description: string;
  recommendations: React.ReactNode;
  options?: NodeOption[];
  isTerminal?: boolean;
  content?: React.ReactNode;
}

const treeData: Record<NodeId, NodeData> = {
  root: {
    id: 'root',
    phase: 1,
    type: 'undetermined',
    title: 'Granuloma Identification & Initial Assessment',
    description: 'Granulomas have been identified on histopathology. Begin with the critical distinction between infectious and non-infectious causes.',
    options: [
      { text: 'Suspect Infectious Cause', target: 'infectious-workup', icon: <BacteriaIcon className="h-5 w-5"/> },
      { text: 'Suspect Non-Infectious Cause', target: 'non-infectious-workup', icon: <AllergiesIcon className="h-5 w-5"/> },
      { text: 'Undetermined - Proceed with Comprehensive Workup', target: 'comprehensive-workup', icon: <LightbulbIcon className="h-5 w-5"/> },
    ],
    recommendations: (
      <ul className="list-disc list-inside space-y-1">
        <li>Always prioritize exclusion of infectious causes before considering non-infectious etiologies.</li>
        <li>Correlate with clinical presentation: B-symptoms (fever, night sweats, weight loss) suggest infection.</li>
        <li>Review radiologic findings: Tree-in-bud pattern suggests infection; perilymphatic nodules suggest sarcoidosis.</li>
      </ul>
    ),
  },
  'infectious-workup': {
    id: 'infectious-workup',
    phase: 2,
    type: 'infectious',
    title: 'Infectious Workup',
    description: 'When infection is suspected, perform a systematic evaluation for mycobacterial and fungal organisms using special stains and cultures.',
    options: [
        { text: 'Mycobacterial Evaluation', target: 'mycobacterial-workup', icon: <BacteriaIcon className="h-5 w-5"/> },
        { text: 'Fungal Evaluation', target: 'fungal-workup', icon: <SeedlingIcon className="h-5 w-5"/> },
        { text: 'Other Infectious Agents', target: 'other-infectious', icon: <VirusIcon className="h-5 w-5"/> },
    ],
    recommendations: (
        <ul className="list-disc list-inside space-y-1">
            <li>Send fresh tissue for routine microbiology (culture & PCR) and histopathology.</li>
            <li>Necrotizing granulomas are most commonly infectious (MTB, NTM, fungi).</li>
            <li>Consider patient's geographic location and travel history for endemic fungi.</li>
        </ul>
    ),
  },
  'mycobacterial-workup': {
      id: 'mycobacterial-workup',
      phase: 3,
      type: 'infectious',
      title: 'Mycobacterial Evaluation',
      description: 'Evaluate for Mycobacterium tuberculosis (MTB) and non-tuberculous mycobacteria (NTM) using appropriate stains and molecular tests.',
      options: [
          { text: 'M. tuberculosis Complex', target: 'mtb-workup', icon: <BacteriaIcon className="h-5 w-5"/> },
          { text: 'Non-Tuberculous Mycobacteria (NTM)', target: 'ntm-workup', icon: <BacteriaIcon className="h-5 w-5"/> },
      ],
      recommendations: (
          <ul className="list-disc list-inside space-y-1">
              <li>Perform Ziehl-Neelsen (ZN) stain and auramine-rhodamine fluorescence staining.</li>
              <li>Send tissue for mycobacterial culture (gold standard) and PCR (e.g., Xpert MTB/RIF).</li>
              <li>MTB typically shows caseating necrosis; NTM may show histologically identical granulomas.</li>
          </ul>
      ),
  },
  'mtb-workup': {
      id: 'mtb-workup',
      phase: 4,
      isTerminal: true,
      type: 'infectious',
      title: 'Conclusion: M. tuberculosis Complex',
      description: 'Tuberculosis remains a leading cause of granulomatous lung disease worldwide. Diagnosis requires identification of the organism or its DNA.',
      content: (
          <>
              <h4 className="font-semibold text-slate-800 mb-2">Diagnostic Criteria for MTB:</h4>
              <ul className="list-disc list-inside space-y-2 text-slate-600">
                  <li><strong>Clinical:</strong> Endemic exposure, immunosuppression (HIV), active TB contact.</li>
                  <li><strong>Radiologic:</strong> Upper lobe cavitary lesions, tree-in-bud pattern, lymphadenopathy.</li>
                  <li><strong>Histologic:</strong> Caseating (necrotizing) granulomas with Langhans giant cells.</li>
                  <li><strong>Laboratory:</strong> Positive culture or molecular identification (Xpert MTB/RIF) from tissue/sputum.</li>
              </ul>
          </>
      ),
      recommendations: "MTB can mimic other granulomatous diseases. Always confirm with microbiologic studies before initiating treatment. In immunocompromised patients, granulomas may be poorly formed or absent."
  },
  'ntm-workup': {
      id: 'ntm-workup',
      phase: 4,
      isTerminal: true,
      type: 'infectious',
      title: 'Conclusion: Non-Tuberculous Mycobacteria (NTM)',
      description: 'NTM pulmonary disease is increasingly recognized, especially in patients with structural lung disease.',
      content: (
           <>
              <h4 className="font-semibold text-slate-800 mb-2">Diagnostic Criteria for NTM (ATS/IDSA Guidelines):</h4>
              <ul className="list-disc list-inside space-y-2 text-slate-600">
                  <li><strong>Clinical:</strong> Pulmonary symptoms, radiologic findings, exclusion of other diagnoses.</li>
                  <li><strong>Radiologic:</strong> Nodular bronchiectasis (especially RML/lingula), fibrocavitary disease.</li>
                  <li><strong>Special Consideration:</strong> Hot Tub Lung (HTL) - hypersensitivity vs. infection to NTM.</li>
                  <li><strong>Laboratory:</strong> Positive NTM cultures from bronchial wash or sputum (≥2) or lung biopsy.</li>
              </ul>
          </>
      ),
      recommendations: "Hot Tub Lung presents with centrilobular nodules and ground-glass opacities, mimicking hypersensitivity pneumonitis. Histology shows non-necrotizing granulomas and cellular bronchiolitis."
  },
  'fungal-workup': {
      id: 'fungal-workup',
      phase: 3,
      type: 'infectious',
      title: 'Fungal Evaluation',
      description: 'Fungal infections are common causes of granulomatous lung disease. Geographic variation is critical for diagnosis.',
      options: [
          { text: 'Endemic Fungi', target: 'endemic-fungi', icon: <SeedlingIcon className="h-5 w-5"/> },
          { text: 'Cryptococcus', target: 'cryptococcus', icon: <SeedlingIcon className="h-5 w-5"/> },
          { text: 'Aspergillus', target: 'aspergillus', icon: <SeedlingIcon className="h-5 w-5"/> },
      ],
      recommendations: (
          <ul className="list-disc list-inside space-y-1">
              <li>Perform GMS stain for fungi and examine carefully at both low and high magnification.</li>
              <li>Consider patient's geographic location and travel history for endemic fungi.</li>
              <li>Send tissue for fungal culture and consider serologic testing (antigen/antibody).</li>
          </ul>
      )
  },
  'endemic-fungi': {
    id: 'endemic-fungi',
    phase: 4,
    isTerminal: true,
    type: 'infectious',
    title: 'Conclusion: Endemic Fungal Infections',
    description: 'Histoplasma, Blastomyces, and Coccidioides are major endemic fungal causes of granulomatous lung disease.',
    content: <p>Review the comparison table in the Job Aid & Atlas for details on Histoplasma, Blastomyces, and Coccidioides.</p>,
    recommendations: 'Histoplasma is the most common overlooked cause of unexplained necrotizing granulomas. Multiple recuts and special stains may be necessary for diagnosis.'
  },
  cryptococcus: {
    id: 'cryptococcus',
    phase: 4,
    isTerminal: true,
    type: 'infectious',
    title: 'Conclusion: Cryptococcosis',
    description: 'Cryptococcus neoformans and Cryptococcus gattii cause granulomatous inflammation, particularly in immunocompromised patients.',
    content: (
         <>
            <h4 className="font-semibold text-slate-800 mb-2">Diagnostic Criteria for Cryptococcosis:</h4>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
                <li><strong>Histologic:</strong> Narrow-based budding yeast (4-7μm); may show capsule on H&E.</li>
                <li><strong>Special Stains:</strong> Mucicarmine highlights capsule; Fontana-Masson stains cell wall of capsule-deficient strains.</li>
                <li><strong>Laboratory:</strong> Serum/BAL cryptococcal antigen (highly sensitive/specific), culture.</li>
            </ul>
        </>
    ),
    recommendations: 'Cryptococcus is a common opportunistic infection in patients with sarcoidosis due to their underlying immunosuppression. Always consider in patients with known sarcoidosis who develop new or worsening symptoms.'
  },
  aspergillus: {
    id: 'aspergillus',
    phase: 4,
    isTerminal: true,
    type: 'infectious',
    title: 'Conclusion: Aspergillosis',
    description: 'Aspergillus species rarely cause granulomatous inflammation, except in chronic forms of the disease.',
    content: (
         <>
            <h4 className="font-semibold text-slate-800 mb-2">Diagnostic Criteria for Aspergillosis:</h4>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
                <li><strong>Histologic:</strong> Septate hyphae with acute-angle branching (45°); rarely forms granulomas.</li>
                <li><strong>Chronic Forms:</strong> Chronic necrotizing aspergillosis (semi-invasive) may show granulomatous inflammation.</li>
                <li><strong>Laboratory:</strong> Culture, galactomannan antigen, PCR, Aspergillus IgG/IgE.</li>
            </ul>
        </>
    ),
    recommendations: 'Allergic bronchopulmonary aspergillosis (ABPA) can cause granulomatous inflammation in the airways, typically in patients with asthma or cystic fibrosis. Look for eosinophilic inflammation and mucus plugs.'
  },
  'other-infectious': {
    id: 'other-infectious',
    phase: 3,
    isTerminal: true,
    type: 'infectious',
    title: 'Conclusion: Other Infectious Agents',
    description: 'Less common infectious causes of granulomatous lung disease include parasites, bacteria, and viruses.',
    content: (
        <ul className="list-disc list-inside space-y-2 text-slate-600">
            <li><strong>Parasitic:</strong> Schistosomiasis, paragonimiasis, strongyloidiasis.</li>
            <li><strong>Bacterial:</strong> Brucellosis, tularemia, nocardiosis, rhodococcus equi.</li>
            <li><strong>Viral:</strong> Rare, but reported with herpesviruses in immunocompromised patients.</li>
        </ul>
    ),
    recommendations: 'Always consider travel history and exposure to unusual pathogens when common infectious causes have been excluded. Consultation with infectious disease specialists may be helpful.'
  },
  'non-infectious-workup': {
    id: 'non-infectious-workup',
    phase: 2,
    type: 'non-infectious',
    title: 'Non-Infectious Workup',
    description: 'After excluding infectious causes, evaluate for non-infectious granulomatous lung diseases. Always correlate with clinical and radiologic findings.',
    options: [
        { text: 'Sarcoidosis', target: 'sarcoidosis-workup', icon: <DiseaseIcon className="h-5 w-5"/> },
        { text: 'Vasculitis', target: 'vasculitis-workup', icon: <HeartbeatIcon className="h-5 w-5"/> },
        { text: 'Hypersensitivity Pneumonitis', target: 'hypersensitivity-workup', icon: <AllergiesIcon className="h-5 w-5"/> },
        { text: 'Other Non-Infectious Causes', target: 'other-non-infectious', icon: <EllipsisHorizontalIcon className="h-5 w-5"/> },
    ],
    recommendations: (
        <ul className="list-disc list-inside space-y-1">
            <li>Non-infectious causes require a diagnosis of exclusion after thorough infectious workup.</li>
            <li>Clinical-radiologic-pathologic correlation is essential for accurate diagnosis.</li>
            <li>Consider drug-induced sarcoidosis-like reactions (DISR) and malignancy-associated reactions.</li>
        </ul>
    )
  },
  'sarcoidosis-workup': {
      id: 'sarcoidosis-workup',
      phase: 3,
      isTerminal: true,
      type: 'non-infectious',
      title: 'Conclusion: Sarcoidosis',
      description: 'Sarcoidosis is a multisystem granulomatous disorder of unknown cause. The diagnosis requires clinical-radiologic-pathologic correlation.',
      content: (
          <>
              <h4 className="font-semibold text-slate-800 mb-2">Diagnostic Criteria for Sarcoidosis:</h4>
              <ul className="list-disc list-inside space-y-2 text-slate-600">
                  <li><strong>Clinical:</strong> Multisystem involvement; may present with Löfgren's syndrome or Heerfordt's syndrome.</li>
                  <li><strong>Radiologic:</strong> Bilateral hilar lymphadenopathy, perilymphatic nodules.</li>
                  <li><strong>Histologic:</strong> Well-formed, non-necrotizing granulomas in a lymphangitic distribution.</li>
                  <li><strong>Laboratory:</strong> Elevated ACE level (nonspecific), hypercalcemia, BAL lymphocytosis with CD4:CD8 ratio &gt;3.5.</li>
              </ul>
          </>
      ),
      recommendations: 'Sarcoidosis is a diagnosis of exclusion. Always rule out infections and other granulomatous diseases like Berylliosis before making the diagnosis.'
  },
  'vasculitis-workup': {
      id: 'vasculitis-workup',
      phase: 3,
      type: 'non-infectious',
      title: 'Vasculitis Evaluation',
      description: 'Granulomatosis with polyangiitis (GPA) and eosinophilic granulomatosis with polyangiitis (EGPA) are the primary vasculitides causing granulomatous lung disease.',
      options: [
          { text: 'Granulomatosis with Polyangiitis (GPA)', target: 'gpa-workup', icon: <HeartbeatIcon className="h-5 w-5"/> },
          { text: 'Eosinophilic Granulomatosis with Polyangiitis (EGPA)', target: 'egpa-workup', icon: <HeartbeatIcon className="h-5 w-5"/> },
      ],
      recommendations: (
          <ul className="list-disc list-inside space-y-1">
              <li>Test for ANCA (c-ANCA/PR3 for GPA, p-ANCA/MPO for EGPA).</li>
              <li>Look for systemic involvement (renal, skin, nerve, ENT).</li>
              <li>Consider lung biopsy for definitive diagnosis when possible.</li>
          </ul>
      )
  },
  'gpa-workup': {
    id: 'gpa-workup',
    phase: 4,
    isTerminal: true,
    type: 'non-infectious',
    title: 'Conclusion: Granulomatosis with Polyangiitis (GPA)',
    description: 'GPA (formerly Wegener granulomatosis) is a necrotizing granulomatous vasculitis affecting small- to medium-sized vessels.',
    content: (
         <>
            <h4 className="font-semibold text-slate-800 mb-2">Diagnostic Criteria for GPA:</h4>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
                <li><strong>Clinical:</strong> Upper airway (sinusitis, nasal ulcers), lower airway (nodules, cavities), renal (glomerulonephritis).</li>
                <li><strong>Radiologic:</strong> Pulmonary nodules (often multiple and bilateral), cavities.</li>
                <li><strong>Histologic:</strong> Necrotizing granulomas, necrotizing vasculitis, geographic necrosis.</li>
                <li><strong>Serology:</strong> c-ANCA/PR3 positive in 90% of active systemic disease.</li>
            </ul>
        </>
    ),
    recommendations: 'Limited forms of GPA may present with only granulomatous inflammation without vasculitis. Always consider infection in the differential, especially when necrosis is present.'
  },
  'egpa-workup': {
    id: 'egpa-workup',
    phase: 4,
    isTerminal: true,
    type: 'non-infectious',
    title: 'Conclusion: Eosinophilic Granulomatosis with Polyangiitis (EGPA)',
    description: 'EGPA (formerly Churg-Strauss syndrome) is an eosinophil-rich, necrotizing granulomatous inflammation often affecting the lungs.',
    content: (
        <>
            <h4 className="font-semibold text-slate-800 mb-2">Diagnostic Criteria for EGPA:</h4>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
                <li><strong>Clinical:</strong> Asthma, eosinophilia (&gt;1,500/μL), mononeuritis multiplex.</li>
                <li><strong>Radiologic:</strong> Patchy, migratory pulmonary opacities.</li>
                <li><strong>Histologic:</strong> Eosinophil-rich inflammation, necrotizing granulomas, vasculitis.</li>
                <li><strong>Serology:</strong> p-ANCA/MPO positive in ~50% of cases.</li>
            </ul>
        </>
    ),
    recommendations: 'EGPA can be difficult to distinguish from chronic eosinophilic pneumonia. The presence of systemic vasculitis or mononeuritis multiplex helps establish the diagnosis.'
  },
  'hypersensitivity-workup': {
    id: 'hypersensitivity-workup',
    phase: 3,
    isTerminal: true,
    type: 'non-infectious',
    title: 'Conclusion: Hypersensitivity Pneumonitis (HP)',
    description: 'HP is an immune-mediated lung disease caused by inhalation of antigens in susceptible individuals.',
    content: (
        <>
            <h4 className="font-semibold text-slate-800 mb-2">Diagnostic Criteria for HP:</h4>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
                <li><strong>Clinical:</strong> Exposure to known antigen (birds, mold, hot tubs, etc.).</li>
                <li><strong>Radiologic:</strong> Centrilobular nodules, ground-glass opacities, mosaic attenuation.</li>
                <li><strong>Histologic:</strong> Poorly formed, non-necrotizing, airway-centric granulomas; cellular bronchiolitis.</li>
                <li><strong>Laboratory:</strong> BAL lymphocytosis (&gt;20-30%), serum-specific IgG antibodies (supportive).</li>
            </ul>
        </>
    ),
    recommendations: 'Hot Tub Lung is a distinct entity caused by exposure to Mycobacterium avium complex in hot tubs, presenting with features of both HP and infection.'
  },
  'other-non-infectious': {
    id: 'other-non-infectious',
    phase: 3,
    isTerminal: true,
    type: 'non-infectious',
    title: 'Conclusion: Other Non-Infectious Causes',
    description: 'Several other non-infectious conditions can cause granulomatous lung disease.',
    content: (
        <ul className="list-disc list-inside space-y-2 text-slate-600">
            <li><strong>Chronic Beryllium Disease (CBD):</strong> Histologically identical to sarcoidosis; requires exposure history and positive BeLPT.</li>
            <li><strong>Drug-Induced Sarcoidosis-like Reactions (DISR):</strong> Caused by checkpoint inhibitors, TNF-α inhibitors, etc.</li>
            <li><strong>Malignancy-Associated Granulomas:</strong> Sarcoid-like reactions can occur with lymphomas and solid tumors.</li>
        </ul>
    ),
    recommendations: 'A detailed medication and occupational history is essential to identify potential drug-induced or exposure-related reactions.'
  },
  'comprehensive-workup': {
      id: 'comprehensive-workup',
      phase: 2,
      isTerminal: true,
      type: 'undetermined',
      title: 'Conclusion: Comprehensive Workup Required',
      description: 'When the cause is unclear, a comprehensive workup for both infectious and non-infectious causes is necessary.',
      content: (
          <ul className="list-disc list-inside space-y-2 text-slate-600">
              <li><strong>Clinical Evaluation:</strong> Detailed history including symptoms, exposures, travel, occupation, medications.</li>
              <li><strong>Radiologic Evaluation:</strong> High-resolution CT to characterize pattern and distribution.</li>
              <li><strong>Laboratory Tests:</strong> ACE level, ANCA, serum-specific IgG for HP, etc.</li>
              <li><strong>Pulmonary Evaluation:</strong> Bronchoscopy with BAL, transbronchial or surgical lung biopsy.</li>
              <li><strong>Histopathology:</strong> H&E with GMS, ZN, and potentially PCR for microorganisms.</li>
          </ul>
      ),
      recommendations: 'Multidisciplinary discussion (MDD) involving pulmonology, radiology, and pathology is essential for complex cases. When diagnosis remains uncertain, close follow-up and re-biopsy may be necessary.'
  }
};

const LoadingSpinner: React.FC<{ text?: string }> = ({ text = "Loading..." }) => (
    <div className="flex items-center justify-center h-full my-4">
        <svg className="animate-spin h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="ml-3 text-slate-600">{text}</span>
    </div>
);

const PhaseIndicator: React.FC<{ currentPhase: number, maxPhase: number }> = ({ currentPhase, maxPhase }) => (
    <div className="flex items-center justify-center space-x-2 sm:space-x-4 my-8">
        {Array.from({ length: maxPhase }).map((_, index) => {
            const phase = index + 1;
            const isActive = phase === currentPhase;
            const isCompleted = phase < currentPhase;
            return (
                <div key={phase} className="flex flex-col items-center text-center">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold border-2 transition-all duration-300
                        ${isCompleted ? 'bg-primary-600 border-primary-600 text-white' : ''}
                        ${isActive ? 'bg-white border-primary-600 text-primary-600' : ''}
                        ${!isActive && !isCompleted ? 'bg-white border-slate-300 text-slate-400' : ''}
                    `}>
                        {isCompleted ? <CheckCircleIcon className="h-5 w-5" /> : phase}
                    </div>
                    <p className={`mt-2 text-xs sm:text-sm font-semibold transition-colors duration-300
                        ${isActive ? 'text-primary-600' : 'text-slate-500'}
                    `}>Phase {phase}</p>
                </div>
            )
        })}
    </div>
);


const DiagnosticPathway: React.FC<{ user: User }> = ({ user }) => {
    const [path, setPath] = useState<NodeId[]>(['root']);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [images, setImages] = useState<Record<string, StoredImage | null>>({});
    const [loadingImages, setLoadingImages] = useState<Record<string, boolean>>({});

    const latestNodeRef = useRef<HTMLDivElement>(null);

    const currentNodeId = path[path.length - 1];
    const currentNode = treeData[currentNodeId];

    useEffect(() => {
        const fetchImageForStep = async (nodeId: NodeId) => {
            if (images[nodeId] === undefined && !loadingImages[nodeId]) {
                setLoadingImages(prev => ({ ...prev, [nodeId]: true }));
                const node = treeData[nodeId];
                const context = `${node.title}: ${node.description}`;
                const image = await findRelevantImage(context);
                setImages(prev => ({ ...prev, [nodeId]: image }));
                setLoadingImages(prev => ({ ...prev, [nodeId]: false }));
            }
        };

        path.forEach(fetchImageForStep);

        if (latestNodeRef.current) {
            latestNodeRef.current.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' });
        }

    }, [path, images, loadingImages]);


    const handleSelectOption = (nodeId: NodeId, option: NodeOption) => {
        setAnswers(prev => ({ ...prev, [nodeId]: option.text }));
        setPath(prev => [...prev, option.target]);

        trackEvent(user.username, Section.DIAGNOSTIC_PATHWAY, nodeId, {
            question: treeData[nodeId].title,
            selectedAnswer: option.text,
            isCorrect: true, // In a branching path, every choice is "correct" for the path taken
            timestamp: Date.now()
        });
    };

    const restartPathway = () => {
        setPath(['root']);
        setAnswers({});
        setImages({});
        setLoadingImages({});
    }

    const nodeTypeStyles: Record<NodeType, { border: string; badgeBg: string; badgeText: string }> = {
        infectious: { border: 'border-red-500', badgeBg: 'bg-red-100', badgeText: 'text-red-800' },
        'non-infectious': { border: 'border-primary-500', badgeBg: 'bg-primary-100', badgeText: 'text-primary-800' },
        undetermined: { border: 'border-amber-500', badgeBg: 'bg-amber-100', badgeText: 'text-amber-800' },
    };

    return (
        <div className="animate-fade-in">
            <SectionHeader
                title="Interactive Diagnostic Algorithm"
                subtitle="Navigate the diagnostic process with this interactive decision tree."
            />
            
            <Card>
                <PhaseIndicator currentPhase={currentNode.phase} maxPhase={4} />

                <div className="flex justify-center mb-6">
                    <button
                        onClick={restartPathway}
                        className="bg-slate-200 text-slate-700 font-semibold py-2 px-5 rounded-lg hover:bg-slate-300 transition-colors flex items-center shadow-sm">
                        <ArrowPathIcon className="h-5 w-5 mr-2" />
                        Start Over
                    </button>
                </div>

                <div className="space-y-6">
                    {path.map((nodeId, index) => {
                        const node = treeData[nodeId];
                        const isLatest = index === path.length - 1;
                        const styles = nodeTypeStyles[node.type];
                        const userAnswer = answers[nodeId];

                        return (
                            <div key={`${nodeId}-${index}`} ref={isLatest ? latestNodeRef : null}>
                                <Card className={`!mb-0 border-l-4 ${styles.border} ${!isLatest ? 'opacity-80 bg-slate-50' : ''}`}>
                                    <span className={`absolute top-4 right-4 text-xs font-bold px-2.5 py-1 rounded-full ${styles.badgeBg} ${styles.badgeText}`}>
                                        Phase {node.phase}
                                    </span>
                                    <h2 className="text-xl font-semibold font-serif text-slate-800 mb-2 pr-20">{node.title}</h2>
                                    <p className="text-slate-600 mb-4">{node.description}</p>
                                    
                                    {loadingImages[nodeId] && <LoadingSpinner text="Finding relevant image..." />}
                                    {images[nodeId] && (
                                        <div className="my-4 space-y-2 animate-fade-in">
                                            <WSIViewer staticImageUrl={images[nodeId]?.src} altText={images[nodeId]?.title} />
                                            <p className="text-center text-sm text-slate-600 font-semibold italic">
                                                AI-selected image from gallery: "{images[nodeId]?.title}"
                                            </p>
                                        </div>
                                    )}

                                    {node.content && <div className="mt-4 text-sm">{node.content}</div>}

                                    {node.options && (
                                        <div className={`mt-4 space-y-3 ${!isLatest ? 'pointer-events-none' : ''}`}>
                                            {node.options.map(option => (
                                                <button
                                                    key={option.text}
                                                    onClick={() => handleSelectOption(node.id, option)}
                                                    disabled={!isLatest}
                                                    className={`w-full text-left p-3 border rounded-lg transition-all duration-200 flex items-center font-medium
                                                        ${userAnswer === option.text
                                                            ? 'bg-primary-600 border-primary-600 text-white shadow-md'
                                                            : 'bg-white border-slate-300 hover:bg-slate-100 hover:border-slate-400'
                                                        }`}
                                                >
                                                   {option.icon && <span className="mr-3">{option.icon}</span>}
                                                   {option.text}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {(userAnswer || node.isTerminal) && (
                                        <div className="mt-6">
                                            <Alert type="info" title="Expert Recommendation">
                                                {node.recommendations}
                                            </Alert>
                                        </div>
                                    )}
                                </Card>
                            </div>
                        );
                    })}
                </div>
            </Card>
        </div>
    );
};

export default DiagnosticPathway;