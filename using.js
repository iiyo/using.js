/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

 Using.js - Simple JavaScript module loader.

 Copyright (c) 2015 Jonathan Steinbeck
 All rights reserved.

 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are met:

 * Redistributions of source code must retain the above copyright
   notice, this list of conditions and the following disclaimer.

 * Redistributions in binary form must reproduce the above copyright
   notice, this list of conditions and the following disclaimer in the
   documentation and/or other materials provided with the distribution.

 * Neither the name using.js nor the names of its contributors 
   may be used to endorse or promote products derived from this software 
   without specific prior written permission.

 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDERS BE LIABLE FOR ANY
 DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

/* global document, console */

var using = (function () {
    
    "use strict";
    
    var modules = {}, loadedScripts = {}, dependencies = {}, definitions = {}, dependingOn = {};
    var runners = [], selectors = {}, runnersCheckInProgress = false;
    
    function updateModule (moduleName) {
        
        var deps = [], depNames = dependencies[moduleName], moduleResult;
        var currentSelectors = selectors[moduleName];
        
        if (modules[moduleName]) {
            return;
        }
        
        if (depNames.length === 0) {
            
            moduleResult = definitions[moduleName]();
            
            if (!moduleResult) {
                console.error("Module '" + moduleName + "' returned nothing");
            }
            
            modules[moduleName] = moduleResult;
            
            dependingOn[moduleName].forEach(updateModule);
        }
        else if (allModulesLoaded(depNames)) {
            
            //console.log("currentSelectors, depNames:", currentSelectors, depNames);
            
            depNames.forEach(function (name, i) {
                deps.push(select(name, currentSelectors[i]));
            });
            
            moduleResult = definitions[moduleName].apply(undefined, deps);
            
            if (!moduleResult) {
                console.error("Module '" + moduleName + "' returned nothing.");
            }
            
            modules[moduleName] = moduleResult;
            
            dependingOn[moduleName].forEach(updateModule);
        }
        
        startRunnersCheck();
    }
    
    function startRunnersCheck () {
        
        if (runnersCheckInProgress) {
            return;
        }
        
        runnersCheckInProgress = true;
        
        checkRunners();
    }
    
    function checkRunners () {
        
        runners.forEach(function (runner) {
            runner();
        });
        
        if (runners.length) {
            setTimeout(checkRunners, 20);
        }
        else {
            runnersCheckInProgress = false;
        }
    }
    
    function allModulesLoaded (moduleNames) {
        
        var loaded = true;
        
        moduleNames.forEach(function (name) {
            if (!modules[name]) {
                loaded = false;
            }
        });
        
        return loaded;
    }
    
    function select (moduleName, selectors) {
        
        var argSelectors, mod;
        
        mod = modules[moduleName];
        
        if (!selectors) {
            console.log("Module has no selectors:", moduleName);
            return mod;
        }
        
        argSelectors = selectors.slice();
        
        while (argSelectors.length) {
            
            if (typeof mod !== "object" || mod === null) {
                throw new TypeError("Module '" + moduleName + "' has no property '" +
                    argSelectors.join("::") + "'.");
            }
            
            mod = mod[argSelectors.shift()];
        }
        
        return mod;
    }
    
    function using (/* module names */) {
        
        var args, moduleNames, moduleSelectors, capabilityObject;
        
        moduleNames = [];
        moduleSelectors = [];
        args = [].slice.call(arguments);
        
        args.forEach(function (arg, index) {
            
            var selector, moduleName;
            var parts = arg.split("::");
            var protocolParts = parts[0].split(":");
            var protocol = protocolParts.length > 1 ? protocolParts[0] : "";
            
            parts[0] = protocolParts.length > 1 ? protocolParts[1] : protocolParts[0];
            
            selector = parts.slice(1);
            moduleName = parts[0];
            
            if (protocol === "ajax") {
                moduleNames.push(arg);
            }
            else {
                moduleNames.push(moduleName);
            }
            
            moduleSelectors.push(selector);
            
            if (!(moduleName in dependencies) && !(moduleName in modules)) {
                
                if (protocol === "ajax") {
                    
                    dependencies[arg] = [];
                    
                    if (!dependingOn[arg]) {
                        dependingOn[arg] = [];
                    }
                    
                    using.ajax(using.ajax.HTTP_METHOD_GET, arg.replace(/^ajax:/, ""),
                        null, ajaxResourceSuccessFn, ajaxResourceSuccessFn);
                }
                else {
                    
                    dependencies[moduleName] = [];
                    
                    if (!dependingOn[moduleName]) {
                        dependingOn[moduleName] = [];
                    }
                    
                    loadModule(moduleName);
                }
            }
            
            function ajaxResourceSuccessFn (request) {
                modules[arg] = request;
                dependingOn[arg].forEach(updateModule);
            }
        });
        
        
        capabilityObject = {
            run: run,
            define: define
        };
        
        return capabilityObject;
        
        
        function run (callback) {
            
            if (!runner(true)) {
                runners.push(runner);
            }
            
            startRunnersCheck();
            
            return capabilityObject;
            
            function runner (doNotRemove) {
                
                var deps = [];
                
                if (allModulesLoaded(moduleNames)) {
                    
                    //console.log("moduleSelectors, moduleNames:", moduleSelectors, moduleNames);
                    
                    moduleNames.forEach(function (name, i) {
                        deps.push(select(name, moduleSelectors[i]));
                    });
                    
                    callback.apply(undefined, deps);
                    
                    if (!doNotRemove) {
                        runners.splice(runners.indexOf(runner), 1);
                    }
                    
                    return true;
                }
                
                return false;
            }
        }
        
        function define (moduleName, callback) {
            
            if (exists(moduleName)) {
                console.warn("Module '" + moduleName + "' is already defined.");
                return capabilityObject;
            }
            
            definitions[moduleName] = callback;
            dependencies[moduleName] = moduleNames;
            selectors[moduleName] = moduleSelectors;
            
            if (!dependingOn[moduleName]) {
                dependingOn[moduleName] = [];
            }
            
            moduleNames.forEach(function (name) {
                
                if (!dependingOn[name]) {
                    dependingOn[name] = [];
                }
                
                dependingOn[name].push(moduleName);
            });
            
            updateModule(moduleName);
            
            return capabilityObject;
            
        }
    }
    
    function exists (name) {
        return name in definitions;
    }
    
    using.exists = exists;
    using.path = "";
    
    (function () {
        
        var scripts = document.getElementsByTagName("script");
        
        using.path = scripts[scripts.length - 1].src.replace(/using\.js$/, "");
        
    }());
    
    using.modules = {};
    
    function loadModule (moduleName) {
        
        if (!(moduleName in using.modules)) {
            throw new Error("Unknown module '" + moduleName + "'.");
        }
        
        using.loadScript(using.modules[moduleName]);
    }
    
    using.loadScript = function (url) {
        
        var script = document.createElement("script");
        var scriptId = "using_script_" + url;
        
        if (loadedScripts[url] || document.getElementById(scriptId)) {
            return;
        }
        
        script.setAttribute("id", scriptId);
        
        script.src = url;
        
        document.body.appendChild(script);
    };
    
    return using;
    
}());

