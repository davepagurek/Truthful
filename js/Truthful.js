//Module for input checking and parsing
var Truthful = (function(isNode) {

  if (isNode) _ = require("lodash");

  // Object to store public methods
  var exports = {};

  // Object to store internal properties and methods
  var internal = {}

  /*
   * Base classes
   */

  // Description of a valid syntactic unit of a boolean expression
  function Token(options) {
    if (!options) throw new Error("Token options must be specified!");
    if (!options.pattern) throw new Error("Token options.pattern must be specified!");

    this.pattern = new RegExp("^" + options.pattern.source);
    this._evaluate = options.evaluate;
    this._validate = options.validate;
    this.variable = !!options.variable;
  }
  Token.prototype = {
    match: function(str) {
      var result = str.match(this.pattern);
      return result ? result[0] : null;
    },
    evaluate: function(expr, vars) {
      if (!this._evaluate) throw new Error("No evaluate function specified!");
      return this._evaluate.bind(expr)(vars);
    },
    validate: function(expr) {
      return this._validate ? this._validate.bind(expr)() : true;
    }
  };

  // An instance of a Boolean expression as a token
  function Expression(options) {
    options = options || {};
    this.token = options.token;
    this.literal = options.literal;
    this.prev = options.prev;
    this.next = options.next;
    if (!this.validate()) {
      throw new Error("Invalid syntax for token " + this.literal + ": " + this.string());
    }
  }
  Expression.prototype = {
    empty: function() {
      return !this.token;
    },
    variables: function() {
      if (this.empty()) return {};
      var set = _.extend({}, this.prev.variables(), this.next.variables());
      if (this.token.variable) set[this.literal] = true;
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
      return this.token ? this.token.evaluate(this, vars) : false;
    },
    validate: function() {
      return this.token ? this.token.validate(this) : true;
    }
  };

  // An instance of a truth table, potentially with multiple Boolean expression columns
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


  /*
   * Public interface
   */

  // Generates an Expression object from a Boolean expression string
  exports.expression = function(input) {
    input = input.replace(/\s+/g, ""); // Ignore whitespace
    if (input.length == 0) throw new Error("No tokens found in input");

    var tokenInput = [];
    while (input.length>0) {
      var result = internal.firstMatch(input);
      if (!result) throw new Error("Couldn't match token: " + input);
      tokenInput.push(result);
      input = input.substr(result.length);
    }

    return internal.parse(tokenInput);
  };

  // Generates a Table object from a string input of comma-separated
  // Boolean expressions, optionally prefaced with a `name:` label
  exports.truthTable = function(input) {
    var err = null;
    var expressions = input.split(/,\s*/).map(function(element) {
      var match =  /^\s*(.+)\s*:(.+)$/.exec(element); // Get function name if it exists
      if (match) {
        return {
          name: match[1],
          expression: exports.expression(match[2])
        };
      } else {
        return {
          name: element,
          expression: exports.expression(element)
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


  /*
   * Helpers
   */

  // Finds the first index of a token in an input array
  // where the token is not nested in brackets
  internal.indexOutsideBrackets = function(tokenInput, token) {
    var openBrackets = 0;
    for (var i = 0; i < tokenInput.length; i++) {
      if (token.match(tokenInput[i]) && openBrackets == 0) return i;
      if (internal.openBracket.match(tokenInput[i])) openBrackets++;
      if (internal.closeBracket.match(tokenInput[i])) openBrackets--;
    }
    return -1;
  };

  // Returns the literal of the first matching token in the
  // input, giving precedence to tokens added earlier
  internal.firstMatch = function(input) {
    var tokens = [internal.openBracket, internal.closeBracket].concat(internal.tokens);
    for (var i = 0; i < tokens.length; i++) {
      var result = tokens[i].match(input);
      if (result) return result;
    }
    return null;
  };

  // Parses an array of token strings into a binary expression tree
  internal.parse = function(tokenInput) {
    if (!tokenInput || tokenInput.length == 0) return new Expression();

    if (internal.openBracket.match(tokenInput[0]) && internal.indexOutsideBrackets(tokenInput.slice(1), internal.closeBracket) == tokenInput.length-2) {
      return internal.parse(tokenInput.slice(1, -1));
    }
    if (internal.closeBracket.match(tokenInput[0])) throw new Error("Improperly nested brackets: " + tokenInput.join(""));

    var tokens = internal.tokens.slice(); // Make copy of tokens to go through
    while (tokens.length > 0) {
      var token = tokens.pop();
      var tokenLocation = internal.indexOutsideBrackets(tokenInput, token);
      if (tokenLocation != -1) {
        var prev = internal.parse(tokenInput.slice(0, tokenLocation));
        var next = internal.parse(tokenInput.slice(tokenLocation+1));
        return new Expression({
          token: token,
          literal: tokenInput[tokenLocation],
          prev: prev,
          next: next
        });
      }
    }

    throw new Error("Extra tokens left unparsed: " + tokens.join(", "));
  };

  /*
   * Language syntax definitions
   */

  internal.openBracket = new Token({pattern: /\(/});
  internal.closeBracket = new Token({pattern: /\)/});

  internal.tokens = [
    new Token({
      pattern: /\w+/,
      evaluate: function(vars) { return vars[this.literal] || false },
      variable: true
    }),
    new Token({
      pattern: /true/,
      evaluate: function() { return true }
    }),
    new Token({
      pattern: /false/,
      evaluate: function() { return false }
    }),
    new Token({
      pattern: /!/,
      validate: function() { return this.prev.empty() && !this.next.empty() },
      evaluate: function(vars) { return !this.next.evaluate(vars) }
    }),
    new Token({
      pattern: /&/,
      validate: function() { return !this.prev.empty() && !this.next.empty() },
      evaluate: function(vars) { return this.prev.evaluate(vars) && this.next.evaluate(vars) }
    }),
    new Token({
      pattern: /\|/,
      validate: function() { return !this.prev.empty() && !this.next.empty() },
      evaluate: function(vars) { return this.prev.evaluate(vars) || this.next.evaluate(vars) }
    }),
    new Token({
      pattern: /=>/,
      validate: function() { return !this.prev.empty() && !this.next.empty() },
      evaluate: function(vars) { return !this.prev.evaluate(vars) || this.next.evaluate(vars) }
    }),
    new Token({
      pattern: /<=>/,
      validate: function() { return !this.prev.empty() && !this.next.empty() },
      evaluate: function(vars) { return !((this.prev.evaluate(vars) && !this.next.evaluate(vars)) || (!this.prev.evaluate(vars) && this.next.evaluate(vars))) }
    })
  ];

  if (isNode) module.exports = exports;

  return exports;
})(typeof window === "undefined"); // Check if running in Node or not using the presence of `window`
