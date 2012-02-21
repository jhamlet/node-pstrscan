
(function () {
    
    var Proteus = require("proteus"),
        PClass  = Proteus.Class,
        BOL_REGEX = /[\r\n\f]/,
        PStrScan
    ;
    //-----------------------------------------------------------------------
    // Private
    //-----------------------------------------------------------------------
    function scan (pattern, atCurPos, asStr, advance) {
        var pos = this.pos,
            maxPos = atCurPos ? pos : Infinity,
            result, match, matchPos
        ;
        // coerce a string to a RegExp
        pattern = typeof pattern === "string" ?
                new RegExp(pattern, "gm") :
                pattern;
        // if the RegExp is not global or multiline, make it so
        pattern = !pattern.global || !pattern.multiline ?
                new RegExp(pattern.source, "gm") :
                pattern;
        // tell the pattern where to start matching
        pattern.lastIndex = pos;

        result = pattern.exec(this.source);
        if (result && result.index <= maxPos) {
            this.captures = result;
            match = result[0];
            matchPos = result.index + match.length;
            
            if (advance) {
                this.last = result.index;
                this.pos = matchPos;
            }
            
            this.match = !atCurPos ?
                    this.source.slice(pos, matchPos) :
                    match;
            
            this.eos = this.pos >= this.source.length;

            return asStr ? this.match : this.match.length;
        }

        this.captures = this.match = null;
        
        return null;
    }
    //-----------------------------------------------------------------------
    // Public
    //-----------------------------------------------------------------------
    PStrScan = PClass.derive({
        
        init: function (src) {
            this.reset(src);
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
            var c = this.source.charAt(this.pos);
            
            this.last = this.pos;
            this.pos = this.pos + c.length;
            this.captures = [c];
            this.match = c;
            
            this.eos = this.pos >= this.source.length;
            
            return this.match;
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
        
        getRemainder: function () {
            return this.source.slice(this.pos);
        },
        
        getPosition: function () {
            return this.pos;
        },
        
        hasTerminated: function () {
            return this.eos;
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
        
        getCapture: function () {
            return this.captures;
        },
        //-------------------------------------------------------------------
        // Scanner State
        //-------------------------------------------------------------------
        reset: function (src) {
            if (typeof src !== "undefined") {
                this.source = src.toString();
            }

            this.last = this.pos = 0;
            this.match = null;
            this.eos = this.source && this.source.length <= this.pos;
            
            return this;
        },
        
        terminate: function () {
            this.pos = this.source.length;
            this.eos = this.source && this.source.length <= this.pos;
            return this;
        },
        
        concat: function (txt) {
            this.source += txt;
            this.eos = txt.length > 0 ? false : true;
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