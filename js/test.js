var assert = require("assert");
var Truthful = require("./Truthful.js");

describe("Truthful", function() {
  describe("Expression evaluation", function() {
    it("Should understand basic OR", function() {
      var expr = Truthful.expression("x|y");
      assert.equal(expr.evaluate({x:true, y:true}), true, "t|t");
      assert.equal(expr.evaluate({x:true, y:false}), true, "t|f");
      assert.equal(expr.evaluate({x:false, y:true}), true, "f|t");
      assert.equal(expr.evaluate({x:false, y:false}), false, "f|f");
    });
    it("Should understand basic AND", function() {
      var expr = Truthful.expression("x&y");
      assert.equal(expr.evaluate({x:true, y:true}), true, "t&t");
      assert.equal(expr.evaluate({x:true, y:false}), false, "t&f");
      assert.equal(expr.evaluate({x:false, y:true}), false, "f&t");
      assert.equal(expr.evaluate({x:false, y:false}), false, "f&f");
    });
    it("Should understand basic IMPLIES", function() {
      var expr = Truthful.expression("x=>y");
      assert.equal(expr.evaluate({x:true, y:true}), true, "t=>t");
      assert.equal(expr.evaluate({x:true, y:false}), false, "t=>f");
      assert.equal(expr.evaluate({x:false, y:true}), true, "f=>t");
      assert.equal(expr.evaluate({x:false, y:false}), true, "f=>f");
    });
    it("Should understand basic IFF", function() {
      var expr = Truthful.expression("x<=>y");
      assert.equal(expr.evaluate({x:true, y:true}), true, "t<=>t");
      assert.equal(expr.evaluate({x:true, y:false}), false, "t<=>f");
      assert.equal(expr.evaluate({x:false, y:true}), false, "f<=>t");
      assert.equal(expr.evaluate({x:false, y:false}), true, "f<=>f");
    });
    it("Should understand basic NOT", function() {
      var expr = Truthful.expression("!x");
      assert.equal(expr.evaluate({x:true}), false, "!t");
      assert.equal(expr.evaluate({x:false}), true, "!f");
    });
    it("Should understand literals", function() {
      assert.equal(Truthful.expression("true").evaluate(), true, "t");
      assert.equal(Truthful.expression("false").evaluate(), false, "f");
    });
    it("Should respect precedence of operators, right-associative", function() {
      assert.equal(Truthful.expression("!a|b").string(), "(!a)|b");
      assert.equal(Truthful.expression("!(a|b)").string(), "!(a|b)");
      assert.equal(Truthful.expression("(a | b) & (c => a)").string(), "(a|b)&(c=>a)");
      assert.equal(Truthful.expression("a=>b=>c").string(), "a=>(b=>c)");
    });
    it("Should ignore extra brackets", function() {
      assert.equal(Truthful.expression("true|true").evaluate(), true, "t|t");
      assert.equal(Truthful.expression("true|(true)").evaluate(), true, "t|(t)");
      assert.equal(Truthful.expression("(true|((true)))").evaluate(), true, "(t|((t)))");
    });
    it("Should ignore extra whitespace", function() {
      assert.equal(Truthful.expression("true|true").evaluate(), true, "t|t");
      assert.equal(Truthful.expression("true | true").evaluate(), true, "t | t");
      assert.equal(Truthful.expression("  true  |   true   ").evaluate(), true, "  t  |   t   ");
    });
  });

  describe("Expression objects", function() {
    it("Should be able to produce a string", function() {
      assert.equal(Truthful.expression("a|b&(!c)").string(), "a|(b&(!c))");
      assert.equal(Truthful.expression("a | b & ( ! c )").string(), "a|(b&(!c))");
    });
    it("Should be able to produce a set of variables", function() {
      assert.equal(
        JSON.stringify(Truthful.expression("a|b|c").variables()),
        JSON.stringify({a:true,b:true,c:true})
      );
    });
  });

  describe("Truth tables", function() {
    it("Should alphabetize variables", function() {
      assert.deepEqual(
        Truthful.truthTable("d|b|a|c").variables,
        ["a","b","c","d"]
      );
    });
    it("Should parse multiple expressions", function() {
      assert.deepEqual(
        Truthful.truthTable("a|b, c|d").expressions.map(function(e) { return e.label() }).sort(),
        ["a|b", "c|d"]
      );
    });
    it("Should parse named expressions", function() {
      assert.deepEqual(
        Truthful.truthTable("a|b, test1:a&b, test2:a=>b").expressions.map(function(e) { return e.label() }).sort(),
        ["a|b", "test1", "test2"]
      );
    });
    it("Should produce valid tables", function() {
      assert.deepEqual(
        Truthful.truthTable("a&b").table(),
        [
          [true, true, true],
          [true, false, false],
          [false, true, false],
          [false, false, false]
        ]
      );
    });
    it("Should be able to generate George-style ASCII tables", function() {
      assert.equal(
        Truthful.truthTable("a|b").george(),
        " a | b || a|b \n" +
        " T | T ||  T  \n" +
        " T | F ||  T  \n" +
        " F | T ||  T  \n" +
        " F | F ||  F  "
      )
    })
  });

  describe("Invalid input", function() {
    it("Should catch improperly nested brackets", function() {
      assert.throws(function() {
        Truthful.expression("(true))");
      }, "Improperly nested brackets: )");
      assert.throws(function() {
        Truthful.expression("((true)");
      }, "Improperly nested brackets: (true");
    });
    it("Should catch invalid tokens", function() {
      assert.throws(function() {
        Truthful.expression("true$false");
      }, "Couldn't match token: $false");
    });
    it("Should catch no input", function() {
      assert.throws(function() {
        Truthful.expression("");
      }, "No tokens found in input");
      assert.throws(function() {
        Truthful.expression("   ");
      }, "No tokens found in input");
    });
    it("Should validate tokens used", function() {
      assert.throws(function() {
        Truthful.expression("|");
      }, "Invalid syntax for token |: |");
      assert.throws(function() {
        Truthful.expression("|b");
      }, "Invalid syntax for token |: |b");
      assert.throws(function() {
        Truthful.expression("b|");
      }, "Invalid syntax for token |: b|");
      assert.throws(function() {
        Truthful.expression("&");
      }, "Invalid syntax for token &: &");
      assert.throws(function() {
        Truthful.expression("&b");
      }, "Invalid syntax for token &: &b");
      assert.throws(function() {
        Truthful.expression("b&");
      }, "Invalid syntax for token &: b&");
      assert.throws(function() {
        Truthful.expression("=>");
      }, "Invalid syntax for token =>: =>");
      assert.throws(function() {
        Truthful.expression("=>b");
      }, "Invalid syntax for token =>: =>b");
      assert.throws(function() {
        Truthful.expression("b=>");
      }, "Invalid syntax for token =>: b=>");
      assert.throws(function() {
        Truthful.expression("<=>");
      }, "Invalid syntax for token <=>: <=>");
      assert.throws(function() {
        Truthful.expression("<=>b");
      }, "Invalid syntax for token <=>: <=>b");
      assert.throws(function() {
        Truthful.expression("b<=>");
      }, "Invalid syntax for token <=>: b<=>");
    });
  });
});
