import Vue from 'vue2'
import TimePicker from '@/modules/time-picker'
import instantiateComponent from '@/common/helpers/instantiate-component'
import { dispatchSwipe } from '../utils/event'

describe('TimePicker', () => {
  let vm
  afterEach(() => {
    if (vm) {
      vm.$parent.destroy()
      vm = null
    }
  })

  it('use', () => {
    Vue.use(TimePicker)
    expect(Vue.component(TimePicker.name))
      .to.be.a('function')
  })

  it('should render correct contents', function (done) {
    vm = createPicker()

    const cancelBtn = vm.$el.querySelector('.cube-picker-cancel')
    expect(cancelBtn.textContent.trim())
      .to.equal('取消')

    const confirmBtn = vm.$el.querySelector('.cube-picker-confirm')
    expect(confirmBtn.textContent.trim())
      .to.equal('确定')
    vm.show()
    setTimeout(() => {
      const wheels = vm.$el.querySelectorAll('.cube-picker-wheel-wrapper > div')
      expect(wheels.length)
        .to.equal(3)

      const firstWheelItems = wheels[0].querySelectorAll('li')
      expect(firstWheelItems.length)
        .to.equal(3)
      expect(firstWheelItems[0].textContent.trim())
        .to.equal('今日')

      const secondWheelItems = wheels[1].querySelectorAll('li')
      expect(secondWheelItems[0].textContent.trim())
        .to.equal('现在')

      vm.hide()

      setTimeout(() => {
        const nextDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
        vm.setTime(+nextDate)
        vm.show()
        setTimeout(() => {
          const wheel = vm.$el.querySelector('.cube-picker-wheel-wrapper > div > ul')
          const transform = wheel.style.webkitTransform || wheel.style.transform
          expect(transform.match(/translate\(0px,\s*(-?\d+)px\)/)[1])
            .to.equal('-36')

          expect(firstWheelItems[1].textContent.trim())
            .to.equal(`${nextDate.getMonth() + 1}月${nextDate.getDate()}日`)

          done()
        }, 100)
      })
    }, 100)
  })

  it('should render correct contents - no showNow', function (done) {
    vm = createPicker({
      showNow: false,
      title: '自定义标题',
      day: {
        len: 4,
        filter: ['今天'],
        format: 'M月d日'
      }
    })

    const cancelBtn = vm.$el.querySelector('.cube-picker-cancel')
    expect(cancelBtn.textContent.trim())
      .to.equal('取消')

    const confirmBtn = vm.$el.querySelector('.cube-picker-confirm')
    expect(confirmBtn.textContent.trim())
      .to.equal('确定')
    vm.show()
    setTimeout(() => {
      const wheels = vm.$el.querySelectorAll('.cube-picker-wheel-wrapper > div')
      expect(wheels.length)
        .to.equal(3)
      const firstWheelItems = wheels[0].querySelectorAll('li')
      expect(firstWheelItems.length)
        .to.equal(4)
      expect(firstWheelItems[0].textContent.trim())
        .to.equal('今天')
      done()
    }, 100)
  })

  it('should render correct contents - showNow text', function (done) {
    vm = createPicker({
      showNow: {
        text: 'now text'
      }
    })

    vm.show()
    setTimeout(() => {
      const wheels = vm.$el.querySelectorAll('.cube-picker-wheel-wrapper > div')

      const secondWheelItems = wheels[1].querySelectorAll('li')
      expect(secondWheelItems[0].textContent.trim())
        .to.equal('now text')

      done()
    }, 100)
  })

  it('should trigger events', function (done) {
    this.timeout(10000)

    const selectHandle = sinon.spy()
    const cancelHandle = sinon.spy()
    const changeHandle = sinon.spy()
    const events = {
      select: selectHandle,
      cancel: cancelHandle,
      change: changeHandle
    }

    vm = createPicker({}, events)

    // cancel
    vm.show()
    const cancelBtn = vm.$el.querySelector('.cube-picker-cancel')
    cancelBtn.click()
    expect(cancelHandle)
      .to.be.callCount(1)

    // change
    vm.show()
    setTimeout(() => {
      const wheels = vm.$el.querySelectorAll('.cube-picker-wheel-wrapper > div')
      const firstWheelItems = wheels[0].querySelectorAll('li')

      dispatchSwipe(firstWheelItems[1], [
        {
          pageX: firstWheelItems[1].offsetLeft + 10,
          pageY: firstWheelItems[1].offsetTop + 10
        },
        {
          pageX: 300,
          pageY: 380
        }
      ], 100)
      setTimeout(() => {
        expect(changeHandle)
          .to.be.callCount(1)

        // select: now
        const confirmBtn = vm.$el.querySelector('.cube-picker-confirm')
        confirmBtn.click()
        const now = +new Date()
        expect(selectHandle)
          .to.be.callCount(1)
        expect(selectHandle.args[0][0])
          .to.be.closeTo(now, 2)

        done()
      }, 1000)
    }, 100)
  })

  it('should have correct args when select normal time', function (done) {
    const selectHandle = sinon.spy()
    vm = createPicker({
      showNow: false,
      delay: 0,
      minuteStep: 1
    }, {
      select: selectHandle
    })

    // select: now
    vm.show()
    setTimeout(() => {
      const confirmBtn = vm.$el.querySelector('.cube-picker-confirm')
      confirmBtn.click()
      const now = +new Date()
      expect(selectHandle)
        .to.be.callCount(1)
      expect(selectHandle.args[0][0])
        .to.be.closeTo(now, 60 * 1000)

      done()
    }, 100)
  })

  it('should add warn log when sigle is true', () => {
    const app = new Vue()
    const originWarn = console.warn
    const msgs = []
    console.warn = function (...args) {
      msgs.push(args.join('#'))
    }
    vm = app.$createTimePicker({}, true)
    expect(msgs.length)
      .to.equal(1)
    console.warn = originWarn
  })
})

function createPicker(props = {}, events = {}) {
  return instantiateComponent(Vue, TimePicker, {
    props: props,
    on: events
  })
}
