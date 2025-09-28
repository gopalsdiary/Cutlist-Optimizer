/**
 * File System Service for CutList Optimizer
 * Provides functionality to browse and import files from the local file system
 */
(function () {
    'use strict';

    angular.module('app').factory('FileSystemService', ['$q', '$window', function ($q, $window) {

        // Service object
        var service = {};
        
        // Current path for file system navigation
        var currentPath = '';
        
        // File system API (will be initialized when supported)
        var fsAPI = null;

        /**
         * Check if File System Access API is supported in the browser
         */
        service.isSupported = function() {
            return 'showDirectoryPicker' in window && 'showOpenFilePicker' in window;
        };

        /**
         * Initialize the file system service
         */
        service.initialize = function() {
            var deferred = $q.defer();
            
            if (!service.isSupported()) {
                deferred.reject('File System Access API is not supported in your browser');
                return deferred.promise;
            }
            
            deferred.resolve(true);
            return deferred.promise;
        };

        /**
         * Open directory picker dialog
         */
        service.openDirectoryPicker = function() {
            var deferred = $q.defer();
            
            if (!service.isSupported()) {
                deferred.reject('File System Access API is not supported in your browser');
                return deferred.promise;
            }

            window.showDirectoryPicker()
                .then(function(directoryHandle) {
                    fsAPI = directoryHandle;
                    currentPath = directoryHandle.name;
                    deferred.resolve({
                        path: currentPath,
                        handle: directoryHandle
                    });
                })
                .catch(function(error) {
                    deferred.reject(error.message || 'Failed to access directory');
                });
                
            return deferred.promise;
        };

        /**
         * List contents of the current directory
         */
        service.listDirectory = function(dirHandle) {
            var deferred = $q.defer();
            var handle = dirHandle || fsAPI;
            
            if (!handle) {
                deferred.reject('No directory selected. Please select a directory first.');
                return deferred.promise;
            }
            
            var entries = [];
            
            // Read all entries from the directory
            var readEntries = function() {
                handle.entries()
                    .then(async function(entriesIterator) {
                        for await (const entry of entriesIterator) {
                            const name = entry[0];
                            const item = entry[1];
                            const isDirectory = item.kind === 'directory';
                            
                            entries.push({
                                name: name,
                                isDirectory: isDirectory,
                                handle: item
                            });
                        }
                        
                        // Sort entries: directories first, then files
                        entries.sort(function(a, b) {
                            if (a.isDirectory && !b.isDirectory) return -1;
                            if (!a.isDirectory && b.isDirectory) return 1;
                            return a.name.localeCompare(b.name);
                        });
                        
                        deferred.resolve(entries);
                    })
                    .catch(function(error) {
                        deferred.reject(error.message || 'Failed to read directory contents');
                    });
            };
            
            readEntries();
            return deferred.promise;
        };

        /**
         * Read file content as text
         */
        service.readFileAsText = function(fileHandle) {
            var deferred = $q.defer();
            
            if (!fileHandle) {
                deferred.reject('Invalid file handle');
                return deferred.promise;
            }

            fileHandle.getFile()
                .then(function(file) {
                    var reader = new FileReader();
                    
                    reader.onload = function(e) {
                        deferred.resolve(e.target.result);
                    };
                    
                    reader.onerror = function() {
                        deferred.reject('Failed to read file');
                    };
                    
                    reader.readAsText(file);
                })
                .catch(function(error) {
                    deferred.reject(error.message || 'Failed to get file');
                });
                
            return deferred.promise;
        };

        /**
         * Parse CSV file content and convert to panels
         */
        service.parseCsvToPanels = function(content, separator) {
            var deferred = $q.defer();
            var sep = separator || ',';
            var lines = content.split('\n');
            var panels = [];
            
            // Skip header row
            for (var i = 1; i < lines.length; i++) {
                var line = lines[i].trim();
                if (!line) continue;
                
                var parts = line.split(sep);
                if (parts.length >= 4) {
                    var panel = {
                        width: parseFloat(parts[0]),
                        height: parseFloat(parts[1]),
                        count: parseInt(parts[2], 10),
                        label: parts[3] || ''
                    };
                    
                    // Add material if available
                    if (parts.length > 4) {
                        panel.material = parts[4];
                    }
                    
                    panels.push(panel);
                }
            }
            
            deferred.resolve(panels);
            return deferred.promise;
        };
        
        /**
         * Open file picker dialog
         */
        service.openFilePicker = function(options) {
            var deferred = $q.defer();
            var pickerOpts = {
                types: [{
                    description: 'CSV Files',
                    accept: {
                        'text/csv': ['.csv']
                    }
                }],
                excludeAcceptAllOption: false,
                multiple: false
            };
            
            // Extend with custom options if provided
            if (options) {
                angular.extend(pickerOpts, options);
            }
            
            window.showOpenFilePicker(pickerOpts)
                .then(function(fileHandles) {
                    if (fileHandles.length > 0) {
                        deferred.resolve(fileHandles[0]);
                    } else {
                        deferred.reject('No file selected');
                    }
                })
                .catch(function(error) {
                    deferred.reject(error.message || 'Failed to open file picker');
                });
                
            return deferred.promise;
        };

        return service;
    }]);

})();