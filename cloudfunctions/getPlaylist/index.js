// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database()
const rp = require('request-promise')
const URL = 'http://musicapi.xiecheng.live/personalized'
const playlistCollection = db.collection('playlist')

const MAX_LIMIT = 100
// 云函数入口函数
exports.main = async (event, context) => {
  // const list = await playlistCollection.get()


  //取得总条数,countResult是对象
  const countResult = await playlistCollection.count()
  //对象.total  取得数据总条数
  const total = countResult.total
  //次数向上取整
  const batchTimes = Math.ceil(total / MAX_LIMIT)

  const tasks = []
  //分次数取数据
  for (let i = 0; i < batchTimes; i++) {
    let promise = playlistCollection.skip(i * MAX_LIMIT).limit(MAX_LIMIT).get()
    tasks.push(promise)
  }

  let list = {
    data: []
  }

  //数据多次获取
  if (tasks.length > 0) {
    list = (await Promise.all(tasks)).reduce((acc, cur) => {
      return {
        data: acc.data.concat(cur.data)
      }
    })
  }

  const playlist = await rp(URL).then(res => {
    return JSON.parse(res).result
  })

  //判断是否重复,去重
  const newData = []
  for (let i = 0, len1 = playlist.length; i < len1; i++) {
    let flag = true
    for (let j = 0, len2 = list.data.length; j < len2; j++) {
      if (playlist[i].id === list.data[j].id) {
        flag = false
        break
      }
    }
    if (flag) {
      newData.push(playlist[i])
    }
  }

  // console.log(playlist)
  for (let i = 0, len = newData.length; i < len; i++){

    await playlistCollection.add({
      data: {
        ...newData[i],
        createTime: db.serverDate(),
      }
    }).then(res => {
      console.log('插入成功')
    }).catch(err => {
      console.error('插入失败')
    })
  }

  return newData.length

}