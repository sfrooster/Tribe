if (!String.prototype.format) {
    String.prototype.format = function () {
        var args = arguments;
        var mrepl = function (match, number) {
            return typeof args[number] != 'undefined' ? args[number] : match;
        };
        return this.replace(/{(\d+)}/g, mrepl);
    };
}
//# sourceMappingURL=Polyfills.js.map
