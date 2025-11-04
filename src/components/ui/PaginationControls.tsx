import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '../icons.tsx';

interface PaginationControlsProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({ currentPage, totalPages, onPageChange }) => {
    return (
        <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-6">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <ChevronLeftIcon className="h-5 w-5 mr-2" />
                Previous
            </button>

            <span className="text-sm text-slate-800">
                Page <span className="font-semibold text-sky-800">{currentPage}</span> of <span className="font-semibold text-sky-800">{totalPages}</span>
            </span>

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                Next
                <ChevronRightIcon className="h-5 w-5 ml-2" />
            </button>
        </div>
    );
};

export default PaginationControls;