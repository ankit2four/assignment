const express = require('express');
const router = express.Router();
const Transaction = require('./backend/models/Transaction');

// API endpoint to list all transactions based on the month with search and pagination
router.get('/api/transactions', async (req, res) => {
    try {
        const { month, search = '', page = 1, perPage = 10 } = req.query;
        const [_, monthIndex] = month.split('-'); // Ignore the year part
        const startDate = new Date(2000, monthIndex - 1, 1); // Set a fixed year (e.g., 2000) to ignore the year part
        const endDate = new Date(2000, monthIndex, 0); // Set a fixed year (e.g., 2000) to ignore the year part

        const searchNumber = parseFloat(search); // Convert search string to a number

        const query = {
            dateOfSale: { $gte: startDate, $lt: endDate },
            $or: [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { price: { $eq: searchNumber } } // Use equality comparison for exact price match
            ]
        };

        const totalCount = await Transaction.countDocuments(query);
        const transactions = await Transaction.find(query)
            .skip((page - 1) * perPage)
            .limit(parseInt(perPage));

        res.status(200).json({ totalCount, transactions });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API endpoint for statistics
router.get('/api/statistics', async (req, res) => {
    try {
        const { month } = req.query;
        const [_, monthIndex] = month.split('-'); // Ignore the year part
        const startDate = new Date(2000, monthIndex - 1, 1); // Set a fixed year (e.g., 2000) to ignore the year part
        const endDate = new Date(2000, monthIndex, 0); // Set a fixed year (e.g., 2000) to ignore the year part

        const totalSaleAmount = await Transaction.aggregate([
            { $match: { dateOfSale: { $gte: startDate, $lt: endDate } } },
            { $group: { _id: null, total: { $sum: '$price' } } }
        ]);

        const totalSoldItems = await Transaction.countDocuments({
            dateOfSale: { $gte: startDate, $lt: endDate },
            sold: true
        });

        const totalNotSoldItems = await Transaction.countDocuments({
            dateOfSale: { $gte: startDate, $lt: endDate },
            sold: false
        });

        res.status(200).json({
            totalSaleAmount: totalSaleAmount.length ? totalSaleAmount[0].total : 0,
            totalSoldItems,
            totalNotSoldItems
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API endpoint for bar chart
router.get('/api/barChart', async (req, res) => {
    try {
        const { month } = req.query;
        const [_, monthIndex] = month.split('-'); // Ignore the year part
        const startDate = new Date(2000, monthIndex - 1, 1); // Set a fixed year (e.g., 2000) to ignore the year part
        const endDate = new Date(2000, monthIndex, 0); // Set a fixed year (e.g., 2000) to ignore the year part

        const priceRanges = [
            { min: 0, max: 100 },
            { min: 101, max: 200 },
            { min: 201, max: 300 },
            { min: 301, max: 400 },
            { min: 401, max: 500 },
            { min: 501, max: 600 },
            { min: 601, max: 700 },
            { min: 701, max: 800 },
            { min: 801, max: 900 },
            { min: 901, max: Infinity }
        ];

        const barChartData = [];
        for (const range of priceRanges) {
            const count = await Transaction.countDocuments({
                dateOfSale: { $gte: startDate, $lt: endDate },
                price: { $gte: range.min, $lte: range.max }
            });
            barChartData.push({ range: `${range.min}-${range.max}`, count });
        }

        res.status(200).json(barChartData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API endpoint for pie chart
router.get('/api/pieChart', async (req, res) => {
    try {
        const { month } = req.query;
        const [_, monthIndex] = month.split('-'); // Ignore the year part
        const startDate = new Date(2000, monthIndex - 1, 1); // Set a fixed year (e.g., 2000) to ignore the year part
        const endDate = new Date(2000, monthIndex, 0); // Set a fixed year (e.g., 2000) to ignore the year part

        const pieChartData = await Transaction.aggregate([
            { $match: { dateOfSale: { $gte: startDate, $lt: endDate } } },
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);

        res.status(200).json(pieChartData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API endpoint to fetch combined data from all APIs
router.get('/api/combinedData', async (req, res) => {
    try {
        const { month } = req.query;

        // Fetch data from all APIs
        const transactions = await axios.get(`/api/transactions?month=${month}`);
        const statistics = await axios.get(`/api/statistics?month=${month}`);
        const barChartData = await axios.get(`/api/barChart?month=${month}`);
        const pieChartData = await axios.get(`/api/pieChart?month=${month}`);

        res.status(200).json({
            transactions: transactions.data,
            statistics: statistics.data,
            barChartData: barChartData.data,
            pieChartData: pieChartData.data
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
