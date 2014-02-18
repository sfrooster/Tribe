define(["require", "exports"], function(require, exports) {
    var NullLogger = (function () {
        function NullLogger() {
        }
        NullLogger.prototype.addTag = function (tag) {
        };
        NullLogger.prototype.logLine = function (line) {
        };
        return NullLogger;
    })();
    exports.NullLogger = NullLogger;
});
//# sourceMappingURL=Logging.js.map
