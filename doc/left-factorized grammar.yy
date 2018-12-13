ExpSeq   : '<' Sessions '>' EOF
Sessions : Session NextSessions
NextSessions : // empty
             | ',' Sessions
Session  : ( NUMBER '*' )? (IDENT '=')? Exp

/* the design for each session */
Exp      : BETWEEN Params
         | Blocks
Blocks   : Block CROSS Blocks
         | Block
         | SERIAL '(' Block ')'
Block    : Strategy Params
         | SAME
Params    : '(' Param SubBlock ')'
Param     :  Vars ',' NUMBER
SubBlock  :  /* empty */
          | ',' Blocks

/* independent variables and placeholders */
Vars     : Var CROSS Vars
         | Var
Var      : VarName '=' '{' Levels '}'
VarName  : (IDENT | CROSS)
Levels   : Level ',' Levels
         | Level
Level    : PLACEHOLDER
         | (IDENT | NUMBER | CROSS)
Strategy : FIX
         | RANDOM
         | COMPLETE
         | LATIN
