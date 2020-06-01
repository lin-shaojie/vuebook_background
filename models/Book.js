const {
  TYPE_EPUB,
  UPLOAD_URL,
  UPLOAD_PATH,
  OLD_UPLOAD_URL,
} = require('../utils/constant')
const Epub = require('../utils/epub')
const fs = require('fs')
const path = require('path')
const xml2js = require('xml2js').parseString

class Book {
  constructor(file, data) {
    if (file) {
      this.createBookFormFile(file)
    } else if (data) {
      this.createBookFormData(data)
    }
  }
  createBookFormFile(file) {
    const {
      mimetype = TYPE_EPUB,
      destination,
      filename,
      path,
      originalname,
    } = file
    // 电子书的文件后缀名
    const suffix = mimetype === TYPE_EPUB ? '.epub' : ''
    // 电子书原有路径
    const oldBookPath = path
    // 电子书的新路径
    const bookPath = `${destination}/${filename}${suffix}`
    // 电子书下载路径的url链接
    const dowloadUrl = `${UPLOAD_URL}/book/${filename}${suffix}`
    // 电子书解压后的文件夹路径
    const unzipPath = `${UPLOAD_PATH}/unzip/${filename}`
    // 电子书解压后的文件夹路径URL
    const unzipUrl = `${UPLOAD_URL}/unzip/${filename}`

    if (!fs.existsSync(unzipPath)) {
      // 文件解压路径不存在的话就同步地创建目录。
      fs.mkdirSync(unzipPath, {
        // 迭代创建
        recursive: true,
      })
    }

    // 文件重命名，加上后缀
    if (fs.existsSync(oldBookPath) && !fs.existsSync(bookPath)) {
      // 将旧路径的名字替换为新的路径名
      fs.renameSync(oldBookPath, bookPath)
    }

    this.fileName = filename //文件名
    this.path = `/book/${filename}${suffix}` //epub文件相对路径
    this.filePath = this.path // epub文件路径
    this.originalName = originalname
    this.unzipPath = `/unzip/${filename}` //epub解压后的相对路径
    this.unzipUrl = unzipUrl // 解压后的文件夹链接
    this.url = dowloadUrl //epub文件下载链接
    // 下面都属性需要进行解压才可以获得
    this.title = '' // 书名
    this.author = '' // 作者
    this.publisher = '' // 出版社
    this.contents = [] // 目录
    this.cover = '' // 封面图片路径url
    this.coverPath = '' // 封面图片路径
    this.category = -1 // 分类id
    this.categoryText = '' // 分类名称
    this.language = '' // 语种
  }
  createBookFormData(data) {
    const {
      fileName,
      cover,
      title,
      author,
      publisher,
      language,
      rootFile,
      originalName,
      filePath,
      unzipPath,
      coverPath,
      username,
    } = data
    this.fileName = fileName
    this.cover = coverPath
    this.title = title
    this.author = author
    this.publisher = publisher
    this.bookId = fileName
    this.language = language
    this.rootFile = rootFile
    this.originalName = originalName
    this.path = filePath
    this.filePath = filePath
    this.unzipPath = unzipPath
    this.coverPath = coverPath
    this.createUser = username
    this.createDt = new Date().getTime() // 时间戳
    this.updateDt = new Date().getTime()
    this.updateType = data.updateType === 0 ? data.updateType : 1
    this.category = data.category || 99 // 图书分类
    this.categoryText = data.categoryText || '自定义'
    this.contents = data.contents || []
  }

