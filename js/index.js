window.onload = function() {
  var calculateBtn = document.getElementById("calculate");
  var georgeBtn = document.getElementById("george");
  var input = document.getElementById("input");
  var result = document.getElementById("result");
  var wrapper = document.getElementById("wrapper");
  var georgeContainer = document.getElementById("george_container");
  var georgeResult = document.getElementById("george_result");
  var hideGeorge = document.getElementById("hide_george");
  var table = null;

  var initial = input.value;

  // Use input from URL if it exists
  var q = new QueryString();
  if (q.value("input")) input.value = q.value("input");

  function toggleExplicit(event) {
    event.preventDefault();
    var expression = this.getAttribute("data-expression");
    if (expression) {
      this.setAttribute("data-label", this.textContent);
      this.removeAttribute("data-expression");
      this.textContent = expression;
    } else {
      var label = this.getAttribute("data-label");
      this.setAttribute("data-expression", this.textContent);
      this.removeAttribute("data-label");
      this.textContent = label;
    }
  }

  function preventSelection(event) {
    event.preventDefault();
  }

  function calculate() {
    result.classList.remove("open");
    wrapper.classList.remove("covered");
    georgeContainer.classList.remove("open");

    var timer = setTimeout(function() {
      result.innerHTML = "";

      try {
        table = Truthful.truthTable(input.value);
        htmlTable = table.html();
        _.forEach(
          htmlTable.querySelectorAll("th[data-expression]"),
          function(th) {
            th.addEventListener("click", toggleExplicit);
            th.addEventListener("mousedown", preventSelection);
          }
        );
        result.appendChild(htmlTable);
        result.appendChild(georgeBtn);
        georgeResult.innerHTML = table.george();
        result.appendChild(georgeBtn);
      } catch (err) {
        var errors = document.createElement("div");
        errors.className = "errors";
        errors.innerHTML = err.message;
        result.appendChild(errors);
      }
      result.classList.add("open");
    }, 800);

  };

  function addHistory(event) {
    window.history.pushState(
      {"input": input.value},
      "Truthful: " + input.value,
      "?input=" + encodeURIComponent(input.value)
    );
  }

  calculateBtn.addEventListener("click", function() {
    addHistory();
    calculate();
  });
  input.addEventListener("keyup", function(event) {
    if (event.keyCode==13) {
      addHistory();
      calculate();
    }
  });
  window.addEventListener("popstate", function (event) {
    if (event.state) {
      input.value = event.state.input;
      calculate();
    } else {
      document.getElementById("input").value = initial;
      calculate();
    }
  });
  georgeBtn.addEventListener("click", function() {
    georgeContainer.classList.add("open");
    wrapper.classList.add("covered");
  });
  hideGeorge.addEventListener("click", function() {
    georgeContainer.classList.remove("open");
    wrapper.classList.remove("covered");
  });


  calculate();
};
