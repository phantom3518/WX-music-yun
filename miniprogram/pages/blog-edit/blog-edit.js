//输入文字最大个数
const MAX_WORDS_NUM = 140
//最大上传图片数量
const MAX_IMG_NUM = 9
const db = wx.cloud.database()
//输入的文字内容
let content = ''
let userInfo = {}
Page({

  /**
   * 页面的初始数据
   */
  data: {
    //输入文字个数
    wordsNum: 0,
    footerBottom: 0,
    imgList: [],
    selectPhoto: true,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    console.log(options)
    userInfo = options
  },
  onInput(event) {
    console.log(event)
    let wordsNum = event.detail.value.length
    if (wordsNum >= MAX_WORDS_NUM) {
      wordsNum = `最大字数为${MAX_WORDS_NUM}`
    }
    this.setData({
      wordsNum
    })
    content = event.detail.value
  },
  onChooseImage() {
    //还能再选几张图片
    let max = MAX_IMG_NUM - this.data.imgList.length
    wx.chooseImage({
      count: max,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        // tempFilePath可以作为img标签的src属性显示图片
        console.log(res.tempFilePaths)
        this.setData({
          imgList: this.data.imgList.concat(res.tempFilePaths)
        })
        max = MAX_IMG_NUM - this.data.imgList.length
        this.setData({
          selectPhoto: max <= 0 ? false : true
        })
      }
    })
  },
  send() {
    //2、数据-> 云数据库
    //数据库：内容、图片 fileID、openid、昵称、头像、时间   哪个用户就是openid 
    //1、图片 -> 云存储 fileID 云文件ID   上传以后会返回fileID，也就是云文件ID
    //图片上传

    if(content.trim() === ''){
      wx.showModal({
        title: '请输入内容',
        content: '',
      })
      return
    }

    wx.showLoading({
      title: '发布中',
      mask:true
    })

    let promiseArr = []
    let fileIds = []
    for (let i = 0, len = this.data.imgList.length; i < len; i++) {
      let p = new Promise((resolve, reject) => {
        let item = this.data.imgList[i]
        //文件扩展名
        let suffix = /\.\w+$/.exec(item)[0]
        wx.cloud.uploadFile({
          cloudPath: 'blog/' + Date.now() + '-' + Math.random() * 10000000 + suffix,
          filePath: item, // 文件路径
          success: res => {
            // get resource ID
            // console.log(res)
            fileIds = fileIds.concat(res.fileID)
            resolve()
          },
          fail: err => {
            console.error(err)
            reject()
          }
        })

      })
      //把所有for循环里的promise存到数组里
      promiseArr.push(p)
    }
    //存入到云数据库(小程序端存入云数据库自带openid)
    Promise.all(promiseArr).then(res=>{
      db.collection('blog').add({
        data: {
          ...userInfo,//对象里每个都插入进来可以用扩展运算符
          content,
          img: fileIds,
          createTime:db.serverDate() //服务端的时间 
        }
      }).then(res => {
        wx.hideLoading()
        wx.showToast({
          title: '发布成功',
        })
        //返回博客界面，并刷新
        wx.navigateBack()
        const pages = getCurrentPages()
        console.log(pages)
        //在子界面中调用父界面方法，其实是同级的
        const prevPage = pages[pages.length - 2]
        console.log(prevPage)
        
        prevPage.onPullDownRefresh()
      })
    }).catch(err=>{
      wx.hideLoading()
      wx.showToast({
        title: '发布失败',
      })
    })
  },
  onPreviewImg(event) {
    console.log(event)
    wx.previewImage({
      current: this.data.imgList[event.target.dataset.index], // 当前显示图片的http链接
      urls: this.data.imgList // 需要预览的图片http链接列表
    })
  },
  onDeleteImg(event) {
    console.log(event)
    this.data.imgList.splice(event.target.dataset.index, 1)
    if (this.data.imgList.length == MAX_IMG_NUM - 1) {
      this.setData({
        selectPhoto: true
      })
    }
    this.setData({
      imgList: this.data.imgList
    })
  },
  onFocus(event) {
    //模拟器获取的键盘高度为0
    console.log(event)
    this.setData({
      footerBottom: event.detail.height
    })

  },
  onBlur() {
    this.setData({
      footerBottom: 0
    })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  }
})