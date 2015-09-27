//Module for input checking and parsing
var Truthful = (function(isNode) {

  if (isNode) _ = require("lodash");

  var t = {
    tokens: [],
    translators: {},
    variables: {},
    validators: {},
    openBracket: /^\(/,
    closeBracket: /^\)/
  };

  function Expression(token, literal, prev, next) {
    this.token = token;
    this.literal = literal;
    this.prev = prev;
    this.next = next;
  }

  Expression.prototype = {
    empty: function() {
      return !this.token;
    },
    variables: function() {
      if (this.empty()) return {};
      var set = _.extend({}, this.prev.variables(), this.next.variables());
      if (t.variables[this.token]) set[this.literal] = true;
      return set;
    },
    string: function() {
      var prev = this.prev ? this.prev.string() : "";
      var next = this.next ? this.next.string() : "";
      var current = this.empty() ? "" : this.literal;
      var str = prev + current + next;
      if (prev != "" || next != "") return "(" + str + ")";
      return str;
    },
    evaluate: function(vars) {
      vars = vars || {};
      if (t.translators[this.token]) return t.translators[this.token].bind(this)(this.prev, this.next, vars);
      return false;
    }
  };

  t.addToken = function(pattern, validate, evaluate, variable) {
    pattern = new RegExp("^" + pattern.source);
    t.tokens.push(pattern);
    t.translators[pattern] = evaluate;
    t.validators[pattern] = validate;
    t.variables[pattern] = !!variable;
  };

  t.findIndex = function(tokenInput, token) {
    var openBrackets = 0;
    for (var i = 0; i < tokenInput.length; i++) {
      if (tokenInput[i].match(token) && openBrackets == 0) return i;
      if (tokenInput[i].match(t.openBracket)) openBrackets++;
      if (tokenInput[i].match(t.closeBracket)) openBrackets--;
    }
    return -1;
  };

  t.firstMatch = function(input) {
    var tokens = [t.openBracket, t.closeBracket].concat(t.tokens);
    for (var i = 0; i < tokens.length; i++) {
      var result = input.match(tokens[i]);
      if (result) return result[0];
    }
    return null;
  };

  t.expression = function(input) {
    input = input.replace(/\s+/g, "");
    if (input.length == 0) throw new Error("No tokens found in input");

    var tokenInput = [];
    while (input.length>0) {
      var result = t.firstMatch(input);
      if (!result) throw new Error("Couldn't match token: " + input);
      tokenInput.push(result);
      input = input.substr(result.length);
    }

    return t.parse(tokenInput);
  };

  t.parse = function(tokenInput) {
    if (!tokenInput || tokenInput.length == 0) return new Expression();

    if (tokenInput[0].match(t.openBracket) && t.findIndex(tokenInput.slice(1), t.closeBracket) == tokenInput.length-2) {
      return t.parse(tokenInput.slice(1, -1));
    }
    if (tokenInput[0].match(t.closeBracket)) throw new Error("Improperly nested brackets: " + tokenInput.join(""));

    var tokens = t.tokens.slice();
    while (tokens.length > 0) {
      var token = tokens.pop();
      var tokenLocation = t.findIndex(tokenInput, token);
      if (tokenLocation != -1) {
        var prev = t.parse(tokenInput.slice(0, tokenLocation));
        var next = t.parse(tokenInput.slice(tokenLocation+1));
        var expr = new Expression(token, tokenInput[tokenLocation], prev, next);
        if (t.validators[token] && !t.validators[token](prev, next)) {
          throw new Error("Invalid syntax for token " + tokenInput[tokenLocation] + ": " + expr.string());
        }
        return expr;
      }
    }

    throw new Error("Extra tokens left unparsed: " + tokens.join(", "));
  };

  function Table(variables, expressions) {
    this.variables = variables;
    this.expressions = expressions;
    var combinations = variables.map(function(variable, col) {
      return _.range(Math.pow(2, variables.length)).map(function(cell, row) {
        return Math.floor(row/Math.pow(2, variables.length-col-1)) % 2 == 0;
      });
    });
    this.combinations = combinations;
    var results = expressions.map(function(expression, col) {
      return _.range(Math.pow(2, variables.length)).map(function(cell, row) {
        return expression.expression.evaluate(
          _.object(combinations.map(function(cells, varNum) {
            return [variables[varNum], cells[row]];
          }))
        );
      });
    });
    this.results = results;
  }

  Table.prototype = {
    table: function() {
      // Transpose matrix
      this._table = this._table || _.zip.apply(null, this.combinations.concat(this.results));
      return this._table;
    },
    html: function(T, F) {
      T = T || "T";
      F = F || "F";

      if (isNode) throw new Error("HTML tables can only be made in the browser!");
      var firstResult = this.variables.length;
      var table = document.createElement("table");

      var header = document.createElement("tr");
      this.variables.concat(this.expressions.map(function(expr) {
        return expr.name;
      })).forEach(function(variable, index) {
        var cell = document.createElement("th");
        cell.innerHTML = variable;
        header.appendChild(cell);
      });
      table.appendChild(header);

      this.table().forEach(function(row) {
        var rowElem = document.createElement("tr");
        row.forEach(function(col, index) {
          var cell = document.createElement("td");
          if (index == firstResult) cell.classList.add("truthful-first");
          cell.classList.add(col ? "truthful-true" : "truthful-false");
          cell.innerHTML = col ? T : F;
          rowElem.appendChild(cell);
        });
        table.appendChild(rowElem);
      });

      return table;
    },
    george: function() {
      var T = "T";
      var F = "F";
      var firstResult = this.variables.length;
      var header = this.variables.concat(this.expressions.map(function(expr) {
        return expr.name;
      }));
      var maxLengths = header.map(function(label) {
        return Math.max(label.length, T.length, F.length) + 2;
      });
      return [header].concat(this.table()).map(function(row, n) {
        var values = row.map(function(cell, index) {
          if (n == 0) return _.pad(cell, maxLengths[index]);
          return _.pad((cell ? T : F), maxLengths[index]);
        });
        return values.slice(0, firstResult).join("|") + "||" + values.slice(firstResult).join("|");
      }).join("\n");
    }
  };

  t.truthTable = function(input) {
    var err = null;
    var expressions = input.split(/,\s*/).map(function(element) {
      var match =  /^\s*(.+)\s*:(.+)$/.exec(element); // Get function name if it exists
      if (match) {
        return {
          name: match[1],
          expression: t.expression(match[2])
        };
      } else {
        return {
          name: element,
          expression: t.expression(element)
        };
      }
    });

    var variables = Object.keys(_.reduce(
      expressions.map(function(expr) { return expr.expression.variables() }),
      function(set, vars) { return _.merge(set, vars) },
      {}
    )).sort();

    return new Table(variables, expressions);
  };


  if (isNode) module.exports = t;

  return t;
})(typeof window === "undefined");


Truthful.addToken(/\w+/, null, function(prev, next, vars) { return vars[this.literal] || false }, true);
Truthful.addToken(/true/, null, function(){ return true });
Truthful.addToken(/false/, null, function(){ return false });
Truthful.addToken(/\!/, function(prev, next) { return prev.empty() && !next.empty() }, function(prev, next, vars) { return !next.evaluate(vars) });
Truthful.addToken(/\&/, function(prev, next) { return !prev.empty() && !next.empty() }, function(prev, next, vars) { return prev.evaluate(vars) && next.evaluate(vars) });
Truthful.addToken(/\|/, function(prev, next) { return !prev.empty() && !next.empty() }, function(prev, next, vars) { return prev.evaluate(vars) || next.evaluate(vars) });
Truthful.addToken(/=>/, function(prev, next) { return !prev.empty() && !next.empty() }, function(prev, next, vars) { return !prev.evaluate(vars) || next.evaluate(vars) });
Truthful.addToken(/<=>/, function(prev, next) { return !prev.empty() && !next.empty() }, function(prev, next, vars) { return !((prev.evaluate(vars) && !next.evaluate(vars)) || (!prev.evaluate(vars) && next.evaluate(vars))) });

