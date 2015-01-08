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
function simplifyText(event) {

  //Grabs data from input elements
  var input = document.getElementById("input").value;
  
  //Makes the results pane close
  hide(document.getElementById("wrapper"));

  //wait for pane to close
  var timer = setTimeout(function() {
    var width=500;
    if (document.getElementById("wrapper").offsetWidth<550) width = document.getElementById("wrapper").offsetWidth - 50;

    document.getElementById("result").innerHTML = "";

    var inputFunction = Truthful.createExpression(input);

    //If there are no errors, show the graph
    if (!Truthful.hasErrors()) {
      var inputFormula = document.createElement("div");
      var variablesObj = inputFunction.variables();
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

      table.push([]);
      for (var row=0; row<totalRows; row++) {
        var values = {};
        for (var column=0; column<table.length-1; column++) {
          values[variables[column]]=table[column][row];
        }

        table[col].push(inputFunction.result(values));
      }

      htmlTable += "<table><tr>";

      for (var i=0; i<variables.length; i++) {
        htmlTable += "<th>" + variables[i] + "</th>";
      }
      htmlTable += "<th>" + input + "</th></tr>"

      for (var row=0; row<totalRows; row++) {
        htmlTable += "<tr>";
        for (var column=0; column<table.length; column++) {
          htmlTable += "<td>" + table[column][row] + "</td>";
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
      document.getElementById("wrapper").className="open";
      Truthful.clearErrors();
    }
  }, 800);
}

function onKeyUp(event) {
  if (event.keyCode==13) {
    simplifyText();
  }
}

window.onload = function() {
  document.getElementById("calculate").addEventListener("click", simplifyText);
  document.getElementById("input").addEventListener("keyup", onKeyUp);
  simplifyText();
};