<h1>Truthful</h1>
Calculate truth tables from a boolean algebraic expressions
Live version at http://davepagurek.com/truthful/

<h2>Using Truthful.js</h2>

Include the Javascript file in your HTML:
```HTML
<script src="Truthful.js"></script>
```

<h3>Expressions</h3>
Create an algebraic expression like this:
```javascript
var expression = Truthful.createExpression("a*b+!(c*d)");
```

To get the result of an expression:
```javascript
var x=2;
var result = expression.result({
	"a": 1,
	"b": 0,
	"c": 1,
	"d": 1
});
```
If a variable's value is not specified, it defaults to zero.

Expressions can include * for AND. + for OR, # for XOR, and ! for NOT.

<h3>Truth Tables</h3>
Get an HTML Table element of a truth table by passing an array of input expressions like this:
```javascript
var table = Truthful.truthTable([
    "f1 = a+b*c",
    "f2 = a#b+c”
]);
document.body.appendChild(table);
```

Functions inputted into a truth table can be named as shown above to produce a cleaner looking truth table. Functions not preceded by `<name>=` will simply display the formula instead.
