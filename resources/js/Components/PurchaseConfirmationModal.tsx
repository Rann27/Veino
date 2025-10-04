import React from 'react';
import Modal from './Modal';

interface PurchaseConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    coinAmount: number;
    price: number;
    isLoading?: boolean;
}

const PurchaseConfirmationModal: React.FC<PurchaseConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    coinAmount,
    price,
    isLoading = false
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Notice</h3>
                </div>

                {/* Content */}
                <div className="mb-6">
                    <p className="text-gray-700 mb-4">
                        You are about to purchase <span className="font-semibold text-blue-600">{coinAmount.toLocaleString()} coins</span> for{' '}
                        <span className="font-semibold text-green-600">${price.toFixed(2)}</span>.
                    </p>
                    <p className="text-sm text-gray-500">
                        You will be redirected to PayPal for secure payment processing.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-.548 3.478-.09.476a.641.641 0 0 1-.633.532zm.392-3.396.547-3.477a.641.641 0 0 1 .633-.532h2.19c4.297 0 7.664-1.747 8.647-6.797.03-.149.054-.294.077-.437.292-1.867-.002-3.136-1.012-4.287C17.438.543 15.428 0 12.858 0H5.998c-.524 0-.972.382-1.054.901L1.837 20.597a.641.641 0 0 0 .633.74h4.606a.641.641 0 0 0 .633-.532l.09-.476.392-3.396z"/>
                                </svg>
                                Pay with PayPal
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default PurchaseConfirmationModal;
