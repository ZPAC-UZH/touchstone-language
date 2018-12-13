/* Touchstone grammar */

/* lexical tokens */
/* verified completeness according to UIST 2018 draft: 25.07.18 */
%lex
%%

\s+       /* skip whitespace */
"<"                     return '<';
">"                     return '>';
"("                     return '(';
")"                     return ')';
"{"                     return '{';
"}"                     return '}';
","                     return ',';
"="                     return '=';
"*"                     return '*';
"x"                     return 'CROSS';
"Between"               return 'BETWEEN';
"Same"                  return 'SAME';
"Fix"                   return 'FIX';
"Random"                return 'RANDOM';
"Complete"              return 'COMPLETE';
"Latin"                 return 'LATIN';
"Serial"                return 'SERIAL';
"_"[1-9]"_"             return 'PLACEHOLDER';   /* this condition-order placeholder is resolved in the generator level */
([1-9][0-9]+|[0-9])     return 'NUMBER';
[a-zA-Z0-9\-"_"]+       return 'IDENT';         /* TODO: need to restrict session name from being a single number */
<<EOF>>                 return 'EOF';
.                       return 'INVALID'
/lex


/* operator associations and precedence */

%left '*'
%left '='
%left ','
%left 'CROSS'

/* import functions for processing the syntax tree */
//%{ require('./parser_functions.js') %}
/**/





/* language grammar */
%ebnf

%%


/* experiment sessions */
ExpSeq   : '<' Sessions '>' EOF
           {
              let sessions = $2;

              // resolve "Same" alias in the session level
              for (let i = 1; i < sessions.length; i ++) {
                let current = sessions[i];
                let previous = sessions[i - 1];
                if (current.design == "same") {
                  current.design = previous.design;
                }
              }

              //------------------------------------------------------------------------------
              // postprocessing functions

              // flattening cross operator
              function flatten_cross(design) {
                // no cross operator
                if (typeof design.operator == "undefined") {
                  design = [design];
                }
                // with cross operator
                else if (design.operator == "cross") {
                  let flat_right = flatten_cross(design.right);
                  if (typeof flat_right.operator != "undefined" && flat_right.operator == "cross") {
                    flat_right = flat_right.operands;
                  }
                  design.operands = [design.left].concat(flat_right);
                  delete design.left;
                  delete design.right;
                }
                return design;
              }

              // resolving "same" placeholder in block-level
              function resolve_same_block(prev_block, block) {
                // find same-placeholder in the current design and track the depth
                let depth = 1;
                let design = block;
                let will_resolve = false;
                while (typeof design.subBlock != "undefined") {
                  if (design.subBlock == "same") {
                    will_resolve = true;
                    break;   // design holds the parent of the "same" placeholder
                  }
                  depth++;
                  design = design.subBlock;
                }

                // copy the design at the same level from the previous design
                if (will_resolve) {
                  // find the design at the same level from the previous block
                  let source_design = prev_block;
                  let source_depth = 1
                  while (source_depth <= depth) {
                    source_design = source_design.subBlock;
                    source_depth++
                  }

                  // deep-copy the source design
                  design.subBlock = JSON.parse(JSON.stringify(source_design));
                }

                return block;
              }

              //------------------------------------------------------------------------------
              // post processing execution

              for (let s_i = 0; s_i < sessions.length; s_i++) {

                // flattening block-level crosses (if any)
                flatten_cross(sessions[s_i].design);


                // resolve "Same" alias in block-crossing
                let design = sessions[s_i].design;
                if (typeof design.operator != "undefined" && design.operator == "cross") {
                  for (let i = 1; i < design.operands.length; i++) {
                    let current = design.operands[i];
                    let prev = design.operands[i - 1];
                    let current_new = resolve_same_block(prev, current);
                    design.operands[i] = current_new;
                  }
                }
              }

              return $2;
           }
         ;

Sessions : Session NextSessions
           {
              $$ = [$1]

              // concatenate sessions (if any)
              if (typeof $2 != "undefined") {
                $$ = $$.concat($2);
              }                
           }
         ;

NextSessions : // empty
             | ',' Sessions
               {    
                   $$ = $2;
               }
           ;

Session  : ( NUMBER '*' )? (IDENT '=')? Exp
           {
                let rep = (Number($1) || 1);
                let name = $2;
                let design = $3;
                $$ = {name: name,
                      repetition: rep,
                      design: design};

                yy.lastSession = $$;
           }
         ;



/* the design for each session */
Exp      : BETWEEN Params 
           { 
                $$ = {strategy   : "between", 
                      serial     : false,
                      variables  : $2.variables, 
                      replication: $2.replication};
                if (typeof $2.subBlock != "undefined") {
                  $$.subBlock = $2.subBlock;
                }
           }
         | Blocks
           { $$ = $1 }
         ;

Blocks   : Block CROSS Blocks
           { 
              $$ = {operator: "cross",
                    left    : $1,
                    right   : $3};
           }
         | Block 
           { $$ = $1 }  
         | SERIAL '(' Block ')' 
           { 
                $3.serial = true;
                $$ = $3;
           }
         ;

Block    : Strategy Params
           {
                $$ = {strategy   : $1, 
                      serial     : false,
                      variables  : $2.variables, 
                      replication: $2.replication};
                if (typeof $2.subBlock != "undefined") {
                  $$.subBlock = $2.subBlock;
                }
           }
         | SAME
           { $$ = "same" }
         ;

Params    : '(' Param SubBlock ')'
            { 
                if (typeof $3 != "undefined") {

                    $2.subBlock = $3;
                }
                $$ = $2;
            }
          ;

Param     :  Vars ',' NUMBER 
            { 
                $$ = {variables: $1, replication: Number($3)};
            }
          ;

SubBlock  :  /* empty */
          | ',' Blocks
             {  $$ = $2; }
           ;

/* independent variables and placeholders */
Vars     : Var CROSS Vars
           { 
              $$ = $1.concat($3); 
           }
         | Var
           { $$ = $1; }
         ;
Var      : VarName '=' '{' Levels '}'
           { $$ = [{name: $1, levels: $4}]; }
         ;

VarName  : (IDENT | CROSS)
           { $$ = $1; }
         ;

Levels   : Level ',' Levels
           { $$ = [$1].concat($3); }
         | Level
           { $$ = $1; }
         ;

Level    : PLACEHOLDER
         | (IDENT | NUMBER | CROSS)
           { $$ = $1; }
         ;

Strategy : FIX 
           { $$ = "fix"; }
         | RANDOM 
           { $$ = "random"; }
         | COMPLETE
           { $$ = "complete"; }
         | LATIN
           { $$ = "latin"; }
         ;
/**/
