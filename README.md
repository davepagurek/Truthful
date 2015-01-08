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

Expressions can include * for AND. + for OR, and ! for NOT.