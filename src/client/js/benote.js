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
            console.log(res);
            globalToC = res;
        });
        goToOverview();
    }

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
        console.log(put);
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
                console.log('Header: OK');
            });
            console.log('Single-note: OK');
            renderAllNotesSideNav('benote-sidenav-content');
            readJSON(function(res) {
                for(var i = 0  ; i < res.notes.length ; i++) {
                    if(res.notes[i].id === id) {
                        var title = getElement('benote-note-title');
                        var text = getElement('benote-note-text');
                        title.addEventListener('input', _.debounce(function(){notes.saveTitle(id)}, 1000))
                        text.addEventListener('input', _.debounce(function(){notes.saveContent(id)}, 1000))
                        title.value = res.notes[i].name;
                        get(path.join(__dirname + '/data/notes/note' + id + '.txt'), function(content) {
                            text.value = content;

                        });
                        break;
                    }
                }
                bemu.clearDialogs();
                bemu.addSideNavigation("all-notes-singless", "bemu-sidenav-courtain");
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
        console.log(newGlobalToc);
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

    local.keyboardEvents = function(e) {
        var evtobj = window.event? event : e
        if (evtobj.keyCode == 83 && evtobj.ctrlKey) {
            $('#search-note-modal').modal('open');
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
        bemu: bemu
    };
})();