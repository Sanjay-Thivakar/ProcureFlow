import Modal from "../ui/Modal";
import QuotationCard from "../quotation/QuotationCard";

const RFQDetailsModal = ({
    isOpen,
    onClose,
    rfq,
    onSuccess,
}) => {

    if (!rfq) return null;

    return (

        <Modal
            isOpen={isOpen}
            onClose={onClose}
        >

            <div className="space-y-6">

                <div>

                    <h2 className="text-3xl font-bold">

                        {rfq.productName}

                    </h2>

                    <p className="text-gray-500 mt-2">

                        {rfq.quantity} {rfq.unit}

                    </p>

                    <p className="text-gray-500">

                        Required By :

                        {" "}

                        {new Date(rfq.requiredBy).toLocaleDateString()}

                    </p>

                </div>

                <hr />

                <div className="space-y-5">

                    {
                        rfq.quotations.map((quotation) => (

                            <QuotationCard
                                key={quotation._id}
                                quotation={quotation}
                                onSuccess={onSuccess}
                            />

                        ))
                    }

                </div>

            </div>

        </Modal>

    );

};

export default RFQDetailsModal;