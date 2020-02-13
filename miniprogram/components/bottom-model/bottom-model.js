// components/bottom-model/bottom-model.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    modelShow: Boolean
  },

  options: {
    //消除组件样式隔离
    styleIsolation: 'apply-shared',
    //slot命名
    multipleSlots: true,
  },
  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {
    modelHide() {
      this.setData({
        modelShow:false
      })
    }
  }
})
