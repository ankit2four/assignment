# Transaction Analytics Dashboard

The Transaction Analytics Dashboard is a web application that allows users to analyze transaction data using various visualizations like tables, charts, and graphs. It provides insights into transaction trends, sales performance, and product categories.

## Setup and Installation

### Prerequisites

- Node.js (version 12 or higher)
- npm (Node Package Manager)

### Installation

1. Clone the repository:

git clone <repository-url>

css
Copy code

2. Navigate to the project directory:

cd transaction-analytics-dashboard

markdown
Copy code

3. Install dependencies:

npm install

markdown
Copy code

### Running the Application

1. Start the backend server:

npm run server

markdown
Copy code

2. Start the frontend development server:

npm start

markdown
Copy code

3. Open your browser and navigate to `http://localhost:3000` to view the application.

## Features

- View a list of transactions with details like product name, price, date of sale, category, and description.
- Search for transactions based on title, description, or price.
- Filter transactions by month and view statistics for each month.
- Visualize transaction data using pie charts and bar charts.
- Analyze sales performance, including total sale amount, number of sold items, and number of unsold items.
- Dynamically update charts based on user selections.

## API Endpoints

- `/api/transactions`: Retrieves transaction data.
- `/api/search`: Searches transactions based on title, description, or price.
- `/api/statistics`: Provides statistics for a selected month.
- `/api/pieChart`: Retrieves data for pie chart visualization.
- `/api/barChart`: Retrieves data for bar chart visualization.

## Technologies Used

- Frontend: React.js, Chart.js, Axios, Bootstrap
- Backend: Node.js, Express.js, MongoDB
