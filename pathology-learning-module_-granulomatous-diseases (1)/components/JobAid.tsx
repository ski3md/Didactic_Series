import React from 'react';
import Card from './ui/Card';
import SectionHeader from './ui/SectionHeader';

const JobAid: React.FC = () => {
  return (
    <div className="animate-fade-in">
      <SectionHeader 
        title="Comparative Table"
        subtitle="Distinguishing Sarcoidosis vs. Tuberculosis"
      />

      <Card>
        <h2 className="text-2xl font-semibold font-serif text-slate-800 mb-4">High-Yield Distinctions</h2>
        <p className="text-slate-600 mb-6">This table highlights key distinguishing features between two common entities. Use it as a quick reference at the microscope.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500">
            <thead className="text-xs text-slate-700 uppercase bg-slate-100">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold rounded-l-lg">Feature</th>
                <th scope="col" className="px-6 py-4 font-semibold">Classic Finding in Sarcoidosis</th>
                <th scope="col" className="px-6 py-4 font-semibold rounded-r-lg">Classic Finding in Tuberculosis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr className="bg-white">
                <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">Granuloma Type</th>
                <td className="px-6 py-4">Tightly formed, well-circumscribed, "naked" (scant lymphocytes).</td>
                <td className="px-6 py-4">Can be well-formed or poorly-formed, often confluent, prominent rim of lymphocytes.</td>
              </tr>
              <tr className="bg-white">
                <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">Necrosis</th>
                <td className="px-6 py-4"><strong>Non-necrotizing</strong> ("non-caseating").</td>
                <td className="px-6 py-4"><strong>Caseating necrosis</strong> (eosinophilic, granular, acellular debris).</td>
              </tr>
              <tr className="bg-white">
                <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">Distribution</th>
                <td className="px-6 py-4"><strong>Lymphangitic</strong> (along bronchovascular bundles, septa, pleura).</td>
                <td className="px-6 py-4"><strong>Apical and cavitary</strong> (typically upper lobes).</td>
              </tr>
               <tr className="bg-white">
                <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">Associated Findings</th>
                <td className="px-6 py-4">Schaumann bodies, Asteroid bodies.</td>
                <td className="px-6 py-4">Acid-fast bacilli (AFB) visible with special stain.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default JobAid;
