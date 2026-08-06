const RFQCard = ({ rfq, onViewResponses }) => {

    const responsesReceived = rfq.quotations.filter(
        (quotation) =>
            quotation.status !== "pending"
    ).length;

    const getStatus = () => {

        if (rfq.status === "completed") {
            return {
                text: "Completed",
                color: "bg-green-100 text-green-700",
            };
        }

        if (responsesReceived === rfq.quotations.length) {
            return {
                text: "Ready for Review",
                color: "bg-blue-100 text-blue-700",
            };
        }

        return {
            text: "Waiting for Suppliers",
            color: "bg-yellow-100 text-yellow-700",
        };
    };

    const status = getStatus();

    return (

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 p-6 flex flex-col">

            {/* Header */}

            <div className="flex justify-between items-start mb-6">

                <div>

                    <h2 className="text-2xl font-bold text-gray-900">
                        {rfq.productName}
                    </h2>

                    <p className="text-gray-500 text-sm mt-1">
                        Procurement Request
                    </p>

                </div>

                <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}
                >
                    {status.text}
                </span>

            </div>

            {/* Details */}

            <div className="space-y-3">

                <div className="flex justify-between">

                    <span className="text-gray-500">
                        Quantity
                    </span>

                    <span className="font-semibold">
                        {rfq.quantity} {rfq.unit}
                    </span>

                </div>

                <div className="flex justify-between">

                    <span className="text-gray-500">
                        Required By
                    </span>

                    <span className="font-semibold">
                        {new Date(rfq.requiredBy).toLocaleDateString()}
                    </span>

                </div>

                <div className="flex justify-between">

                    <span className="text-gray-500">
                        Suppliers Invited
                    </span>

                    <span className="font-semibold">
                        {rfq.quotations.length}
                    </span>

                </div>

                <div className="flex justify-between">

                    <span className="text-gray-500">
                        Responses
                    </span>

                    <span className="font-semibold">

                        {responsesReceived} / {rfq.quotations.length}

                    </span>

                </div>

            </div>

            {/* Progress */}

            <div className="mt-6">

                <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">

                    <div
                        className="bg-green-500 h-full transition-all duration-300"
                        style={{
                            width: `${(responsesReceived / rfq.quotations.length) * 100}%`,
                        }}
                    />

                </div>

            </div>

            {/* Footer */}

            <button
                onClick={() => onViewResponses(rfq)}
                className="mt-6 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition-colors"
            >

                View Responses →

            </button>

        </div>

    );

};

export default RFQCard;