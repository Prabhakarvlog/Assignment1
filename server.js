const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();

app.use(bodyParser.json());

// Your secret key for JWT token generation
const secretKey = 'Prabhakar@123';

// Middleware for JWT authentication
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization');
  if (token == null) return res.sendStatus(401);
  jwt.verify(token, secretKey, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};


mongoose.connect('mongodb://localhost:27017/prabhakar', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const Analytics = mongoose.model('Analytics', {
  api: String,
  response: String,
});

// Define routes and endpoints
app.get('/api/common-data', authenticateToken, async (req, res) => {
  try {
    // Fetch data from third-party APIs
    const [api1Data, api2Data] = await Promise.all([
      fetchApiData('https://dummyjson.com/users'),
      fetchApiData('https://reqres.in/api/users'),
    ]);

    // Save response to the database for analytics
    const analytics1 = new Analytics({ api: 'API 1', response: JSON.stringify(api1Data) });
    const analytics2 = new Analytics({ api: 'API 2', response: JSON.stringify(api2Data) });
    await Promise.all([analytics1.save(), analytics2.save()]);

    // Combine the data from both APIs
    const commonData = {
      api1: api1Data,
      api2: api2Data,
    };

    res.json(commonData);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

function fetchApiData(apiUrl) {
  return new Promise(async (resolve) => {
    try {
      const response = await axios.get(apiUrl, { timeout: 2000 });
      resolve(response.data);
    } catch (error) {
      console.error(error);
      resolve({});
    }
  });
}

// Start the Express server
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
