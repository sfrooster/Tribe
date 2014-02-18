interface String {
    //format(...replacements: string[]): string;
    format(...replacements: any[]): string;
}

if (!String.prototype.format) {
    String.prototype.format = function() {
        var args = arguments;
        var mrepl = (match:string, number:any) => typeof args[number] != 'undefined' ? args[number] : match
        return this.replace(/{(\d+)}/g, mrepl);
    };
}

