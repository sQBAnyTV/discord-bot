const mongoose = require('mongoose');

const licznikSchema = new mongoose.Schema({
    _id: { type: String, default: 'licznik' },
    ostatnia_liczba: { type: Number, default: 0 },
    ostatni_uzytkownik: { type: String, default: '' },
    rekord: { type: Number, default: 0 },
    czyWyslanoRekord: { type: Boolean, default: false }
});

module.exports = mongoose.model('Licznik', licznikSchema);