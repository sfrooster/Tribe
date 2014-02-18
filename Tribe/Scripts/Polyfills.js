var _this = this;
if (!String.prototype.format) {
    String.prototype.format = function () {
        var any = [];
        for (var _i = 0; _i < (arguments.length - 0); _i++) {
            any[_i] = arguments[_i + 0];
        }
        var args = arguments;
        var matchReplace = function (match, number) {
            return typeof args[number] !== 'undefined' ? args[number] : match;
        };

        return _this.replace(/{(\d+)}/g, matchReplace);
    };
}

var Guid = (function () {
    function Guid() {
        this._value = Guid.generate();
    }
    Guid.generate = function () {
        var charReplace = function (char) {
            var r = Math.random() * 16 | 0;
            var v = (char === 'x') ? r : r & 0x3 | 0x8;
            return v.toString(16);
        };

        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, charReplace);
    };

    Object.defineProperty(Guid.prototype, "value", {
        get: function () {
            return this._value;
        },
        enumerable: true,
        configurable: true
    });
    return Guid;
})();
//# sourceMappingURL=Polyfills.js.map
