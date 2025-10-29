import React, { useState, useRef, useEffect } from 'react';
import Card from './ui/Card';
import SectionHeader from './ui/SectionHeader';
import Alert from './ui/Alert';
import { CheckCircleIcon, XCircleIcon, LightbulbIcon, ArrowPathIcon } from './icons';
import { User, Section } from '../types';
import { trackEvent } from '../utils/tracking';

type StepId = 
  | 'q1_sarc_dist' 
  | 'q2_hp_features'
  | 'q3_necrotizing_infections'
  | 'q4_blastomycosis'
  | 'q5_crypto_op'
  | 'q6_ntm_hot_tub'
  | 'q7_gpa_microabscess'
  | 'q8_berylliosis_mimic'
  | 'q9_rheumatoid_nodule'
  | 'q10_pjp_granuloma'
  | 'compendium';

interface Option {
  id: string;
  text: string;
  nextStep: StepId;
  feedback: string;
  isCorrect: boolean;
}

interface Step {
  id: StepId;
  title: string;
  question: string;
  information?: string;
  options?: Option[];
  conclusion?: React.ReactNode;
}

const pathwayData: Record<StepId, Step> = {
  q1_sarc_dist: {
    id: 'q1_sarc_dist',
    title: 'Question 1: Sarcoidosis Distribution',
    question: "The distribution of well-formed, non-necrotizing granulomas in classic pulmonary sarcoidosis is typically described as following the lymphatic routes of the lung parenchyma, a pattern referred to as:",
    options: [
      { id: 'a', text: 'Bronchiolocentric', nextStep: 'q2_hp_features', isCorrect: false, feedback: 'Incorrect. A bronchiolocentric pattern is centered on small airways and is a key feature of Hypersensitivity Pneumonitis, not Sarcoidosis.' },
      { id: 'b', text: 'Air-space centered', nextStep: 'q2_hp_features', isCorrect: false, feedback: 'Incorrect. An "air-space centered" distribution describes pathology filling the alveolar air spaces, like in bronchopneumonia. Sarcoidosis is an interstitial disease.' },
      { id: 'c', text: 'Lymphangitic', nextStep: 'q2_hp_features', isCorrect: true, feedback: `Correct. Sarcoidosis is a disease where the granulomas are confined to the interstitium. The granulomas follow the lymphatic routes along the visceral pleura, interlobular septa, and bronchovascular bundles, which is defined as a "lymphangitic distribution".` },
      { id: 'd', text: 'Panacinar', nextStep: 'q2_hp_features', isCorrect: false, feedback: 'Incorrect. Panacinar describes a pattern of emphysema affecting the entire acinus, not a distribution pattern for granulomas.' },
    ],
  },
  q2_hp_features: {
      id: 'q2_hp_features',
      title: 'Question 2: Hypersensitivity Pneumonitis Features',
      question: 'Histologic confirmation of classic, chronic hypersensitivity pneumonia (HP) relies on identifying which combination of features?',
      options: [
          {id: 'a', text: 'Well-formed, tightly clustered, non-necrotizing granulomas in a lymphangitic distribution.', nextStep: 'q3_necrotizing_infections', isCorrect: false, feedback: 'Incorrect. This describes the classic findings of Sarcoidosis.'},
          {id: 'b', text: 'Necrotizing granulomas with central bland necrosis and scarce organisms.', nextStep: 'q3_necrotizing_infections', isCorrect: false, feedback: 'Incorrect. This pattern is characteristic of infectious granulomas, like Tuberculosis or Histoplasmosis.'},
          {id: 'c', text: 'Loose, poorly formed non-necrotizing granulomas centered on the peribronchiolar interstitium.', nextStep: 'q3_necrotizing_infections', isCorrect: true, feedback: 'Correct. HP is characterized by a lymphocyte-rich interstitial infiltrate in a distinctly bronchiolocentric fashion, with associated loosely formed granulomas.'},
          {id: 'd', text: 'Granulomas predominantly situated within the lumens of distal airways.', nextStep: 'q3_necrotizing_infections', isCorrect: false, feedback: 'Incorrect. This unusual air-space centered granuloma location is a key feature of the MAC infection variant known as "hot-tub lung".'},
      ]
  },
  q3_necrotizing_infections: {
      id: 'q3_necrotizing_infections',
      title: 'Question 3: Necrotizing Granulomas',
      question: 'Necrotizing granulomatous inflammation involving central bland (caseating) necrosis is characteristic of which major group of infectious diseases?',
      options: [
          {id: 'a', text: 'Tuberculosis and Endemic Fungal Infections (e.g., Histoplasmosis).', nextStep: 'q4_blastomycosis', isCorrect: true, feedback: 'Correct. Tuberculosis is the classic example of caseating necrosis. Many endemic fungi, like Histoplasmosis, also produce necrotizing granulomas with central bland necrosis.'},
          {id: 'b', text: 'Classic Granulomatosis with Polyangiitis (GPA).', nextStep: 'q4_blastomycosis', isCorrect: false, feedback: 'Incorrect. The necrosis in GPA is typically "dirty" or suppurative, with neutrophilic debris, not bland.'},
          {id: 'c', text: 'MAC infection (hot-tub lung variant).', nextStep: 'q4_blastomycosis', isCorrect: false, feedback: 'Incorrect. Hot-tub lung typically features non-necrotizing granulomas within the airways.'},
          {id: 'd', text: 'Foreign body reaction (Aspiration pneumonia).', nextStep: 'q4_blastomycosis', isCorrect: false, feedback: 'Incorrect. Aspiration can cause granulomas, but caseating necrosis is not a feature.'},
      ]
  },
    q4_blastomycosis: {
    id: 'q4_blastomycosis',
    title: 'Question 4: Suppurative Granulomas',
    question: 'A lung biopsy reveals necrotizing granulomatous inflammation with a prominent component of necrotic neutrophils (suppuration). Which endemic fungal organism is classically associated with this histological pattern?',
    options: [
      { id: 'a', text: 'Histoplasma capsulatum', nextStep: 'q5_crypto_op', isCorrect: false, feedback: 'Incorrect. Histoplasmosis typically causes bland, caseous-type necrosis, not suppurative inflammation.' },
      { id: 'b', text: 'Blastomyces dermatitidis', nextStep: 'q5_crypto_op', isCorrect: true, feedback: 'Correct. Blastomycosis is frequently characterized by suppurative granulomatous inflammation, where the central necrosis is rich in neutrophils.' },
      { id: 'c', text: 'Coccidioides immitis', nextStep: 'q5_crypto_op', isCorrect: false, feedback: 'Incorrect. Coccidioidomycosis causes necrotizing granulomas, but prominent suppuration is the classic feature of Blastomycosis.' },
      { id: 'd', text: 'Cryptococcus neoformans', nextStep: 'q5_crypto_op', isCorrect: false, feedback: 'Incorrect. Cryptococcus typically forms poorly-formed granulomas and is not associated with a prominent suppurative response.' },
    ],
  },
  q5_crypto_op: {
    id: 'q5_crypto_op',
    title: 'Question 5: Cryptococcus & Organizing Pneumonia',
    question: 'A common manifestation of pulmonary cryptococcosis is organizing pneumonia (OP). This secondary OP is histologically distinguished from cryptogenic organizing pneumonia (COP) by the presence of:',
    options: [
      { id: 'a', text: 'Prominent foamy macrophages.', nextStep: 'q6_ntm_hot_tub', isCorrect: false, feedback: 'Incorrect. Foamy macrophages are more characteristic of Pneumocystis Pneumonia.' },
      { id: 'b', text: 'Diffuse alveolar damage (DAD).', nextStep: 'q6_ntm_hot_tub', isCorrect: false, feedback: 'Incorrect. DAD is a pattern of acute lung injury, not typically seen with OP.' },
      { id: 'c', text: 'Fibrin thrombi in small arteries.', nextStep: 'q6_ntm_hot_tub', isCorrect: false, feedback: 'Incorrect. This would suggest a vasculitic or thrombotic process.' },
      { id: 'd', text: 'Associated granulomatous inflammation including loose clusters of epithelioid cells and giant cells.', nextStep: 'q6_ntm_hot_tub', isCorrect: true, feedback: 'Correct. Organizing pneumonia caused by Cryptococcus is distinguished by the presence of associated granulomatous inflammation. The yeast forms can often be found within the inflammatory infiltrate.' },
    ],
  },
  q6_ntm_hot_tub: {
    id: 'q6_ntm_hot_tub',
    title: 'Question 6: NTM "Hot-Tub Lung"',
    question: 'The MAC infection variant known as "hot-tub lung" is notable because the non-necrotizing and focally necrotizing granulomas are situated predominantly within which location?',
    options: [
        {id: 'a', text: 'Bronchial wall interstitium (like middle lobe syndrome).', nextStep: 'q7_gpa_microabscess', isCorrect: false, feedback: 'Incorrect. This describes a different pattern of NTM infection.'},
        {id: 'b', text: 'Visceral pleura (lymphangitic pattern).', nextStep: 'q7_gpa_microabscess', isCorrect: false, feedback: 'Incorrect. This is the pattern for Sarcoidosis.'},
        {id: 'c', text: 'Lumens of distal airways.', nextStep: 'q7_gpa_microabscess', isCorrect: true, feedback: 'Correct. In "hot-tub lung", the granulomas are uniquely situated within the lumens of distal airways, an unusual air-space centered location distinct from the interstitial location seen in Sarcoidosis or classic HP.'},
        {id: 'd', text: 'Alveolar septa (interstitial pneumonia).', nextStep: 'q7_gpa_microabscess', isCorrect: false, feedback: 'Incorrect. While there is interstitial inflammation, the defining feature is the intraluminal location of the granulomas.'},
    ]
  },
  q7_gpa_microabscess: {
      id: 'q7_gpa_microabscess',
      title: 'Question 7: Granulomatosis with Polyangiitis (GPA)',
      question: 'Which microscopic feature, characterized by a small focus of necrotic neutrophils surrounded by epithelioid histiocytes and giant cells, is considered an extremely helpful finding in the histologic diagnosis of classic GPA?',
      options: [
          {id: 'a', text: 'Central coagulative necrosis surrounded by palisading histiocytes.', nextStep: 'q8_berylliosis_mimic', isCorrect: false, feedback: 'Incorrect. This describes a Rheumatoid Nodule.'},
          {id: 'b', text: 'Geographic zones of bland necrosis.', nextStep: 'q8_berylliosis_mimic', isCorrect: false, feedback: 'Incorrect. This is more typical for infectious granulomas like TB or Fungi.'},
          {id: 'c', text: 'Granulomatous microabscess.', nextStep: 'q8_berylliosis_mimic', isCorrect: true, feedback: 'Correct. The granulomatous microabscess is a highly characteristic, though not always present, finding in GPA that helps distinguish it from other necrotizing granulomatous diseases.'},
          {id: 'd', text: 'Lymphoid aggregates with germinal centers.', nextStep: 'q8_berylliosis_mimic', isCorrect: false, feedback: 'Incorrect. This is a non-specific finding of chronic inflammation.'},
      ]
  },
    q8_berylliosis_mimic: {
    id: 'q8_berylliosis_mimic',
    title: 'Question 8: Berylliosis Mimicry',
    question: 'Chronic beryllium exposure can lead to pulmonary interstitial fibrosis and non-necrotizing granulomas. Histologically, this pneumoconiosis is indistinguishable from which noninfectious diffuse granulomatous lung disease?',
    options: [
      { id: 'a', text: 'Hypersensitivity Pneumonitis', nextStep: 'q9_rheumatoid_nodule', isCorrect: false, feedback: 'Incorrect. HP granulomas are typically loose and poorly-formed, unlike the well-formed granulomas of Berylliosis.' },
      { id: 'b', text: 'Hard Metal Pneumoconiosis', nextStep: 'q9_rheumatoid_nodule', isCorrect: false, feedback: 'Incorrect. Hard metal disease (giant cell interstitial pneumonia) has a different histologic appearance.' },
      { id: 'c', text: 'Pulmonary Sarcoidosis', nextStep: 'q9_rheumatoid_nodule', isCorrect: true, feedback: 'Correct. Chronic Berylliosis causes well-formed, non-necrotizing granulomas that are histologically identical to those of Sarcoidosis. The distinction depends on clinical history of exposure and specialized testing.' },
      { id: 'd', text: 'Silicosis', nextStep: 'q9_rheumatoid_nodule', isCorrect: false, feedback: 'Incorrect. Silicotic nodules have a characteristic whorled, hyalinized collagen appearance.' },
    ],
  },
  q9_rheumatoid_nodule: {
    id: 'q9_rheumatoid_nodule',
    title: 'Question 9: Rheumatoid Nodule',
    question: 'In lung pathology, the irregularly shaped granuloma known as the Rheumatoid Nodule is defined by a large geographic area of central coagulative necrosis surrounded by a peripheral layer of:',
    options: [
      { id: 'a', text: 'Prominent plasma cells.', nextStep: 'q10_pjp_granuloma', isCorrect: false, feedback: 'Incorrect. While plasma cells may be in the surrounding inflammation, they do not define the border of the necrosis.' },
      { id: 'b', text: 'Polymorphic lymphocytes.', nextStep: 'q10_pjp_granuloma', isCorrect: false, feedback: 'Incorrect. This is non-specific.' },
      { id: 'c', text: 'Palisading histiocytes.', nextStep: 'q10_pjp_granuloma', isCorrect: true, feedback: 'Correct. The Rheumatoid Nodule is characterized by central coagulative necrosis surrounded by a distinctive fence-like arrangement of elongated histiocytes, known as palisading.' },
      { id: 'd', text: 'Eosinophil-rich infiltrate.', nextStep: 'q10_pjp_granuloma', isCorrect: false, feedback: 'Incorrect. A prominent eosinophilic infiltrate would suggest a different diagnosis, such as EGPA.' },
    ],
  },
  q10_pjp_granuloma: {
    id: 'q10_pjp_granuloma',
    title: 'Question 10: Pneumocystis Pneumonia (PJP) Granulomas',
    question: 'While typically presenting with frothy intra-alveolar exudate, Pneumocystis pneumonia may rarely present with granulomatous inflammation. When granulomas are present in PJP, their characteristic location is:',
    options: [
      { id: 'a', text: 'Confined to the interlobular septa.', nextStep: 'compendium', isCorrect: false, feedback: 'Incorrect. This describes a lymphangitic pattern.' },
      { id: 'b', text: 'Centered around the vessel walls (vasculitis).', nextStep: 'compendium', isCorrect: false, feedback: 'Incorrect. This would suggest a primary vasculitis.' },
      { id: 'c', text: 'In the peribronchiolar interstitium.', nextStep: 'compendium', isCorrect: false, feedback: 'Incorrect. This is the location for HP.' },
      { id: 'd', text: 'Within the air space.', nextStep: 'compendium', isCorrect: true, feedback: 'Correct. Granulomatous inflammation in PJP, when it occurs, involves poorly formed granulomas located within the air space, accompanying the characteristic frothy exudates.' },
    ],
  },
  compendium: {
      id: 'compendium',
      title: 'Diagnostic Compendium: Granulomatous Diseases',
      question: '',
      conclusion: 'You have completed the diagnostic pathway. Below is a comprehensive summary table of key granulomatous diseases for your reference. This table integrates clinical, radiologic, and histopathologic features to aid in differential diagnosis.'
  }
};

