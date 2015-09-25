//Module for input checking and parsing
var Truthful = (function() {

  var t = {
    tokens: [/^\(/, /^\)/],
    translators: {},
    variables: {},
    validators: {},
    openBracket: "(",
    closeBracket: ")"
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
      return prev + current + next;
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
      if (tokenInput[i] == t.openBracket) openBrackets++;
      if (tokenInput[i] == t.closeBracket) openBrackets--;
    }
    return -1;
  };

  t.firstMatch = function(input) {
    for (var i = 0; i < t.tokens.length; i++) {
      var result = input.match(t.tokens[i]);
      if (result) return result[0];
    }
    return null;
  };

  t.createExpression = function(input, callback) {
    input = input.replace(/\s+/g, "");
    if (input.length == 0) return callback(new Error("No tokens found in input"));

    var tokenInput = [];
    while (input.length>0) {
      var result = t.firstMatch(input);
      if (!result) return callback(new Error("Couldn't match token: " + input));
      tokenInput.push(result);
      input = input.substr(result.length);
    }

    return t.parse(tokenInput, callback);
  };

  t.parse = function(tokenInput, callback) {
    if (!tokenInput || tokenInput.length == 0) return callback(null, new Expression());

    if (tokenInput[0] == t.openBracket) {
      if (tokenInput[tokenInput.length-1] == t.closeBracket) {
        return t.parse(tokenInput.slice(1, -1), callback);
      } else {
        return callback(new Error("Improperly nested brackets: " + tokenInput.join("")));
      }
    }
    if (tokenInput[0] == t.closeBracket) return callback(new Error("Improperly nested brackets: " + tokenInput.join("")));

    var tokens = t.tokens.slice();
    while (tokens.length > 0) {
      var token = tokens.pop();
      var tokenLocation = t.findIndex(tokenInput, token);
      if (tokenLocation != -1) {

        // Parse previous block
        return t.parse(tokenInput.slice(0, tokenLocation), function(err, prev) {
          if (err) return callback(err);

          // Parse next block
          t.parse(tokenInput.slice(tokenLocation+1), function(err, next) {
            if (err) return callback(err);
            var expr = new Expression(token, tokenInput[tokenLocation], prev, next);
            if (t.validators[token] && !t.validators[token](prev, next)) {
              return callback(new Error("Invalid syntax for token " + tokenInput[tokenLocation] + ": " + expr.string()));
            }
            callback(null, expr);
          });
        });
      }
    }

    return callback(new Error("Extra tokens left unparsed: " + tokens.join(", ")));
  };

  t.truthTable = function(input) {
    var functions = [];
    var expressions = Array.prototype.map.call(input, function(element) {

      //Get function name if it exists
      var match =  /^\s*(.+)\s*=(.+)$/.exec(element);
      if (match) {
        functions.push(match[1]);
        return t.createExpression(match[2]);
      } else {
        functions.push(element);
        return t.createExpression(element);
      }
    });
    var variablesObj = {};

    //Get array of variables in the expressions
    for (i=0; i<expressions.length; i++) {
      var fnVariables = expressions[i].variables();
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

    for (var i=0; i<expressions.length; i++) {
      table.push([]);
    }
    for (var row=0; row<totalRows; row++) {
      var values = {};
      for (var column=0; column<table.length-1; column++) {
        values[variables[column]]=table[column][row];
      }

      for (i=0; i<expressions.length; i++) {
        table[variables.length+i].push(expressions[i].evaluate(values));
      }
    }

    htmlTable += "<table><tr>";

    for (var i=0; i<variables.length; i++) {
      htmlTable += "<th>" + variables[i] + "</th>";
    }
    for (i=0; i<functions.length; i++) {
      htmlTable += "<th>" + functions[i] + "</th>";
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
    return new DOMParser().parseFromString(htmlTable, "text/html").getElementsByTagName("table")[0];

  };

  return t;
}());


Truthful.addToken(/\w+/, null, function(prev, next, vars) { return vars[this.literal] || false });
Truthful.addToken(/true/, null, function(){ return true });
Truthful.addToken(/false/, null, function(){ return false });
Truthful.addToken(/\!/, function(prev, next) { return prev.empty() && !next.empty() }, function(prev, next, vars) { return !next.evaluate(vars) });
Truthful.addToken(/\&/, function(prev, next) { return !prev.empty() && !next.empty() }, function(prev, next, vars) { return prev.evaluate(vars) && next.evaluate(vars) });
Truthful.addToken(/\|/, function(prev, next) { return !prev.empty() && !next.empty() }, function(prev, next, vars) { return prev.evaluate(vars) || next.evaluate(vars) });
Truthful.addToken(/=>/, function(prev, next) { return !prev.empty() && !next.empty() }, function(prev, next, vars) { return !prev.evaluate(vars) || next.evaluate(vars) });
Truthful.addToken(/<=>/, function(prev, next) { return !prev.empty() && !next.empty() }, function(prev, next, vars) { return !((prev.evaluate(vars) && !next.evaluate(vars)) || (!prev.evaluate(vars) && next.evaluate(vars))) });

if (module) module.exports = Truthful;
