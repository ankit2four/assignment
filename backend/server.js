const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors');

const Transaction = require('./models/Transaction');

const app = express();
app.use(cors());

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/mern_challenge', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', function () {
    console.log("Connected to MongoDB");
});

// API endpoint to fetch data from third-party API and initialize the database
app.get('/api/initDatabase', async (req, res) => {
    try {
        const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
        const transactions = response.data;

        // Insert transactions into the database
        await Transaction.insertMany(transactions);

        res.status(200).json({ message: 'Database initialized successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Other API endpoints will be defined here
// API endpoint to list all transactions based on the month with search and pagination
app.get('/api/transactions', async (req, res) => {
    try {
        const { page = 1, perPage = 10 } = req.query;

        // Fetch all transactions with pagination
        const totalCount = await Transaction.countDocuments({});
        const transactions = await Transaction.find({})
            .skip((page - 1) * perPage)
            .limit(parseInt(perPage));

        res.status(200).json({ totalCount, transactions });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/search', async (req, res) => {
    try {
        const { title = '', description = '', price = '', page = 1, perPage = 10 } = req.query;

        // Construct search query
        const query = {};

        if (title) {
            query.title = { $regex: title, $options: 'i' };
        }
        if (description) {
            query.description = { $regex: description, $options: 'i' };
        }
        if (price) {
            query.price = parseFloat(price) || 0;
        }

        // Fetch matching transactions with pagination
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
app.get('/api/statistics', async (req, res) => {
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


// API endpoint for pie chart
app.get('/api/pieChart', async (req, res) => {
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
app.get('/api/combinedData', async (req, res) => {
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


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