const compendiumTableData = {
    headers: ['Disease Entity', 'Clinical/Radiology (HRCT)', 'Histopathology (Granuloma Characteristics)', 'Distribution Pattern', 'Serology/Special Tests', 'Differential Diagnosis Key Features'],
    rows: [
        ['Sarcoidosis', 'Young/middle-aged adults. Exquisitely lymphangitic distribution (nodular/linear bands).', 'Well-formed, tightly clustered, non-necrotizing granulomas. Often dense collagen fibrosis. Non-necrotizing granulomatous vasculitis common.', 'Lymphangitic: Interstitium (septa, bronchovascular bundles, pleura).', 'Nonspecific inclusions (Schaumann bodies). Diagnosis of exclusion.', 'Must exclude granulomatous infections. Berylliosis is histologically indistinguishable.'],
        ['Hypersensitivity Pneumonia (HP)', 'Reaction to inhaled antigens. Ground-glass opacities, centrilobular nodules (early); honeycomb (late).', 'Loosely formed granulomas. Associated chronic bronchiolitis and lymphoplasmacytic infiltrate.', 'Bronchiolocentric: Centered on the peribronchiolar interstitium.', 'Identification of causative antigen is key.', 'Fibrotic HP can mimic UIP. Classic HP differs from "hot-tub lung" (MAC).'],
        ['Tuberculosis (TB)', 'Reactivation disease. Solitary nodule or miliary lesions.', 'Necrotizing (caseating) granuloma with central bland necrosis. Organisms are scarce.', 'N/A', 'Acid-fast stain shows scarce organisms. Culture or molecular required.', 'Histology shared with NTM; molecular testing required. Exclude endemic fungi.'],
        ['NTM / MAC Infections', 'Resembles TB. May involve localized bronchiectasis or hot-tub lung syndrome.', 'Varies: Necrotizing granulomas (like TB); Loose, non-necrotizing (airway wall); Non-necrotizing in distal airway lumens (Hot-tub lung).', 'N/A', 'Culture and molecular techniques.', 'Hot-tub lung variant has unique luminal granuloma location.'],
        ['Histoplasmosis', 'Endemic in Mississippi/Ohio River valleys. Persistent lung nodule.', 'Necrotizing granulomatous inflammation; central necrosis may be concentric/calcified. Acute form may resemble GPA.', 'N/A', 'GMS stain reveals small, uniform, oval-shaped yeasts.', 'Acute form may mimic Lymphomatoid Granulomatosis or GPA.'],
        ['Blastomycosis', 'Endemic in south/central US.', 'Necrotizing and non-necrotizing granulomas. Characteristically suppurative granulomatous inflammation.', 'N/A', 'Large, rounded yeasts with thick, doubly refractile cell walls and broad-based budding.', 'Distinguished from Cryptococcus (smaller) and Coccidioides.'],
        ['Cryptococcosis', 'Worldwide distribution. Isolated lung nodules.', 'Poorly formed, loose non-necrotizing and often coexisting necrotizing granulomas. Yeast in giant cells.', 'N/A', 'Yeast has clear halo (capsule). Mucicarmine stain is positive.', 'May present as secondary organizing pneumonia.'],
        ['Coccidioidomycosis', 'Endemic in southwestern US. Localized lung nodules. Tissue eosinophilia common.', 'Necrotizing granulomatous inflammation is most common.', 'N/A', 'Key feature: Large spherules containing multiple small endospores.', 'N/A'],
        ['GPA (Classic Type)', 'Systemic vasculitis (upper respiratory, lung, kidney).', 'Necrotizing granulomatous inflammation (geographic dirty necrosis). Granulomatous microabscesses. Necrotizing vasculitis.', 'N/A', 'C-ANCA/PR3 positive (highly specific).', 'Histology may overlap with necrotizing infections. Requires clinical context.'],
        ['EGPA', 'Occurs in patients with asthma and blood eosinophilia.', 'Necrotizing granulomatous inflammation, eosinophilic pneumonia, and necrotizing vasculitis. Eosinophil-rich.', 'N/A', 'P-ANCA/MPO positive in a minority.', 'Distinguished from GPA by overwhelming eosinophilia.'],
        ['Rheumatoid Nodule', 'Associated with Rheumatoid Arthritis.', 'Irregularly shaped granuloma with large central coagulative necrosis. Surrounded by peripheral palisading histiocytes.', 'N/A', 'Diagnosis hinges on underlying CTD.', 'Distinguish from infections (no organisms) and vasculitides.'],
        ['Berylliosis', 'Requires history of beryllium exposure.', 'Interstitial fibrosis with non-necrotizing granulomas. May contain Schaumann bodies.', 'N/A', 'Beryllium Lymphocyte Proliferation Test.', 'Histologically indistinguishable from sarcoidosis.'],
        ['Langerhans Cell Histiocytosis (LCH)', 'Almost exclusively in smokers. Cysts and nodules, upper lobe predominant.', 'Bronchiolocentric nodules of Langerhans cells, eosinophils, and macrophages; vaguely granulomatous.', 'Bronchiolocentric', 'CD1a+, S-100+. Birbeck granules on EM.', 'N/A'],
        ['Aspiration Pneumonia', 'Chronic presentation may mimic infection or tumor.', 'Chronic/necrotizing granulomatous inflammation (foreign body reaction) surrounding aspirated material.', 'Bronchiolocentric', 'Identification of foreign material (e.g., vegetable matter).', 'Must find foreign material to distinguish from infection.']
    ]
};

