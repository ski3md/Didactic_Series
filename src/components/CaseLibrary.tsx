import React, { useState, useEffect } from "react";
import { CaseStudy, User } from "../types.ts";
import Card from "./ui/Card.tsx";
import SectionHeader from "./ui/SectionHeader.tsx";
import { getCaseStudies } from "../utils/caseStore.ts";
import { MicroscopeIcon, ChevronLeftIcon } from "./icons.tsx";
import Alert from "./ui/Alert.tsx";

const CaseDetailsView: React.FC<{ caseStudy: CaseStudy; onBack: () => void }> = ({ caseStudy, onBack }) => (
  <Card>
    <button onClick={onBack} className="flex items-center text-sm font-semibold text-sky-700 hover:text-sky-900 mb-6">
      <ChevronLeftIcon className="h-5 w-5 mr-1" />
      Back to Case Library
    </button>
    <h2 className="text-2xl font-bold font-serif text-slate-900">{caseStudy.title}</h2>
    <div className="flex flex-wrap gap-2 mt-2 mb-6">
      <span className="text-xs bg-sky-100 text-sky-800 font-medium px-2 py-1 rounded-md">{caseStudy.category}</span>
      <span className="text-xs bg-amber-100 text-amber-800 font-medium px-2 py-1 rounded-md">{caseStudy.difficulty}</span>
      <span className="text-xs bg-teal-100 text-teal-800 font-medium px-2 py-1 rounded-md">{caseStudy.caseType}</span>
    </div>

    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-lg text-slate-800 border-b pb-2 mb-2">Clinical Vignette</h3>
        <p className="text-slate-700">{caseStudy.description}</p>
      </div>
      <div>
        <h3 className="font-semibold text-lg text-slate-800 border-b pb-2 mb-2">Images</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {caseStudy.images.map(img => (
            <div key={img.imageId}>
              <img src={img.path} alt={img.caption} className="w-full aspect-square object-cover rounded-lg border" />
              <p className="text-xs text-slate-600 mt-1">{img.caption} ({img.stain})</p>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-lg text-slate-800 border-b pb-2 mb-2">Discussion</h3>
        <p className="text-slate-700 prose prose-sm max-w-none">{caseStudy.discussion}</p>
      </div>
       <div>
        <h3 className="font-semibold text-lg text-slate-800 border-b pb-2 mb-2">Teaching Points</h3>
        <ul className="list-disc list-inside space-y-1 text-slate-700">
          {caseStudy.teachingPoints.map((point, i) => <li key={i}>{point}</li>)}
        </ul>
      </div>
      {caseStudy.mcqs && caseStudy.mcqs.length > 0 && (
         <div>
            <h3 className="font-semibold text-lg text-slate-800 border-b pb-2 mb-2">Knowledge Check</h3>
            {caseStudy.mcqs.map((mcq, i) => (
                <div key={i} className="mt-4 p-4 bg-slate-50 rounded-lg border">
                    <p className="font-medium text-slate-800">{mcq.question}</p>
                    <p className="text-sm text-slate-600 mt-2"><strong>Answer:</strong> {mcq.answer}</p>
                    <p className="text-sm text-slate-600 mt-1"><strong>Rationale:</strong> {mcq.rationale}</p>
                </div>
            ))}
        </div>
      )}
    </div>
  </Card>
);

const CaseLibrary: React.FC<{ user: User | null }> = ({ user }) => {
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] = useState<CaseStudy | null>(null);

  useEffect(() => {
    const fetchCases = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const store = await getCaseStudies();
        const studies = Object.values(store.caseStudies).sort((a,b) => a.caseId.localeCompare(b.caseId));
        setCaseStudies(studies);
      } catch (e: any) {
        setError(`Failed to load case studies: ${e.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCases();
  }, []);

  if (selectedCase) {
      return (
          <div className="animate-fade-in">
              <CaseDetailsView caseStudy={selectedCase} onBack={() => setSelectedCase(null)} />
          </div>
      )
  }

  return (
    <div className="animate-fade-in">
      <SectionHeader title="Case Study Library" subtitle="Browse AI-generated cases." icon={<MicroscopeIcon className="h-8 w-8" />} />
      
      {isLoading ? (
        <p className="text-center text-slate-600">Loading case library...</p>
      ) : error ? (
        <Alert type="error">{error}</Alert>
      ) : caseStudies.length === 0 ? (
        <Alert type="info" title="No Cases Found">
          The case library is empty. Please ask an administrator to run the AI-Powered Case Authoring tool in the Admin View to generate cases based on the image gallery.
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {caseStudies.map(cs => (
                <Card key={cs.caseId} interactive onClick={() => setSelectedCase(cs)} className="!mb-0 flex flex-col">
                    <h3 className="text-lg font-semibold font-serif text-slate-900">{cs.title}</h3>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="text-xs bg-sky-100 text-sky-800 font-medium px-2 py-0.5 rounded-md">{cs.category}</span>
                        <span className="text-xs bg-amber-100 text-amber-800 font-medium px-2 py-0.5 rounded-md">{cs.difficulty}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-3 flex-grow">{cs.description}</p>
                    <p className="text-right text-sm font-semibold text-sky-700 mt-4">View Case &rarr;</p>
                </Card>
            ))}
        </div>
      )}
    </div>
  );
};

export default CaseLibrary;