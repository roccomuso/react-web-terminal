import React from 'react'
import Terminal from '../Terminal.jsx'
import { configure } from 'enzyme'
import Adapter from 'enzyme-adapter-react-15'
import { shallow } from 'enzyme'

configure({ adapter: new Adapter() })

describe('Terminal', () => {
  it('renders correctly', () => {
    shallow(<Terminal />)
  })
})

describe('User login', () => {
  const name = 'Bob'
  const wrapper = shallow(<Terminal />)
  wrapper.instance().performLogin(name)
  wrapper.update()
  expect(wrapper.state().is_authenticated).toBe(true)
})

describe('Topup user balance', async () => {
  const name = 'Bob'
  const wrapper = shallow(<Terminal />)
  const instance = wrapper.instance()
  instance.performLogin(name)
  wrapper.update()
  await instance.performTopUp(100)
  wrapper.update()
  expect(wrapper.state().clients[0].balance).toEqual(100)
})

describe('Transfer 30 in balance to another account with initial balance of 100', async () => {
  const sender_name = 'Bob'
  const recipient_name = 'Alice'
  const wrapper = shallow(<Terminal />)
  const instance = wrapper.instance()
  instance.performLogin(recipient_name)
  wrapper.update()
  instance.performLogin(sender_name)
  wrapper.update()
  const sender_index = wrapper
    .state()
    .clients.findIndex((x) => x.name === sender_name)
  const recipient_index = wrapper
    .state()
    .clients.findIndex((x) => x.name === recipient_name)
  await instance.performTopUp(100)
  wrapper.update()
  await instance.performTransfer(recipient_name, 30)
  wrapper.update()
  expect(wrapper.state().clients[sender_index].balance).toEqual(70)
  expect(wrapper.state().clients[recipient_index].balance).toEqual(30)
})

describe('Transfer 30 in credit to another account with initial balance of 0', async () => {
  const sender_name = 'Bob'
  const recipient_name = 'Alice'
  const wrapper = shallow(<Terminal />)
  const instance = wrapper.instance()
  instance.performLogin(recipient_name)
  wrapper.update()
  instance.performLogin(sender_name)
  wrapper.update()
  const sender_index = wrapper
    .state()
    .clients.findIndex((x) => x.name === sender_name)
  const recipient_index = wrapper
    .state()
    .clients.findIndex((x) => x.name === recipient_name)
  await instance.performTransfer(recipient_name, 30)
  wrapper.update()
  expect(wrapper.state().clients[sender_index].balance).toEqual(0)
  expect(
    wrapper.state().clients[sender_index].adjustment[
      recipient_name.toLowerCase()
    ].debit,
  ).toEqual(30)
  expect(
    wrapper.state().clients[recipient_index].adjustment[
      sender_name.toLowerCase()
    ].credit,
  ).toEqual(30)
})

describe('Transfer 200 in credit to another account with initial balance of 100', async () => {
  const sender_name = 'Bob'
  const recipient_name = 'Alice'
  const wrapper = shallow(<Terminal />)
  const instance = wrapper.instance()
  instance.performLogin(recipient_name)
  wrapper.update()
  instance.performLogin(sender_name)
  wrapper.update()
  await instance.performTopUp(100)
  wrapper.update()
  const sender_index = wrapper
    .state()
    .clients.findIndex((x) => x.name === sender_name)
  const recipient_index = wrapper
    .state()
    .clients.findIndex((x) => x.name === recipient_name)
  await instance.performTransfer(recipient_name, 200)
  wrapper.update()
  expect(wrapper.state().clients[sender_index].balance).toEqual(0)
  expect(wrapper.state().clients[recipient_index].balance).toEqual(100)
  expect(
    wrapper.state().clients[sender_index].adjustment[
      recipient_name.toLowerCase()
    ].debit,
  ).toEqual(100)
  expect(
    wrapper.state().clients[recipient_index].adjustment[
      sender_name.toLowerCase()
    ].credit,
  ).toEqual(100)
})
