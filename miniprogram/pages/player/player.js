// pages/player/player.js
//不显示的数据定义在外面,如歌曲列表
//当前正在播放的歌单数组
let musiclist = []
//当前正在播放的index
let nowPlayingIndex = 0
//获取全局唯一的背景音频管理器
const backgroundAudioManager = wx.getBackgroundAudioManager()
//获取到小程序全局唯一的 App 实例
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    picUrl: '',
    isplaying: false, //false表示不播放，true表示正在播放
    isLyricShow: false, //表示当前歌词是否显示
    lyric: '',
    isSameMusic: false, //是否为同一首歌
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {

    console.log(options)
    nowPlayingIndex = options.index
    //将musiclist存到storage里，存在本地
    musiclist = wx.getStorageSync('musiclist')
    this._loadMusicDetail(options.musicId)
  },
  //加载歌曲信息
  _loadMusicDetail(musicId) {
    //判断是否是同一首歌曲
    if (musicId == app.getPlayMusicId()) {
      this.setData({
        isSameMusic: true
      })
    } else {
      this.setData({
        isSameMusic: false
      })
    }
    //不是同一首就先停止歌曲
    if (!this.data.isSameMusic) {
      backgroundAudioManager.stop()
    } else {
      backgroundAudioManager.play()
    }
    let music = musiclist[nowPlayingIndex]
    console.log(music)
    wx.setNavigationBarTitle({
      title: music.name,
    })
    //更改图片 播放状态为false
    this.setData({
      picUrl: music.al.picUrl,
      isplaying: false
    })
    //调用全局属性，设置musicId，为了返回时高亮显示正常
    console.log(musicId, typeof musicId)
    app.setPlayMusicId(musicId)
    wx.showLoading({
      title: '歌曲加载中',
    })
    //调用云函数 传musicId 获取这首音乐
    wx.cloud.callFunction({
      name: 'music',
      data: {
        musicId: musicId,
        $url: 'musicUrl'
      }
    }).then(res => {
      console.log(res)
      let result = JSON.parse(res.result)
      if (result.data[0].url == null) {
        wx.showToast({
          title: '无权限播放VIP歌曲',
        })
        return
      }
      if (!this.data.isSameMusic) {
        backgroundAudioManager.src = result.data[0].url
        backgroundAudioManager.title = music.name
        backgroundAudioManager.coverImgUrl = music.al.picUrl
        backgroundAudioManager.singer = music.ar[0].name
        backgroundAudioManager.epname = music.al.name

        //保存播放历史
        this.savePlayHistory()
      }

      this.setData({
        isplaying: true
      })


      wx.hideLoading()

      //加载歌词
      wx.cloud.callFunction({
        name: 'music',
        data: {
          musicId,
          $url: 'lyric',
        }
      }).then(res => {
        console.log(JSON.parse(res.result))
        let lyric = '暂无歌词'
        const lrc = JSON.parse(res.result).lrc
        if (lrc) {
          lyric = lrc.lyric
        }
        this.setData({
          lyric
        })
      })
    })
  },
  changeBackPlay(event) {
    // console.log(event.detail.isplaying)
    this.setData({
      isplaying: event.detail.isplaying
    })
  },
  //播放暂停切换
  togglePlaying() {
    if (this.data.isplaying) {
      backgroundAudioManager.pause()
    } else {
      backgroundAudioManager.play()
    }
    this.setData({
      isplaying: !this.data.isplaying
    })
  },
  //上一首
  onPrev() {
    nowPlayingIndex--
    if (nowPlayingIndex < 0) {
      nowPlayingIndex = musiclist.length - 1
    }
    //加载音乐
    this._loadMusicDetail(musiclist[nowPlayingIndex].id)
  },
  //下一首
  onNext() {
    nowPlayingIndex++
    if (nowPlayingIndex === musiclist.length) {
      nowPlayingIndex = 0
    }
    
    //加载音乐
    this._loadMusicDetail(musiclist[nowPlayingIndex].id)

  },

  onChangeLyricShow() {
    this.setData({
      isLyricShow: !this.data.isLyricShow
    })
  },
  //从进度条组件传当前时间给歌词组件
  timeUpdate(event) {
    this.selectComponent('.lyric').update(event.detail.currentTime)
  },

  //保存播放历史
  savePlayHistory() {
    //当前正在播放的歌曲
    const music = musiclist[nowPlayingIndex]
    //获取当前用户openid
    const openid = app.globalData.openid
    //history为该openid下存的数组
    const history = wx.getStorageSync(openid)
    let bHave = false
    for (let i = 0, len = history.length; i < len; i++) {
      //如果歌曲存在
      if (history[i].id == music.id) {
        bHave = true
        break
      }
    }
    //如果歌曲不存在，bhave为flase
    if (!bHave) {
      //往数组头部插入
      history.unshift(music)
      wx.setStorage({
        key: openid,
        data: history,
      })
    }
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