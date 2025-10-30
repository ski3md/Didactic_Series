import React, { useState, useEffect } from 'react';
import { CaseStudy, User } from '../types';
import { getCaseStudies } from '../utils/caseStore';
import Card from './ui/Card';
import SectionHeader from './ui/SectionHeader';
import WSIViewer from './WSIViewer';
import { CollectionIcon } from './icons';

const CaseViewer: React.FC<{ caseStudy: CaseStudy; onBack: () => void }> = ({ caseStudy, onBack }) => {
    return (
        <div className="animate-fade-in">
            <button onClick={onBack} className="mb-6 text-sm font-semibold text-primary-600 hover:text-primary-800 transition-colors">
                &larr; Back to Case Library
            </button>
            <Card>
                <h2 className="text-3xl font-bold font-serif text-slate-800">{caseStudy.title}</h2>
                <div className="flex flex-wrap gap-2 mt-3 mb-6">
                    {caseStudy.tags.map(tag => (
                        <span key={tag} className="bg-slate-100 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-full">{tag}</span>
                    ))}
                    <span className={`capitalize bg-primary-100 text-primary-800 text-xs font-medium px-2.5 py-1 rounded-full`}>{caseStudy.difficulty}</span>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold text-lg text-slate-800 mb-2 border-b pb-2">Description</h3>
                            <p className="text-slate-600">{caseStudy.description}</p>
                        </div>
                         <div>
                            <h3 className="font-semibold text-lg text-slate-800 mb-2 border-b pb-2">Case Context</h3>
                            <p className="text-slate-600">{caseStudy.caseContext}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg text-slate-800 mb-2 border-b pb-2">Learning Objectives</h3>
                            <ul className="list-disc list-inside space-y-1 text-slate-600">
                                {caseStudy.learningObjectives.map((obj, i) => <li key={i}>{obj}</li>)}
                            </ul>
                        </div>
                         <div>
                            <h3 className="font-semibold text-lg text-slate-800 mb-2 border-b pb-2">Discussion</h3>
                            <p className="text-slate-600">{caseStudy.discussion}</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg text-slate-800 mb-2 text-center">Associated Images</h3>
                        {caseStudy.images.length > 0 ? (
                            caseStudy.images.map(image => (
                                <div key={image.imageId}>
                                    <WSIViewer staticImageUrl={image.path} altText={image.caption} />
                                    <p className="text-center text-sm text-slate-600 mt-2 font-semibold italic">{image.caption}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-slate-500">No images associated with this case.</p>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
};

const CaseList: React.FC<{ cases: CaseStudy[]; onSelectCase: (caseStudy: CaseStudy) => void }> = ({ cases, onSelectCase }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cases.map(caseStudy => (
                <Card key={caseStudy.caseId} interactive={true} className="!mb-0 h-full flex flex-col" onClick={() => onSelectCase(caseStudy)}>
                    <div className="flex-grow">
                        <h3 className="text-lg font-semibold font-serif text-slate-800 mb-2">{caseStudy.title}</h3>
                        <p className="text-sm text-slate-500 mb-4">{caseStudy.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-slate-100">
                        {caseStudy.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="bg-slate-100 text-slate-700 text-xs font-medium px-2 py-0.5 rounded-full">{tag}</span>
                        ))}
                         <span className={`capitalize bg-primary-100 text-primary-800 text-xs font-medium px-2 py-0.5 rounded-full`}>{caseStudy.difficulty}</span>
                    </div>
                </Card>
            ))}
        </div>
    );
};


const CaseLibrary: React.FC<{ user: User }> = ({ user }) => {
    const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
    const [selectedCase, setSelectedCase] = useState<CaseStudy | null>(null);

    useEffect(() => {
        const store = getCaseStudies();
        setCaseStudies(Object.values(store.caseStudies));
    }, []);

    if (selectedCase) {
        return <CaseViewer caseStudy={selectedCase} onBack={() => setSelectedCase(null)} />;
    }

    return (
        <div className="animate-fade-in">
            <SectionHeader 
                title="Case Study Library"
                subtitle="Browse a collection of AI-generated and organized case studies."
                icon={<CollectionIcon className="h-10 w-10" />}
            />
            {caseStudies.length === 0 ? (
                <Card>
                    <div className="text-center py-8">
                        <h3 className="text-xl font-semibold text-slate-700">The Library is Empty</h3>
                        <p className="text-slate-500 mt-2">
                           {user.isAdmin 
                            ? "Go to the Admin View to generate case studies from the image galleries." 
                            : "No case studies have been generated yet. Please check back later."}
                        </p>
                    </div>
                </Card>
            ) : (
                <CaseList cases={caseStudies} onSelectCase={setSelectedCase} />
            )}
        </div>
    );
};

export default CaseLibrary;
