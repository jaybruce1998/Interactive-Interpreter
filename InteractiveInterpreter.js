/**
 * Program usage:
 *
 * fn avg => (x + y) / 2
    ERROR: Unknown identifier 'x'
 * fn avg x y => (x + y) / 2
 (NOTE: All function parameters MUST be explicitly defined)
 * a = 2
    2
 * b = 4
    4
 * avg a b
    3
    
 * Have fun! :)
 */

//constructor for the interpreter: we need dictionaries for variables and functions
//the user makes
function Interpreter()
{
    this.vars = {};
    this.functions = {};
}
//a simpler tokenizer for parsing user input
Interpreter.prototype.tokenize = function (program)
{
    if (program === "")
        return [];

    var regex = /\s*(=>|[-+*\/\%=\(\)]|[A-Za-z_][A-Za-z0-9_]*|[0-9]*\.?[0-9]+)\s*/g;
    return program.split(regex).filter(function (s) { return !s.match(/^\s*$/); });
};
//the main function for parsing user input
Interpreter.prototype.input = function(exp)
{
  var e=this.tokenize(exp), t, q, x;//start by tokenizing their input
  if(e[0]=='fn')//user is defining a new function
  {
    var i=e.indexOf("=>");//represents divide between function name and the code it will execute
    for(var k in this.vars)//go through all the existing variables
      if(k==e[1])
        throw "Cannot declare function with name of existing variable!";
    for(var j=1; j<i; j++)//go through all function arguments
      for(var k=j+1; k<i; k++)//and compare them with the ones after them
        if(e[j]==e[k])
          throw "No repeat variables allowed!";
    t=e.slice(1, i);//represents left side of the function
    q=e.slice(i+1).join(" ");//and the right side, joined by spaces for easier parsing later
    for(var j=1; j<t.length; j++)//go through all the function arguments
      q=q.replace(new RegExp(t[j], 'g'), 1);//and try to replace them with an arbitrary
      //number; in this case, it's 1
    new Interpreter().input(q);//if this fails, we know it's an invalid function
    this.functions[t.join(" ")]=e.slice(i+1).join(" ");//save the function for later use
    return '';//no return value for function declarations
  }
  for(var i=e.length-1; i>=0; i--)//look for function calls in the given expression
    for(var k in this.functions)//go through all the functions
      if(k.startsWith(e[i]))//we found a function call!
      {
        t=this.tokenize(k);//keys to dicts cannot be lists, so we must continuously
        //re-tokenize function declarations UGH
        q=e.splice(i, t.length);//get the whole function call out of e
        if(t.length!=q.length)//splice will not fail when its second arg is too large
          throw "Not enough arguments!";//so we must manually check
        x=this.functions[k];//store the function code for easy manipulation
        for(var i=1; i<t.length; i++)//go through all function call args
          x=x.replace(new RegExp(t[i], 'g'), q[i]);//and pop them into place!
        e.splice(i, 0, this.input(x));//function code SHOULD be evaluated naturally at this point, YAY!
      }
    for(var i=e.indexOf("("); i>=0; i=e.indexOf("("))//simplify all parentheses
    {
      var j=i+1;//we found a (, start looking for the corresponding )
      for(var n=1; n>0; j++)//we need to match up ALL () that we find!
        if(e[j]=="(")//we need more )
          n++;
        else if(e[j]==")")//we need less )
          n--;
      t=e.splice(i, j-i);//evaluate everything in parentheses separately
      if(t.indexOf("fn")>=0)//functions cannot be declared in parentheses, sorry!
        throw "Functions must be declared separately!";
      //recursively evaluate expression in the parentheses and put it back in the original
      //expression
      e.splice(i, 0, this.input(t.slice(1, t.length-1).join(" ")));
    }
    if(e.length==0)//user typed nothing
      return '';//so give them NOTHING
    if(e[1]=='=')//we're defining a variable ooh
    {
      for(var k in this.functions)//go through all the functions
        if(k.startsWith(e[0]))//uh oh, can't make a variable with an existing function name!
          throw "Function already exists with this variable name!";
      //recursively evaluate righthand-side of equals sign to allow for multiple variable assignments
      this.vars[e[0]]=this.input(e.slice(2).join(""));
    }
    if(isNaN(e[0]))//user is trying to use a variable in an expression
      if(isNaN(this.vars[e[0]]))//uh-oh, they didn't define that variable yet!
        throw "This variable does not exist!";
      else
        e[0]=this.vars[e[0]];//plug in actual value of said variable
    for(var i=1; i<e.length; i++)//go through the expression looking for math to perform
      if(e[i]=="*")//PEMDAS, but we already did P and don't support E
      {
        x=e.splice(--i, 3);
        e.splice(i, 0, x[0]*x[2]);
      }
      else if(e[i]=="%")//Modulus has the same precedence as multiplication/division
      {//so we SHOULD call it PEMMDAS
        x=e.splice(--i, 3);
        e.splice(i, 0, x[0]%x[2]);
      }
      else if(e[i]=='/')
      {
        x=e.splice(--i, 3);
        e.splice(i, 0, x[0]/x[2]);
      }
    for(var i=1; i<e.length; i++)//Addition and subtraction have lower priority
      if(e[i]=="+")//so they get evaluated down here
      {
        x=e.splice(--i, 3);
        e.splice(i, 0, +x[0]+ +x[2]);//need two plus signs so string concatenation isn't performed
      }
      else if(e[i]=='-')
      {
        x=e.splice(--i, 3);
        e.splice(i, 0, x[0]-x[2]);
      }
  if(e.length!=1&&e[1]!='='||isNaN(e[0]))//could not resolve variable name or symbol
    throw "Could not finish parsing input!";
  return +e[0];//by default, all tokens are strings, so we need to convert to a number
};