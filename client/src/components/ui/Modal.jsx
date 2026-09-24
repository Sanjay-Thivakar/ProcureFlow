const Modal = ({ isOpen, onClose, children }) => {

    if (!isOpen) return null;

    return (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">

            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 relative">

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-2xl text-slate-400 hover:text-slate-700 transition"
                >
                    ×
                </button>

                {children}

            </div>

        </div>

    );

};

export default Modal;