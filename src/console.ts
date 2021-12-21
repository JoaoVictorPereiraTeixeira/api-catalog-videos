import {default as chalk} from 'chalk';
import './bootstrap';
import * as commands from './commands';

console.log(commands)

const command = process.argv[2] || null;
if(!command){
  showAvailableCommands()
}

// @ts-ignore
const commandKey: string | undefined = Object.keys(commands).find(c => commands[c].command === command)

if(!commandKey){
  showAvailableCommands()
}

// @ts-ignore
const commandInstance = new commands[commandKey]

// console.dir(error, {depth: 5})
commandInstance
  .run()
  .catch(console.error)


console.log(commandKey)
//executar os comandos

function showAvailableCommands(){
  console.log(chalk.green('Loopback Console'));
  console.log(chalk.green(' '));
  console.log(chalk.green('Available commands'));
  console.log(chalk.green(' '));
  for(const c of Object.keys(commands)){
    // @ts-ignore
    console.log(`- ${chalk.green(commands[c].command)} - ${commands[c].description} `);
  }
  console.log(chalk.green(' '));
  process.exit();
}
