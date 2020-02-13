// components/progress-bar/progress-bar.js
let movableAreaWidth = 0
let movableViewWidth = 0
//获取全局唯一的背景音频管理器。
const backgroundAudioManager = wx.getBackgroundAudioManager()
let currentSec = -1 //当前的秒数
let duration = 0 //当前音乐全部时间
let isMoving = false //判断是否在拖拽/锁
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    isSameMusic:Boolean
  },

  /**
   * 组件的初始数据
   */
  data: {
    showTime: {
      currentTime: '00:00',
      totalTime: '00:00',
    },
    movableDis: 0,
    progress: 0
  },

  lifetimes: {

    ready() {
      //当前点的是同一首歌，重新获取当前歌曲总时间，因为歌曲在oncanplay中，没有重新获取值
      if(this.properties.isSameMusic && this.data.showTime.totalTime == '00:00'){
        this._setTime()
      }
      this._getMovableDis()
      this._bindBGMEvent()
    }
  },
  /**
   * 组件的方法列表
   */
  methods: {
    //拖动
    onChange(event) {
      // console.log(event)
      // console.log(this.data.progress)

      //滑动进度条时先修改data里的进度百分比和圆圈x位置
      if (event.detail.source == 'touch') {
        this.data.progress = event.detail.x / (movableAreaWidth - movableViewWidth) * 100
        this.data.movableDis = event.detail.x
        isMoving = true
      }

    },
    //结束拖动
    onTouchEnd() {
      //当前播放时间格式化
      const currentTimeFmt = this._dateFormat(Math.floor(backgroundAudioManager.currentTime))
      //setData修改进度条 圆圈位置 当前播放时间
      this.setData({
        progress: this.data.progress,
        movableDis: this.data.movableDis,
        ['showTime.currentTime']: `${currentTimeFmt.min}:${currentTimeFmt.sec}`
      })
      // 背景音乐跳转到 进度 * 总时长 / 100
      backgroundAudioManager.seek(this.data.progress * duration / 100)
      isMoving = false

    },
    //获取进度条开始和结束位置
    _getMovableDis() {
      const query = this.createSelectorQuery()
      //boundingClientRect节点查询
      query.select('.movable-area').boundingClientRect()
      query.select('.movable-view').boundingClientRect()
      query.exec(rect => {
        // console.log(rect)
        movableAreaWidth = rect[0].width
        movableViewWidth = rect[1].width
        console.log(movableAreaWidth, movableViewWidth)
      })
    },
    //播放事件
    _bindBGMEvent() {
      backgroundAudioManager.onPlay(() => {
        console.log('onPlay')
        this.triggerEvent('changeBackPlay', { 
          isplaying:true 
        })
        isMoving = false
      })
      backgroundAudioManager.onStop(() => {
        console.log('onStop')
      })
      backgroundAudioManager.onPause(() => {
        console.log('onPause')
        this.triggerEvent('changeBackPlay',{
          isplaying:false
          })
      })
      backgroundAudioManager.onWaiting(() => {
        console.log('onWaiting')
      })
      backgroundAudioManager.onCanplay(() => {
        console.log('onCanplay')
        console.log(backgroundAudioManager.duration)
        if (typeof backgroundAudioManager.duration != 'undefined') {
          this._setTime()
        } else {
          setTimeout(() => {
            this._setTime()
          }, 1000)
        }
      })
      //监听背景音频播放进度更新事件
      backgroundAudioManager.onTimeUpdate(() => {
        // console.log('onTimeUpdate')
        if (!isMoving) {
          //获取当前时间
          const currentTime = backgroundAudioManager.currentTime
          //获取总时间
          const duration = backgroundAudioManager.duration
          // console.log(currentTime)
          //格式化当前时间为00:00
          const currentTimeFmt = this._dateFormat(currentTime)
          //取当前时间的整秒部分
          const sec = currentTime.toString().split('.')[0]
          if (sec != currentSec) {
            this.setData({
              //进度条圆圈移动数值
              movableDis: (movableAreaWidth - movableViewWidth) * currentTime / duration,
              //进度百分比
              progress: currentTime / duration * 100,
              //当前时间格式化
              ['showTime.currentTime']: `${currentTimeFmt.min}:${currentTimeFmt.sec}`
            })
            currentSec = sec
            //联动歌词
            this.triggerEvent('timeUpdate',{
              currentTime
            })
          }
        }



      })
      backgroundAudioManager.onEnded(() => {
        console.log('onEnded')
        this.triggerEvent('musicEnd')
      })
      backgroundAudioManager.onError(res => {
        console.log('res.errMsg')
        console.log('res.errCode')
        wx.showToast({
          title: '错误：' + res.errCode
        })
      })
    },
    //设置总时间
    _setTime() {
      duration = backgroundAudioManager.duration
      console.log(duration)
      const durationFmt = this._dateFormat(duration)
      console.log(durationFmt)
      this.setData({
        ['showTime.totalTime']: `${durationFmt.min}:${durationFmt.sec}`
      })
    },
    //格式化时间
    _dateFormat(sec) {
      //分钟
      const min = Math.floor(sec / 60)
      sec = Math.floor(sec % 60)
      return {
        'min': this._parse0(min),
        'sec': this._parse0(sec)
      }
    },
    //补零
    _parse0(sec) {
      return sec < 10 ? '0' + sec : sec
    }
  }
})