import path from 'path'
import crypto from 'crypto'
import { IPicGo, IPluginConfig } from 'picgo/dist/types'

const sleep = async (time: number): Promise<any> => {
  return await new Promise(resolve => setTimeout(resolve, time))
}

const pluginConfig = (ctx: IPicGo): IPluginConfig[] => {
  let userConfig = ctx.getConfig('picgo-plugin-rename-image')
  if (!userConfig) {
    userConfig = {}
  }
  return [
    {
      name: 'format',
      type: 'input',
      alias: '路径格式',
      default: (userConfig as IPluginConfig).format || '',
      message: '如：image/note/{localFolder:2}/{y}/{m}/{d}/{h}-{i}-{s}-{hash}-{origin}-{rand:5}',
      required: false
    }
  ]
}

export = (ctx: IPicGo) => {
  const register = (): void => {
    ctx.helper.beforeUploadPlugins.register('rename-image', {
      handle: async ctx => {
        // console.log(ctx)
        const autoRename = ctx.getConfig('settings.autoRename')
        if (autoRename) {
          ctx.emit('notification', {
            title: '❌ 警告',
            body: '请关闭 PicGo 的 【时间戳重命名】 功能,\nrename-image 插件重命名方式会被覆盖'
          })
          await sleep(10000)
          throw new Error('rename image conflict with the timestamp renaming of picgo')
        }
        const format: string = ctx.getConfig('picgo-plugin-rename-image.format') || ''
        ctx.output = ctx.output.map((item, i) => {
          // 获取即将输出的文件名
          let fileName = item.fileName
          if (format) {
            const currentTime = new Date()
            const formatObject = {
              y: currentTime.getFullYear(),
              m: currentTime.getMonth() + 1,
              d: currentTime.getDate(),
              h: currentTime.getHours(),
              i: currentTime.getMinutes(),
              s: currentTime.getSeconds(),
              ms: currentTime.getTime().toString().slice(-3),
              timestamp: currentTime.getTime().toString().slice(0, -3)
            }
            // 去除空格
            fileName = format
              .trim()
              // 替换日期
              .replace(/{(y|m|d|h|i|s|ms|timestamp)}/gi, (result, key) => {
                if (key === 'ms' || key === 'timestamp') return formatObject[key]
                else return formatObject[key].toString().padStart(2, '0')
              })
              // 截取本地目录
              .replace(/{(localFolder:?(\d+)?)}/gi, (result, key, count) => {
                if (ctx.input[i]) {
                  count = Math.max(1, count || 0)
                  const paths = path.dirname(ctx.input[i]).split(path.sep)
                  key = paths.slice(0 - count).reduce((a, b) => `${a}/${b}`)
                }
                return key.replace(/:/g, '')
              })
              // 随机字符串
              .replace(/{(rand:?(\d+)?)}/gi, (result, key, count) => {
                if (key === 'rand' || key.indexOf('rand:') === 0) {
                  count = Math.min(Math.max(1, count || 6), 32)
                  return crypto
                    .randomBytes(Math.ceil(count / 2))
                    .toString('hex')
                    .slice(0, count)
                }
              })
              // 字符串替换
              .replace(/{(hash|origin:?(.+)?|\w+)}/gi, (result, key, replacement) => {
                // 文件原名
                if (key.startWith('origin')) {
                  replacement = replacement === '' ? '-' : replacement
                  return fileName
                    .substring(0, Math.max(0, fileName.lastIndexOf('.')) || fileName.length)
                    .replace(/[\\/:<>|"' *?$#&@()[\]^~]+/g, replacement)
                }
                // 文件hash值
                if (key === 'hash') {
                  const hash = crypto.createHash('md5')
                  hash.update(item.buffer)
                  return hash.digest('hex')
                }
                return key
              })

              // 去除多余的"/"
              .replace(/[/]+/g, '/')

            // 最后如果 fileName 只是一个 /，则进行特殊处理，用索引来作为文件名
            if (fileName.slice(-1) === '/') {
              fileName += i.toString()
            }

            fileName += item.extname
          }
          item.fileName = fileName
          return item
        })
      },
      config: pluginConfig
    })
  }
  return {
    register,
    config: pluginConfig
  }
}
