const RFQ = require("../models/rfq.model");
const Product = require("../models/product.model");
const Quotation = require("../models/quotation.model");

const getRestaurantRFQs = async (req, res) => {

    try {

        if (req.user.role !== "restaurant") {
            return res.status(403).json({
                success: false,
                message: "Only restaurants can view RFQs."
            });
        }

        const rfqs = await RFQ.find({
            restaurant: req.user.id,
        });

        const rfqsWithQuotations = await Promise.all(

            rfqs.map(async (rfq) => {

                const quotations = await Quotation.find({
                    rfq: rfq._id,
                })
                    .populate("supplier", "name email");

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

        const rfq = await RFQ.findById(req.params.id);

        if (!rfq) {
            return res.status(404).json({
                success: false,
                message: "RFQ not found."
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