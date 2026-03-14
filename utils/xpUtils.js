// Funkcja do obliczania wymaganego XP na dany poziom (progresja geometryczna)
function wymaganeXp(level) {
    if (level === 1) return 100;
    return 100 * Math.pow(2, level - 1);
}

// Funkcja do parsowania czasu (np. "10m", "1h", "2d")
function parseTime(timeStr) {
    const unit = timeStr.slice(-1);
    const value = parseInt(timeStr.slice(0, -1));
    
    if (isNaN(value)) return null;
    
    switch(unit) {
        case 's': return value * 1000; // sekundy
        case 'm': return value * 60 * 1000; // minuty
        case 'h': return value * 60 * 60 * 1000; // godziny
        case 'd': return value * 24 * 60 * 60 * 1000; // dni
        default: return null;
    }
}

module.exports = { wymaganeXp, parseTime };