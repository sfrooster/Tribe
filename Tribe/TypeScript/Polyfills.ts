interface String {
    //format(...replacements: string[]): string;
    format(...replacements: any[]): string;
}

if (!String.prototype.format) {
    String.prototype.format = (...any) => {
        var args = arguments;
        var matchReplace = (match: string, number: any) => {
            return typeof args[number] !== 'undefined' ? args[number] : match;
        }
        
        return this.replace(/{(\d+)}/g, matchReplace);
    };
}

class Guid {
    static generate() {
        var charReplace = (char: string) => {
            var r = Math.random() * 16 | 0;
            var v = (char === 'x') ? r : r & 0x3 | 0x8;
            return v.toString(16);
        }

        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, charReplace);
    }

    constructor() {
        this._value = Guid.generate();
    }

    private _value: string;
    get value(): string {
        return this._value;
    }
}