  // 电子书解析
  parse() {
    return new Promise((resolve, reject) => {
      const bookPath = `${UPLOAD_PATH}${this.filePath}`
      // console.log(bookPath)
      if (!fs.existsSync(bookPath)) {
        reject(new Error('上传电子书路径不存在'))
      }
      const epub = new Epub(bookPath)
      epub.on('error', (error) => {
        reject(error)
      })
      // 解析结束
      epub.on('end', (error) => {
        if (error) {
          reject(error)
        } else {
          // console.log('epub', epub)
          const {
            title,
            language,
            creator,
            creatorFileAs,
            publisher,
            cover,
          } = epub.metadata
          if (!title) {
            reject(new Error('图书标题为空'))
          } else {
            this.title = title
            this.language = language || 'en'
            this.author = creator || creatorFileAs || 'unknow'
            this.publisher = publisher || 'unknow'
            this.rootFile = epub.rootFile
            const handleGetImage = (err, file, mimeType) => {
              if (err) {
                reject(err)
              } else {
                const suffix = mimeType.split('/')[1]
                const coverPath = `${UPLOAD_PATH}/imgs/${this.fileName}.${suffix}`
                const coverUrl = `${UPLOAD_URL}/imgs/${this.fileName}.${suffix}`
                fs.writeFileSync(coverPath, file, 'binary') // 吧封面写入文件夹里
                this.coverPath = `/imgs/${this.fileName}.${suffix}`
                this.cover = coverUrl
                // 解析成功向前端返回该对象
                resolve(this)
              }
            }
            try {
              this.unzip() // 解压
              this.parseContents(epub).then(({ chapters, chapterTree }) => {
                this.contents = chapters
                this.contentsTree = chapterTree
                epub.getImage(cover, handleGetImage)
              }) // 目录解析
            } catch (e) {
              reject(e)
            }
          }
        }
      })
      epub.parse() //解析
    })
  }
  // 解压
  unzip() {
    const AdmZip = require('adm-zip')
    const zip = new AdmZip(Book.genPath(this.path))
    zip.extractAllTo(Book.genPath(this.unzipPath), true) //将路径下的文件进行解压，放到新的路径。第二参数为是否覆盖
  }
  // 目录解析
  parseContents(epub) {
    function getNcxFilePath() {
      const spine = epub && epub.spine
      const manifest = epub && epub.manifest
      const ncx = spine.toc && spine.toc.href
      const id = spine.toc && spine.toc.id

      if (ncx) {
        return ncx
      } else {
        return manifest[id].href
      }
    }
    function findParent(array, level = 0, pid = '') {
      return array.map((item) => {
        item.level = level
        item.pid = pid
        if (item.navPoint && item.navPoint.length > 0) {
          item.navPoint = findParent(item.navPoint, level + 1, item['$'].id)
        } else if (item.navPoint) {
          // 为对象时候的情况
          item.navPoint.level = level + 1
          item.navPoint.pid = item['$'].id
        }
        return item
      })
    }

    function flatten(array) {
      return [].concat(
        ...array.map((item) => {
          if (item.navPoint && item.navPoint.length > 0) {
            return [].concat(item, ...flatten(item.navPoint))
          } else if (item.navPoint) {
            return [].concat(item, item.navPoint)
          }
          return item
        })
      )
    }

    const ncxFilePath = Book.genPath(`${this.unzipPath}/${getNcxFilePath()}`)
    if (fs.existsSync(ncxFilePath)) {
      return new Promise((resolve, reject) => {
        const xml = fs.readFileSync(ncxFilePath, 'utf-8') // 读取ncx文件
        const dir = path.dirname(ncxFilePath).replace(UPLOAD_PATH, '') // 相对路径
        const fileName = this.fileName
        const unzipPath = this.unzipPath
        // 将ncx文件从xml转为json
        xml2js(
          xml,
          {
            explicitArray: false, // 设置为false时，解析结果不会包裹array
            ignoreAttrs: false, // 解析属性
          },
          function (err, json) {
            if (err) {
              reject(err)
            } else {
              // console.log('json', json)
              const navMap = json.ncx.navMap // 获取ncx的navMap属性
              if (navMap.navPoint && navMap.navPoint.length > 0) {
                // 如果navMap属性存在navPoint属性，则说明目录存在
                navMap.navPoint = findParent(navMap.navPoint)
                const newNavMap = flatten(navMap.navPoint) // 创建一个新的数组而不改变原数组,将目录拆分为扁平结构
                const chapters = [] // 章节信息
                newNavMap.forEach((chapter, index) => {
                  const src = chapter.content['$'].src
                  chapter.id = `${src}`
                  chapter.href = `${dir}/${src}`.replace(unzipPath, '')
                  chapter.text = `${UPLOAD_URL}${dir}/${src}` // 生成章节的URL
                  chapter.label = chapter.navLabel.text || ''
                  chapter.navId = chapter['$'].id
                  chapter.fileName = fileName
                  chapter.order = index + 1
                  chapters.push(chapter)
                })
                const chapterTree = []
                chapters.forEach((item) => {
                  item.children = []
                  if (item.pid === '') {
                    // 为一级目录
                    chapterTree.push(item)
                  } else {
                    const parent = chapters.find((_) => _.navId === item.pid)
                    parent.children.push(item)
                  }
                })
                // console.log('chapterTree', chapterTree)
                resolve({ chapters, chapterTree })
              } else {
                reject(new Error('目录解析失败，目录数为0'))
              }
            }
          }
        )
      })
    } else {
      throw new Error('资源目录不存在！')
    }
  }

