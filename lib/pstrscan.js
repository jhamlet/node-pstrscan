
(function () {
    
    var Proteus = require("proteus"),
        PClass  = Proteus.Class,
        BOL_REGEX = /[\r\n\f]/,
        PStrScan
    ;
    //-----------------------------------------------------------------------
    // Private
    //-----------------------------------------------------------------------
    function scan (pattern, atPos, asStr, advance) {
        var pos = this.pos,
            src, result, match, matchPos
        ;
        // coerce a string to a regular expression
        pattern = pattern.source ? pattern : new RegExp(pattern, 'g');
        pattern = pattern.global ? pattern : new RegExp(pattern.source, 'g');
        
        src = this.source;
        pattern.lastIndex = pos;
        result = pattern.exec(src);
        
        if (result && (!atPos || (atPos && result.index === pos))) {
            // TODO: capture the following in an updateState function
            // but, test the performance impact an extra function call
            // might cause.
            this.captures = result;
            this.match = match = result[0];
            
            if (advance) {
                this.last = result.index;
                this.pos = pattern.lastIndex;
            }
            
            this.eos = this.pos >= this.source.length;
            
            match = src.slice(pos, pattern.lastIndex);
            return asStr ? match : match.length;
        }
        
        return (this.captures = this.match = null);
    }
    //-----------------------------------------------------------------------
    // Public
    //-----------------------------------------------------------------------
    PStrScan = PClass.derive({
        
        init: function (src) {
            this.setSource(src);
        },
        //-------------------------------------------------------------------
        // Scanning
        //-------------------------------------------------------------------
        scan: function (pattern) {
            return scan.call(this, pattern, 1, 1, 1);
        },
        
        scanUntil: function (pattern) {
            return scan.call(this, pattern, 0, 1, 1);
        },
        
        scanChar: function () {
            var c = this.peek(),
                caps = [c];
            
            caps.index    = this.last = this.pos;
            this.pos      = this.pos + c.length;
            this.captures = caps;
            this.match    = c;
            
            this.hasTerminated();
            
            return c;
        },

        skip: function (pattern) {
            return scan.call(this, pattern, 1, 0, 1);
        },
        
        skipUntil: function (pattern) {
            return scan.call(this, pattern, 0, 0, 1);
        },
        //-------------------------------------------------------------------
        // Looking ahead
        //-------------------------------------------------------------------
        check: function (pattern) {
            return scan.call(this, pattern, 1, 0, 0);
        },
        
        checkUntil: function (pattern) {
            return scan.call(this, pattern, 0, 0, 0);
        },
        
        peek: function (count) {
            return this.source.substr(this.pos, count || 1);
        },
        //-------------------------------------------------------------------
        // Scanner Data
        //-------------------------------------------------------------------
        getSource: function () {
            return this.source;
        },
        
        setSource: function (src) {
            if (typeof src !== "undefined") {
                this.source = src.toString();
                this.reset();
            }
            return this;
        },
        
        getRemainder: function () {
            return this.source.slice(this.pos);
        },
        
        getPosition: function () {
            return this.pos;
        },
        
        setPosition: function (pos) {
            this.pos = pos;
            return this;
        },
        
        getPos: Proteus.aliasMethod("getPosition"),
        setPos: Proteus.aliasMethod("setPosition"),
        
        hasTerminated: function () {
            var eos = (this.eos = this.source ?
                        this.source.length <= this.pos :
                        true);
            return eos;
        },
        
        atBeginningOfLine: function () {
            return this.pos === 0 ||
                    this.pos === this.source.length ||
                    BOL_REGEX.test(this.source.charAt(this.pos-1));
        },
        
        atBOL: Proteus.aliasMethod("atBeginningOfLine"),
        //-------------------------------------------------------------------
        // Scanner Match Data
        //-------------------------------------------------------------------
        getPreMatch: function () {
            if (this.match) {
                return this.source.slice(0, this.last);
            }
            return null;
        },
        
        getMatch: function () {
            return this.match;
        },
        
        getPostMatch: function () {
            if (this.match) {
                return this.source.slice(this.pos);
            }
            return null;
        },
        
        getCapture: function (idx) {
            return this.captures[idx];
        },
        //-------------------------------------------------------------------
        // Scanner State
        //-------------------------------------------------------------------
        reset: function () {
            this.last = this.pos = 0;
            this.captures = this.match = null;
            this.hasTerminated();
            return this;
        },
        
        terminate: function () {
            this.pos = this.source.length;
            this.hasTerminated();
            return this;
        },
        
        concat: function (txt) {
            this.source += txt;
            this.hasTerminated();
            return this;
        },
        
        unscan: function () {
            if (this.match) {
                this.captures = this.match = null;
                this.pos = this.last;
                this.last = 0;
            }
            else {
                throw new Error(
                    "PStringScanner#unscan: No previous match."
                );
            }
        }
        
    });
    //-----------------------------------------------------------------------
    // Exports
    //-----------------------------------------------------------------------
    if (typeof module !== "undefined") {
        module.exports = PStrScan;
    }
    else {
        this.PStringScanner = PStrScan;
    }
    
}());