/* global using, XMLHttpRequest, ActiveXObject */

using.ajax = (function () {
    
    var HTTP_STATUS_OK = 200;
    var READY_STATE_UNSENT = 0;
    var READY_STATE_OPENED = 1;
    var READY_STATE_HEADERS_RECEIVED = 2;
    var READY_STATE_LOADING = 3;
    var READY_STATE_DONE = 4;
    
    function ajax (method, url, data, onSuccess, onError, timeout) {
        
        var requestObject = XMLHttpRequest ?
            new XMLHttpRequest() :
            new ActiveXObject("Microsoft.XMLHTTP");
        
        requestObject.open(method, url + "?random=" + Math.random(), true);
        
        if (timeout) {
            
            requestObject.timeout = timeout;
            
            requestObject.ontimeout = function () {
                
                requestObject.abort();
                
                if (!onError) {
                    return;
                }
                
                onError(new Error("Connection has reached the timeout of " + timeout + " ms."));
            };
        }
        
        requestObject.onreadystatechange = function() {
            
            var done, statusOk;
            
            done = requestObject.readyState === READY_STATE_DONE;
            
            if (done) {
                
                try {
                    statusOk = requestObject.status === HTTP_STATUS_OK;
                }
                catch (error) {
                    console.error(error);
                    statusOk = false;
                }
                
                if (statusOk) {
                    onSuccess(requestObject);
                }
                else {
                    onError(requestObject);
                }
            }
        };
        
        if (data) {
            requestObject.send(data);
        }
        else {
            requestObject.send();
        }
        
        return requestObject;
    }
    
    ajax.HTTP_STATUS_OK = HTTP_STATUS_OK;
    
    ajax.READY_STATE_UNSENT = READY_STATE_UNSENT;
    ajax.READY_STATE_OPENED = READY_STATE_OPENED;
    ajax.READY_STATE_HEADERS_RECEIVED = READY_STATE_HEADERS_RECEIVED;
    ajax.READY_STATE_LOADING = READY_STATE_LOADING;
    ajax.READY_STATE_DONE = READY_STATE_DONE;
    
    ajax.HTTP_METHOD_GET = "GET";
    ajax.HTTP_METHOD_POST = "POST";
    ajax.HTTP_METHOD_PUT = "PUT";
    ajax.HTTP_METHOD_DELETE = "DELETE";
    ajax.HTTP_METHOD_HEAD = "HEAD";
    
    return ajax;
    
}());
