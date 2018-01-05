var Benote = (function(){
    var globalToC;
    var local = {};
    var notes = {};
    var fs = require('fs');
    var path = require('path');
    var webFrame = require('electron').webFrame;
    var bemu = new Bemu();
    webFrame.setVisualZoomLevelLimits(1, 1);
    webFrame.setLayoutZoomLevelLimits(0, 0);
    local.isDialogAndSideNavAdded = false;
    var hello = function() {
        readJSON(function(res) {
            globalToC = res;
        });
        bemu.addDialog("about-dialog", "bemu-dialog-courtain");
        bemu.addDialog("reset-dialog", "bemu-dialog-courtain");
        goToOverview();
    }

    local.isGlobalSearchShown = false;
    local.idOfFirstNote = -1;

    notes.create = function() {
        var tmpTime = new Date();
        globalToC.lastId++;
        globalToC.notes.push({
            name: 'New Note ' + globalToC.lastId,
            id: globalToC.lastId,
            createdOn: tmpTime.getTime(),
            lastEditOn: tmpTime.getTime(),

        });
        fs.writeFile(path.join(__dirname, '/data/notes/note'+globalToC.lastId+'.txt'), '', function (err) {

            if (err) throw err;
            fs.writeFile(path.join(__dirname, '/data/table-of-contents.json'), JSON.stringify(globalToC), function (err) {
                if (err) throw err;
                getNote(globalToC.lastId);
            });   
        });
    };

    notes.delete = function(id) {
        for(var i = 0 ; i < globalToC.notes.length ; i++) {
            if(id === globalToC.notes[i].id) {
                globalToC.notes.splice(i, 1);
                break;
            }
        }
        fs.unlink(path.join(__dirname, '/data/notes/note' + id + '.txt'), function(err) {
            if (err) throw err;
            fs.writeFile(path.join(__dirname, '/data/table-of-contents.json'), JSON.stringify(globalToC), function (err) {
                if (err) throw err;
                goToOverview();
            });

        })
    };

    notes.saveTitle = function(id) {
        var newTitle = (getElement("benote-note-title")).value;
        for(var i = 0  ; i < globalToC.notes.length ;  i++) {
            if(id === globalToC.notes[i].id) {
                globalToC.notes[i].name = newTitle;
                fs.writeFile(path.join(__dirname, '/data/table-of-contents.json'), JSON.stringify(globalToC), function (err) {
                    if (err) throw err;
                });
                break;
            }
        }
    }

    notes.saveContent = function(id) {
        var content = getElement("benote-note-text").value;
        fs.writeFile(path.join(__dirname, '/data/notes/note'+id+'.txt'), content, function (err) {
            if (err) throw err;
        });
    }

    var readJSON = function(callback) {
        var put = path.join(__dirname,'/data/table-of-contents.json');
        fs.readFile(put,function(err,res){
            if(err) throw err;
            callback(JSON.parse(res));
        });
    };

    var parseDate = function(date) {
        var h = date.getHours();
        var m = date.getMinutes();
        if(h < 10) {
            h = '0' + h;
        }
        if(m < 10) {
            m = '0' + m;
        }
        return h + ':' + m + ' ' + date.getDate() + '.' + (date.getMonth()+1) + '.' + date.getFullYear();
    };
    
    var get = function(file, callback) {
        var xobj = new XMLHttpRequest();
        xobj.open('GET', file, true);
        xobj.onreadystatechange = function () {
          if (xobj.readyState == 4 && xobj.status == '200') {
            callback(xobj.responseText);
          }
        };
        xobj.send(null);
    };

    var getElement = function (id) {
        return document.getElementById(id);
    };

    

    var renderListOverview = function (locationId) {
        var toc = getElement(locationId);
        if(toc && globalToC) {
            var container = document.createElement('ul');
            var listHead = document.createElement('li');
            listHead.setAttribute('class','list-head');
            listHead.appendChild(document.createTextNode('Notes'));
            container.appendChild(listHead);

            container.setAttribute('class','list hoverable');
            
            for(var i = 0 ; i < globalToC.notes.length ; i++) {

                var listItem = document.createElement('li');
                listItem.setAttribute('class','list-item');
                listItem.setAttribute('onclick','Benote.getNote('+globalToC.notes[i].id + ')');
                
                listItem.appendChild(document.createTextNode(globalToC.notes[i].name));
                container.appendChild(listItem);
            } 
            toc.appendChild(container);
        } else if(toc) {
            readJSON(function(res) {
                var container = document.createElement('ul');
                var listHead = document.createElement('li');
                listHead.setAttribute('class','list-head');
                listHead.appendChild(document.createTextNode('Notes'));
                container.appendChild(listHead);

                container.setAttribute('class','list hoverable');
                
                for(var i = 0 ; i < res.notes.length ; i++) {

                    var listItem = document.createElement('li');
                    listItem.setAttribute('class','list-item');
                    listItem.setAttribute('onclick','Benote.getNote('+res.notes[i].id + ')');
                    
                    listItem.appendChild(document.createTextNode(res.notes[i].name));
                    container.appendChild(listItem);
                } 
                toc.appendChild(container);
            }) 
        } else {
            console.error("Unknown ID");
        }
        
    };

    var renderAllNotesSideNav = function (locationId) {
        var toc = getElement(locationId);
        if(toc) {
            toc.innerHTML = '';
            var first = document.createElement('input');
            first.setAttribute('class','button full-width white');
            first.setAttribute('type','button');
            first.setAttribute('onclick','Benote.bemu.toggleSideNav()');
            first.setAttribute('value','Close sidebar');   
            toc.appendChild(first); 
            for(var i = 0; i < globalToC.notes.length ; i++) {
                var noteToAppend = document.createElement('input');
                noteToAppend.setAttribute('class','button full-width white');
                noteToAppend.setAttribute('type','button');
                noteToAppend.setAttribute('onclick','Benote.goToNote(' + globalToC.notes[i].id + ')');
                noteToAppend.setAttribute('value', globalToC.notes[i].name);   
                toc.appendChild(noteToAppend); 
            }
        } else {
            console.error("Unknown ID");
        }
        
    };
    
    var renderView = function (where, view, next) {
        var main = getElement(where);
        get(path.join(__dirname, '/views/' + view + '.html'), function (res) {
            main.innerHTML = res;
            next();
        });
    };

    var getNote = function(id) {
        local.openNoteId = id;
        renderView('main','single-note', function() {
            renderView('header','subviews/header', function() {
                bemu.addDropdown("header-settings-dropdown");
            });
            renderAllNotesSideNav('benote-sidenav-content');
            readJSON(function(res) {
                for(var i = 0  ; i < res.notes.length ; i++) {
                    if(res.notes[i].id === id) {
                        var title = getElement('benote-note-title');
                        var text = getElement('benote-note-text');
                        text.focus();
                        title.addEventListener('input', _.debounce(function(){notes.saveTitle(id)}, 500))
                        text.addEventListener('input', _.debounce(function(){notes.saveContent(id)}, 500))
                        title.value = res.notes[i].name;
                        get(path.join(__dirname + '/data/notes/note' + id + '.txt'), function(content) {
                            text.value = content;

                        });
                        break;
                    }
                }
                bemu.clearDialogs();
                bemu.addSideNavigation("all-notes-singless", "bemu-sidenav-courtain");
                bemu.addDialog("about-dialog", "bemu-dialog-courtain");
                bemu.addDialog("reset-dialog", "bemu-dialog-courtain");
                bemu.addDialog("confirm-delete-dialog", "bemu-dialog-courtain");
                if(!local.isDialogAndSideNavAdded) {
                    
                    local.isDialogAndSideNavAdded = true;
                }
                
            })
            
        })

    };

    var confirmDelete = function(){
        bemu.toggleDialog('confirm-delete-dialog');
        notes.delete(local.openNoteId);

    };

    var goToNote = function(id) {
        bemu.toggleSideNav();
        getNote(id);
    }

    var getIdOfOpenNote = function() {
        return local.openNoteId;
    }

    var goToOverview = function() {
        renderView('main', 'overview', function() {
            renderView('search','subviews/search', function() {
                var searchField = getElement('overview-search');
                searchField.addEventListener('input',
                    _.debounce(overviewSearch,300)
                );
            });
    
            renderView('header','subviews/header', function() {
                bemu.addDropdown("header-settings-dropdown");
            });
            
            renderListOverview("listOfNotes");
        });
    }

    var overviewSearch = function() {
        var search = getElement('overview-search').value;

        var regStr = '.*';
        for(var i = 0 ; i < search.length ; i++) {
            if(search[i] == ' ') continue;
            regStr += '[' + search[i].toLowerCase() + search[i].toUpperCase() + ']' + '.*';
        }
        var regex = new RegExp(regStr);
        var newGlobalToc = [];
        for(var i = 0 ; i < globalToC.notes.length ; i++) {
            if(regex.test(globalToC.notes[i].name)) {
                newGlobalToc.push(globalToC.notes[i]);
            }
        }
        renderNewOverview(newGlobalToc);
    }

    var renderNewOverview  = function(notes) {
        var toc = getElement('listOfNotes');
        toc.innerHTML = '';
        var container = document.createElement('ul');
        var listHead = document.createElement('li');
        listHead.setAttribute('class','list-head');
        listHead.appendChild(document.createTextNode('Notes'));
        container.appendChild(listHead);

        container.setAttribute('class','list hoverable');
        
        for(var i = 0 ; i < notes.length ; i++) {

            var listItem = document.createElement('li');
            listItem.setAttribute('class','list-item');
            listItem.setAttribute('onclick','Benote.getNote('+notes[i].id + ')');
            
            listItem.appendChild(document.createTextNode(notes[i].name));
            container.appendChild(listItem);
        } 
        toc.appendChild(container);
    }
    var closeGlobalSearch = function() {
        local.isGlobalSearchShown = false;
        var globalSearch = getElement('global-search');
        var globalSearchCourtain = getElement('bemu-global-search-courtain');
        globalSearch.classList.add('global-search-hidden');
        globalSearchCourtain.classList.add('hide');
        globalSearchCourtain.classList.add('courtain-hidden');
    }

    var onGlobalSearchInput = function () {
        var search = getElement('global-search-input').value;

        var regStr = '.*';
        for(var i = 0 ; i < search.length ; i++) {
            if(search[i] == ' ') continue;
            regStr += '[' + search[i].toLowerCase() + search[i].toUpperCase() + ']' + '.*';
        }
        var regex = new RegExp(regStr);
        var newGlobalToc = [];
        for(var i = 0 ; i < globalToC.notes.length ; i++) {
            if(regex.test(globalToC.notes[i].name)) {
                newGlobalToc.push(globalToC.notes[i]);
            }
        }
        if(newGlobalToc.length>0) {
            local.idOfFirstNote = newGlobalToc[0].id;
            var result = getElement('global-search-result');
            result.innerHTML = '';
            var container = document.createElement('ul');
            container.setAttribute('class', 'white');
        
            container.setAttribute('class','list hoverable');
            
            for(var i = 0 ; i < newGlobalToc.length ; i++) {
                if(i > 10) break;
                var listItem = document.createElement('li');
                listItem.setAttribute('class','list-item white');
                listItem.setAttribute('onclick','Benote.closeGlobalSearch();Benote.getNote('+newGlobalToc[i].id + ')');
                
                listItem.appendChild(document.createTextNode(newGlobalToc[i].name));
                container.appendChild(listItem);
            } 
            
            result.appendChild(container);
        } else {
            local.idOfFirstNote = -1;
        }
        
    };

    var exportNotes = function() {
        const {dialog} = require('electron').remote;
        var archiver = require('archiver');
        
        dialog.showOpenDialog({properties: ['openFile', 'openDirectory']},
            function(where){
                var output = fs.createWriteStream(path.join(where[0], '/benote.zip'));
                var archive = archiver('zip');

                output.on('close', function () {
                });

                archive.on('error', function(err){
                    throw err;
                });

                archive.pipe(output);
                archive.directory(path.join(__dirname,'/data'), 'data');
                archive.finalize();
            }
        );
    };

    var resetAndGoToOverView  = function() {
        reset(function(){
            var AdmZip = require('adm-zip');
            var zip = new AdmZip(path.join(__dirname, '/fresh-copy.zip'));
            zip.extractAllTo('./client', true);
            readJSON(function(res){
                globalToC = res;
                bemu.toggleDialog('reset-dialog');
                goToOverview();
            })
        })
    };

    var reset = function(next) {
        var rimraf = require('rimraf');
        rimraf(path.join(__dirname,'/data'),function(){
            next();
        })
    };

    var importNotes = function() {
        const {dialog} = require('electron').remote;
        var AdmZip = require('adm-zip');
        dialog.showOpenDialog({ filters: [

            { name: 'Benoze Zip', extensions: ['zip'] }
         
           ]},
            function(where){
                var zip = new AdmZip(where[0]);
                reset(function(){
                    zip.extractAllTo('./client', true);
                    readJSON(function(res){
                        globalToC = res;
                        goToOverview();
                    })
                    
                });
                
            }
        );
        console.log('Import');
    };

    local.keyboardEvents = function(e) {
        var evtobj = window.event? event : e
        if (evtobj.keyCode == 83 && evtobj.ctrlKey) {
            local.isGlobalSearchShown = true;
            var globalSearch = getElement('global-search');
            var globalSearchInput = getElement('global-search-input');
            var result = getElement('global-search-result');
            result.innerHTML = '';
            globalSearchInput.value = '';
            globalSearchInput
            .addEventListener('input', _.debounce(onGlobalSearchInput, 200))
            var globalSearchCourtain = getElement('bemu-global-search-courtain');
            globalSearch.classList.remove('global-search-hidden');
            globalSearchCourtain.classList.remove('hide');
            globalSearchCourtain.classList.remove('courtain-hidden');
            globalSearchInput.focus();
        } else if (evtobj.keyCode == 79 && evtobj.ctrlKey) {
            goToOverview();
        } else if (evtobj.keyCode == 78 && evtobj.ctrlKey) {
            notes.create();
        } else if(evtobj.keyCode == 27) {
            if(local.isGlobalSearchShown) {
                closeGlobalSearch();
            }
        } else if(evtobj.keyCode == 13) {
            if(local.isGlobalSearchShown && local.idOfFirstNote != -1) {
                closeGlobalSearch();
                getNote(local.idOfFirstNote);
            }
        }

    }
    document.onkeydown = local.keyboardEvents;

    
    return {
        hello: hello,
        getElement: getElement,
        parseDate: parseDate,
        get: get,
        renderListOverview: renderListOverview,
        readJSON: readJSON,
        notes: notes,
        renderView: renderView,
        getNote: getNote,
        getIdOfOpenNote: getIdOfOpenNote,
        goToOverview: goToOverview,
        renderAllNotesSideNav: renderAllNotesSideNav,
        goToNote: goToNote,
        confirmDelete: confirmDelete,
        overviewSearch: overviewSearch,
        closeGlobalSearch: closeGlobalSearch,
        export: exportNotes,
        import: importNotes,
        resetAndGoToOverView: resetAndGoToOverView,
        bemu: bemu
    };
})();