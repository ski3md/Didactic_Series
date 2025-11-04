import React from 'react';
import { User } from '../types.ts';
import SectionHeader from './ui/SectionHeader.tsx';
import ImageGalleries from './ImageGalleries.tsx';
import { BookOpenIcon } from './icons.tsx';

interface ReferenceLibraryProps {
  user: User | null;
}

const ReferenceLibrary: React.FC<ReferenceLibraryProps> = ({ user }) => {

  return (
    <div className="animate-fade-in space-y-8">
      <SectionHeader 
        title="Reference Library"
        subtitle="Explore case studies, browse image galleries, and use the diagnostic atlas."
        icon={<BookOpenIcon className="h-10 w-10" />}
      />
      <div>
        <ImageGalleries user={user} />
      </div>
    </div>
  );
};

export default ReferenceLibrary;