import Modal from "../ui/Modal";
import QuotationCard from "../quotation/QuotationCard";

const RFQResponsesModal = ({
    isOpen,
    onClose,
    rfq,
    onSuccess,
}) => {

    if (!rfq) return null;

    const responsesReceived = rfq.quotations.filter(
        quotation => quotation.status !== "pending"
    ).length;

    return (

        <Modal
            isOpen={isOpen}
            onClose={onClose}
        >

            <div className="space-y-8">

                {/* RFQ Header */}

                <div>

                    <h1 className="text-3xl font-bold">

                        {rfq.productName}

                    </h1>

                    <p className="text-gray-500 mt-2">

                        Procurement Request

                    </p>

                </div>

                {/* RFQ Summary */}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

                    <div>

                        <p className="text-gray-400 text-sm">

                            Quantity

                        </p>

                        <p className="font-semibold">

                            {rfq.quantity} {rfq.unit}

                        </p>

                    </div>

                    <div>

                        <p className="text-gray-400 text-sm">

                            Required By

                        </p>

                        <p className="font-semibold">

                            {new Date(
                                rfq.requiredBy
                            ).toLocaleDateString()}

                        </p>

                    </div>

                    <div>

                        <p className="text-gray-400 text-sm">

                            Suppliers

                        </p>

                        <p className="font-semibold">

                            {rfq.quotations.length}

                        </p>

                    </div>

                    <div>

                        <p className="text-gray-400 text-sm">

                            Responses

                        </p>

                        <p className="font-semibold">

                            {responsesReceived} / {rfq.quotations.length}

                        </p>

                    </div>

                </div>

                <hr />

                {/* Supplier Quotations */}

                <div className="space-y-6">

                    {rfq.quotations.map((quotation) => (

                        <QuotationCard
                            key={quotation._id}
                            quotation={quotation}
                            onSuccess={onSuccess}
                        />

                    ))}

                </div>

            </div>

        </Modal>

    );

};

export default RFQResponsesModal;