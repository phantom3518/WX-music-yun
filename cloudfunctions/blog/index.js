// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init()
//引入tcb-router
const TcbRouter = require('tcb-router')
//初始化数据库
const db = cloud.database()
//取到blog数据库集合
const blogCollection = db.collection('blog')
//取到blog评论数据库集合
const blogCommentCollection = db.collection('blog-comment')

const MAX_LIMIT = 100
// 云函数入口函数
exports.main = async(event, context) => {
  const app = new TcbRouter({
    event
  })

  app.router('list', async(ctx, next) => {
    const keyword = event.keyword
    let w = {} //查询条件设为w,即搜索输入的字
    if (keyword.trim() != '') {
      w = {
        content: new db.RegExp({
          regexp: keyword,
          options: 'i'
        })
      }
    }

    //skip分页，因为数据很多条，limit每次查询多少条，orderby指定排序字段 desc为逆序
    let blogList = await blogCollection
      .where(w)
      .skip(event.start)
      .limit(event.count)
      .orderBy('createTime', 'desc')
      .get().then((res) => {
        return res.data
      })
    ctx.body = blogList
  })

  app.router('detail', async(ctx, next) => {
    let blogId = event.blogId
    //博客详情查询
    let detail = await blogCollection.where({
      _id: blogId
    }).get().then(res => {
      return res.data
    })
    // 评论查询
    const countResult = await blogCollection.count()
    const total = countResult.total
    let commentList = {
      data: []
    }
    if (total > 0) {
      const batchTimes = Math.ceil(total / MAX_LIMIT)
      const tasks = []
      for (let i = 0; i < batchTimes; i++) {
        let promise = blogCommentCollection.skip(i * MAX_LIMIT)
          .limit(MAX_LIMIT).where({
            blogId
          }).orderBy('createTime', 'desc').get()
        tasks.push(promise)
      }
      if (tasks.length > 0) {
        commentList = (await Promise.all(tasks)).reduce((acc, cur) => {
          return {
            data: acc.data.concat(cur.data)
          }
        })
      }

    }

    ctx.body = {
      commentList,
      detail,
    }


  })


  //我的博客查询
  const wxContext = cloud.getWXContext()
  app.router('getListByOpenid', async (ctx, next) => {
    ctx.body = await blogCollection.where({
      _openid: wxContext.OPENID
    }).skip(event.start).limit(event.count)
      .orderBy('createTime', 'desc').get().then((res) => {
        return res.data
      })
  })

  return app.serve()
}