  // 将book对象转换为 数据库对应的字段
  toDb() {
    return {
      fileName: this.fileName,
      cover: this.cover,
      title: this.title,
      author: this.author,
      publisher: this.publisher,
      bookId: this.fileName,
      language: this.language,
      rootFile: this.rootFile,
      originalName: this.originalName,
      filePath: this.filePath,
      unzipPath: this.unzipPath,
      coverPath: this.coverPath,
      createUser: this.createUser,
      createDt: this.createDt, // 时间戳
      updateDt: this.updateDt,
      updateType: this.updateType,
      category: this.category, // 图书分类
      categoryText: this.categoryText,
    }
  }

  getContents() {
    return this.contents
  }


  // 删除电子书相关文件
  reset() {
    if (Book.pathExists(this.filePath)) {
      // 路径存在
      fs.unlinkSync(Book.genPath(this.filePath))
    }
    if (Book.pathExists(this.coverPath)) {
      fs.unlinkSync(Book.genPath(this.coverPath))
    }
    if (Book.pathExists(this.unzipPath)) {
      fs.rmdirSync(Book.genPath(this.unzipPath), { recursive: true })
    }
  }
  static genPath(path) {
    if (!path.startsWith('/')) {
      path = `/${path}`
    }
    return `${UPLOAD_PATH}${path}`
  }

  // 判断路径是否存在
  static pathExists(path) {
    if (path.startsWith(UPLOAD_PATH)) {
      return fs.existsSync(path)
    } else {
      return fs.existsSync(Book.genPath(path))
    }
  }

  // 生成电子书封面地址
  static genCoverUrl(book) {
    const { cover } = book
    if (+book.updateType === 0) {
      // 旧版电子书
      if (cover) {
        if (cover.startsWith('/')) {
          return `${OLD_UPLOAD_URL}${cover}`
        } else {
          return `${OLD_UPLOAD_URL}/${cover}`
        }
      } else {
        return null
      }
    } else {
      if (cover) {
        if (cover.startsWith('/')) {
          return `${UPLOAD_URL}${cover}`
        } else {
          return `${UPLOAD_URL}/${cover}`
        }
      } else {
        return null
      }
    }
  }

  /**
   * 将数组目录转换为目录树
   */
  static genContentsTree(contents) {
    const contentsTree = []
    if (contents) {
      contents.forEach((item) => {
        item.children = []
        if (item.pid === '') {
          // 为一级目录
          contentsTree.push(item)
        } else {
          const parent = contents.find((_) => _.navId === item.pid)
          parent.children.push(item)
        }
      })
    }
    return contentsTree
  }
}

module.exports = Book
