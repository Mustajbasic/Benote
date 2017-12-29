
function Bemu() {
    var dropdownList = [];
    var dialogList = [];
    var dropdownListOnlyIds = [];
    var sidenav = {};
    var expose = {};
    var numberOfShownDropdowns = 0;
    var body = document.getElementsByTagName('body')[0];
    var closeDropdown = function (id) {
        for (var i = 0; i < dropdownList.length; i++) {
            if (dropdownList[i].getId() == id) {
                dropdownList[i].close();
            }
        }
    };
    expose.addSideNavigation = function (id, courtain) {
        sidenav = BemuSideNavigation(id, courtain);

    };
    expose.toggleSideNav = function () {
        sidenav.toggle();
    };
    expose.addDialog = function (id, courtain) {
        dialogList.push(BemuDialog(id, courtain));
    };
    expose.toggleDialog = function (id) {
        
        for (var i = 0; i < dialogList.length; i++) {
            if (dialogList[i].getId() == id) {
                body.classList.toggle('noscroll');
                dialogList[i].toggle();
            }
        }
    };
    expose.addDropdown = function (id) {
        dropdownList.push(BemuDropdown(id));
        dropdownListOnlyIds.push(id);
        window.onclick = function (event) {
            for (var i = 0; i < dropdownListOnlyIds.length; i++) {
                if (!event.target.matches('#' + dropdownListOnlyIds[i])) {
                    closeDropdown(dropdownListOnlyIds[i]);
                }
            }
        };
    };
    expose.toggleDropdown = function (id) {
        for (var i = 0; i < dropdownList.length; i++) {
            if (dropdownList[i].getId() == id) {
                if (dropdownList[i].toggleDropdown()) {
                    numberOfShownDropdowns++;
                } else {
                    numberOfShownDropdowns--;
                }
            }
        }
    };
    expose.closeAllDropdowns = function () {
        if (numberOfShownDropdowns > 0) {
            for (var i = 0; i < dropdownList.length; i++) {
                if (dropdownList[i].isShown()) {
                    dropdownList[i].toggleDropdown(dropdownList[i].getId());
                }
            }
            numberOfShownDropdowns = 0;
        }
    };
    return expose;
}

function BemuDropdown(idParam) {
    var id = idParam;
    var dropdown = document.getElementById(id);
    var dropdownInner = dropdown.getElementsByClassName('dropdown-list')[0];
    var dropdownShownStatus = false;
    var expose = {};
    expose.toggleDropdown = function () {
        if (dropdownShownStatus) {
            dropdownInner.className = "dropdown-list hide";
            dropdownShownStatus = false;
        } else {
            dropdownInner.className = "dropdown-list";
            dropdownShownStatus = true;
        }
        return dropdownShownStatus;
    };
    expose.close = function () {
        dropdownShownStatus = false;
        dropdownInner.className = "dropdown-list hide";
    };
    expose.isShown = function () {
        return dropdownShownStatus;
    };
    expose.getId = function () {
        return id;
    };
    return expose;
}

function BemuSideNavigation(idParam, courtainParam) {
    var id = idParam;
    var courtainId = courtainParam;
    var sidenav = document.getElementById(id);
    var courtain = document.getElementById(courtainId);
    var isOpen = false;

    var expose = {};
    courtain.onclick = function () {
        expose.toggle();
    };
    expose.toggle = function () {
        sidenav.classList.toggle('sidenav-hidden');

        if (isOpen) {
            courtain.classList.toggle('courtain-hidden');
            setTimeout(courtain.classList.toggle('hide'), 100);
        } else {
            courtain.classList.toggle('hide');
            courtain.classList.toggle('courtain-hidden');
        }


    };

    return expose;
}

function BemuDialog(idParam, courtainParam) {
    var id = idParam;
    var courtainId = courtainParam;
    var dialog = document.getElementById(id);
    var courtain = document.getElementById(courtainId);
    var isOpen = false;

    var expose = {};
    expose.getId = function () {
        return id;
    };
    expose.getCourtainId = function () {
        return courtainId;
    };
    expose.toggle = function () {
        dialog.classList.toggle('dialog-hidden');

        if (isOpen) {
            courtain.classList.toggle('courtain-hidden');
            setTimeout(courtain.classList.toggle('hide'), 100);
        } else {
            courtain.classList.toggle('hide');
            courtain.classList.toggle('courtain-hidden');
        }


    };
    return expose;
}