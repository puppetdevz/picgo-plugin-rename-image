## picgo-plugin-rename-image

对上传的图片进行重命名

可以很自定义生成文件存储路径的插件，文件(包括路径)名称支持日期、随机字符串、文件 MD5、原文件名、原文件目录结构等规则。

更多需求，欢迎 PR 或提 ISSUE。

## 配置规则

<img src="https://puppet-bucket.oss-cn-guangzhou.aliyuncs.com/image/note/b518232764c79b10ead289dcf6fa3201.png" alt="image-20221129022100279" style="zoom: 67%;" />

默认为空，自定义文件路径及文件名，例如：

```sh
image/note/{localFolder:2}/{y}/{m}/{d}/{h}-{i}-{s}-{hash}-{origin}-{rand:6}
```

上传文件名为 `/images/test/localImage.jpg` 的文件时，会重命名为

```
image/note/images/test/2020/07/24/21-40-31-36921a9c364ed4789d4bc684bcb81d62-localImage-fa2c97.jpg
```

具体的变量含义如下：

- {y}：年，4位
- {m}：月，2位
- {d}：日期，2位
- {h}：小时，2位
- {i}：分钟，2位
- {s}：秒，2位
- {ms}：毫秒，3位(**v1.0.4**)
- `{timestamp}`：时间戳(秒)，10位
- `{hash}`：文件的 md5 值，32位
- `{origin:<replacement>}`：文件原名（会去掉后缀）， 会将文件原名中的不合法字符替换为`<replacement>`，例如空格等等，默认为 `-`
- `{rand:<count>}`：随机字符数，`<count>` 表示个数，默认为6个，示例：{rand：32}、{rand}
- `{localFolder:<count>}`：`<count>`表示层级 ，默认为 1，示例：{localFolder:6}、{localFolder}

可以自己选择变量进行配置，例如只配置 hash，则为：

<img src="https://puppet-bucket.oss-cn-guangzhou.aliyuncs.com/image/note/35dac6f542ad1adcfcc148fdda28bb0c.png" alt="image-20221129022508747" style="zoom: 67%;" />

