var mongoose = require('mongoose');

var quarterSchema = mongoose.Schema({
    _id: false,
    qId: Number,
    painted: Boolean
});

var daySchema = mongoose.Schema({
    quarters: [quarterSchema],
    day: Date,
    notes: String,
    dailyTotal: Number,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Paiva', daySchema);