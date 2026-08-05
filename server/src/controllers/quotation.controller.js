const RFQ = require("../models/rfq.model"); 
const Quotation = require("../models/quotation.model");
const Product = require("../models/product.model");
const mongoose = require("mongoose");

const createRFQ = async (req, res) => {

    try {

        // Only restaurants can create RFQs
        if (req.user.role !== "restaurant") {

            return res.status(403).json({
                success: false,
                message: "Only restaurants can create RFQs."
            });

        }

        const {
            productListings,
            quantity,
            message,
            requiredBy,
        } = req.body;

        if (
            !productListings ||
            !Array.isArray(productListings) ||
            productListings.length === 0 ||
            !quantity ||
            !requiredBy
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields."
            });

        }

        // Fetch selected products
        const selectedProducts = await Product.find({
            _id: { $in: productListings }
        });

        if (selectedProducts.length !== productListings.length) {

            return res.status(404).json({
                success: false,
                message: "One or more selected products were not found."
            });

        }

        const firstProduct = selectedProducts[0];

        const normalizeProductName = (name) =>
            name.trim().toLowerCase();

        const normalizedName = normalizeProductName(firstProduct.name);

        const allSameProduct = selectedProducts.every(product =>
            normalizeProductName(product.name) === normalizedName &&
            product.unit === firstProduct.unit
        );

        if (!allSameProduct) {

            return res.status(400).json({
                success: false,
                message: "All selected products must represent the same item."
            });

        }

        const rfq = new RFQ({

            restaurant: req.user.id,

            productListings,

            productName: firstProduct.name,

            unit: firstProduct.unit,

            quantity,

            requiredBy,

            message,

        });

        await rfq.save();

        for (const product of selectedProducts) {

            console.log("--------------------------------");
            console.log("Creating quotation for:");
            console.log(product.name);
            console.log(product._id);

            const quotation = new Quotation({

                rfq: rfq._id,

                restaurant: req.user.id,

                supplier: product.supplier,

                product: product._id,

                productName: product.name,

                unit: product.unit,

                listedPrice: product.price,

                quantity,

                requiredBy,

                message,

            });

            await quotation.save();

           

        }

        return res.status(201).json({

            success: true,

            message: "RFQ created successfully.",

            rfq,

        });

    } catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message,

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
        .populate("restaurant", "name email")
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

        // ✅ Extract request body FIRST
        const {
            quotedPrice,
            discountPercentage,
            estimatedDelivery,
            supplierNote,
        } = req.body;

        // Then validate
        if (!quotedPrice || quotedPrice <= 0) {
            return res.status(400).json({
                success: false,
                message: "Quoted price must be greater than zero."
            });
        }

        quotation.quotedPrice = quotedPrice;
        quotation.discountPercentage = discountPercentage;
        quotation.estimatedDelivery = estimatedDelivery;
        quotation.supplierNote = supplierNote;

        

        if (
            discountPercentage &&
            (discountPercentage < 0 || discountPercentage > 100)
        ) {
            return res.status(400).json({
                success: false,
                message: "Discount must be between 0 and 100."
            });
        }

        if (!estimatedDelivery) {
            return res.status(400).json({
                success: false,
                message: "Estimated delivery date is required."
            });
        }

        quotation.validUntil = new Date(
            Date.now() + 2 * 24 * 60 * 60 * 1000
        );

        quotation.status = "quoted";

        await quotation.save();

        res.status(200).json({
            success: true,
            quotation,
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};

const acceptQuotation = async (req, res) => {
    try {

        if (req.user.role !== "restaurant") {
            return res.status(403).json({
                success: false,
                message: "Only restaurants can accept quotations."
            });
        }

        const quotation = await Quotation.findById(req.params.id);

        if (!quotation) {
            return res.status(404).json({
                success: false,
                message: "Quotation not found."
            });
        }

        if (quotation.restaurant.toString() !== req.user.id) {
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

        // Accept selected quotation
        quotation.status = "accepted";

        await quotation.save();

        // Reject all other quotations for this RFQ
        await Quotation.updateMany(
            {
                rfq: quotation.rfq,
                _id: { $ne: quotation._id },
                status: "quoted",
            },
            {
                $set: {
                    status: "rejected",
                },
            }
        );

        // Mark RFQ as completed
        await RFQ.findByIdAndUpdate(
            quotation.rfq,
            {
                status: "completed",
            }
        );

        return res.status(200).json({
            success: true,
            message: "Quotation accepted successfully.",
            quotation,
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};

const rejectQuotation = async (req, res) => {
    try {

        if (req.user.role !== "restaurant") {
            return res.status(403).json({
                success: false,
                message: "Only restaurants can reject quotations."
            });
        }

        const quotation = await Quotation.findById(req.params.id);

        if (!quotation) {
            return res.status(404).json({
                success: false,
                message: "Quotation not found."
            });
        }

        if (quotation.restaurant.toString() !== req.user.id) {
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

        if (quotation.validUntil && quotation.validUntil < new Date()) {
            quotation.status = "expired";
            await quotation.save();

            return res.status(400).json({
                success: false,
                message: "Quotation has expired."
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

const getRestaurantQuotations = async (req, res) => {
    try {

        if (req.user.role !== "restaurant") {
            return res.status(403).json({
                success: false,
                message: "Only restaurants can view their quotations."
            });
        }

        const quotations = await Quotation.find({
            restaurant: req.user.id
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
    createRFQ,
    getSupplierQuotations,
    respondToQuotation,
    acceptQuotation,
    rejectQuotation,
    getRestaurantQuotations,
};