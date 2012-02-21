/*globals suite, setup, test*/

(function () {
    var FS = require("fs"),
        should = require("should"),
        PStrScanner = require("../"),
        StrScanner
    ;
    
    function benchmark (fn) {
        
        return function () {
            var start = Date.now(),
                finish;
            
            fn();
            
            finish = Date.now();
            console.log((finish - start) + " ms");
        };
    }
    
    /**
     * Can't run the performance comparison if the contender is not available
     */
    try {
        StrScanner = require("strscan").StringScanner;
    }
    catch (e) {
        console.log("StringScanner not installed. Aborting performance test.");
        return;
    }
    
    suite("PStringScanner vs. StringScanner Performance", function () {
        var txt = FS.readFileSync(__dirname + "/sample.txt");
        
        test("PStringScanner 83 kb file", benchmark(function () {
            var s = new PStrScanner(txt),
                match
            ;
            
            while (!s.eos) {
                match = s.scan(/[\w,.]+/) || s.scan(/\s+/);
            }
        }));
        
        test("StringScanner 83 kb file", benchmark(function () {
            var s = new StrScanner(txt),
                match
            ;
            
            while (!s.hasTerminated()) {
                match = s.scan(/[\w,.]+/) || s.scan(/\s+/);
            }
        }));
    });
    
}());