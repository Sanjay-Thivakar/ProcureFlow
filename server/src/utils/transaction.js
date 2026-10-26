const mongoose = require("mongoose");

/**
 * Checks if the current MongoDB connection supports replica-set transactions.
 */
const supportsTransactions = () => {
    try {
        const topology = mongoose.connection.client?.topology;
        const type = topology?.description?.type;
        if (type === "Single") {
            return false;
        }
        if (type === "ReplicaSetWithPrimary" || type === "Sharded") {
            return true;
        }
    } catch (_) {}
    return true;
};

/**
 * Executes work inside a MongoDB transaction if the connected MongoDB instance
 * supports transactions (replica set / sharded cluster / MongoDB Atlas).
 * If transactions are not supported (e.g., local standalone MongoDB),
 * it gracefully falls back to executing without a session.
 *
 * @param {Function} work - Callback (session) => Promise<any>
 * @returns {Promise<any>}
 */
const runInTransaction = async (work) => {
    if (!supportsTransactions()) {
        return await work(null);
    }

    let session = null;
    try {
        session = await mongoose.startSession();
        let result;
        await session.withTransaction(async () => {
            result = await work(session);
        });
        return result;
    } catch (error) {
        const message = error?.message || "";
        const isUnsupported =
            message.includes("Transaction numbers are only allowed on a replica set member or mongos") ||
            message.includes("replica set member") ||
            message.includes("Transactions are not supported") ||
            message.includes("retryable writes") ||
            message.includes("does not support retryable writes") ||
            message.includes("standalone");

        if (isUnsupported) {
            return await work(null);
        }
        throw error;
    } finally {
        if (session) {
            try {
                await session.endSession();
            } catch (_) {}
        }
    }
};

module.exports = { runInTransaction, supportsTransactions };
