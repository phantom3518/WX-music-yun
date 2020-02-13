// 云函数入口文件
const cloud = require('wx-server-sdk')
//定义对象，引入tcb-router
const TcbRouter = require('tcb-router')

cloud.init()

// 云函数入口函数
exports.main = async(event, context) => {
  //tcb自动处理参数和路由转发
  const app = new TcbRouter({
    event
  })
  //全局中间件处理公共逻辑,获取当前用户openId
  app.use(async(ctx, next) => {
    console.log('进入全局中间件')
    ctx.data = {}
    ctx.data.openId = event.userInfo.openId
    //通过next关联中间件
    await next()
    console.log('退出全局中间件')
  })

  //定义music路由
  app.router('music',async(ctx, next)=>{
    console.log('进入音乐名称中间件')
    ctx.data.musicName = '数鸭子'
    await next()
    console.log('退出音乐名称中间件')
  }, async (ctx, next)=>{
    console.log('进入音乐中间件')
    ctx.data.musicType = '儿歌'
    ctx.body = {
      data: ctx.data
    }
    console.log('退出音乐中间件')
  })
  //定义movie路由
  app.router('movie', async (ctx, next) => {
    console.log('进入动画名称中间件')
    ctx.data.movieName = '千与千寻'
    await next()
    console.log('退出动画名称中间件')
  }, async (ctx, next) => {
    console.log('进入电影名称中间件')
    ctx.data.movieType = '日本动画片'
    ctx.body = {
      data: ctx.data
    }
    console.log('退出电影名称中间件')
  })
  //返回当前服务
  return app.serve()
}