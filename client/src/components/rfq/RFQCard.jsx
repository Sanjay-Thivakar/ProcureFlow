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

        const hasPending = rfq.quotations.some((q) => q.status === "pending");
        const hasActiveQuoted = rfq.quotations.some(
            (q) =>
                q.status === "quoted" &&
                (!q.validUntil || new Date(q.validUntil) >= new Date())
        );

        if (!hasPending && !hasActiveQuoted) {
            return {
                text: "Expired",
                color: "bg-orange-100 text-orange-700",
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
            color: "bg-amber-100 text-amber-700",
        };
    };

    const status = getStatus();

    return (

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 p-6 flex flex-col">

            {/* Header */}

            <div className="flex justify-between items-start mb-6">

                <div>

                    <h2 className="text-2xl font-bold text-slate-800">
                        {rfq.productName}
                    </h2>

                    <p className="text-slate-500 text-sm mt-1">
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

                <div className="flex justify-between items-center">

                    <span className="text-xs uppercase tracking-wide text-slate-400">
                        Quantity
                    </span>

                    <span className="font-semibold text-slate-800">
                        {rfq.quantity} {rfq.unit}
                    </span>

                </div>

                <div className="flex justify-between items-center">

                    <span className="text-xs uppercase tracking-wide text-slate-400">
                        Required By
                    </span>

                    <span className="font-semibold text-slate-800">
                        {new Date(rfq.requiredBy).toLocaleDateString()}
                    </span>

                </div>

                <div className="flex justify-between items-center">

                    <span className="text-xs uppercase tracking-wide text-slate-400">
                        Suppliers Invited
                    </span>

                    <span className="font-semibold text-slate-800">
                        {rfq.quotations.length}
                    </span>

                </div>

                <div className="flex justify-between items-center">

                    <span className="text-xs uppercase tracking-wide text-slate-400">
                        Responses
                    </span>

                    <span className="font-semibold text-slate-800">

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