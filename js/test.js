var assert = require("assert");
var Truthful = require("./Truthful.js");

describe("Truthful", function() {
  describe("Expression evaluation", function() {
    it("Should understand basic OR", function() {
      Truthful.createExpression("x|y", function(err, expr) {
        if (err) throw err;
        assert.equal(expr.evaluate({x:true, y:true}), true, "t|t");
        assert.equal(expr.evaluate({x:true, y:false}), true, "t|f");
        assert.equal(expr.evaluate({x:false, y:true}), true, "f|t");
        assert.equal(expr.evaluate({x:false, y:false}), false, "f|f");
      });
    });
    it("Should understand basic AND", function() {
      Truthful.createExpression("x&y", function(err, expr) {
        if (err) throw err;
        assert.equal(expr.evaluate({x:true, y:true}), true, "t&t");
        assert.equal(expr.evaluate({x:true, y:false}), false, "t&f");
        assert.equal(expr.evaluate({x:false, y:true}), false, "f&t");
        assert.equal(expr.evaluate({x:false, y:false}), false, "f&f");
      });
    });
    it("Should understand basic IMPLIES", function() {
      Truthful.createExpression("x=>y", function(err, expr) {
        if (err) throw err;
        assert.equal(expr.evaluate({x:true, y:true}), true, "t=>t");
        assert.equal(expr.evaluate({x:true, y:false}), false, "t=>f");
        assert.equal(expr.evaluate({x:false, y:true}), true, "f=>t");
        assert.equal(expr.evaluate({x:false, y:false}), true, "f=>f");
      });
    });
    it("Should understand basic IFF", function() {
      Truthful.createExpression("x<=>y", function(err, expr) {
        if (err) throw err;
        assert.equal(expr.evaluate({x:true, y:true}), true, "t<=>t");
        assert.equal(expr.evaluate({x:true, y:false}), false, "t<=>f");
        assert.equal(expr.evaluate({x:false, y:true}), false, "f<=>t");
        assert.equal(expr.evaluate({x:false, y:false}), true, "f<=>f");
      });
    });
    it("Should understand basic NOT", function() {
      Truthful.createExpression("!x", function(err, expr) {
        if (err) throw err;
        assert.equal(expr.evaluate({x:true}), false, "!t");
        assert.equal(expr.evaluate({x:false}), true, "!f");
      });
    });
    it("Should understand literals", function() {
      Truthful.createExpression("true", function(err, expr) {
        if (err) throw err;
        assert.equal(expr.evaluate(), true, "t");
      });
      Truthful.createExpression("false", function(err, expr) {
        if (err) throw err;
        assert.equal(expr.evaluate(), false, "f");
      });
    });
    it("Should respect precedence of operators", function() {
      Truthful.createExpression("!false|true", function(err, expr) {
        if (err) throw err;
        assert.equal(expr.evaluate(), true, "!f|t");
      });
      Truthful.createExpression("!(false|true)", function(err, expr) {
        if (err) throw err;
        assert.equal(expr.evaluate(), false, "!(f|t)");
      });
    });
    it("Should ignore extra brackets", function() {
      Truthful.createExpression("true|true", function(err, expr) {
        if (err) throw err;
        assert.equal(expr.evaluate(), true, "t|t");
      });
      Truthful.createExpression("true|(true)", function(err, expr) {
        if (err) throw err;
        assert.equal(expr.evaluate(), true, "t|(t)");
      });
      Truthful.createExpression("(true|((true)))", function(err, expr) {
        if (err) throw err;
        assert.equal(expr.evaluate(), true, "(t|((t)))");
      });
    });
    it("Should ignore extra whitespace", function() {
      Truthful.createExpression("true|true", function(err, expr) {
        if (err) throw err;
        assert.equal(expr.evaluate(), true, "t|t");
      });
      Truthful.createExpression("true | true", function(err, expr) {
        if (err) throw err;
        assert.equal(expr.evaluate(), true, "t | t");
      });
      Truthful.createExpression("  true  |   true   ", function(err, expr) {
        if (err) throw err;
        assert.equal(expr.evaluate(), true, "  t  |   t   ");
      });
    });
  });

  describe("Invalid input", function() {
    it("Should catch improperly nested brackets", function() {
      Truthful.createExpression("(true))", function(err, expr) {
        assert.ok(err);
        assert.equal(err.message, "Improperly nested brackets: )");
      });
      Truthful.createExpression("((true)", function(err, expr) {
        assert.ok(err);
        assert.equal(err.message, "Improperly nested brackets: (true");
      });
    });
    it("Should catch invalid tokens", function() {
      Truthful.createExpression("true$false", function(err, expr) {
        assert.ok(err);
        assert.equal(err.message, "Couldn't match token: $false");
      });
    });
    it("Should catch no input", function() {
      Truthful.createExpression("", function(err, expr) {
        assert.ok(err);
        assert.equal(err.message, "No tokens found in input");
      });
      Truthful.createExpression("   ", function(err, expr) {
        assert.ok(err);
        assert.equal(err.message, "No tokens found in input");
      });
    });
    it("Should validate tokens used", function() {
      Truthful.createExpression("|", function(err, expr) {
        assert.ok(err);
        assert.equal(err.message, "Invalid syntax for token |: |");
      });
      Truthful.createExpression("|b", function(err, expr) {
        assert.ok(err);
        assert.equal(err.message, "Invalid syntax for token |: |b");
      });
      Truthful.createExpression("b|", function(err, expr) {
        assert.ok(err);
        assert.equal(err.message, "Invalid syntax for token |: b|");
      });
      Truthful.createExpression("&", function(err, expr) {
        assert.ok(err);
        assert.equal(err.message, "Invalid syntax for token &: &");
      });
      Truthful.createExpression("&b", function(err, expr) {
        assert.ok(err);
        assert.equal(err.message, "Invalid syntax for token &: &b");
      });
      Truthful.createExpression("b&", function(err, expr) {
        assert.ok(err);
        assert.equal(err.message, "Invalid syntax for token &: b&");
      });
      Truthful.createExpression("=>", function(err, expr) {
        assert.ok(err);
        assert.equal(err.message, "Invalid syntax for token =>: =>");
      });
      Truthful.createExpression("=>b", function(err, expr) {
        assert.ok(err);
        assert.equal(err.message, "Invalid syntax for token =>: =>b");
      });
      Truthful.createExpression("b=>", function(err, expr) {
        assert.ok(err);
        assert.equal(err.message, "Invalid syntax for token =>: b=>");
      });
      Truthful.createExpression("<=>", function(err, expr) {
        assert.ok(err);
        assert.equal(err.message, "Invalid syntax for token <=>: <=>");
      });
      Truthful.createExpression("<=>b", function(err, expr) {
        assert.ok(err);
        assert.equal(err.message, "Invalid syntax for token <=>: <=>b");
      });
      Truthful.createExpression("b<=>", function(err, expr) {
        assert.ok(err);
        assert.equal(err.message, "Invalid syntax for token <=>: b<=>");
      });
    })
  });
});
