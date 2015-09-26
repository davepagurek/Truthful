<h1>Truthful</h1>
Calculate truth tables from a boolean algebraic expressions
Live version at http://davepagurek.com/truthful/

<h2>Using Truthful.js</h2>

Fork the repo and set up dependencies:
```
npm install
npm install -g bower
bower install
```

Include the Javascript file in your HTML:
```HTML
<script src="Truthful.js"></script>
```
...or in Node:
```HTML
var Truthful = require("./js/Truthful.js");
```

<h3>Expressions</h3>
Create an algebraic expression like this:
```javascript
var expression = Truthful.expression("!(b|c|a)");
```
Expressions can use `&` for AND, `|` for OR, `=>` for IMPLIES, `<=>` for IFF, `!` for NOT and round brackets for grouping. Literals `true` and `false` may also be used.
The precedence of operators is `() > ! > & > | > => > <=>`.

To get the result of an expression, pass in an object with values for each variable:
```javascript
Truthful.expression("c&(a|b)").result({
	"a": true,
	"b": false,
	"c": true,
})
// Returns true
```
If a variable's value is not specified, it defaults to false.

Expressions can return an object with keys for the variables present in it (rather than an array, so that each variable only can occur once):
```javascript
Truthful.expression("a|b|c").variables()
// Returns {a:true,b:true,c:true}
```

Expressions can also render string versions of themselves with brackets specifying order of operations explicitly:
```javascript
Truthful.expression("a|b&(!c)").string()
// Returns "(a|(b&(!c)))"
```

<h3>Truth Tables</h3>
Get an HTML `<table>` element of a truth table by passing an input string:
```javascript
var table = Truthful.truthTable("a => !(b|c|a)");
document.body.appendChild(table.html());
```

A string containing an ASCII table formatted for George can also be returned:
```javascript
Truthful.truthTable("a|b").george()
/* 
Returns a string containing a table such as:
 a | b || a|b
 T | T ||  T 
 T | F ||  T 
 F | T ||  T 
 F | F ||  F
*/
```

To compare multiple functions, separate each with a comma. A function can be named by optionally specifying a `name:` beforehand:
```javascript
Truthful.truthTable("a => !(b|c|a), thing: a <=> b").george()
/*
Returns
 a | b | c || a => !(b|c|a) | thing 
 T | T | T ||       F       |   T   
 T | T | F ||       F       |   T   
 T | F | T ||       F       |   F   
 T | F | F ||       F       |   F   
 F | T | T ||       T       |   F   
 F | T | F ||       T       |   F   
 F | F | T ||       T       |   T   
 F | F | F ||       T       |   T   
*/
```

<h3>Error handling</h3>
If there is an error with user input, Truthful will throw a `new Error()` with a useful message. If using Truthful for arbitrary user data, it is recommended to parse input in a `try { } catch (err) { }` and show the user `err.message`.

<h2>Contributing</h2>
- Make an issue on GitHub if you notice a broken feature
- Fork the repo and make a branch for any updates
- After cloning locally, run `npm install`
- Add tests for new features
- Run tests with `npm test`
- Create a pull request
For more details: https://guides.github.com/activities/contributing-to-open-source/#contributing
