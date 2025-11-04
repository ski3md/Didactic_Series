import React from 'react';
import Card from './Card.tsx';
import { ArrowRightToBracketIcon } from '../icons.tsx';

const LoginRequiredCard: React.FC = () => {
    return (
        <Card>
            <div className="text-center py-8">
                <ArrowRightToBracketIcon className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                <h3 className="text-xl font-semibold text-slate-800">Login Required</h3>
                <p className="text-slate-600 mt-2">
                    You must be logged in to access this section of the module.
                </p>
                <p className="text-sm text-slate-500 mt-1">
                    Please use the sidebar to log in or create an account.
                </p>
            </div>
        </Card>
    );
};
export default LoginRequiredCard;