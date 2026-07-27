const Quotation = require("../models/quotation.model");
const Product = require("../models/product.model");

const createQuotation = async (req, res) => {
    try {

        // Only buyers can request quotations
        if (req.user.role !== "buyer") {
            return res.status(403).json({
                success: false,
                message: "Only buyers can request quotations."
            });
        }

        const { productId, quantity, message, requiredBy } = req.body;

        // Check if the product exists
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found."
            });
        }

        const quotation = await Quotation.create({
            buyer: req.user.id,
            supplier: product.supplier,
            product: product._id,
            quantity,
            message,
            requiredBy,
        });

        res.status(201).json({
            success: true,
            quotation
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

const getSupplierQuotations = async (req, res) => {
    try {

        if (req.user.role !== "supplier") {
            return res.status(403).json({
                success: false,
                message: "Only suppliers can view quotations."
            });
        }

        const quotations = await Quotation.find({
            supplier: req.user.id
        })
        .populate("buyer", "name email")
        .populate("product", "name category unit");

        res.status(200).json({
            success: true,
            count: quotations.length,
            quotations
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const respondToQuotation = async (req, res) => {
    try {

        if (req.user.role !== "supplier") {
            return res.status(403).json({
                success: false,
                message: "Only suppliers can respond to quotations."
            });
        }

        const quotation = await Quotation.findById(req.params.id);

        if (!quotation) {
            return res.status(404).json({
                success: false,
                message: "Quotation not found."
            });
        }

        // Ensure the logged-in supplier owns this quotation
        if (quotation.supplier.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Not authorized."
            });
        }
        
        if (quotation.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: "Quotation has already been responded to."
            });
        }


        const {
            quotedPrice,
            discountPercentage,
            estimatedDelivery,
            supplierNote
        } = req.body;

        quotation.quotedPrice = quotedPrice;
        quotation.discountPercentage = discountPercentage;
        quotation.estimatedDelivery = estimatedDelivery;
        quotation.supplierNote = supplierNote;

        // Quote expires after 2 days
        quotation.validUntil = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

        quotation.status = "quoted";

        await quotation.save();

        res.status(200).json({
            success: true,
            quotation
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

const acceptQuotation = async (req, res) => {
    try {

        if (req.user.role !== "buyer") {
            return res.status(403).json({
                success: false,
                message: "Only buyers can accept quotations."
            });
        }

        const quotation = await Quotation.findById(req.params.id);

        if (!quotation) {
            return res.status(404).json({
                success: false,
                message: "Quotation not found."
            });
        }

        if (quotation.buyer.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Not authorized."
            });
        }

        if (quotation.status !== "quoted") {
            return res.status(400).json({
                success: false,
                message: "Quotation cannot be accepted."
            });
        }

        if (quotation.validUntil && quotation.validUntil < new Date()) {
            quotation.status = "expired";
            await quotation.save();

            return res.status(400).json({
                success: false,
                message: "Quotation has expired."
            });
        }

        quotation.status = "accepted";

        await quotation.save();

        res.status(200).json({
            success: true,
            message: "Quotation accepted successfully.",
            quotation
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

const rejectQuotation = async (req, res) => {
    try {

        if (req.user.role !== "buyer") {
            return res.status(403).json({
                success: false,
                message: "Only buyers can reject quotations."
            });
        }

        const quotation = await Quotation.findById(req.params.id);

        if (!quotation) {
            return res.status(404).json({
                success: false,
                message: "Quotation not found."
            });
        }

        if (quotation.buyer.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Not authorized."
            });
        }

        if (quotation.status !== "quoted") {
            return res.status(400).json({
                success: false,
                message: "Quotation cannot be rejected."
            });
        }

        quotation.status = "rejected";

        await quotation.save();

        res.status(200).json({
            success: true,
            message: "Quotation rejected successfully.",
            quotation
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

const getBuyerQuotations = async (req, res) => {
    try {

        if (req.user.role !== "buyer") {
            return res.status(403).json({
                success: false,
                message: "Only buyers can view their quotations."
            });
        }

        const quotations = await Quotation.find({
            buyer: req.user.id
        })
        .populate("supplier", "name email")
        .populate("product", "name category unit");

        res.status(200).json({
            success: true,
            count: quotations.length,
            quotations
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

module.exports = {
    createQuotation,
    getSupplierQuotations,
    respondToQuotation,
    acceptQuotation,
    rejectQuotation,
    getBuyerQuotations,
};