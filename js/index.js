function hide(element) {
  element.style.overflow = "hidden";
  element.style.height = getComputedStyle(element).height;
  element.style.transition = 'all .5s ease';
  element.offsetHeight = "" + element.offsetHeight; // force repaint
  element.style.height = '0';
  element.style.marginTop = "0";
  element.style.marginBottom = "0";
}
function show(element) {
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
}

window.onload = function() {
  var calculateBtn = document.getElementById("calculate");
  var input = document.getElementById("input");
  var result = document.getElementById("result");
  var wrapper = document.getElementById("wrapper");

  var initial = input.value;

  // Use input from URL if it exists
  var q = new QueryString();
  if (q.value("input")) input.value = q.value("input");

  function calculate() {
    hide(wrapper);

    var timer = setTimeout(function() {
      result.innerHTML = "";

      try {
        result.appendChild(Truthful.truthTable(input.value).html());
      } catch (err) {
        var errors = document.createElement("div");
        errors.innerHTML = err.message;
        result.appendChild(errors);
      }
      show(wrapper);
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
