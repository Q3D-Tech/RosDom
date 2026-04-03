"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveAccountMode = resolveAccountMode;
function resolveAccountMode(birthYear, currentYear = new Date().getFullYear()) {
    const age = currentYear - birthYear;
    if (age <= 13) {
        return 'child';
    }
    if (age <= 49) {
        return 'adult';
    }
    return 'elderly';
}
//# sourceMappingURL=account-mode.js.map