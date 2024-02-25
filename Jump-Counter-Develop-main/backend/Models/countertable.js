const mongoose = require("mongoose")

const jumpCounterSchema = new mongoose.Schema({
    numberOfSubjects: Number,
    totalRunTime: Number,
    bins: Number,
    phaseOneDuration: {
        minutes: Number,
        seconds: Number
    },
    phaseTwoDuration: {
        minutes: Number,
        seconds: Number
    },
    subjectcode: String
});
