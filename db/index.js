const mysql = require('mysql')
const config = require('./config')
const { debug } = require('../utils/constant')
const { isObject } = require('../utils')

/**
 * 数据库连接
 */
function connect() {
  return mysql.createConnection({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database,
    multipleStatements: true, // 允许每条 mysql 语句有多条查询.使用它时要非常注意，因为它很容易引起 sql 注入（默认：false）
  })
}

/**
 查询多条记录
 * 
 * @param {*} sql sql语句
 */
function querySql(sql) {
  const conn = connect()
  debug && console.log(sql)
  return new Promise((resolve, reject) => {
    try {
      conn.query(sql, (err, result) => {
        if (err) {
          // debug && console.log('查询失败，原因:' + JSON.stringify(err))
          // 存在错误
          reject(err)
        } else {
          // debug && console.log('查询成功', JSON.stringify(result))
          // 返回结果
          resolve(result)
        }
      })
    } catch (e) {
      reject(e)
    } finally {
      // 释放连接
      conn.end()
    }
  })
}

/**
 *  查询一条记录
 * @param {*} sql sql语句
 */

function queryOne(sql) {
  return new Promise((resolve, reject) => {
    debug && console.log('queryone', sql)
    querySql(sql)
      .then((result) => {
        if (result && result.length > 0) {
          resolve(result[0])
        } else {
          resolve(null)
        }
      })
      .catch((err) => {
        reject(err)
      })
  })
}

/**
 * 向某个数据库表插入数据
 * @param {*} model 数据对象
 * @param {*} tableName  具体为哪一张表
 */
function insert(model, tableName) {
  return new Promise((resolve, reject) => {
    if (!isObject(model)) {
      reject(new Error('插入数据库失败，插入数据非对象！'))
    } else {
      const keys = []
      const values = []
      Object.keys(model).forEach((key) => {
        if (model.hasOwnProperty(key)) {
          // 判断是否有该属性
          keys.push(`\`${key}\``) // 特殊字符，用于数据库查询
          values.push(`'${model[key]}'`)
        }
      })
      if (keys.length > 0 && values.length > 0) {
        let sql = `INSERT INTO \`${tableName}\``
        const keysString = keys.join(',')
        const valueString = values.join(',')
        sql = `${sql} (${keysString}) VALUES (${valueString})`
        const conn = connect()
        try {
          conn.query(sql, (err, res) => {
            if (err) {
              reject(err)
            } else {
              resolve(res)
            }
          })
        } catch (e) {
          reject(e)
        } finally {
          conn.end() // 释放连接
        }
      } else {
        // 传入的对象为空
        reject(new Error('插入数据库失败，对象中没有数据！'))
      }
    }
  })
}

/**
 * 更新电子书信息
 * @param {*} model 数据对象
 * @param {*} tableName 具体为哪一张表
 * @param {*} where 查询条件
 */
function update(model, tableName, where) {
  return new Promise((resolve, reject) => {
    if (!isObject(model)) {
      reject(new Error('插入数据库失败，插入数据非对象！'))
    } else {
      const entry = []
      // 遍历数据对象
      Object.keys(model).forEach((key) => {
        if (model.hasOwnProperty(key)) {
          // 是否为自身属性
          entry.push(`\`${key}\`='${model[key]}'`)
        }
      })
      if (entry.length > 0) {
        const sql = `UPDATE \`${tableName}\` SET ${entry.join(',')} ${where}`
        debug && console.log('update', sql)
        const conn = connect()
        try {
          conn.query(sql, (err, res) => {
            if (err) {
              reject(err)
            } else {
              resolve(res)
            }
          })
        } catch (error) {
          reject(error)
        } finally {
          conn.end()
        }
      }
    }
  })
}

/**
 * 返回数据库查询添加语句
 * @param {*} where
 * @param {*} key 键名
 * @param {*} value 值
 */
function and(where, key, value) {
  if (where === 'where') {
    return `${where} \`${key}\` = '${value}' `
  } else {
    return `${where} and \`${key}\` = '${value}' `
  }
}

/**
 * 返回数据模糊查询条件
 * @param {*} where
 * @param {*} key
 * @param {*} value
 */
function andLike(where, key, value) {
  if (where === 'where') {
    return `${where} \`${key}\` LIKE '%${value}%' `
  } else {
    return `${where} and  \`${key}\` LIKE '%${value}%' `
  }


}
module.exports = {
  querySql,
  queryOne,
  insert,
  update,
  and,
  andLike,
}
