const testPost = (req, res) => {
    console.log(req.body);

    res.json({
        message: "Data received successfully!",
        data: req.body,
    });
};

module.exports = {
    testPost,
};