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

    var hello = function() {
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
        fs.writeFile(__dirname + '/data/notes/note'+globalToC.lastId+'.txt', '', function (err) {

            if (err) throw err;
            fs.writeFile(__dirname + '/data/table-of-contents.json', JSON.stringify(globalToC), function (err) {
                if (err) throw err;
                getNote(globalToC.lastId);
            });
            
    
        });
    };

    notes.delete = function(id) {
        for(var i = 0  ; i < globalToC.notes.length ;  i++) {
            if(id === globalToC.notes[i].id) {
                globalToC.notes.splice(i,1);
                break;
            }
        }
        fs.unlink(__dirname + '/data/notes/note'+id+'.txt', function(err) {
            if (err) throw err;
            fs.writeFile(__dirname + '/data/table-of-contents.json', JSON.stringify(globalToC), function (err) {
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
                fs.writeFile(__dirname + '/data/table-of-contents.json', JSON.stringify(globalToC), function (err) {
                    if (err) throw err;
                });
                break;
            }
        }
    }

    notes.saveContent = function(id) {
        var content = getElement("benote-note-text").value;
        fs.writeFile(__dirname + '/data/notes/note'+id+'.txt', content, function (err) {
            if (err) throw err;
        });
    }

    var readJSON = function(file, callback) {
        var xobj = new XMLHttpRequest();
        xobj.overrideMimeType('application/json');
        xobj.open('GET', file, true);
        xobj.onreadystatechange = function () {
          if (xobj.readyState == 4 && xobj.status == '200') {
            callback(JSON.parse(xobj.responseText));
          }
        };
        xobj.send(null);
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

    var renderTableOfContents = function (locationId) {
        var toc = getElement(locationId);
        if(toc) {
            readJSON(__dirname + '/data/table-of-contents.json', function(res) {
                var container = document.createElement('div');
                container.setAttribute('class', 'list-group');
                for(var i = 0 ; i < res.notes.length ; i++) {
                    var a = document.createElement('a');
                    a.setAttribute('class','list-group-item list-group-item-action flex-column align-items-start');
                    var aDiv = document.createElement('div');
                    aDiv.setAttribute('class','d-flex w-100 justify-content-between');
                    var h5 = document.createElement('h5');
                    h5.setAttribute('class','mb-1');
                    var date = new Date(res.notes[i].createdOn);
                    h5.appendChild(document.createTextNode(res.notes[i].name));
                    var small = document.createElement('small');
                    small.appendChild(document.createTextNode(parseDate(date)));
                    aDiv.appendChild(h5);
                    aDiv.appendChild(small);
                    a.appendChild(aDiv);
                    a.setAttribute('onclick','Benote.getNote('+res.notes[i].id + ')');
                    container.appendChild(a);
                }
                toc.appendChild(container);
            });
        } else {
            console.error("Unknown ID");
        }
        
    };

    var renderListOverview = function (locationId) {
        var toc = getElement(locationId);
        if(toc) {
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
        } else {
            console.error("Unknown ID");
        }
        
    };

    var renderAllNotesSideNav = function (locationId) {
        var toc = getElement(locationId);
        if(toc) {
            toc.innerHTML = '';
            for(var i = 0; i < globalToC.notes.length ; i++) {
                var li = document.createElement('li');
                var a = document.createElement('a');
                li.setAttribute('onclick','Benote.goToNote('+globalToC.notes[i].id + ')');
                a.appendChild(document.createTextNode(globalToC.notes[i].name));
                li.appendChild(a);
                toc.appendChild(li);
            }
        } else {
            console.error("Unknown ID");
        }
        
    };
    
    var renderView = function (where, view, next) {
        var main = getElement(where);
        get(__dirname + '/views/' + view + '.html', function (res) {
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
            renderAllNotesSideNav('all-notes-single');
            readJSON(__dirname + '/data/table-of-contents.json', function(res) {
                for(var i = 0  ; i < res.notes.length ; i++) {
                    if(res.notes[i].id === id) {
                        var title = getElement('benote-note-title');
                        var text = getElement('benote-note-text');
                        title.addEventListener('input', _.debounce(function(){notes.saveTitle(id)}, 1000))
                        text.addEventListener('input', _.debounce(function(){notes.saveContent(id)}, 1000))
                        title.value = res.notes[i].name;
                        get(__dirname + '/data/notes/note' + id + '.txt', function(content) {
                            text.value = content;

                        });
                        bemu.addSideNavigation("all-notes-singless", "bemu-courtain");
                        break;
                    }
                }
            })
            
        })

    };

    var goToNote = function(id) {
        $('.button-collapse').sideNav('show');
        getNote(id);
    }

    var getIdOfOpenNote = function() {
        return local.openNoteId;
    }

    var goToOverview = function() {
        renderView('main', 'overview', function() {
            renderView('search','subviews/search', function() {
            });
    
            renderView('header','subviews/header', function() {
            });
            
            renderListOverview("listOfNotes");
        });
    }

    local.keyboardEvents = function(e) {
        var evtobj = window.event? event : e
        if (evtobj.keyCode == 83 && evtobj.ctrlKey) {
            $('#search-note-modal').modal('open');
        }

    }
    document.onkeydown = local.keyboardEvents;

    readJSON(__dirname + '/data/table-of-contents.json', function(res) {
        globalToC = res;
    });
    
    return {
        hello: hello,
        getElement: getElement,
        parseDate: parseDate,
        get: get,
        renderTableOfContents: renderTableOfContents,
        renderListOverview: renderListOverview,
        readJSON: readJSON,
        notes: notes,
        renderView: renderView,
        getNote: getNote,
        getIdOfOpenNote: getIdOfOpenNote,
        goToOverview: goToOverview,
        renderAllNotesSideNav: renderAllNotesSideNav,
        goToNote: goToNote,
        bemu: bemu
    };
})();