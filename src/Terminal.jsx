import React, { Component } from 'react'
import { Scrollbars } from 'react-custom-scrollbars'
import './App.css'

class Terminal extends Component {
  constructor(props) {
    super(props)
    this.state = {
      commands: {},
      is_authenticated: false,
      active_client: null,
      clients: [{ name: 'Bob', balance: 0, debit: {}, credit: {} }],
      history: [],
      prompt: '$ ',
    }
  }

  clearHistory() {
    this.setState({ history: [] })
  }

  registerCommands() {
    this.setState({
      commands: {
        intro: this.showWelcomeMsg,
        help: this.showHelp,
        login: this.initLogin,
        balance: this.getBalance,
        topup: this.initTopUp,
        pay: this.performPay,
        logout: this.performLogout,
      },
    })
  }

  performLogout() {
    this.setState({ is_authenticated: false, active_client: null })
    this.addHistory(['You have successfully logged out...'])
    this.clearInput()
  }

  getBalance() {
    const balance = this.getClientByName(this.state.active_client).balance
    if (!this.state.is_authenticated || isNaN(balance)) {
      console.error('error with balance amount')
      this.addHistory([
        'An unexpected error occurred, could not fetch balance...',
      ])
      this.clearInput()
      return
    } else {
      this.addHistory([`Your account balance is ${balance}`])
      this.clearInput()
    }
  }

  getClientByName(name) {
    return this.state.clients.find(
      (client) => client.name.toLowerCase() === name.toLowerCase(),
    )
  }

  performTopUp(amount) {
    if (isNaN(amount)) {
      this.addHistory('Invalid entry, please enter a valid amount')
      this.clearInput()
    } else {
      const curr_client = this.getClientByName(this.state.active_client)
      const balance = curr_client.balance + Number(amount)
      let client_obj = this.state.clients.map((client) => {
        return { ...client }
      })
      client_obj.find(
        (client) => client.name === curr_client.name,
      ).balance = balance
      this.setState({ clients: client_obj })
      this.addHistory(`Topup successful, current amount is: ${balance}`)
    }
  }

  performLogin(client_name) {
    const is_existing_client = this.state.clients.some((client) => {
      return client.name.toLowerCase() === client_name.toLowerCase()
    })
    if (is_existing_client) {
      this.setState({ active_client: client_name, is_authenticated: true })
      this.addHistory([
        `Hi ${client_name}, you have successfully logged in..`,
        `Your current balance is ${this.getClientByName(client_name).balance}`,
        'You may perform the following actions: ',
        '1) topup - topup balance',
        '2) balance - check account balance',
        '3) pay - transfer balance to another account',
      ])
    } else {
      const clients_obj = this.state.clients.push({
        name: client_name,
        balance: 0,
      })
      this.setState({ clients_obj })
      this.addHistory([
        `Hi ${client_name} you have successfully created a new account..`,
        'Please proceed to login with your account',
      ])
    }
    this.setState({
      active_client: client_name,
    })
  }

  performTransfer(client_name, amount) {
    // deduct account balance
    // add balance to recipient
    // check negative
  }

  showWelcomeMsg() {
    this.addHistory(
      'Hello, this terminal simulates user interaction with a retail bank',
    )
    this.addHistory('Type `help` to see what all commands are available')
  }

  openLink(link) {
    return function () {
      window.open(link, '_blank')
    }
  }

  showHelp() {
    this.addHistory([
      'login - create new account or login into existing account',
      'topup - topup account balance',
      'pay - transfer funds to another account',
    ])
  }

  componentDidMount() {
    var term = this.term

    this.registerCommands()
    this.showWelcomeMsg()
    term.focus()
  }

  componentDidUpdate() {
    this.scrollBar.scrollToBottom()
  }

  handleInput(e) {
    if (e.key === 'Enter') {
      var input_text = this.term.value
      var input_array = input_text.split(' ')
      var input = input_array[0]
      var arg = input_array[1]
      var command = this.state.commands[input]

      this.addHistory(this.state.prompt + ' ' + input_text)

      if (input_text.startsWith('login')) {
        const input_string = input_text.split(' ')
        if (input_text.length === 2) {
          this.addHistory(['Please key in a valid account'])
        } else {
          this.performLogin(input_string[1])
        }
        this.clearInput()
        return
      }

      if (input_text.startsWith('topup')) {
        const input_string = input_text.split(' ')
        if (input_text.length === 2) {
          this.addHistory(['Please enter a valid amount'])
        } else {
          this.performTopUp(input_string[1])
        }
        this.clearInput()
        return
      }

      if (input_text.startsWith('pay')) {
        const input_string = input_text.split(' ')
        if (input_text.length === 2) {
          this.addHistory(['Please key in a valid account'])
        } else {
          this.performTransfer(input_string[1])
        }
        this.clearInput()
        return
      }

      if (input_text.startsWith('login') && this.state.is_authenticated) {
        this.addHistory([
          `You are already logged in as ${this.state.active_client}`,
          'To end session please logout...',
        ])
        this.clearInput()
        return
      }

      if (command === undefined) {
        this.addHistory('sh: command not found: ' + input)
      } else {
        command.call(this, arg)
      }
      this.clearInput()
    }
  }

  clearInput() {
    this.term.value = ''
  }

  addHistory(output) {
    /* output: Array or String */
    var history = this.state.history
    if (Array.isArray(output)) {
      history = history.concat(output)
    } else {
      history.push(output)
    }

    this.setState({ history: history })
  }

  handleClick() {
    var term = this.term
    term.focus()
  }

  render() {
    var output = this.state.history.map(function (op, i) {
      return <p key={i}>{op}</p>
    })

    return (
      <Scrollbars
        style={{ width: 715 }}
        autoHeight
        autoHeightMin={100}
        autoHeightMax={400}
        ref={(elem) => (this.scrollBar = elem)}
        autoHide
        autoHideTimeout={1000}
        autoHideDuration={200}
      >
        <div id="content">
          <div className="input-area" onClick={this.handleClick.bind(this)}>
            {output}
            <p>
              <span className="prompt">{this.state.prompt}</span>
              <input
                type="text"
                onKeyPress={this.handleInput.bind(this)}
                ref={(elem) => (this.term = elem)}
              />
            </p>
          </div>
        </div>
      </Scrollbars>
    )
  }
}

export default Terminal
