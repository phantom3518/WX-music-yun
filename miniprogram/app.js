//app.js
App({
  onLaunch: function() {

    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
        //   如不填则使用默认环境（第一个创建的环境）
        env: 'test-r9ykx',
        traceUser: true,
      })
    }
    //调用获取openid
    this.getOpenid()
    //全局数据
    this.globalData = {
      playingMusicId: -1,
      openid: -1,
    }
  },
  //全局函数

  //对当前musicId值设置
  setPlayMusicId(musicId) {
    this.globalData.playingMusicId = musicId
  },
  //获取当前musicId
  getPlayMusicId() {
    return this.globalData.playingMusicId
  },

  //获取openid
  getOpenid() {
    wx.cloud.callFunction({
      name: 'login',
    }).then(res => {
      //把openid作为本地存储的key
      const openid = res.result.openid
      this.globalData.openid = openid
      
      if (wx.getStorageSync(openid) == '') {
        wx.setStorageSync(openid, [])
      }
    })
  },

  // checkUpdate() {
  //   const updateManager = wx.getUpdateManager()
  //   //检测版本更新
  //   updateManager.onCheckForUpdate(res => {
  //     if(res.hasUpdate) {
  //       updateManager.onUpdateReady(()=>{
  //         wx.showModal({
  //           title: '更新提示',
  //           content: '新版本已经准备好，是否需要重启应用',
  //           success(res) {
  //             if(res.confirm) {
  //               updateManager.applyUpdate()
  //             }
  //           }
  //         })
  //       })
  //     }
  //   })
  // }
})