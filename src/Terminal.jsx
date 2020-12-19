import React from 'react'
import { Scrollbars } from 'react-custom-scrollbars'
import './App.css'

class Terminal extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      commands: {},
      is_authenticated: false,
      active_client: null,
      clients: [{ name: 'Bob', balance: 0, adjustment: {} }],
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
      this.addHistory([`Your account balance is ${balance}.`])
      this.clearInput()
    }
  }

  getClientByName(name) {
    return this.state.clients.find(
      (client) => client.name.toLowerCase() === name.toLowerCase(),
    )
  }

  async performTopUp(amount) {
    if (isNaN(amount)) {
      this.addHistory('Invalid entry, please enter a valid amount.')
      this.clearInput()
    } else {
      const curr_client = this.getClientByName(this.state.active_client)
      const balance = curr_client.balance + Number(amount)
      const client_obj = this.state.clients.map((client) => {
        return { ...client }
      })
      const messages = []
      let final_balance = balance
      if (!this.isEmptyObject(curr_client.adjustment)) {
        const self = this
        for (const key of Object.keys(curr_client.adjustment)) {
          if (curr_client.adjustment[key].debit > 0) {
            const loan = curr_client.adjustment[key].debit
            if (final_balance >= loan) {
              final_balance = final_balance - loan
              await self.updateAdjustment(client_obj, key, curr_client.name, 0)
              const target_balance = self.getClientByName(key).balance + loan
              await self.updateBalanceByAccount(client_obj, key, target_balance)
              messages.push(`Transferred ${loan} to ${key}.`)
              messages.push(`Your balance is ${final_balance}`)
            }
          }
        }
      }

      await this.updateBalanceByAccount(
        client_obj,
        this.state.active_client,
        final_balance,
      )

      if (final_balance === balance && balance > 0) {
        messages.push(`Topup successful, current balance is: ${final_balance}.`)
      }

      const adjustment_messages = this.checkAdjustment(this.state.active_client)

      this.setState({ clients: client_obj })
      this.addHistory([...messages, ...adjustment_messages])
    }
  }

  performLogin(client_name) {
    const is_existing_client = this.state.clients.some((client) => {
      return client.name.toLowerCase() === client_name.toLowerCase()
    })
    if (is_existing_client) {
      this.setState({
        active_client: client_name,
        is_authenticated: true,
        prompt: `$(${client_name}) `,
      })
    } else {
      const clients_obj = this.state.clients
      clients_obj.push({
        name: client_name,
        balance: 0,
        adjustment: {},
      })
      this.setState({
        clients: clients_obj,
        active_client: client_name,
        is_authenticated: true,
        prompt: `$(${client_name}) `,
      })
    }
    const default_messages = [
      `Hello ${client_name}.`,
      `Your balance is ${this.getClientByName(client_name).balance}.`,
    ]
    const adjustment_messages = this.checkAdjustment(client_name)

    this.addHistory([...default_messages, ...adjustment_messages])
  }

  async performTransfer(to_client_name, amount) {
    const is_existing_client = this.state.clients.some((client) => {
      return client.name.toLowerCase() === to_client_name.toLowerCase()
    })
    const is_self = to_client_name === this.state.active_client

    if (!is_existing_client || is_self) {
      this.addHistory("The account entered doesn't exist.")
      this.clearInput()
      return
    } else if (isNaN(amount)) {
      this.addHistory('Please enter a valid amount.')
      this.clearInput()
      return
    } else {
      const curr_balance = this.getClientByName(this.state.active_client)
        .balance
      let final_balance = curr_balance - Number(amount)

      const client_obj = this.state.clients.map((client) => {
        return { ...client }
      })

      let final_amount = amount

      if (final_balance < 0) {
        const adjustment_balance = Math.abs(final_balance)
        await this.updateAdjustment(
          client_obj,
          this.state.active_client,
          to_client_name,
          adjustment_balance,
        )
        final_balance = 0
        final_amount = amount - adjustment_balance
      }
      await this.updateBalanceByAccount(
        client_obj,
        this.state.active_client,
        final_balance,
      )
      await this.updateBalanceByAccount(
        client_obj,
        to_client_name,
        final_amount,
      )
      this.setState({
        clients: client_obj,
      })
    }
    // deduct account balance
    // add balance to recipient
    // check negative
    const default_messages = [
      `Your balance is ${
        this.getClientByName(this.state.active_client).balance
      }.`,
    ]
    const adjustment_messages = this.checkAdjustment(this.state.active_client)

    this.addHistory([...default_messages, ...adjustment_messages])
  }

  isEmptyObject(obj) {
    return Object.keys(obj).length === 0 && obj.constructor === Object
  }

  checkAdjustment(client_name) {
    const client_info = this.getClientByName(client_name)
    let adjustment_messages = []

    if (!this.isEmptyObject(client_info.adjustment)) {
      Object.keys(client_info.adjustment).forEach(function (key) {
        if (client_info.adjustment[key].debit > 0) {
          const string = `You owe ${key} ${client_info.adjustment[key].debit}.`
          adjustment_messages.push(string)
        }
        if (client_info.adjustment[key].credit > 0) {
          const string = `${key} owes you ${client_info.adjustment[key].credit}.`
          adjustment_messages.push(string)
        }
      })
    }

    return adjustment_messages
  }

  updateAdjustment(client_obj, debitor_name, creditor_name, adjustment) {
    const client_debit = this.getClientByName(debitor_name).adjustment
    const client_credit = this.getClientByName(creditor_name).adjustment
    const debit = { debit: adjustment }
    const credit = { credit: adjustment }
    const promise = new Promise(function (resolve) {
      client_obj.find(
        (client) => client.name.toLowerCase() === debitor_name.toLowerCase(),
      ).adjustment = Object.assign(client_debit, {
        [`${creditor_name}`.toLowerCase()]: debit,
      })

      client_obj.find(
        (client) => client.name.toLowerCase() === creditor_name.toLowerCase(),
      ).adjustment = Object.assign(client_credit, {
        [`${debitor_name}`.toLowerCase()]: credit,
      })

      resolve(client_obj)
    })
    return promise
  }

  updateBalanceByAccount(client_obj, name, amount) {
    const promise = new Promise(function (resolve) {
      client_obj.find((client) => {
        return client.name.toLowerCase() === name.toLowerCase()
      }).balance = amount
      resolve(client_obj)
    })
    return promise
  }

  showWelcomeMsg() {
    this.addHistory('Hello, this terminal acts as a simple banking simulator')
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
      'balance - check account balance',
    ])
  }

  componentDidMount() {
    var term = this.term

    this.registerCommands()
    this.showWelcomeMsg()
    if (term) {
      term.focus()
    }
  }

  componentDidUpdate() {
    if (this.scrollBar) {
      this.scrollBar.scrollToBottom()
    }
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
        if (input_string.length < 2) {
          this.addHistory(['Please key in a valid account'])
        } else {
          this.performLogin(input_string[1])
        }
        this.clearInput()
        return
      }

      if (input_text.startsWith('topup') && this.state.is_authenticated) {
        const input_string = input_text.split(' ')
        if (input_string.length < 2) {
          this.addHistory(['Please enter a valid amount'])
        } else {
          this.performTopUp(input_string[1])
        }
        this.clearInput()
        return
      }

      if (input_text.startsWith('pay') && this.state.is_authenticated) {
        const input_string = input_text.split(' ')
        if (input_string.length < 3) {
          this.addHistory(['Please key in account to transfer to and amount.'])
        } else {
          this.performTransfer(input_string[1], input_string[2])
        }
        this.clearInput()
        return
      }

      // if (input_text.startsWith('login') && this.state.is_authenticated) {
      //   this.addHistory([
      //     `You are already logged in as ${this.state.active_client}`,
      //     'To end session please logout...',
      //   ])
      //   this.clearInput()
      //   return
      // }

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
