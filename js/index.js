var hide = function(element) {
    element.style.overflow = "hidden";
    element.style.height = getComputedStyle(element).height;
    element.style.transition = 'all .5s ease';
    element.offsetHeight = "" + element.offsetHeight; // force repaint
    element.style.height = '0';
    element.style.marginTop = "0";
    element.style.marginBottom = "0";
};
var show = function(element) {
    var prevHeight = element.style.height;
    element.style.height = 'auto';
    var endHeight = getComputedStyle(element).height;
    element.style.height = prevHeight;
    element.offsetHeight = "" + element.offsetHeight; // force repaint
    element.style.transition = 'all .5s ease';
    element.style.height = endHeight;
    element.style.marginTop = "";
    element.style.marginBottom = "";
    element.addEventListener('transitionend', function transitionEnd(event) {
        if (event.propertyName == 'height' && this.style.height == endHeight) {
            this.style.transition = '';
            this.style.height = 'auto';
            this.style.overflow = "visible";
        }
        this.removeEventListener('transitionend', transitionEnd, false);
    }, false);
};

var calculate = function(input) {
    //Makes the results pane close
    hide(document.getElementById("wrapper"));

    //wait for pane to close
    var timer = setTimeout(function() {
        var width=500;
        if (document.getElementById("wrapper").offsetWidth<550) width = document.getElementById("wrapper").offsetWidth - 50;

        document.getElementById("result").innerHTML = "";

        var table = Truthful.truthTable(input);

        //If there are no errors, show the table
        if (!Truthful.hasErrors()) {
            document.getElementById("result").appendChild(table);

            //Otherwise, show the errors, then clear the error list
        } else {
            document.getElementById("result").appendChild(Truthful.displayErrors());

            Truthful.clearErrors();
        }
        show(document.getElementById("wrapper"));
    }, 800);

};
function processInput(event) {

    //Grabs data from input elements
    var raw = document.getElementById("input").value;
    var input = raw.split(",");

    if (event) {
        //Make this to the browser history
        window.history.pushState({"input":input}, "Truthful: " + raw, "?input=" + encodeURIComponent(raw));
    }

    calculate(input);

}

function onKeyUp(event) {
    if (event.keyCode==13) {
        processInput(event);
    }
}

window.onload = function() {
    var initial = document.getElementById("input").value;
    document.getElementById("calculate").addEventListener("click", processInput);
    document.getElementById("input").addEventListener("keyup", onKeyUp);

    var $_GET = {};
    var args = location.search.substr(1).split(/&/);
    for (var i=0; i<args.length; ++i) {
        var tmp = args[i].split(/=/);
        if (tmp[0] != "") {
            $_GET[decodeURIComponent(tmp[0])] = decodeURIComponent(tmp.slice(1).join("").replace("+", " "));
        }
    }
    if ($_GET["input"]) {
        document.getElementById("input").value = decodeURIComponent($_GET["input"]);
    }

    processInput(false);

    window.onpopstate = function (event) {
        if (event.state) {
            calculate(event.state.input);
            document.getElementById("input").value = event.state.input.join(",");
        } else {
            calculate([initial]);
            document.getElementById("input").value = initial;

        }
    }
};
