import * as commands from './commands';

const command = process.argv[2] || null;
console.log(commands)
if(!command){
  //show availables
}

// @ts-ignore
const commandKey: string | undefined = Object.keys(commands).find(c => commands[c].command === command)

if(!commandKey){
  //show availables
}

console.log(commandKey)
//executar os comandos
