# vuebook_background



## 简介

[校园图书后台管理系统服务端](https://book.poetrycode.top/)采用了node.js的Express框架，主要功能有JWT认证、MD5盐加密、文件上传下载、电子书解析等功能。



## 主要技术栈

```
- jsonwebtoken：使用 JWT 进行登录认证
- multer：使用 Express 官方的 multer 进行文件上传
- adm-zip：使用 adm-zip 解压 epub 电子书
- epub：使用 epub 库完成电子书解析
- crypto：使用 crypto 完成密码的 MD5 加密
- Sql数据库的增删改。
```


##  开发

```bash

# 克隆项目
git clone https://github.com/lin-shaojie/vuebook_background.git


# 进入项目目录
cd 


# 安装依赖
npm install


# 建议不要直接使用 cnpm 安装依赖，会有各种诡异的 bug。可以通过如下操作解决 npm 下载速度慢的问题
npm install --registry=https://registry.npm.taobao.org


# 启动服务
npm run dev
启动服务运用了`nodemon`工具,如果没有下载请在`package.json`文件修改
```

## 其它
- 服务端运行环境有生产模块还有开发模式，切换模式请在utils/env.js文件下修改。

- API访问地址分请在`utils/constant.js`下修改，需要注意的是在`UPLOAD_PATH`路径不可修改为服务器的地址,应该更改为服务器所在的文件夹路径地址，否则会造成上传的失败。

- 本地服务器主要采用了https服务，可在根目录下创建https文件夹，然后将 `.key`和`.pem`文件放入即可。