interface DiagnosticPathwayProps {
  user: User;
}

const DiagnosticPathway: React.FC<DiagnosticPathwayProps> = ({ user }) => {
  const [currentStepId, setCurrentStepId] = useState<StepId>('q1_sarc_dist');
  const [history, setHistory] = useState<({step: Step, answerId: string})[]>([]);
  const activeCardRef = useRef<HTMLDivElement>(null);

  const currentStep = pathwayData[currentStepId];

  useEffect(() => {
    if (activeCardRef.current) {
        activeCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [currentStepId]);

  const handleSelectOption = (option: Option) => {
    setHistory([...history, {step: currentStep, answerId: option.id}]);
    
    // Tracking
    trackEvent(
        user.username,
        Section.DIAGNOSTIC_PATHWAY,
        currentStep.id,
        {
            question: currentStep.question,
            selectedAnswer: option.text,
            isCorrect: option.isCorrect,
            timestamp: Date.now()
        }
    );
    
    setCurrentStepId(option.nextStep);
  };

  const restartPathway = () => {
    setCurrentStepId('q1_sarc_dist');
    setHistory([]);
  }

  const renderOption = (option: Option, step: Step, isHistory: boolean) => {
      const isSelected = history.find(h => h.step.id === step.id)?.answerId === option.id;

      let optionClass = 'bg-white border-slate-300 hover:bg-slate-50 hover:border-slate-400';
      if (isHistory) {
          if(isSelected) {
            optionClass = option.isCorrect ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500';
          } else {
            optionClass = 'bg-slate-50 border-slate-300 text-slate-500 cursor-default';
          }
      }

      return (
          <div key={option.id}>
              <button
                  disabled={isHistory}
                  onClick={() => handleSelectOption(option)}
                  className={`w-full text-left p-4 border rounded-lg transition-all duration-200 flex items-center justify-between ${optionClass} ${!isHistory ? 'cursor-pointer' : 'cursor-default'}`}
              >
                  <span className="flex-1">{option.text}</span>
                  {isHistory && isSelected && option.isCorrect && <CheckCircleIcon className="h-6 w-6 text-green-600" />}
                  {isHistory && isSelected && !option.isCorrect && <XCircleIcon className="h-6 w-6 text-red-600" />}
              </button>
               {isHistory && isSelected && (
                <div className="mt-3">
                  <Alert type={option.isCorrect ? 'success' : 'error'}>
                      {option.feedback}
                  </Alert>
                </div>
              )}
          </div>
      )
  }

  return (
    <div className="animate-fade-in">
      <SectionHeader 
        title="Comprehensive Diagnostic Pathway"
        subtitle="Simulating a multi-stage diagnostic workflow for granulomatous diseases."
      />
      
      {history.map(({step}, index) => (
           <Card key={index} className="opacity-70 !shadow-md border-slate-200/60 bg-slate-50">
               <h2 className="text-xl font-semibold font-serif text-slate-700 mb-2">{step.title}</h2>
               {step.information && <p className="bg-slate-100 p-3 rounded-lg border border-slate-200 text-slate-600 mb-4">{step.information}</p>}
               <p className="font-semibold text-slate-600 mb-4">{step.question}</p>
               <div className="space-y-3">
                   {step.options?.map(option => renderOption(option, step, true))}
               </div>
           </Card>
      ))}

      <Card ref={activeCardRef}>
        <h2 className="text-2xl font-semibold font-serif text-slate-800 mb-4">{currentStep.title}</h2>
        
        {currentStep.information && (
            <Alert type="info" className="mb-6">
                {currentStep.information}
            </Alert>
        )}
        
        {currentStep.question && <p className="font-semibold text-slate-700 mb-4">{currentStep.question}</p>}
        
        {currentStep.options && (
            <div className="space-y-3">
                {currentStep.options.map(option => renderOption(option, currentStep, false))}
            </div>
        )}

        {currentStep.id === 'compendium' && (
             <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg animate-fade-in">
                 <div className="flex items-center text-lg font-semibold font-serif text-slate-800 mb-3">
                     <LightbulbIcon className="h-6 w-6 text-primary-600 mr-3" />
                     <h3>{currentStep.conclusion}</h3>
                 </div>
                 <div className="overflow-x-auto mt-4">
                  <table className="w-full text-xs text-left text-slate-600 border-collapse">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                      <tr>
                        {compendiumTableData.headers.map(header => (
                          <th key={header} scope="col" className="px-4 py-3 border border-slate-200 font-semibold">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {compendiumTableData.rows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="even:bg-slate-50 border-b border-slate-200">
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="px-4 py-3 border border-slate-200">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                 </div>
                 <div className="mt-8 text-center">
                    <button 
                        onClick={restartPathway}
                        className="bg-primary-600 text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500 transition-colors flex items-center justify-center mx-auto shadow-sm">
                        <ArrowPathIcon className="h-5 w-5 mr-2" />
                        Restart Pathway
                    </button>
                </div>
             </div>
        )}
      </Card>
    </div>
  );
};

export default DiagnosticPathway;
