window.onload = function() {
  var calculateBtn = document.getElementById("calculate");
  var input = document.getElementById("input");
  var result = document.getElementById("result");

  var initial = input.value;

  // Use input from URL if it exists
  var q = new QueryString();
  if (q.value("input")) input.value = q.value("input");

  function calculate() {
    result.classList.remove("open");

    var timer = setTimeout(function() {
      result.innerHTML = "";

      try {
        result.appendChild(Truthful.truthTable(input.value).html());
      } catch (err) {
        var errors = document.createElement("div");
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


  calculate();
};
