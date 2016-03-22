define("optional", [], {
    load : function (moduleName, parentRequire, onload, config){
        // http://stackoverflow.com/questions/14164610/requirejs-optional-dependency/27422370#27422370
        var onLoadSuccess = function(moduleInstance){
            // Module successfully loaded, call the onload callback so that
            // requirejs can work its internal magic.
            onload(moduleInstance);
        }

        var onLoadFailure = function(err){
            // optional module failed to load.
            var failedId = err.requireModules && err.requireModules[0];
            console.warn("Could not load optional module: " + failedId);

            // Undefine the module to cleanup internal stuff in requireJS
            requirejs.undef(failedId);

            // Now define the module instance as undefined
            // (NOTE: you can return any other value you want here)
            define(failedId, [], function(){return undefined;});

            // Now require the module make sure that requireJS thinks 
            // that is it loaded. Since we've just defined it, requirejs 
            // will not attempt to download any more script files and
            // will just call the onLoadSuccess handler immediately
            parentRequire([failedId], onLoadSuccess);
        }

        parentRequire([moduleName], onLoadSuccess, onLoadFailure);
    }
});