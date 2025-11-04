import React, { useState, useEffect } from 'react';
import Card from './ui/Card';
import SectionHeader from './ui/SectionHeader';
import { XCircleIcon, SparklesIcon } from './icons';
import { findRelevantImage } from '../utils/aiImageSelector';
import { StoredImage } from '../types';

const atlasData = [
  {
    category: 'I. Infectious Granulomatous Diseases',
    subcategories: [
      {
        title: 'A. Mycobacterial',
        diseases: [
          {
            name: 'Mycobacterium tuberculosis',
            features: <><strong>Features:</strong> Caseating granulomas (amorphous, eosinophilic, necrotic centers), composed of epithelioid histiocytes and Langhans-type giant cells, surrounded by a cuff of lymphocytes.</>,
            links: [{ url: 'https://www.pathologyatlas.ro/tuberculous-lymphadenitis-granuloma.php', text: 'Tuberculous Granuloma - Atlas of Pathology' }],
            imageUrl: 'https://www.pathpedia.com/education/eatlas/histopathology/lymph_nodes/tuberculous_lymphadenitis/tuberculous-lymphadenitis-1.jpeg?Width=800'
          },
          {
            name: 'Nontuberculous Mycobacteria (NTM), e.g., M. avium complex (MAC)',
            features: <><strong>Features:</strong> In immunocompromised patients, often <em>poorly formed</em> granulomas or just collections of foamy macrophages (histiocytes) packed with organisms, which stain with AFB. "Hot tub lung" is a form of HP.</>,
            links: [{ url: 'https://www.elsevier.es/es-revista-clinics-22-articulo-incidence-mycobacteria-in-pulmonary-granulomatous-S1807593224002412', text: 'Incidence of mycobacteria in pulmonary granulomatous lesions' }],
            imageUrl: 'https://www.researchgate.net/profile/Won-Jung-Koh/publication/320504743/figure/fig1/AS:614324225019914@1523477717582/Histopathologic-findings-of-pulmonary-disease-due-to-Mycobacterium-avium-complex-in-a.png'
          }
        ]
      },
      {
        title: 'B. Fungal',
        diseases: [
          { name: 'Histoplasma capsulatum', features: <><strong>Features:</strong> Small, oval yeasts (2-5 &mu;m) found <em>within</em> the cytoplasm of macrophages. Best seen on GMS or PAS stains. Can be associated with caseating granulomas.</>, links: [{ url: 'https://journals.asm.org/doi/10.1128/msphere.00742-20', text: 'Histoplasma Species Elicit Distinct Patterns of Pulmonary Inflammation' }], imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/87/Histoplasmosis_-_interstitial_-_very_high_mag.jpg' },
          { name: 'Blastomyces dermatitidis', features: <><strong>Features:</strong> Large (8-15 &mu;m), round-to-oval yeasts with thick, "double-contoured" walls and characteristic <strong>broad-based budding</strong>.</>, links: [{ url: 'https://www.ncbi.nlm.nih.gov/books/NBK441987/', text: 'Blastomycosis - StatPearls (NCBI)' }], imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Blastomycosis_PASD.jpg/1024px-Blastomycosis_PASD.jpg' },
          { name: 'Coccidioides immitis/posadasii', features: <><strong>Features:</strong> Very large (30-100 &mu;m), thick-walled <strong>spherules</strong> which contain smaller <strong>endospores</strong>. Ruptured spherules elicit a mixed inflammatory (neutrophilic and granulomatous) response.</>, links: [{ url: 'https://meridian.allenpress.com/aplm/article/130/1/97/459659/Unusual-Forms-of-Immature-Sporulating-Coccidioides', text: 'Unusual Forms of Immature Sporulating Coccidioides' }], imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Coccidioidomycosis_spherule.jpg/1024px-Coccidioidomycosis_spherule.jpg' },
          { name: 'Cryptococcus neoformans/gattii', features: <><strong>Features:</strong> Yeasts of variable size (5-15 &mu;m) with prominent polysaccharide capsules that are clear ("halo") on H&E and stain brightly with <strong>Mucicarmine</strong>. Often causes a "soap bubble" or gelatinous tissue reaction with minimal inflammation in immunocompromised hosts.</>, links: [{ url: 'https://commons.wikimedia.org/wiki/File:Cryptococcosis_of_lung_in_patient_with_AIDS._Mucicarmine_stain_962_lores.jpg', text: 'Cryptococcosis of lung - Mucicarmine stain (Wikimedia Commons)' }], imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8b/Cryptococcosis_of_lung_in_patient_with_AIDS._Mucicarmine_stain_962_lores.jpg' },
          { name: 'Aspergillus spp.', features: <><strong>Features:</strong> In Allergic Bronchopulmonary Aspergillosis (ABPA), features include mucoid impaction of bronchi, abundant eosinophils, Charcot-Leyden crystals, and fungal hyphae (thin, septate, acute-angle branching).</>, links: [{ url: 'https://www.imrpress.com/journal/FBL/8/5/10.2741/945', text: 'Pathology of allergic bronchopulmonary aspergillosis' }], imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Aspergillus_GMS.jpg/1024px-Aspergillus_GMS.jpg' },
          { name: 'Pneumocystis jirovecii', features: <><strong>Features:</strong> Classically a foamy, eosinophilic ("cotton candy") intra-alveolar exudate. The granulomatous form (rare) shows poorly formed granulomas, often with a "fluffy" eosinophilic necrotic center that reveals the organisms on GMS stain.</>, links: [{ url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4951449/', text: 'Unmasking Granulomatous Pneumocystis jirovecii Pneumonia' }], imageUrl: 'https://www.researchgate.net/profile/Aurelie-Guinard/publication/305380582/figure/fig1/AS:385803207868417@1468994065221/Histological-findings-of-granulomatous-Pneumocystis-jirovecii-pneumonia-A-Low-power.png' }
        ]
      },
      {
        title: 'C. Bacterial (Non-mycobacterial)',
        diseases: [
            { name: 'Coxiella burnetii (Q Fever)', features: <><strong>Features:</strong> The classic (though not pathognomonic) finding is a <strong>"doughnut" granuloma</strong> or fibrin-ring granuloma: a central lipid vacuole surrounded by a ring of fibrin, epithelioid histiocytes, and other inflammatory cells.</>, links: [{ url: 'https://www.researchgate.net/publication/231178178_Q_fever_Bone_marrow_characteristic_granuloma', text: 'Q fever: Bone marrow characteristic granuloma (ResearchGate)' }], imageUrl: 'https://www.researchgate.net/publication/285324529/figure/fig1/AS:668636730249226@1536426966817/Fibrin-ring-granuloma-doughnut-lesion-in-the-bone-marrow-of-a-patient-with-Q-fever.png' },
            { name: 'Nocardia spp.', features: <><strong>Features:</strong> <strong>Suppurative granulomas</strong>, which are essentially abscesses (collections of neutrophils) surrounded by granulomatous inflammation. The organism is a filamentous, branching, weakly gram-positive rod, best seen on a <strong>Modified Acid-Fast</strong> stain.</>, links: [{ url: 'https://sesc.cat/en/granulomatous-suppurative-pneumonia-due-to-nocardia-in-a-calf/', text: 'Granulomatous-suppurative pneumonia due to Nocardia' }], imageUrl: 'https://sesc.cat/wp-content/uploads/2014/12/SESC-091-14-3.jpg' }
        ]
      },
      {
          title: 'D. Parasitic',
          diseases: [
              { name: 'Dirofilaria immitis', features: <><strong>Features:</strong> A large, round, necrotic granuloma ("coin lesion") with a central, often degenerated, nematode. The organism's internal structures (e.g., thick cuticle) can sometimes be identified.</>, links: [{ url: 'https://www.researchgate.net/figure/Histopathological-findings-of-the-pulmonary-nodule-Dirofilaria-immitis-is-present-in-the_fig4_299072502', text: 'Histopathological findings of the pulmonary nodule (ResearchGate)' }], imageUrl: 'https://www.researchgate.net/publication/299072502/figure/fig4/AS:340989013540869@1458309531853/Histopathological-findings-of-the-pulmonary-nodule-Dirofilaria-immitis-is-present-in-the.png' }
          ]
      }
    ]
  },
  {
    category: 'II. Non-Infectious Granulomatous Diseases',
    subcategories: [
      {
        title: 'A. Systemic / Idiopathic',
        diseases: [
          { name: 'Sarcoidosis', features: <><strong>Features:</strong> The classic non-caseating granuloma. They are well-formed, discrete, and <strong>"naked"</strong> (i.e., with very little surrounding lymphocytic inflammation). Asteroid bodies and Schaumann bodies can be seen but are not specific.</>, links: [{ url: 'https://dermnetnz.org/topics/sarcoidosis-pathology', text: 'Sarcoidosis pathology - DermNet' }], imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Sarcoid_lung_interstitium.jpg/1024px-Sarcoid_lung_interstitium.jpg' },
          { name: "Crohn's Disease", features: <><strong>Features:</strong> Rare in the lung, but histologically mimics sarcoidosis. Features non-caseating granulomas that may be airway-centered or random. Diagnosis requires a strong clinical history of GI Crohn's disease.</>, links: [{ url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8261598/', text: "Crohn's disease with pulmonary granuloma in a child (PMC)" }], imageUrl: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8261598/bin/CRJ-2021-5573489-g002.jpg' }
        ]
      },
      {
        title: 'B. Inhalational / Hypersensitivity',
        diseases: [
          { name: 'Hypersensitivity Pneumonitis (HP)', features: <><strong>Features:</strong> The classic triad is 1) cellular bronchiolitis, 2) chronic interstitial inflammation (lymphoplasmacytic), and 3) <strong>poorly formed, non-necrotizing granulomas</strong> and/or isolated multinucleated giant cells, often located <em>peribronchiolarly</em>.</>, links: [{ url: 'https://meridian.allenpress.com/aplm/article/132/2/199/460400/Hypersensitivity-Pneumonitis-Histopathology', text: 'Hypersensitivity Pneumonitis: Histopathology - Archives of Pathology' }], imageUrl: 'http://www.webpathology.com/slides-100/slide-2-hp-med.jpg' },
          { name: 'Berylliosis (Chronic Beryllium Disease)', features: <><strong>Features:</strong> Histologically <em>indistinguishable</em> from sarcoidosis. Shows well-formed, non-caseating granulomas. The distinction is clinical (history of exposure) and immunological (positive BeLPT).</>, links: [{ url: 'https://www.frontiersin.org/journals/immunology/articles/10.3389/fimmu.2020.00474/full', text: 'Adaptive Immunity in Pulmonary Sarcoidosis and Chronic Beryllium Disease' }], imageUrl: 'https://www.cdc.gov/niosh/topics/beryllium/images/histo.jpg' },
          { name: 'Silicosis', features: <><strong>Features:</strong> Features classic <strong>silicotic nodules</strong>, which are dense, whorled, hyalinized (collagenous) nodules. Under <strong>polarized light</strong>, they contain numerous, small, brightly birefringent silica crystals.</>, links: [{ url: 'https://webpath.med.utah.edu/LUNGHTML/LUNG086.html', text: 'Lung, silicosis, polarized light microscopic - WebPath' }, { url: 'https://www.youtube.com/watch?v=PUqOTkKWZR4', text: 'Video: Silicosis Histopathology Overview (YouTube)' }], imageUrl: 'https://webpath.med.utah.edu/jpeg5/LUNG086.jpeg' },
          { name: 'Talc Granulomatosis (IV drug use)', features: <><strong>Features:</strong> Features foreign-body giant cells containing plate-like, brightly birefringent <strong>talc crystals</strong> under <strong>polarized light</strong>. The granulomas are characteristically perivascular or intravascular.</>, links: [{ url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC1860321/', text: 'Talc induced pulmonary granulomatosis - (PMC)' }], imageUrl: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC1860321/bin/1746-1596-1-11-1-c.jpg' }
        ]
      },
      {
        title: 'C. ANCA-Associated Vasculitides',
        diseases: [
          { name: 'Granulomatosis with Polyangiitis (GPA)', features: <><strong>Features:</strong> A triad of vasculitis, (often neutrophilic), <strong>"geographic" necrosis</strong> (large, map-like, basophilic necrosis), and granulomatous inflammation with palisading histiocytes and giant cells.</>, links: [{ url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11138764/', text: 'Pulmonary pathology in vasculitis - (PMC)' }], imageUrl: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11138764/bin/yjbm_77_2_79_F3.jpg' },
          { name: 'Eosinophilic Granulomatosis with Polyangiitis (EGPA)', features: <><strong>Features:</strong> Necrotizing, <strong>eosinophil-rich</strong> granulomas (granulomas with central eosinophilic necrosis surrounded by histiocytes) and an eosinophilic vasculitis.</>, links: [{ url: 'https://www.ncbi.nlm.nih.gov/books/NBK537099/', text: 'Eosinophilic Granulomatosis With Polyangiitis - (NCBI)' }], imageUrl: 'https://www.pathpresenter.net/casereportsv4/fetch/3b74e64f0b2f153a8174780598710329.jpg?type=1&content_type=1' }
        ]
      },
      {
        title: 'D. Drug-Induced',
        diseases: [
          { name: 'Checkpoint Inhibitors', features: <><strong>Features:</strong> Can induce a <strong>sarcoid-like reaction</strong> with well-formed, non-caseating granulomas, histologically identical to sarcoidosis.</>, links: [{ url: 'https://www.actasdermo.org/es-translated-article-sarcoid-like-reactions-immune-articulo-S0001731023008645', text: 'Sarcoid-like Reactions to Immune Checkpoint Inhibitors' }], imageUrl: 'https://www.jto.org/cms/10.1016/j.jtho.2016.11.2223/attachment/2a2a7f52-5011-4099-b1fd-e09fa4968453/gr1.jpg' },
          { name: 'Methotrexate', features: <><strong>Features:</strong> Can cause a hypersensitivity-like reaction. Findings can include non-caseating granulomas (similar to HP), organizing pneumonia, and interstitial inflammation with eosinophils.</>, links: [{ url: 'https://publications.ersnet.org/content/erj/15/2/373', text: 'Methotrexate pneumonitis: review of the literature and histopathological findings' }], imageUrl: 'https://erj.ersjournals.com/content/erj/15/2/373/F1.large.jpg' }
        ]
      },
      {
        title: 'E. Lymphoproliferative Disorders',
        diseases: [
          { name: 'Lymphomatoid Granulomatosis (LyG)', features: <><strong>Features:</strong> An <strong>angiocentric</strong> and <strong>angiodestructive</strong> infiltrate of atypical lymphoid cells (EBV+ B-cells) mixed with reactive T-cells. The "granulomatosis" part is a misnomer; it's more of an inflammatory, necrotic process that can mimic granulomas.</>, links: [{ url: 'https://ajronline.org/doi/10.2214/ajr.175.5.1751335', text: 'Lymphomatoid Granulomatosis Radiologic Features and Pathologic Correlations' }], imageUrl: 'https://ars.els-cdn.com/content/image/3-s2.0-B9780323377135000219-f021-006-9780323377135.jpg' },
          { name: 'Granulomatous-Lymphocytic Interstitial Lung Disease (GLILD)', features: <><strong>Features:</strong> A complication of CVID. Features a combination of follicular bronchiolitis (lymphoid follicles with germinal centers along airways) and non-caseating, sarcoid-like granulomas.</>, links: [{ url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4554947/', text: 'Granulomatous and Lymphocytic Interstitial Lung Disease (GLILD) - (PMC)' }], imageUrl: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4554947/bin/f1-0060417.jpg' }
        ]
      }
    ]
  }
];

const ImageModal: React.FC<{ imageUrl: string; imageName: string; onClose: () => void }> = ({ imageUrl, imageName, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-modal-title"
    >
      <div className="relative p-2 bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-auto" onClick={(e) => e.stopPropagation()}>
        <img src={imageUrl} alt={`Histology of ${imageName}`} className="object-contain max-w-full max-h-[85vh] rounded" />
        <h2 id="image-modal-title" className="sr-only">Histology image of {imageName}</h2>
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 bg-white rounded-full p-1 shadow-lg text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
          aria-label="Close image viewer"
        >
          <XCircleIcon className="h-9 w-9" />
        </button>
      </div>
    </div>
  );
};


const JobAid: React.FC = () => {
  const [openCategories, setOpenCategories] = useState<string[]>([atlasData[0].category]);
  const [modalImage, setModalImage] = useState<{url: string, name: string} | null>(null);
  const [aiImages, setAiImages] = useState<Record<string, StoredImage | null>>({});
  const [loadingImage, setLoadingImage] = useState<string | null>(null);


  const toggleCategory = (category: string) => {
    setOpenCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const handleFindImage = async (diseaseName: string, features: React.ReactNode) => {
    setLoadingImage(diseaseName);
    // Convert React node to simple text for the AI prompt
    const contextText = `${diseaseName}: ${JSON.stringify(features)}`;
    const image = await findRelevantImage(contextText);
    setAiImages(prev => ({ ...prev, [diseaseName]: image }));
    setLoadingImage(null);
  };

  return (
    <div className="animate-fade-in">
      <SectionHeader 
        title="Histology Link-Out Atlas"
        subtitle="A curated collection of high-yield examples for differentiating granulomatous diseases."
      />

      <div className="space-y-6">
        {atlasData.map(({ category, subcategories }) => {
          const isOpen = openCategories.includes(category);
          return (
            <div key={category} className="border border-slate-200/80 bg-white rounded-xl shadow-sm">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full text-left p-4 md:p-5 flex justify-between items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg"
                aria-expanded={isOpen}
              >
                <h2 className="text-xl font-semibold font-serif text-slate-800">{category}</h2>
                <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                  <svg className="h-6 w-6 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </span>
              </button>
              {isOpen && (
                <div className="p-4 md:p-5 border-t border-slate-200/80 space-y-8">
                  {subcategories.map(({ title, diseases }) => (
                    <div key={title}>
                      <h3 className="text-lg font-bold text-slate-700 mb-4">{title}</h3>
                      <div className="space-y-4">
                        {diseases.map(disease => {
                          const displayImage = aiImages[disease.name]?.src ?? disease.imageUrl;
                          const imageAlt = aiImages[disease.name]?.title ?? `Histology of ${disease.name}`;
                          const isAiImage = !!aiImages[disease.name];
                          
                          return (
                            <Card key={disease.name} className="!mb-0 !p-5 bg-slate-50/50">
                              <div className="flex flex-col md:flex-row items-start gap-5">
                                  {displayImage && (
                                       <div className="flex-shrink-0 text-center w-32">
                                          <button
                                              onClick={() => setModalImage({url: displayImage, name: disease.name})}
                                              className="group relative w-32 h-32 rounded-md overflow-hidden border-2 border-slate-200 hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200"
                                              aria-label={`View histology image for ${disease.name}`}
                                          >
                                              <img src={displayImage} alt={imageAlt} className="w-full h-full object-cover bg-slate-100" />
                                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 10h.01" />
                                                  </svg>
                                              </div>
                                              {isAiImage && (
                                                <div title="This image was selected by AI from the gallery" className="absolute top-1 right-1 bg-primary-500 p-1 rounded-full text-white shadow">
                                                    <SparklesIcon className="h-3 w-3" />
                                                </div>
                                              )}
                                          </button>
                                          <p className="text-xs text-slate-500 mt-1.5">Click to enlarge</p>
                                      </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold text-md text-primary-800 mb-2">{disease.name}</h4>
                                      <p className="text-sm text-slate-600 leading-relaxed mb-4">{disease.features}</p>
                                      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                                        <div className="flex flex-col sm:flex-row gap-3">
                                          {disease.links.map(link => (
                                              <a
                                              key={link.url}
                                              href={link.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-sm font-medium text-primary-600 bg-primary-100 hover:bg-primary-200 hover:text-primary-700 px-3 py-1.5 rounded-md transition-colors inline-flex items-center"
                                              >
                                              {link.text}
                                              <svg className="w-4 h-4 ml-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-4.5 0V6.375c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125-1.125h-4.5A1.125 1.125 0 0110.5 10.5z" /></svg>
                                              </a>
                                          ))}
                                        </div>
                                        <button 
                                            onClick={() => handleFindImage(disease.name, disease.features)}
                                            disabled={loadingImage === disease.name}
                                            className="text-sm font-medium text-slate-600 bg-slate-200 hover:bg-slate-300 hover:text-slate-700 px-3 py-1.5 rounded-md transition-colors inline-flex items-center disabled:opacity-50"
                                        >
                                            <SparklesIcon className="h-4 w-4 mr-1.5" />
                                            {loadingImage === disease.name ? 'Searching...' : 'Find Image'}
                                        </button>
                                      </div>
                                  </div>
                              </div>
                            </Card>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {modalImage && <ImageModal imageUrl={modalImage.url} imageName={modalImage.name} onClose={() => setModalImage(null)} />}
    </div>
  );
};

export default JobAid;
