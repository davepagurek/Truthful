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

        var inputFunction = [];
        for (var i=0; i<input.length; i++) {
            inputFunction.push(Truthful.createExpression(input[i]));
        }

        //If there are no errors, show the table
        if (!Truthful.hasErrors()) {
            var inputFormula = document.createElement("div");
            var variablesObj = {};
            for (i=0; i<inputFunction.length; i++) {
                var fnVariables = inputFunction[i].variables();
                for (var key in fnVariables) {
                    variablesObj[key] = 1;
                }
            }
            var variables = [];
            for (var key in variablesObj) {
                variables.push(key);
            }
            variables.sort();

            var htmlTable = "";

            var table = [];
            var col=0;
            var totalRows = Math.pow(2, variables.length);
            for (var key in variables) {
                table.push([]);
                var value = 0;
                for (var row=0; row<totalRows; row++) {
                    table[col].push(value);
                    if ((row+1)%Math.pow(2, variables.length-col-1) == 0) {
                        if (value) {
                            value = 0;
                        } else {
                            value = 1;
                        }
                    }
                }
                col++;
            }

            for (var i=0; i<inputFunction.length; i++) {
                table.push([]);
            }
            for (var row=0; row<totalRows; row++) {
                var values = {};
                for (var column=0; column<table.length-1; column++) {
                    values[variables[column]]=table[column][row];
                }

                for (i=0; i<inputFunction.length; i++) {
                    table[variables.length+i].push(inputFunction[i].result(values));
                }
            }

            htmlTable += "<table><tr>";

            for (var i=0; i<variables.length; i++) {
                htmlTable += "<th>" + variables[i] + "</th>";
            }
            for (i=0; i<input.length; i++) {
                htmlTable += "<th>" + input[i] + "</th>";
            }
            htmlTable += "</tr>";

            for (var row=0; row<totalRows; row++) {
                htmlTable += "<tr>";
                for (var column=0; column<table.length; column++) {
                    htmlTable += "<td class='" + (table[column][row]?"on":"off") + ((column==variables.length)?" firstResult":"") + "'>" + table[column][row] + "</td>";
                }
                htmlTable += "</tr>";
            }

            htmlTable += "</table>";

            //console.table(table);
            inputFormula.innerHTML = htmlTable;



            document.getElementById("result").appendChild(inputFormula);
            show(document.getElementById("wrapper"));

            //Otherwise, show the errors, then clear the error list
        } else {
            document.getElementById("result").appendChild(Truthful.displayErrors());
            show(document.getElementById("wrapper"));
            Truthful.clearErrors();
        }
    }, 800);

};
function processInput(event) {

    //Grabs data from input elements
    var input = document.getElementById("input").value.split(",");

    if (event) {
        //Make this to the browser history
        window.history.pushState({"input":input});
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
