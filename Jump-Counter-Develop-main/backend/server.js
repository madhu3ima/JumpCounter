require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');


const app = express();
app.use(cors());
app.use(bodyParser.json());

// Replace the uri string with your MongoDB Atlas connection string.
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const jumpCounterSchema = new mongoose.Schema({
    numberOfSubjects: String,
    phaseOneMinutes: String,
    phaseOneSeconds: String,
    phaseTwoMinutes: String,
    phaseTwoSeconds: String,
    numberOfBins: String,
    selectedValue: String,
    ratDetails: [
        {
          ratId: String,
          phaseOneMinutes: String,
          phaseOneSeconds: String,
          phaseTwoMinutes: String,
          phaseTwoSeconds: String,
          // Add other rat-specific fields as needed
        },
      ], 
});

const JumpCounter = mongoose.model('JumpCounter', jumpCounterSchema);

app.post('/api/jumpcounter', async (req, res) => {
    try {
        const jumpCounter = new JumpCounter(req.body);
        console.log(req.body)
        console.log(jumpCounter)
        const savedJumpCounter = await jumpCounter.save();
        console.log(savedJumpCounter)
        res.status(201).json(savedJumpCounter);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));