# using.js

Simple JavaScript module loader.

## Usage

Add your modules to using's paths:

    using.modules.dep1 = "dep1.js";
    using.modules.dep2 = "dep2.js";
    using.modules.dep3 = "dep3.js";

Defining a module with two dependencies:

    using("dep1", "dep2").define("dep3", function (dep1, dep2) {
        
        function dep3 () {
            dep1();
            dep2();
        }
        
        return dep3;
        
    });

Running some code after loading its dependencies:

    using("dep3").run(function (dep3) {
        console.log(dep3());
    });

Loading a file via AJAX as a dependency:

    using("ajax:myFile.json").run(function (myFileRequest) {
        console.log(JSON.parse(myFileRequest.responseText));
    });
