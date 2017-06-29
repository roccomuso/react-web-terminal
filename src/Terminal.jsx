import React, {Component} from 'react'
import {Scrollbars} from 'react-custom-scrollbars'
import './App.css'

class Terminal extends Component {

  constructor(props) {
    super(props)
    this.state = {
      commands: {},
      history: [],
      prompt: '$ '
    }

    /* bind Methods to the Component scope */
    this.clearHistory = this.clearHistory.bind(this)
    this.registerCommands = this.registerCommands.bind(this)
    this.listFiles = this.listFiles.bind(this)
    this.showWelcomeMsg = this.showWelcomeMsg.bind(this)
    this.showHelp = this.showHelp.bind(this)
  }

  clearHistory() {
    this.setState({history: []});
  }

  registerCommands() {
    this.setState({
      commands: {
        'intro': this.showWelcomeMsg,
        'help': this.showHelp,
        'github': this.openLink('https://github.com/roccomuso'),
        'source': this.openLink('https://github.com/roccomuso/react-web-terminal'),
        'ls': this.listFiles,
        'clear': this.clearHistory
      }
    });
  }

  listFiles() {
    this.addHistory("README.md");
  }

  showWelcomeMsg() {
    this.addHistory("Hello, this web-terminal lets you take control of a remote device.");
    this.addHistory("Type `help` to see what all commands are available");
  }

  openLink(link) {
    return function() {
      window.open(link, '_blank');
    }
  }

  showHelp() {
    this.addHistory([
      "intro - print intro message",
      "help - this help text",
      "github - view my github profile",
      "source - browse the code for this page",
      "ls - list files",
      "clear - clear screen"
    ])
  }

  componentDidMount() {
    var term = this.term

    this.registerCommands();
    this.showWelcomeMsg();
    term.focus();
  }

  componentDidUpdate() {
    this.scrollBar.scrollToBottom()
  }

  handleInput(e) {
    if (e.key === "Enter") {
      var input_text = this.term.value;
      var input_array = input_text.split(' ');
      var input = input_array[0];
      var arg = input_array[1];
      var command = this.state.commands[input];

      this.addHistory(this.state.prompt + " " + input_text);

      if (command === undefined) {
        this.addHistory("sh: command not found: " + input);
      } else {
        command(arg);
      }
      this.clearInput();
    }
  }

  clearInput() {
    this.term.value = "";
  }

  addHistory(output) {/* output: Array or String */
    var history = this.state.history;
    if (Array.isArray(output)) {
      history = history.concat(output)
    } else {
      history.push(output)
    }

    this.setState({'history': history})
  }

  handleClick() {
    var term = this.term
    term.focus()
  }

  render() {
    var output = this.state.history.map(function(op, i) {
      return <p key={i}>{op}</p>
    })

    return (
      <Scrollbars style={{ width: 715 }} autoHeight autoHeightMin={100} autoHeightMax={400} ref={elem => this.scrollBar = elem} autoHide autoHideTimeout={1000} autoHideDuration={200}>
        <div id="content">
          <div className='input-area' onClick={this.handleClick.bind(this)}>
            {output}
            <p>
              <span className="prompt">{this.state.prompt}</span>
              <input type="text" onKeyPress={this.handleInput.bind(this)} ref={elem => this.term = elem}/>
            </p>
          </div>
        </div>
      </Scrollbars>
    )
  }

}

export default Terminal
