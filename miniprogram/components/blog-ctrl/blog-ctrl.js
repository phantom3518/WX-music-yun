let userInfo = {}
const db = wx.cloud.database()
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    blogId:String,
    blog:Object,
  },
  options: {
    //消除组件样式隔离
    styleIsolation: 'apply-shared',
    
  },
  /**
   * 组件的初始数据
   */
  data: {
    //登录组件是否显示
    loginShow: false,
    modelShow:false,
    content:''
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onComment() {
      //判断用户是否授权
      wx.getSetting({
        success: (res) => {
          console.log(res)
          if (res.authSetting['scope.userInfo']) {
            wx.getUserInfo({
              success: (res) => {
                userInfo = res.userInfo
                //显示评论的弹出层
                this.setData({
                  modelShow: true
                })
              }
            })
          } else {
            this.setData({
              loginShow: true
            })

          }
        }
      })
    },
    onLoginSuccess(event) {
      userInfo  = event.detail
      //授权框消失，评论框显示
      this.setData({
        loginShow: false,
      },()=>{
        this.setData({
          modelShow: true
        })
      })
    },
    onLoginFail() {
      wx.showModal({
        title: '授权用户才能进行评价',
        content: '',
      })
    },
    // onInput(event) {
    //   console.log(event.detail.value)
    //   this.setData({
    //     content: event.detail.value
    //   })
    // },
    onSend(event) {
      console.log(event)

      //评论信息插入云数据库
      // let formId = event.detail.formId

      let content = event.detail.value.content
      if (content.trim() == '') {
        wx.showModal({
          title: '评论内容不能为空',
          content: '',
        })
        return
      }
      wx.showLoading({
        title: '评价中',
        mask: true
      })
      db.collection('blog-comment').add({
        data: {
          content,
          createTime:db.serverDate(),
          blogId: this.properties.blogId,
          nickName: userInfo.nickName,
          avatarUrl: userInfo.avatarUrl
        }
      }).then(res => {
        wx.hideLoading()
        wx.showToast({
          title: '评论成功',
        })
        this.setData({
          modelShow: false,
          content: ''
        })
        //父元素刷新评论页面
        this.triggerEvent('refreshCommentList')

      })

      

    }
  }
})
