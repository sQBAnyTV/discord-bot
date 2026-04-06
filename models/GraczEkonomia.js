const mongoose = require('mongoose');

const ekonomiaSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    monety: { type: Number, default: 0 },
    poziomPoszukiwan: { type: Number, default: 0 },
    poziomOchrony: { type: Number, default: 0 },
    doswiadczenie: { type: Number, default: 0 },
    udaneNapady: { type: Number, default: 0 },
    nieudaneNapady: { type: Number, default: 0 },
    ostatnieDaily: { type: Date, default: null },
    grupa: { type: String, default: null },
    ekwipunek: {
        pistolet: { type: Number, default: 0 },
        samochod: { type: Number, default: 0 },
        kamizelka: { type: Number, default: 0 },
        zaklocacz: { type: Number, default: 0 },
        c4: { type: Number, default: 0 },
        karta_magnetyczna: { type: Number, default: 0 },
        wiertlo: { type: Number, default: 0 }
    },
    cooldownNapad: {
        sklep: { type: Date, default: null },
        konwoj: { type: Date, default: null },
        bank: { type: Date, default: null },
        muzeum: { type: Date, default: null }
}
});

module.exports = mongoose.model('GraczEkonomia', ekonomiaSchema);