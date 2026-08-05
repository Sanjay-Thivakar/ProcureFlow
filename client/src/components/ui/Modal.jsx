const Modal = ({ isOpen, onClose, children }) => {

    if (!isOpen) return null;

    return (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">

            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 relative">

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-2xl text-gray-500 hover:text-black"
                >
                    ×
                </button>

                {children}

            </div>

        </div>

    );

};

export default Modal;