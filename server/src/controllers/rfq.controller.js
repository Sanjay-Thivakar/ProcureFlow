const RFQ = require("../models/rfq.model");
const Quotation = require("../models/quotation.model");

const getRestaurantRFQs = async (req, res) => {
    try {
        if (req.user.role !== "restaurant") {
            return res.status(403).json({
                success: false,
                message: "Only restaurants can view RFQs."
            });
        }

        const now = new Date();
        await Quotation.updateMany(
            {
                restaurant: req.user.id,
                status: "quoted",
                validUntil: { $exists: true, $lt: now }
            },
            {
                $set: { status: "expired" }
            }
        );

        const rfqs = await RFQ.find({
            restaurant: req.user.id,
        }).sort({ createdAt: -1 });

        const rfqsWithQuotations = await Promise.all(
            rfqs.map(async (rfq) => {
                const quotations = await Quotation.find({
                    rfq: rfq._id,
                }).populate("supplier", "name email");

                return {
                    ...rfq.toObject(),
                    quotations,
                };
            })
        );

        return res.status(200).json({
            success: true,
            rfqs: rfqsWithQuotations,
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const getRFQDetails = async (req, res) => {
    try {
        const now = new Date();
        await Quotation.updateMany(
            {
                rfq: req.params.id,
                status: "quoted",
                validUntil: { $exists: true, $lt: now }
            },
            {
                $set: { status: "expired" }
            }
        );

        const rfq = await RFQ.findById(req.params.id);

        if (!rfq) {
            return res.status(404).json({
                success: false,
                message: "RFQ not found."
            });
        }

        // Ownership and Role-Based Authorization
        if (req.user.role === "restaurant") {
            if (rfq.restaurant.toString() !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: "Forbidden. You are not authorized to view this RFQ."
                });
            }

            const quotations = await Quotation.find({
                rfq: rfq._id
            }).populate("supplier", "name email");

            return res.status(200).json({
                success: true,
                rfq,
                quotations
            });
        } else if (req.user.role === "supplier") {
            // Suppliers can only view RFQs they are invited to, and ONLY see their own quotation
            const supplierQuotations = await Quotation.find({
                rfq: rfq._id,
                supplier: req.user.id
            }).populate("supplier", "name email");

            if (supplierQuotations.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: "Forbidden. You are not authorized to view this RFQ."
                });
            }

            return res.status(200).json({
                success: true,
                rfq,
                quotations: supplierQuotations
            });
        } else {
            return res.status(403).json({
                success: false,
                message: "Forbidden. Invalid role."
            });
        }

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getRestaurantRFQs,
    getRFQDetails,
};