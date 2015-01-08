//Module for input checking and parsing
var Truthful = (function() {

  //Class for operators
  function Operator(input) {
    this.operator = input;
    if (!input) {
      Truthful.log("Operator has no input.");
    }

    this.solve = function(segment1, segment2, x) {
      var v1 = segment1.coefficient;
      if (segment1.type=="variable") {
        v1 = x;
      }
      var v2 = segment2.coefficient;
      if (segment2.type=="variable") {
        v2 = x;
      }
      if (this.operator=="+") {
        return new Segment(v1 || v2);
      } else if  (this.operator=="*") {
        return  new Segment(v1 && v2);
      }
    };
  }

  //Class for special functions
  function MathFunction(input) {
    this.f=input;
    if (!input) {
      XCalc.log("Math function has no input.");
    }

    this.solve = function(segment) {
      var v = segment.coefficient;
      if (this.f=="not") {
        if (v) {
          return new Segment(0);
        } else {
          return new Segment(1);
        }
      }
    };
  }

  //Class for a segment of math (a container)
  function Segment(input) {
    this.sections = [];
    this.type="section";
    this.operator=0;
    this.mathFunction = 0;
    this.coefficient=0;
    this.variable="";

    var removeBrackets = function(value) {
      if (!value) return "";

      //While there are brackets around the string
      while (value.substr(0, 1)=="(" && value.substr(value.length-1, 1)==")") {
        var openBrackets=1;

        //See if the end bracket closes the opening bracket or not
        for (var i=1; i<value.length&&openBrackets>0; i++) {
          if (value.substr(i, 1)=="(") openBrackets++;
          if (value.substr(i, 1)==")") openBrackets--;
        }
        i-=1;

        //If it corresponds to different brackets, do nothing
        if (openBrackets!==0 || i!=value.length-1) {
          break;

        //Otherwise, remove the brackets, continue loop to see if there are more
        } else {
          value=value.substring(1, value.length-1);
        }
      }

      return value;
    };

    var findLast = function(operator, value) {

      //Keep searching for the next last sign if the one found is within brackets
      var inBrackets=true;
      var index=-1;
      if (operator!="^") {
        index=value.lastIndexOf(operator);
      } else {
        index=value.indexOf(operator); //Look for the first instead of last if it's an exponent
      }
      var operators="+*'!";
      while (inBrackets) {
        var openBrackets=0;

        //Find how many brackets are opened or closed at a given point in the string
        for (var i=0; i<value.length; i++) {
          if (value.substr(i, 1)=="(") {
            openBrackets++;
          } else if (value.substr(i, 1)==")") {
            openBrackets--;
          }

          if (i==index) {

            //If no brackets are open (and if the operator is actually - and not just a minus sign), break the loop.
            if ((openBrackets===0 && (operator!="-" || (i>0 && operators.indexOf(value.substr(i-1, 1))==-1) || i===0)) || (openBrackets==1 && operator=="(")) {
              inBrackets=false;
              break;

            //Otherwise, find the next operator, and loop through again to see if that one is in brackets
            } else {
              if (operator!="^") {
                index = value.substring(0, index).lastIndexOf(operator);
              } else {
                var nextOperator = value.substring(index+1).indexOf(operator);
                if (nextOperator==-1) {
                  index=-1;
                } else {
                  index = (index+1+value.substring(index+1).indexOf(operator));
                }
              }
            }
          }
        }

        //If no more operators are found, break the loop
        if (index==-1) {
          inBrackets=false;
        }
      }
      return index;
    };

    //Specifically for finding brackets that can be used for multiplication
    var findMultiplicationBrackets = function(value) {

      //Keep searching for the next last sign if the one found is within brackets
      var inBracketsOpen=true;
      var inBracketsClosed=true;
      var indexOpen=-1;
      var indexClosed=-1;
      var operators="+*'!";
      
      indexOpen=value.lastIndexOf("(");
      indexClosed=value.lastIndexOf(")");

      while (inBracketsOpen || inBracketsClosed) {
        var openBrackets=0;

        //Find how many brackets are opened or closed at a given point in the string
        for (var i=0; i<value.length; i++) {
          if (value.substr(i, 1)=="(") {
            openBrackets++;
          } else if (value.substr(i, 1)==")") {
            openBrackets--;
          }

          if (i==indexOpen && inBracketsOpen) {

            if (openBrackets==1 && i!==0 && operators.indexOf(value.substr(i-1, 1))==-1) {
              inBracketsOpen=false;

            //Otherwise, find the next operator, and loop through again to see if that one is in brackets
            } else {
              indexOpen = value.substring(0, indexOpen).lastIndexOf("(");
            }
          }

          if (i==indexClosed && inBracketsClosed) {

            if (openBrackets===0 && i<value.length-1 && operators.indexOf(value.substr(i+1, 1))==-1) {
              inBracketsClosed=false;

            //Otherwise, find the next operator, and loop through again to see if that one is in brackets
            } else {
              indexClosed = value.substring(0, indexClosed).lastIndexOf(")");
            }
          }
        }

        //If no more operators are found, break the loop
        if (indexOpen==-1) {
          inBracketsOpen=false;
        }
        if (indexClosed==-1) {
          inBracketsClosed=false;
        }
      }

      if (indexClosed>indexOpen && indexClosed!=-1) {
        return indexClosed;
      } else {
        return indexOpen;
      }
    };

    this.containsVariable = function() {
      if (this.type=="variable") {
        return true;
      } else if (this.type=="value") {
        return false;
      } else {
        if (this.sections.length==1) {
          return this.sections[0].containsVariable();
        } else if (this.sections.length==2) {
          return this.sections[0].containsVariable() || this.sections[1].containsVariable();
        }
      }
    };

    this.variables = function() {
      if (this.type=="variable") {
        var result = {};
        result[this.variable] = 0;
        return result;
      } else if (this.type=="value") {
        return {};
      } else {
        if (this.sections.length==1) {
          return this.sections[0].variables();
        } else if (this.sections.length==2) {
          var result = this.sections[0].variables();
          var result2 = this.sections[1].variables();
          for (var attrname in result2) { result[attrname] = result2[attrname]; }
          return result;
        }
      }
    };

    this.equals = function(expression) {
      if (this.type != expression.type) {
        return false;
      } else {
        if (this.type=="function") {
          return (this.mathFunction.f==expression.mathFunction.f && this.sections[0].equals(expression.sections[0]));
        } else if (this.type=="variable") {
          return (this.variable==expression.variable && this.coefficient==expression.coefficient);
        } else if (this.type=="constant") {
          return (this.mathConstant.c==expression.mathConstant.c);
        } else if (this.type=="value") {
          return this.coefficient==expression.coefficient;
        } else if (this.type=="section") {
          if (this.operator.operator=="*" || this.operator.operator=="+") {
            return (this.operator.operator==expression.operator.operator && ((this.sections[0].equals(expression.sections[0]) && this.sections[1].equals(expression.sections[1])) || (this.sections[0].equals(expression.sections[1]) && this.sections[1].equals(expression.sections[0]))));
          } else {
            return (this.operator.operator==expression.operator.operator && this.sections[0].equals(expression.sections[0]) && this.sections[1].equals(expression.sections[1]));
          }
        }
      }
    };

    //Recursively solve children
    this.solve = function(x) {
      if (!x) x={};
      if (this.type=="value") {
        return this;
      } else if (this.type=="variable") {
        return new Segment(x[this.variable] || 0);
      } else if (this.type=="constant") {
        return this.mathConstant.solve();
      } else if (this.type=="function") {
        return this.mathFunction.solve(this.sections[0].solve(x));
      } else {
        if (this.sections.length==1) {
          return this.sections[0].solve(x);
        } else if (this.sections.length==2) {
          return this.operator.solve(this.sections[0].solve(x), this.sections[1].solve(x), x);
        }
      }
    };

    //Outputs the final answer
    this.result = function(x) {
      return this.solve(x).coefficient;
    };

    

    //Returns a string with the formula of the function
    this.formula = function() {
      var str = "";

      if (this.type=="value") {
        str += this.coefficient;
      } else if (this.type=="variable") {
        str += "x";
      } else if (this.type=="constant") {
        str += this.mathConstant.c;
      } else if (this.type=="function") {
        str += this.mathFunction.f + "(" + this.sections[0].formula() + ")";
      } else if (this.type=="section") {
        if (this.sections[0].type=="section") {
          str+= "(" + this.sections[0].formula() + ")";
        } else {
          str+= this.sections[0].formula();
        }
        str += this.operator.operator;
        if (this.sections[1].type=="section") {
          str+= "(" + this.sections[1].formula() + ")";
        } else {
          str+= this.sections[1].formula();
        }
      }

      return str;
    };


    //constructor: parse the string
    if (input!==undefined) {
      if (typeof(input)=="string") {
        //Remove excess whitespace
        input = input.replace(/\s/g, "");

        //get rid of unnecessary brackets surrounding the section
        input = removeBrackets(input);
        
        //Find the last instance of each operator in the string
        var addition = findLast("+", input);
        
        var bracket1 = findLast("(", input);

        var not = findLast("!", input);

        var multiplication = findLast("*", input);
        var multiplication2 = findMultiplicationBrackets(input); //Find brackets that are the same as multiplication

        //Push back each half of the equation into a section, in reverse order of operations
        if (addition != -1) {
          this.sections.push(new Segment(input.substring(0, addition)));
          this.sections.push(new Segment(input.substring(addition+1)));
          this.operator = new Operator("+");
        } else if (multiplication2 != -1 && Math.max(multiplication2, multiplication)==multiplication2) {
          this.sections.push(new Segment(input.substring(0, multiplication2)));
          this.sections.push(new Segment(input.substring(multiplication2)));
          this.operator = new Operator("*");
        } else if (multiplication != -1) {
          this.sections.push(new Segment(input.substring(0, multiplication)));
          this.sections.push(new Segment(input.substring(multiplication+1)));
          this.operator = new Operator("*");
        } else if (not != -1) {
          this.sections.push(new Segment(input.substring(not+1)));
          this.mathFunction = new MathFunction("not");
          this.type = "function";
        } else if (bracket1 != -1) {
          var openBrackets=1;
          for (var i=bracket1+1; i<input.length&&openBrackets>0; i++) {
            if (input.substr(i, 1)=="(") openBrackets++;
            if (input.substr(i, 1)==")") openBrackets--;
          }
          if (openBrackets===0) {
            var bracket2=i-1;
            if (bracket1>0) this.sections.push(new Segment(input.substring(0, bracket1)));
            if (bracket2-bracket1!=1) this.sections.push(new Segment(input.substring(bracket1+1, bracket2)));
            if (bracket2!=input.length-1) this.sections.push(new Segment(input.substring(bracket2+1)));
            this.operator = new Operator("*");
          } else {
            Truthful.log("Brackets nesting error: " + input);
          }

        //If there are no operators, just push the input itself
        } else {
          //var xLocation=input.toLowerCase().indexOf("x");
          if (/^[a-z0-9]+$/i.test(input)) {
          //if (xLocation!=-1) {
            /*if (xLocation>0) {
              this.sections.push(new Segment(input.substring(0, xLocation)));
              this.sections.push(new Segment("x"));
              this.operator=new Operator("*");
            } else {*/
              this.variable=input;
              this.type="variable";
            //}
          } else {
            this.coefficient = parseFloat(input);
            this.type = "value";
          }
        }
      } else if (typeof(input)=="number") {
        this.coefficient = input;
        this.type = "value";
      } else if (typeof(input)=="boolean") {
        this.type = "value";
        if (input) {
          this.coefficient = 1;
        } else {
          this.coefficient = 0;
        }
      } else if (input.simplify) {
        this.coefficient = input.coefficient;
        this.operator = input.operator;
        this.mathFunction = input.mathFunction;
        this.mathConstant = input.mathConstant;
        this.variable = input.variable;
        this.type=input.type;
        this.sections=[];
        for (var j=0; j<input.sections.length; j++) {
          this.sections.push(new Segment(input.sections[j]));
        }
      }
    } else {
      Truthful.log("Segment has no input.");
    }
  }

  var worker={};

  worker.errors=[];

  //logs errors
  worker.log = function(message) {
    this.errors.push(message);
  };

  worker.clearErrors = function() {
    this.errors = [];
  };

  worker.hasErrors = function() {
    return this.errors.length;
  };

  //creates a list of errors to be displayed
  worker.displayErrors = function() {
    var errorDiv = document.createElement("div");
    errorDiv.className="error";
    errorDiv.innerHTML = "Errors:";
    var errorList = document.createElement("ul");
    for (var i=0; i<this.errors.length; i++) {
      var e = document.createElement("li");
      e.innerHTML = this.errors[i];
      errorList.appendChild(e);
    }
    errorDiv.appendChild(errorList);
    return errorDiv;
  };

  //Checks to see if brackets are properly nested in a string
  worker.properBrackets = function(value) {
    var openBrackets=0;
    for (var i=0; i<value.length; i++) {
      if (value.substr(i, 1)=="(") openBrackets++;
      if (value.substr(i, 1)==")") openBrackets--;
    }
    return openBrackets===0;
  };

  //Creates a new Segment for an expression
  worker.createExpression = function(value) {
    if (this.properBrackets(value)) {
      return new Segment(value);
    } else {
      this.log("Improperly nested brackets.");
      return 0;
    }
  };

  //Creates a new Graph for an expression
  worker.graphExpression = function(value, width, height, x1, x2, y1, y2) {
    if (this.properBrackets(value)) {
      return new Graph(value, width, height, x1, x2, y1, y2);
    } else {
      this.log("Improperly nested brackets.");
      return 0;
    }
  };

  return worker;
}());