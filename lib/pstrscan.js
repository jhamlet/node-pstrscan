
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
            chunkSize, chunkPos, src, maxPos, 
            result, match, matchPos
        ;
        // coerce a string to a regular expression
        pattern = typeof pattern === "string" ?
            new RegExp(pattern, "gm") :
            pattern;
        // make our regular expression global and multiline if not already
        pattern = !pattern.global || !pattern.multiline ?
            new RegExp(pattern.source, "gm") :
            pattern;
            
        // chunk up our source string if looking for a match
        // at the current position
        src = this.source;
        if (atPos) {
            maxPos = 0;
            chunkPos = (chunkSize = this.chunkSize) === 0 ?
                src.length :
                pos + chunkSize;
            chunkPos = chunkPos > src.length ? src.length : chunkPos;
            src = src.slice(pos, chunkPos);
        }
        else {
            pattern.lastIndex = pos;
            maxPos = Infinity;
        }
        
        result = pattern.exec(src);
        if (result && result.index <= maxPos) {
            // TODO: capture the following in an updateState function
            // but, test the performance impact an extra function call
            // might cause.
            this.captures = result;
            match = result[0];
            matchPos = result.index + match.length;
            
            if (advance && atPos) {
                this.last = pos;
                this.pos = pos + matchPos;
            }
            else if (advance) {
                this.last = result.index;
                this.pos = matchPos;
            }
            
            this.match = atPos ?
                match :
                src.slice(pos, matchPos);
            
            this.eos = this.pos >= this.source.length;
            
            return asStr ? this.match : this.match.length;
        }
        
        return (this.captures = this.match = null);
    }
    //-----------------------------------------------------------------------
    // Public
    //-----------------------------------------------------------------------
    PStrScan = PClass.derive({
        
        init: function (src, opts) {
            if (opts) {
                Proteus.merge(this, opts);
            }
            this.reset(src);
        },
        
        chunkSize: 128,
        
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
        
        getRemainder: function () {
            return this.source.slice(this.pos);
        },
        
        getPosition: function () {
            return this.pos;
        },
        
        hasTerminated: function () {
            return (this.eos = this.source.length <= this.pos);
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
        reset: function (src) {
            if (typeof src !== "undefined") {
                this.source = src.toString();
            }

            this.last = this.pos = 0;
            this.captures = this.match = null;
            this.eos = this.source && this.source.length <= this.pos;
            
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