import React from 'react';
import Modal from './Modal';

interface SuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    coinAmount: number;
    newBalance: number;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
    isOpen,
    onClose,
    coinAmount,
    newBalance
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Congratulations!</h3>
                </div>

                {/* Content */}
                <div className="mb-6">
                    <p className="text-gray-700 mb-3">
                        Your purchase was successful! <span className="font-semibold text-green-600">{coinAmount.toLocaleString()} coins</span> have been added to your account.
                    </p>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm text-green-800">
                            <span className="font-medium">Current Balance:</span> {newBalance.toLocaleString()} coins
                        </p>
                    </div>
                </div>

                {/* Action */}
                <div className="flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                        Continue
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default SuccessModal;
