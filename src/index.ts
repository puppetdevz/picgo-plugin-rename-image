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
      message: '如：image/note/{localFolder:2}/{y}/{m}/{d}/{h}-{i}-{s}-{hash}-{size}-{origin}-{rand:5}',
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
              .replace(/{(y|m|d|h|i|s|ms|timestamp)}/gi, (match, key) => {
                if (key === 'ms' || key === 'timestamp') return formatObject[key]
                else return formatObject[key].toString().padStart(2, '0')
              })
              // 截取本地目录
              .replace(/{(localFolder:?(\d+)?)}/gi, (match, key, count) => {
                if (ctx.input[i]) {
                  count = Math.max(1, count || 0)
                  const paths = path.dirname(ctx.input[i]).split(path.sep)
                  key = paths.slice(0 - count).reduce((a, b) => `${a}/${b}`)
                }
                return key.replace(/:/g, '')
              })
              // 随机字符串
              .replace(/{(rand:?(\d+)?)}/gi, (match, key, count) => {
                if (key === 'rand' || key.indexOf('rand:') === 0) {
                  count = Math.min(Math.max(1, count || 6), 32)
                  return crypto
                    .randomBytes(Math.ceil(count / 2))
                    .toString('hex')
                    .slice(0, count)
                }
              })
              // 哈希替换
              .replace(/{(hash)(?::(md5|sha1|sha2-256))?}/gi, (match, key, hashAlgorithm = '') => {
                // 支持的格式：hash、hash:md5 等等，其他格式抛出异常，如果是 hash，则使用 md5
                hashAlgorithm = hashAlgorithm.trim().toLowerCase()
                ctx.log.info('The hash algorithm user expected is ', hashAlgorithm)
                const algorithmMap = {
                  '': 'md5',
                  md5: 'md5',
                  sha1: 'sha1',
                  'sha2-256': 'sha256'
                }
                const algorithm = algorithmMap[hashAlgorithm]
                ctx.log.info('The actual hash algorithm is ', algorithm)
                if (!algorithm) {
                  ctx.log.error(`hash algorithm ${hashAlgorithm} not supported`)
                  throw new Error(`hash algorithm ${hashAlgorithm} not supported`)
                }
                return item.buffer ? crypto.createHash(algorithm).update(item.buffer).digest('hex') : key
              })
              // 文件大小
              .replace(/{size}/gi, (match) => {
                return item.buffer?.length.toString()
              })
              // 文件原名字符串替换
              .replace(/{(origin:?(.+)?|\w+)}/gi, (match, key, replacement) => {
                // 文件原名
                if (key.startsWith('origin')) {
                  replacement = replacement === '' ? '-' : replacement
                  return fileName
                    .substring(0, Math.max(0, fileName.lastIndexOf('.')) || fileName.length)
                    .replace(/[\\/:<>|"' *?$#&@()[\]^~]+/g, replacement)
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
